from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import EmployeeTurnover
from users.permissions import IsAdmin, IsHROfficer
from surveys.models import Factor
from .models import TurnoverAnalytics, RiskFactor
from .serializers import *

class TurnoverRecordViewSet(viewsets.ModelViewSet):
    """
    Full CRUD API endpoint for employee turnover records
    """
    queryset = EmployeeTurnover.objects.all().order_by('-exit_date')
    serializer_class = EmployeeTurnoverSerializer
    permission_classes = [IsAuthenticated]

class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for managing turnover analytics and risk factors
    """
    permission_classes = [IsAuthenticated, IsAdmin | IsHROfficer]

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get the latest turnover analytics report
        """
        analytics = TurnoverAnalytics.objects.order_by('-report_date').first()
        if not analytics:
            return Response({
                'message': 'No analytics reports found.',
                'data': None
            }, status=status.HTTP_200_OK)

        serializer = TurnoverAnalyticsSerializer(analytics)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate a new turnover analytics report with associated risk factors
        """
        try:
            current_date = timezone.now().date()
            overall_rate = 0.12

            # Monthly rates (simulated)
            monthly_rates = []
            monthly_rates.reverse()

            # Department turnover data (simulated)
            department_rates = [
                {'department': 'Engineering', 'rate': 0.08, 'employee_count': 45, 'left_count': 4},
                {'department': 'Sales', 'rate': 0.15, 'employee_count': 20, 'left_count': 3},
                {'department': 'Marketing', 'rate': 0.10, 'employee_count': 10, 'left_count': 1},
                {'department': 'Customer Support', 'rate': 0.20, 'employee_count': 15, 'left_count': 3},
            ]

            # Sample risk factor generation (linked to existing Factor records)
            risk_factor_data = [
                ('Work-Life Balance', 0.75),
                ('Compensation Satisfaction', 0.68),
                ('Manager Relationship', 0.62),
                ('Career Development', 0.58),
                ('Company Culture', 0.45),
                ('Commute Time', 0.35),
            ]

            created_risk_factors = []
            for factor_name, correlation in risk_factor_data:
                factor = Factor.objects.filter(name=factor_name).first()
                if factor:
                    risk_factor = RiskFactor.objects.create(
                        factor=factor,
                        correlation=correlation,
                        sample_size=100,  # you can replace with actual calc
                        analysis_date=current_date
                    )
                    created_risk_factors.append(risk_factor)

            # Create analytics record
            analytics = TurnoverAnalytics.objects.create(
                report_date=current_date,
                overall_rate=overall_rate,
                monthly_rates=monthly_rates,
                department_rates=department_rates,
                metadata={'generated_by': request.user.id}
            )
            analytics.risk_factors.set(created_risk_factors)

            return Response({
                'message': 'Analytics report generated successfully.',
                'report_id': analytics.id,
                'report_date': analytics.report_date
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def risk_factors(self, request):
        """
        Get all risk factors across analytics
        """
        queryset = RiskFactor.objects.all().order_by('-analysis_date')
        serializer = RiskFactorSerializer(queryset, many=True)
        return Response(serializer.data)
