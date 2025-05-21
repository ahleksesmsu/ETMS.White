from django.utils import timezone
from django.db.models import Sum, Avg, Count
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Factor, Survey, Question, SurveyAssignment, SurveyResponse
from .serializers import (
    FactorSerializer, SurveySerializer, QuestionSerializer,
    SurveyAssignmentSerializer, SurveyResponseSerializer,
    SurveyWithQuestionsSerializer, SurveySubmissionSerializer,
    SurveyResponseSummarySerializer
)
from users.permissions import IsAdmin, IsHROfficer, IsEmployee


class FactorViewSet(viewsets.ModelViewSet):
    """
    API endpoint for survey factors. Only HR and admin can access.
    """
    queryset = Factor.objects.all()
    serializer_class = FactorSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['type']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SurveyViewSet(viewsets.ModelViewSet):
    """
    API endpoint for surveys. HR and admin can create and edit.
    """
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title', 'description']
    filterset_fields = ['category', 'is_active']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role in ['ADMIN', 'HR']:
            return Survey.objects.all()
        
        # Employees can only see surveys assigned to them
        return Survey.objects.filter(
            assignments__employee__user=user,
            assignments__is_completed=False
        )
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SurveyWithQuestionsSerializer
        return SurveySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        """Get all responses for a survey."""
        survey = self.get_object()
        assignments = SurveyAssignment.objects.filter(
            survey=survey,
            is_completed=True
        )
        serializer = SurveyResponseSummarySerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get statistics for a survey."""
        survey = self.get_object()
        
        # Get all completed assignments for this survey
        completed_assignments = SurveyAssignment.objects.filter(
            survey=survey,
            is_completed=True
        )
        
        # Total assignments and completion rate
        total_assignments = SurveyAssignment.objects.filter(survey=survey).count()
        completed_count = completed_assignments.count()
        completion_rate = (completed_count / total_assignments * 100) if total_assignments > 0 else 0
        
        # Average score
        avg_score = completed_assignments.filter(total_score__isnull=False).aggregate(
            avg_score=Avg('total_score')
        )
        
        # Factor analysis
        factors_data = []
        for factor in Factor.objects.filter(questions__survey=survey).distinct():
            factor_responses = SurveyResponse.objects.filter(
                question__survey=survey,
                question__factor=factor,
                score__isnull=False
            )
            
            if factor_responses.exists():
                avg_factor_score = factor_responses.aggregate(avg_score=Avg('score'))
                
                factors_data.append({
                    'id': factor.id,
                    'name': factor.name,
                    'type': factor.type,
                    'avg_score': avg_factor_score['avg_score'],
                    'response_count': factor_responses.count()
                })
        
        return Response({
            'survey_id': survey.id,
            'title': survey.title,
            'total_assignments': total_assignments,
            'completed_assignments': completed_count,
            'completion_rate': completion_rate,
            'avg_score': avg_score['avg_score'],
            'factor_analysis': factors_data
        })
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit survey responses."""
        survey = self.get_object()
        serializer = SurveySubmissionSerializer(data=request.data)
        
        if serializer.is_valid():
            assignment_id = serializer.validated_data.get('assignment_id')
            
            try:
                assignment = SurveyAssignment.objects.get(
                    id=assignment_id, 
                    survey=survey,
                    employee__user=request.user
                )
            except SurveyAssignment.DoesNotExist:
                return Response(
                    {'detail': 'Survey assignment not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create responses and calculate scores
            responses = []
            total_score = 0
            
            for response_data in serializer.validated_data.get('responses', []):
                question_id = response_data.get('question_id')
                answer = response_data.get('answer')
                
                try:
                    question = Question.objects.get(id=question_id, survey=survey)
                except Question.DoesNotExist:
                    continue
                
                response, created = SurveyResponse.objects.update_or_create(
                    assignment=assignment,
                    question=question,
                    defaults={'answer': answer}
                )
                
                # Calculate and save score if question has scoring
                if question.has_scoring:
                    response.score = response.calculate_score()
                    response.save()
                    
                    # Add to total score if there's a valid score
                    if response.score is not None and question.factor:
                        # Apply factor weight to the score
                        weighted_score = response.score * question.factor.weight
                        total_score += weighted_score
                
                responses.append(response)
            
            # Mark assignment as completed and save total score
            assignment.is_completed = True
            assignment.completed_at = timezone.now()
            assignment.total_score = total_score
            assignment.save()
            
            return Response({'status': 'survey submitted', 'total_score': total_score}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for survey questions. Only HR and admin can modify.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['survey', 'type', 'has_scoring']
    
    def get_queryset(self):
        survey_id = self.request.query_params.get('survey_id')
        if survey_id:
            return Question.objects.filter(survey_id=survey_id).order_by('order')
        return Question.objects.all().order_by('order')


class SurveyAssignmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for survey assignments.
    """
    queryset = SurveyAssignment.objects.all()
    serializer_class = SurveyAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['survey', 'employee', 'is_completed']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role in ['ADMIN', 'HR']:
            if user.role == 'HR':
                # HR can see assignments for employees in their department
                return SurveyAssignment.objects.filter(
                    employee__user__department=user.department
                ).select_related('survey', 'employee__user')
            return SurveyAssignment.objects.all().select_related('survey', 'employee__user')
        
        # Employees can only see their own assignments
        return SurveyAssignment.objects.filter(
            employee__user=user
        ).select_related('survey', 'employee__user')
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_assignments(self, request):
        """Get current user's survey assignments."""
        assignments = SurveyAssignment.objects.filter(
            employee__user=request.user,
            is_completed=False
        )
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        """Get responses for a specific assignment."""
        assignment = self.get_object()
        responses = assignment.responses.all()
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response(serializer.data)


class SurveyResponseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for survey responses.
    """
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['assignment', 'question']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role in ['ADMIN', 'HR']:
            if user.role == 'HR':
                # HR can see responses for employees in their department
                return SurveyResponse.objects.filter(
                    assignment__employee__user__department=user.department
                )
            return SurveyResponse.objects.all()
        
        # Employees can only see their own responses
        return SurveyResponse.objects.filter(assignment__employee__user=user)
    
    @action(detail=False, methods=['get'])
    def by_survey(self, request):
        """Get responses filtered by survey."""
        survey_id = request.query_params.get('survey_id')
        if not survey_id:
            return Response(
                {'detail': 'Survey ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filter assignments by survey and only include completed ones
        assignments = SurveyAssignment.objects.filter(
            survey_id=survey_id,
            is_completed=True
        )
        
        if request.user.role == 'HR':
            # HR can see only their department
            assignments = assignments.filter(
                employee__user__department=request.user.department
            )
        
        serializer = SurveyResponseSummarySerializer(assignments, many=True)
        return Response(serializer.data)