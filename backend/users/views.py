# users/views.py
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
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
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'status': 'password reset'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin | IsHROfficer]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Employee.objects.all()
        elif user.role == 'HR':
            return Employee.objects.filter(user__department=user.department)
        return Employee.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            employee = Employee.objects.get(user=request.user)
            serializer = self.get_serializer(employee)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({'detail': 'Employee profile not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def available_users(self, request):
        users = User.objects.filter(
            employee_profile__isnull=True,
            role='EMPLOYEE'
        ).exclude(is_superuser=True)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def active_employees(request):
    employees = Employee.objects.filter(user__is_active=True)
    serializer = EmployeeSerializer(employees, many=True)
    return Response(serializer.data)
