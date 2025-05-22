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
    
    # surveys/views.py

    def get_queryset(self):
        user = self.request.user

        if user.role in ['ADMIN', 'HR']:
            return Survey.objects.all()

        # ✅ Allow employee to view both completed and pending surveys
        return Survey.objects.filter(
            assignments__employee__user=user
        ).distinct()

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
    filterset_fields = ['assignment', 'question', 'assignment__survey']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role in ['ADMIN', 'HR']:
            if user.role == 'HR':
                # HR can see responses for employees in their department
                return SurveyResponse.objects.filter(
                    assignment__employee__user__department=user.department
                ).select_related('assignment', 'question')
            return SurveyResponse.objects.all().select_related('assignment', 'question')
        
        # Employees can only see their own responses
        return SurveyResponse.objects.filter(
            assignment__employee__user=user
        ).select_related('assignment', 'question')
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'], url_path='by_survey')
    def by_survey(self, request):
        """Get responses grouped by survey assignment."""
        survey_id = request.query_params.get('survey_id')
        
        if not survey_id:
            return Response(
                {'detail': 'survey_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            survey = Survey.objects.get(id=survey_id)
        except Survey.DoesNotExist:
            return Response(
                {'detail': 'Survey not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get completed assignments for this survey
        assignments = SurveyAssignment.objects.filter(
            survey=survey,
            is_completed=True
        ).select_related('employee__user').prefetch_related('responses__question')
        
        # Check permissions
        user = request.user
        if user.role == 'HR':
            # HR can only see assignments for employees in their department
            assignments = assignments.filter(
                employee__user__department=user.department
            )
        elif user.role not in ['ADMIN', 'HR']:
            # Employees can only see their own assignments
            assignments = assignments.filter(employee__user=user)
        
        response_data = []
        
        for assignment in assignments:
            # Get all responses for this assignment
            responses = assignment.responses.all().select_related('question')
            
            response_items = []
            for response in responses:
                response_items.append({
                    'id': response.id,
                    'question_text': response.question.text,
                    'question_id': response.question.id,
                    'answer': response.answer,
                    'score': response.score,
                    'max_points': response.question.scoring_points,
                    'has_scoring': response.question.has_scoring
                })
            
            response_data.append({
                'id': assignment.id,
                'employee_details': {
                    'name': f"{assignment.employee.user.first_name} {assignment.employee.user.last_name}".strip() or assignment.employee.user.username,
                    'email': assignment.employee.user.email,
                    'department': getattr(assignment.employee.user, 'department', 'N/A'),
                    'position': getattr(assignment.employee, 'position', 'N/A')
                },
                'completed_at': assignment.completed_at,
                'total_score': assignment.total_score,
                'responses': response_items
            })
        
        return Response(response_data)

    @action(detail=True, methods=['patch'])
    def score(self, request, pk=None):
        """Update score for a response."""
        response = self.get_object()
        score = request.data.get('score')
        
        if score is None:
            return Response(
                {'detail': 'Score is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            score = float(score)
            
            # Validate score against max points
            if response.question.has_scoring:
                max_points = response.question.scoring_points
                if score < 0 or score > max_points:
                    return Response(
                        {'detail': f'Score must be between 0 and {max_points}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            response.score = score
            response.save()
            
            # Recalculate total score for the assignment
            assignment = response.assignment
            
            # Get all responses for this assignment that have scoring enabled
            scored_responses = assignment.responses.filter(
                question__has_scoring=True,
                score__isnull=False
            )
            
            # Calculate total with factor weights
            total_score = 0
            for resp in scored_responses:
                if resp.question.factor:
                    # Apply factor weight to the score
                    weighted_score = resp.score * resp.question.factor.weight
                    total_score += weighted_score
                else:
                    # If no factor, just add the raw score
                    total_score += resp.score
            
            assignment.total_score = total_score
            assignment.save()
            
            return Response({
                'status': 'score updated',
                'score': score,
                'total_score': total_score
            })
            
        except ValueError:
            return Response(
                {'detail': 'Invalid score value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
# views.py (add at the bottom or create analytics/views.py)
from django.db.models import Count, Avg, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import Employee
from surveys.models import SurveyAssignment, SurveyResponse, Factor

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def turnover_analytics(request):
    user = request.user
    is_hr = user.role == 'HR'
    
    # Scope employees
    employees = Employee.objects.select_related('user')
    if is_hr:
        employees = employees.filter(user__department=user.department)

    # Risk counts
    risk_levels = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0}
    high_risk_employees = []
    for emp in employees:
        risk = getattr(emp, 'turnover_risk', None)
        if risk:
            risk_levels[risk] += 1
            if risk == 'HIGH':
                high_risk_employees.append({
                    'name': f"{emp.user.first_name} {emp.user.last_name}".strip() or emp.user.username,
                    'department': getattr(emp.user.department, 'name', 'N/A')
                })

    # Department counts
    dept_counts = employees.values('user__department__name').annotate(count=Count('id'))
    by_department = [{'name': d['user__department__name'] or 'N/A', 'count': d['count']} for d in dept_counts]

    # Risk by department
    dept_risk = employees.values('user__department__name', 'turnover_risk').annotate(count=Count('id'))
    risk_by_department = {}
    for row in dept_risk:
        dept = row['user__department__name'] or 'N/A'
        risk = row['turnover_risk']
        if dept not in risk_by_department:
            risk_by_department[dept] = {'department': dept, 'lowRiskCount': 0, 'mediumRiskCount': 0, 'highRiskCount': 0}
        if risk == 'LOW':
            risk_by_department[dept]['lowRiskCount'] += row['count']
        elif risk == 'MEDIUM':
            risk_by_department[dept]['mediumRiskCount'] += row['count']
        elif risk == 'HIGH':
            risk_by_department[dept]['highRiskCount'] += row['count']

    # Pending and completed surveys
    assignments = SurveyAssignment.objects.all()
    if is_hr:
        assignments = assignments.filter(employee__user__department=user.department)
    pending = assignments.filter(is_completed=False).count()
    completed = assignments.filter(is_completed=True).count()

    # Top risk factors by avg score
    top_factors_qs = SurveyResponse.objects.filter(
        score__isnull=False,
        question__factor__type='TURNOVER'
    ).values('question__factor__name').annotate(avg=Avg('score')).order_by('-avg')[:5]
    top_factors = [{'factor': f['question__factor__name'], 'avgScore': round(f['avg'], 2)} for f in top_factors_qs]

    return Response({
        'total': employees.count(),
        'byRisk': [
            {'name': 'Low Risk', 'value': risk_levels['LOW'], 'color': '#16A34A'},
            {'name': 'Medium Risk', 'value': risk_levels['MEDIUM'], 'color': '#EAB308'},
            {'name': 'High Risk', 'value': risk_levels['HIGH'], 'color': '#DC2626'},
        ],
        'byDepartment': by_department,
        'pendingSurveys': pending,
        'completedSurveys': completed,
        'highRiskEmployees': high_risk_employees,
        'topRiskFactors': top_factors,
        'riskByDepartment': list(risk_by_department.values()),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def turnover_analytics(request):
    user = request.user
    is_hr = user.role == 'HR'

    employees = Employee.objects.select_related('user')
    if is_hr:
        employees = employees.filter(user__department=user.department)

    risk_levels = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0}
    high_risk_employees = []

    for emp in employees:
        risk = getattr(emp, 'turnover_risk', None)
        if risk:
            risk_levels[risk] += 1
            if risk == 'HIGH':
                high_risk_employees.append({
                    'name': f"{emp.user.first_name} {emp.user.last_name}".strip() or emp.user.username,
                    'department': getattr(emp.user.department, 'name', 'N/A')
                })

    dept_counts = employees.values('user__department__name').annotate(count=Count('id'))
    by_department = [{'name': d['user__department__name'] or 'N/A', 'count': d['count']} for d in dept_counts]

    dept_risk = employees.values('user__department__name', 'turnover_risk').annotate(count=Count('id'))
    risk_by_department = {}
    for row in dept_risk:
        dept = row['user__department__name'] or 'N/A'
        risk = row['turnover_risk']
        if dept not in risk_by_department:
            risk_by_department[dept] = {'department': dept, 'lowRiskCount': 0, 'mediumRiskCount': 0, 'highRiskCount': 0}
        if risk == 'LOW':
            risk_by_department[dept]['lowRiskCount'] += row['count']
        elif risk == 'MEDIUM':
            risk_by_department[dept]['mediumRiskCount'] += row['count']
        elif risk == 'HIGH':
            risk_by_department[dept]['highRiskCount'] += row['count']

    assignments = SurveyAssignment.objects.all()
    if is_hr:
        assignments = assignments.filter(employee__user__department=user.department)

    pending = assignments.filter(is_completed=False).count()
    completed = assignments.filter(is_completed=True).count()

    top_factors_qs = SurveyResponse.objects.filter(
        score__isnull=False,
        question__factor__type='TURNOVER'
    ).values('question__factor__name').annotate(avg=Avg('score')).order_by('-avg')[:5]

    top_factors = [{'factor': f['question__factor__name'], 'avgScore': round(f['avg'], 2)} for f in top_factors_qs]

    return Response({
        'total': employees.count(),
        'byRisk': [
            {'name': 'Low Risk', 'value': risk_levels['LOW'], 'color': '#16A34A'},
            {'name': 'Medium Risk', 'value': risk_levels['MEDIUM'], 'color': '#EAB308'},
            {'name': 'High Risk', 'value': risk_levels['HIGH'], 'color': '#DC2626'},
        ],
        'byDepartment': by_department,
        'pendingSurveys': pending,
        'completedSurveys': completed,
        'highRiskEmployees': high_risk_employees,
        'topRiskFactors': top_factors,
        'riskByDepartment': list(risk_by_department.values()),
    })