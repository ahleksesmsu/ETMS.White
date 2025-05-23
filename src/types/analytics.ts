export interface TurnoverData {
  overall_rate: number;
  monthly_rates: {
    month: string;
    rate: number;
  }[];
  department_rates: {
    department: string;
    rate: number;
    employee_count: number;
    left_count: number;
  }[];
  risk_factors: {
    factor: string;
    correlation: number;
  }[];
}

export interface DepartmentTurnover {
  department: string;
  rate: number;
  employee_count: number;
  left_count: number;
}

export interface RiskFactor {
  factor: string;
  correlation: number;
}

export interface MonthlyRate {
  month: string;
  rate: number;
}

export interface EmployeeStats {
  total: number;
  byRisk: { name: string; value: number; color: string }[];
  byDepartment: { name: string; count: number }[];
  pendingSurveys: number;
  completedSurveys: number;
  turnoverRate: number;
}