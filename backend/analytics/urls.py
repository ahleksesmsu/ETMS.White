from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TurnoverRecordViewSet, AnalyticsViewSet

router = DefaultRouter()
router.register(r'turnover/records', TurnoverRecordViewSet, basename='turnover-record')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
