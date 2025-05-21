from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TrainingViewSet, TrainingAssignmentViewSet

router = DefaultRouter()
router.register(r'programs', TrainingViewSet)
router.register(r'assignments', TrainingAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]