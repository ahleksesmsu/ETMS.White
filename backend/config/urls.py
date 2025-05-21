"""URL Configuration"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/surveys/', include('surveys.urls')),
    path('api/departments/', include('departments.urls')),
    path('api/trainings/', include('trainings.urls')),
]