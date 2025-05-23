from rest_framework import serializers
from surveys.models import Factor, Survey, Question, SurveyAssignment, SurveyResponse
from users.serializers import UserSerializer



class FactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factor
        fields = [
            'id', 'name', 'description', 'type', 'weight',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class QuestionSerializer(serializers.ModelSerializer):
    factor_details = FactorSerializer(source='factor', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'survey', 'text', 'type', 'options',
            'is_required', 'order', 'factor', 'factor_details',
            'has_scoring', 'scoring_guide', 'scoring_points'
        ]


class SurveySerializer(serializers.ModelSerializer):
    response_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'description', 'category', 'created_by',
            'created_by_name', 'is_active', 'created_at', 'updated_at',
            'question_count', 'response_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'response_count']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return ""

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_response_count(self, obj):
        return obj.assignments.filter(is_completed=True).count()


class SurveyWithQuestionsSerializer(SurveySerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(SurveySerializer.Meta):
        fields = SurveySerializer.Meta.fields + ['questions']


class SurveyAssignmentSerializer(serializers.ModelSerializer):
    survey_details = SurveySerializer(source='survey', read_only=True)
    employee_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    total_score = serializers.FloatField(read_only=True)

    class Meta:
        model = SurveyAssignment
        fields = [
            'id', 'survey', 'survey_details', 'employee', 'employee_name',
            'assigned_by', 'assigned_by_name', 'assigned_at', 'due_date',
            'is_completed', 'completed_at', 'total_score'
        ]
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
    question_text = serializers.SerializerMethodField()
    question_type = serializers.SerializerMethodField()
    factor = serializers.SerializerMethodField()
    score = serializers.FloatField(read_only=True)

    class Meta:
        model = SurveyResponse
        fields = [
            'id', 'assignment', 'question', 'question_text', 'question_type',
            'answer', 'factor', 'submitted_at', 'score'
        ]
        read_only_fields = ['submitted_at', 'score']

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
    question_id = serializers.IntegerField()
    answer = serializers.JSONField()


class SurveySubmissionSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    responses = ResponseSubmissionSerializer(many=True)


class SurveyResponseDetailSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_id = serializers.IntegerField(source='question.id', read_only=True)
    max_points = serializers.FloatField(source='question.scoring_points', read_only=True)
    has_scoring = serializers.BooleanField(source='question.has_scoring', read_only=True)

    class Meta:
        model = SurveyResponse
        fields = [
            'id', 'question_id', 'question_text', 'answer',
            'score', 'max_points', 'has_scoring', 'submitted_at'
        ]


class SurveyResponseSummarySerializer(serializers.ModelSerializer):
    employee_details = serializers.SerializerMethodField()
    responses = serializers.SerializerMethodField()
    total_score = serializers.FloatField(read_only=True)

    class Meta:
        model = SurveyAssignment
        fields = ['id', 'employee_details', 'completed_at', 'total_score', 'responses']

    def get_employee_details(self, obj):
        if obj.employee and obj.employee.user:
            return {
                'id': obj.employee.id,
                'name': f"{obj.employee.user.first_name} {obj.employee.user.last_name}",
                'email': obj.employee.user.email,
                'department': obj.employee.user.department.name if obj.employee.user.department else None,
                'position': obj.employee.position
            }
        return None

    def get_responses(self, obj):
        responses = obj.responses.all().select_related('question')
        return SurveyResponseDetailSerializer(responses, many=True).data