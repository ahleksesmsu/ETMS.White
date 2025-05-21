from rest_framework import serializers
from .models import Training, TrainingAssignment
from departments.serializers import DepartmentSerializer


class TrainingSerializer(serializers.ModelSerializer):
    """Serializer for the Training model."""
    
    created_by_name = serializers.SerializerMethodField()
    department_details = DepartmentSerializer(source='department', read_only=True)
    participant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Training
        fields = ['id', 'title', 'description', 'start_date', 'end_date',
                 'created_by', 'created_by_name', 'department', 'department_details',
                 'is_active', 'is_mandatory', 'max_participants', 
                 'participant_count', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return ""
    
    def get_participant_count(self, obj):
        return obj.assignments.count()


class TrainingAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for the TrainingAssignment model."""
    
    training_details = TrainingSerializer(source='training', read_only=True)
    employee_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingAssignment
        fields = ['id', 'training', 'training_details', 'employee', 
                 'employee_name', 'assigned_by', 'assigned_by_name',
                 'status', 'completion_date', 'assigned_at', 'notes']
        read_only_fields = ['assigned_by', 'assigned_at']
    
    def get_employee_name(self, obj):
        if obj.employee and obj.employee.user:
            return f"{obj.employee.user.first_name} {obj.employee.user.last_name}"
        return ""
    
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}"
        return ""