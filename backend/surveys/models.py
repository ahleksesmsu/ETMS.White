from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Factor(models.Model):
    """
    Factor model - represents categories for survey questions.
    Used for analytics and turnover prediction.
    """
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    type = models.CharField(
        max_length=20,
        choices=(
            ('TURNOVER', 'Turn-over Indicator'),
            ('NON_TURNOVER', 'Non-Indicator'),
        ),
        default='NON_TURNOVER'
    )
    weight = models.FloatField(default=1.0, validators=[MinValueValidator(0.1), MaxValueValidator(10.0)])
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_factors'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Survey(models.Model):
    """Survey model - represents a collection of questions."""
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=50,
        choices=(
            ('END_CONTRACT', 'End-of-Contract Evaluation'),
            ('RENEWAL', 'Renewal Consideration Questionnaire'),
            ('MID_CONTRACT', 'Mid-Contract Job Satisfaction'),
            ('ONBOARDING', 'First-Day Onboarding Satisfaction'),
        )
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_surveys'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class Question(models.Model):
    """Question model - represents survey questions."""
    
    QUESTION_TYPES = (
        ('TEXT', 'Text Input'),
        ('TEXTAREA', 'Text Area'),
        ('RADIO', 'Radio Buttons'),
        ('CHECKBOX', 'Checkboxes'),
        ('DROPDOWN', 'Dropdown Selection'),
        ('RATING', 'Rating Scale'),
    )
    
    survey = models.ForeignKey(
        Survey, 
        on_delete=models.CASCADE, 
        related_name='questions'
    )
    text = models.TextField()
    type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    options = models.JSONField(null=True, blank=True)  # For choices in radio, checkbox, etc.
    is_required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    factor = models.ForeignKey(
        Factor, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='questions'
    )
    # New fields for scoring
    has_scoring = models.BooleanField(default=False)
    scoring_points = models.FloatField(default=0.0)  # Points for this question
    scoring_guide = models.JSONField(null=True, blank=True)  # Maps answers to scores
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.text[:50]}... ({self.get_type_display()})"


class SurveyAssignment(models.Model):
    """Survey Assignment model - links surveys to employees."""
    
    survey = models.ForeignKey(
        Survey, 
        on_delete=models.CASCADE, 
        related_name='assignments'
    )
    employee = models.ForeignKey(
        'users.Employee', 
        on_delete=models.CASCADE, 
        related_name='survey_assignments'
    )
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='assigned_surveys'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_score = models.FloatField(null=True, blank=True)  # Stores the total score for this assignment
    
    class Meta:
        unique_together = ['survey', 'employee']
    
    def __str__(self):
        return f"{self.survey.title} - {self.employee.user.email}"


class SurveyResponse(models.Model):
    """Survey Response model - stores employee responses to surveys."""
    
    assignment = models.ForeignKey(
        SurveyAssignment, 
        on_delete=models.CASCADE, 
        related_name='responses'
    )
    question = models.ForeignKey(
        Question, 
        on_delete=models.CASCADE, 
        related_name='responses'
    )
    answer = models.JSONField()  # Flexible field to store various response types
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(null=True, blank=True)  # Stores calculated score for this response
    
    class Meta:
        unique_together = ['assignment', 'question']
    
    def __str__(self):
        return f"Response to {self.question.text[:30]}..."
    
    def calculate_score(self):
        """Calculate the score based on the question's scoring guide."""
        if not self.question.has_scoring or not self.question.scoring_guide:
            return None
        
        if self.question.type in ('RADIO', 'DROPDOWN'):
            # For single-choice questions
            answer_value = self.answer.get('value')
            return self.question.scoring_guide.get(str(answer_value))
        
        elif self.question.type == 'RATING':
            # For rating questions, the value is the score
            rating_value = self.answer.get('value')
            try:
                return float(rating_value)
            except (ValueError, TypeError):
                return None
        
        elif self.question.type == 'CHECKBOX':
            # For multi-choice questions, sum the values of selected options
            selected_values = self.answer.get('values', [])
            total = 0
            for value in selected_values:
                score = self.question.scoring_guide.get(str(value))
                if score is not None:
                    total += score
            return total
        
        return None