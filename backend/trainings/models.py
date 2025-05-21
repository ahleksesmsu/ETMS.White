from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Training(models.Model):
    """Training model."""
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_trainings'
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trainings'
    )
    is_active = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=False)
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title


class TrainingAssignment(models.Model):
    """Training Assignment model - links trainings to employees."""
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    
    training = models.ForeignKey(
        Training, 
        on_delete=models.CASCADE, 
        related_name='assignments'
    )
    employee = models.ForeignKey(
        'users.Employee', 
        on_delete=models.CASCADE, 
        related_name='training_assignments'
    )
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='assigned_trainings'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    completion_date = models.DateField(null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['training', 'employee']
    
    def __str__(self):
        return f"{self.training.title} - {self.employee.user.email}"