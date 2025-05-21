from rest_framework import serializers
from .models import Factor, Survey, Question, SurveyAssignment, SurveyResponse


class FactorSerializer(serializers.ModelSerializer):
    """Serializer for the Factor model."""
    
    class Meta:
        model = Factor
        fields = ['id', 'name', 'description', 'type', 
                 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for the Question model."""
    
    factor_details = FactorSerializer(source='factor', read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'survey', 'text', 'type', 'options', 
                 'is_required', 'order', 'factor', 'factor_details']


class SurveySerializer(serializers.ModelSerializer):
    """Serializer for the Survey model."""
    
    created_by_name = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'category', 
                 'created_by', 'created_by_name', 'is_active', 
                 'created_at', 'updated_at', 'question_count']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return ""
    
    def get_question_count(self, obj):
        return obj.questions.count()


class SurveyWithQuestionsSerializer(SurveySerializer):
    """Serializer that includes questions with the survey."""
    
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta(SurveySerializer.Meta):
        fields = SurveySerializer.Meta.fields + ['questions']


class SurveyAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for the SurveyAssignment model."""
    
    survey_details = SurveySerializer(source='survey', read_only=True)
    employee_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SurveyAssignment
        fields = ['id', 'survey', 'survey_details', 'employee', 
                 'employee_name', 'assigned_by', 'assigned_by_name', 
                 'assigned_at', 'due_date', 'is_completed', 'completed_at']
        read_only_fields = ['assigned_by', 'assigned_at', 'completed_at']
    
    def get_employee_name(self, obj):
        if obj.employee and obj.employee.user:
            return f"{obj.employee.user.first_name} {obj.employee.user.last_name}"
        return ""
    
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}"
        return ""


class SurveyResponseSerializer(serializers.ModelSerializer):
    """Serializer for the SurveyResponse model."""
    
    question_text = serializers.SerializerMethodField()
    question_type = serializers.SerializerMethodField()
    factor = serializers.SerializerMethodField()
    
    class Meta:
        model = SurveyResponse
        fields = ['id', 'assignment', 'question', 'question_text', 
                 'question_type', 'answer', 'factor', 'submitted_at']
        read_only_fields = ['submitted_at']
    
    def get_question_text(self, obj):
        return obj.question.text if obj.question else ""
    
    def get_question_type(self, obj):
        return obj.question.get_type_display() if obj.question else ""
    
    def get_factor(self, obj):
        if obj.question and obj.question.factor:
            return {
                'id': obj.question.factor.id,
                'name': obj.question.factor.name,
                'type': obj.question.factor.type
            }
        return None


class ResponseSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting a single response."""
    
    question_id = serializers.IntegerField()
    answer = serializers.JSONField()


class SurveySubmissionSerializer(serializers.Serializer):
    """Serializer for submitting a complete survey."""
    
    assignment_id = serializers.IntegerField()
    responses = ResponseSubmissionSerializer(many=True)