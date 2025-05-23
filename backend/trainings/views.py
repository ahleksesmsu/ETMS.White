from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Training, TrainingAssignment
from .serializers import (
    TrainingSerializer, TrainingAssignmentSerializer,
    BulkAssignmentSerializer
)
from users.permissions import IsAdmin, IsHROfficer
from users.models import Employee


class TrainingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for trainings. HR and admin can create and modify.
    """
    queryset = Training.objects.all()
    serializer_class = TrainingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role in ['ADMIN', 'HR']:
            return Training.objects.all()
        
        # Employees can only see trainings assigned to them
        return Training.objects.filter(
            assignments__employee__user=user
        ).distinct()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Bulk assign training to employees."""
        training = self.get_object()
        serializer = BulkAssignmentSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        employee_ids = serializer.validated_data['employee_ids']
        notes = serializer.validated_data.get('notes', '')
        
        # Check if training is active
        if not training.is_active:
            return Response(
                {'detail': 'Cannot assign inactive training'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check max participants limit
        if training.max_participants:
            current_count = training.assignments.count()
            if current_count + len(employee_ids) > training.max_participants:
                return Response(
                    {'detail': 'Assignment would exceed maximum participants limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create assignments
        assignments = []
        errors = []
        
        for employee_id in employee_ids:
            try:
                employee = Employee.objects.get(id=employee_id)
                
                # Check if assignment already exists
                if TrainingAssignment.objects.filter(
                    training=training,
                    employee=employee
                ).exists():
                    errors.append(f"Employee {employee.user.email} already assigned")
                    continue
                
                assignment = TrainingAssignment.objects.create(
                    training=training,
                    employee=employee,
                    assigned_by=request.user,
                    notes=notes
                )
                assignments.append(assignment)
                
            except Employee.DoesNotExist:
                errors.append(f"Employee ID {employee_id} not found")
        
        response_data = {
            'assignments_created': len(assignments),
            'errors': errors if errors else None
        }
        
        return Response(response_data)


class TrainingAssignmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for training assignments.
    """
    queryset = TrainingAssignment.objects.all()
    serializer_class = TrainingAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role in ['ADMIN', 'HR']:
            if user.role == 'HR':
                # HR can see assignments for employees in their department
                return TrainingAssignment.objects.filter(
                    employee__user__department=user.department
                )
            return TrainingAssignment.objects.all()
        
        # Employees can only see their own assignments
        return TrainingAssignment.objects.filter(employee__user=user)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_trainings(self, request):
        """Get current user's training assignments."""
        trainings = TrainingAssignment.objects.filter(
            employee__user=request.user
        )
        serializer = self.get_serializer(trainings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update training assignment status."""
        assignment = self.get_object()
        status = request.data.get('status')
        
        if not status or status not in dict(TrainingAssignment.STATUS_CHOICES):
            return Response(
                {'detail': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If marking as completed, set completion date
        if status == 'COMPLETED' and assignment.status != 'COMPLETED':
            assignment.completion_date = timezone.now().date()
        
        assignment.status = status
        assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)