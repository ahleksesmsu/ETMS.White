from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Training, TrainingAssignment
from .serializers import TrainingSerializer, TrainingAssignmentSerializer
from users.permissions import IsAdmin, IsHROfficer


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