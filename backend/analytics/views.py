# views.py (add at the bottom or create analytics/views.py)
from django.db.models import Count, Avg, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import Employee
from surveys.models import SurveyAssignment, SurveyResponse, Factor

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def turnover_analytics(request):
    user = request.user
    is_hr = user.role == 'HR'
    
    # Scope employees
    employees = Employee.objects.select_related('user')
    if is_hr:
        employees = employees.filter(user__department=user.department)

    # Risk counts
    risk_levels = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0}
    high_risk_employees = []
    for emp in employees:
        risk = getattr(emp, 'turnover_risk', None)
        if risk:
            risk_levels[risk] += 1
            if risk == 'HIGH':
                high_risk_employees.append({
                    'name': f"{emp.user.first_name} {emp.user.last_name}".strip() or emp.user.username,
                    'department': getattr(emp.user.department, 'name', 'N/A')
                })

    # Department counts
    dept_counts = employees.values('user__department__name').annotate(count=Count('id'))
    by_department = [{'name': d['user__department__name'] or 'N/A', 'count': d['count']} for d in dept_counts]

    # Risk by department
    dept_risk = employees.values('user__department__name', 'turnover_risk').annotate(count=Count('id'))
    risk_by_department = {}
    for row in dept_risk:
        dept = row['user__department__name'] or 'N/A'
        risk = row['turnover_risk']
        if dept not in risk_by_department:
            risk_by_department[dept] = {'department': dept, 'lowRiskCount': 0, 'mediumRiskCount': 0, 'highRiskCount': 0}
        if risk == 'LOW':
            risk_by_department[dept]['lowRiskCount'] += row['count']
        elif risk == 'MEDIUM':
            risk_by_department[dept]['mediumRiskCount'] += row['count']
        elif risk == 'HIGH':
            risk_by_department[dept]['highRiskCount'] += row['count']

    # Pending and completed surveys
    assignments = SurveyAssignment.objects.all()
    if is_hr:
        assignments = assignments.filter(employee__user__department=user.department)
    pending = assignments.filter(is_completed=False).count()
    completed = assignments.filter(is_completed=True).count()

    # Top risk factors by avg score
    top_factors_qs = SurveyResponse.objects.filter(
        score__isnull=False,
        question__factor__type='TURNOVER'
    ).values('question__factor__name').annotate(avg=Avg('score')).order_by('-avg')[:5]
    top_factors = [{'factor': f['question__factor__name'], 'avgScore': round(f['avg'], 2)} for f in top_factors_qs]

    return Response({
        'total': employees.count(),
        'byRisk': [
            {'name': 'Low Risk', 'value': risk_levels['LOW'], 'color': '#16A34A'},
            {'name': 'Medium Risk', 'value': risk_levels['MEDIUM'], 'color': '#EAB308'},
            {'name': 'High Risk', 'value': risk_levels['HIGH'], 'color': '#DC2626'},
        ],
        'byDepartment': by_department,
        'pendingSurveys': pending,
        'completedSurveys': completed,
        'highRiskEmployees': high_risk_employees,
        'topRiskFactors': top_factors,
        'riskByDepartment': list(risk_by_department.values()),
    })
