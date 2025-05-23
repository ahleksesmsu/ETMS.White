from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, EmployeeViewSet, CustomTokenObtainPairView, active_employees

router = DefaultRouter()
router.register(r'accounts', UserViewSet)
router.register(r'employees', EmployeeViewSet)

urlpatterns = [
    path('employees/active/', active_employees),  # Explicit route first
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
