from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    FactorViewSet, SurveyViewSet, QuestionViewSet, 
    SurveyAssignmentViewSet, SurveyResponseViewSet
)

router = DefaultRouter()
router.register(r'factors', FactorViewSet)
router.register(r'forms', SurveyViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'assignments', SurveyAssignmentViewSet)
router.register(r'responses', SurveyResponseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]