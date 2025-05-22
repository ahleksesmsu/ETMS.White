from rest_framework import serializers
from .models import EmployeeTurnover, TurnoverAnalytics, RiskFactor
from users.serializers import UserSerializer, DepartmentSerializer
from surveys.models import Factor
from .serializers import *



class EmployeeTurnoverSerializer(serializers.ModelSerializer):
    employee_details = UserSerializer(source='employee.user', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    factor_name = serializers.StringRelatedField(source='factor', read_only=True)
    factor = serializers.PrimaryKeyRelatedField(queryset=Factor.objects.all(), required=False)

    class Meta:
        model = EmployeeTurnover
        fields = [
            'id', 'employee', 'employee_details', 'exit_date', 
            'exit_reason', 'department', 'department_details',
            'position', 'tenure_months', 'performance_rating',
            'survey_responses', 'factor', 'factor_name',
            'created_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'created_by']

        


class TurnoverAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for turnover analytics"""
    
    class Meta:
        model = TurnoverAnalytics
        fields = [
            'id', 'report_date', 'overall_rate', 'monthly_rates',
            'department_rates', 'risk_factors', 'metadata',
            'created_at', 'updated_at'
        ]

# serializers.py

class RiskFactorSerializer(serializers.ModelSerializer):
    factor_name = serializers.StringRelatedField(source='factor', read_only=True)
    factor = serializers.PrimaryKeyRelatedField(queryset=Factor.objects.all())

    class Meta:
        model = RiskFactor
        fields = [
            'id', 'factor', 'factor_name', 'correlation',
            'sample_size', 'analysis_date', 'created_at', 'updated_at'
        ]

    """Serializer for risk factors"""
    
    class Meta:
        model = RiskFactor
        fields = [
            'id', 'factor', 'correlation', 'sample_size',
            'analysis_date', 'created_at', 'updated_at'
        ]