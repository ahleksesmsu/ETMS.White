from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Employee
from .serializers import (
    UserSerializer, EmployeeSerializer, 
    CustomTokenObtainPairSerializer, PasswordResetSerializer
)
from .permissions import IsAdmin, IsHROfficer

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for users. Admin can perform all operations.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password (admin only)."""
        user = self.get_object()
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'status': 'password reset'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for employee profiles. Admin and HR can access.
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]

    def get_queryset(self):
        """Filter employees by department for HR Officers."""
        user = self.request.user
        
        if user.role == 'ADMIN':
            return Employee.objects.all()
        elif user.role == 'HR':
            # HR can see employees in their department
            return Employee.objects.filter(user__department=user.department)
        
        # Employees can only see themselves
        return Employee.objects.filter(user=user)
        
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current employee profile."""
        try:
            employee = Employee.objects.get(user=request.user)
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response(
                {'detail': 'Employee profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )