from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admin users to access.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsHROfficer(permissions.BasePermission):
    """
    Permission to only allow HR officers to access.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'HR'


class IsEmployee(permissions.BasePermission):
    """
    Permission to only allow employees to access.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'EMPLOYEE'