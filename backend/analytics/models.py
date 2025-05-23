from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class RiskFactor(models.Model):
    """Model to track risk factors correlated with turnover"""
    
    factor = models.ForeignKey(
        'surveys.Factor',
        on_delete=models.CASCADE,
        related_name='risk_correlations'
    )
    correlation = models.FloatField()  # 0.0 to 1.0
    sample_size = models.IntegerField()
    analysis_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.factor.name} - {self.correlation}"



class TurnoverAnalytics(models.Model):
    report_date = models.DateField()
    overall_rate = models.FloatField()
    monthly_rates = models.JSONField()
    department_rates = models.JSONField()
    risk_factors = models.JSONField()
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class EmployeeTurnover(models.Model):
    """Model to track employee turnover events"""

    employee = models.ForeignKey(
        'users.Employee',
        on_delete=models.CASCADE,
        related_name='turnover_records'
    )

    exit_date = models.DateField()
    exit_reason = models.TextField(blank=True)

    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        related_name='turnover_records'
    )

    position = models.CharField(max_length=100)

    # Auto-calculated below
    tenure_months = models.IntegerField(null=True, blank=True)

    performance_rating = models.CharField(
        max_length=20,
        blank=True,
        choices=(
            ('Excellent', 'Excellent'),
            ('Good', 'Good'),
            ('Average', 'Average'),
            ('Poor', 'Poor'),
        )
    )

    survey_responses = models.JSONField(null=True, blank=True)

    # Related factor (risk indicator)
    factor = models.ForeignKey(
        'surveys.Factor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='turnover_records'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recorded_turnovers'
    )

    def save(self, *args, **kwargs):
        """Automatically calculate tenure in months based on employee.hire_date and exit_date"""
        if self.employee and self.exit_date:
            hire_date = getattr(self.employee, 'hire_date', None)
            if hire_date:
                delta_months = (self.exit_date.year - hire_date.year) * 12 + (self.exit_date.month - hire_date.month)
                self.tenure_months = max(delta_months, 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.user.email} - {self.exit_date}"