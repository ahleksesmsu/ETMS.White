import React, { useEffect, useState } from 'react';
import { 

  PieChart, Pie, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { AlertTriangle, CheckCircle, Users, ListChecks, TrendingDown } from 'lucide-react';
import api from '../../services/api';
import { EmployeeStats, TurnoverData } from '../../types/analytics';
import TurnoverRateCard from '../../components/analytics/TurnoverRateCard';
import TurnoverTrendsChart from '../../components/analytics/TurnoverTrendsChart';
import DepartmentTurnoverChart from '../../components/analytics/DepartmentTurnoverChart';
import RiskFactorsChart from '../../components/analytics/RiskFactorsChart';
import HRLayout from '../../components/layout/HRLayout';

  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line,
  ErrorBar
} from 'recharts';
import HRLayout from '../../components/layout/HRLayout';
import { 
  AlertTriangle, CheckCircle, Users, ListChecks, 
  Download, Filter, Calendar, Building2
} from 'lucide-react';
import api from '../../services/api';

interface EmployeeStats {
  total: number;
  byRisk: { name: string; value: number; color: string }[];
  byDepartment: { name: string; count: number }[];
  pendingSurveys: number;
  completedSurveys: number;
  highRiskEmployees: { name: string; department: string }[];
  topRiskFactors: { factor: string; avgScore: number; stdDev: number }[];
  riskByDepartment: {
    department: string;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  }[];
}


interface FilterState {
  department: string;
  dateRange: 'all' | 'month' | 'quarter' | 'year';
  riskLevel: 'all' | 'high' | 'medium' | 'low';
}

const HRDashboard: React.FC = () => {
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    byRisk: [
      { name: 'Low Risk', value: 0, color: '#16A34A' },
      { name: 'Medium Risk', value: 0, color: '#EAB308' },
      { name: 'High Risk', value: 0, color: '#DC2626' },
    ],
    byDepartment: [],
    pendingSurveys: 0,
    completedSurveys: 0,
    turnoverRate: 0,
  });
  
  const [turnoverData, setTurnoverData] = useState<TurnoverData>({
    overall_rate: 0,
    monthly_rates: [],
    department_rates: [],
    risk_factors: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);

  const [isTurnoverLoading, setIsTurnoverLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        // Fetch employees
        const employeesResponse = await api.get('/users/employees/');
        const employees = employeesResponse.data;
        
        // Fetch departments
        const departmentsResponse = await api.get('/departments/');
        const departments = departmentsResponse.data;
        
        // Fetch survey assignments
        const assignmentsResponse = await api.get('/surveys/assignments/');
        const assignments = assignmentsResponse.data;
        
        // Process employee risk data
        const riskCounts = {
          'LOW': 0,
          'MEDIUM': 0,
          'HIGH': 0,
        };
        
        employees.forEach((employee: any) => {
          if (employee.turnover_risk) {
            riskCounts[employee.turnover_risk]++;
          }
        });
        
        // Process department data
        const departmentCounts = departments.map((dept: any) => ({
          name: dept.name,
          count: dept.employee_count || 0,
        }));
        
        // Update stats
        setStats({
          total: employees.length,
          byRisk: [
            { name: 'Low Risk', value: riskCounts['LOW'], color: '#16A34A' },
            { name: 'Medium Risk', value: riskCounts['MEDIUM'], color: '#EAB308' },
            { name: 'High Risk', value: riskCounts['HIGH'], color: '#DC2626' },
          ],
          byDepartment: departmentCounts,
          pendingSurveys: assignments.filter((a: any) => !a.is_completed).length,
          completedSurveys: assignments.filter((a: any) => a.is_completed).length,
          turnoverRate: 0, // Will be updated from turnover analytics
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchTurnoverData = async () => {
      try {
        setIsTurnoverLoading(true);
        const response = await api.get('/analytics/turnover/');
        setTurnoverData(response.data);
        
        // Update the turnover rate in stats
        setStats(prevStats => ({
          ...prevStats,
          turnoverRate: response.data.overall_rate,
        }));
      } catch (error) {
        console.error('Error loading turnover analytics:', error);
      } finally {
        setIsTurnoverLoading(false);
      }
    };
    
    fetchEmployeeData();
    fetchTurnoverData();
  }, []);

  return (
    <HRLayout title="HR Dashboard">
      <div className="container mx-auto">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

  const [filters, setFilters] = useState<FilterState>({
    department: 'all',
    dateRange: 'all',
    riskLevel: 'all',
  });
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const response = await api.get('/analytics/turnover/');
      setStats(response.data);
      
      const uniqueDepartments = [...new Set(response.data.byDepartment.map((d: any) => d.name))];
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error('Error loading turnover analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filterData = (data: any) => {
    let filtered = { ...data };

    if (filters.department !== 'all') {
      filtered.riskByDepartment = filtered.riskByDepartment.filter(
        (d: any) => d.department === filters.department
      );
      filtered.highRiskEmployees = filtered.highRiskEmployees.filter(
        (e: any) => e.department === filters.department
      );
    }

    if (filters.riskLevel !== 'all') {
      filtered.byRisk = filtered.byRisk.filter(
        (r: any) => r.name.toLowerCase().includes(filters.riskLevel)
      );
    }

    return filtered;
  };

  const filteredStats = filterData(stats);

  const CustomizedErrorBar = (props: any) => {
    const { x, y, width, height, dataKey } = props;
    const value = Math.abs(height);
    
    return (
      <g>
        <line
          x1={x + width / 2}
          y1={y - value}
          x2={x + width / 2}
          y2={y + value}
          stroke="#666"
          strokeWidth={2}
        />
        <line
          x1={x + width / 2 - 4}
          y1={y - value}
          x2={x + width / 2 + 4}
          y2={y - value}
          stroke="#666"
          strokeWidth={2}
        />
        <line
          x1={x + width / 2 - 4}
          y1={y + value}
          x2={x + width / 2 + 4}
          y2={y + value}
          stroke="#666"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <HRLayout title="HR Dashboard">
      <div className="container mx-auto print:mx-0">
        {/* Header with filters and print button */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex space-x-4">
            <div className="relative">
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="pl-8 pr-4 py-2 border rounded-lg appearance-none"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <Building2 className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
            </div>

            <div className="relative">
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="pl-8 pr-4 py-2 border rounded-lg appearance-none"
              >
                <option value="all">All Time</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
            </div>

            <div className="relative">
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value as any })}
                className="pl-8 pr-4 py-2 border rounded-lg appearance-none"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
              <Filter className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Print Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-teal-500" />
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Total Employees</h3>
                <p className="text-2xl font-semibold">{isLoading ? '-' : stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <AlertTriangle className="h-10 w-10 text-red-500" />
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">High Risk Employees</h3>
                <p className="text-2xl font-semibold">
                  {isLoading ? '-' : filteredStats.byRisk.find(r => r.name === 'High Risk')?.value || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <ListChecks className="h-10 w-10 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Pending Surveys</h3>
                <p className="text-2xl font-semibold">{isLoading ? '-' : stats.pendingSurveys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Completed Surveys</h3>
                <p className="text-2xl font-semibold">{isLoading ? '-' : stats.completedSurveys}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <TrendingDown className="h-10 w-10 text-purple-500" />
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Current Turnover</h3>
                <p className="text-2xl font-semibold">
                  {isTurnoverLoading ? '-' : `${(turnoverData.overall_rate * 100).toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        
        {/* Turnover Analytics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Turnover Analytics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TurnoverTrendsChart 
              data={turnoverData.monthly_rates} 
              isLoading={isTurnoverLoading} 
            />
            
            <DepartmentTurnoverChart 
              data={turnoverData.department_rates} 
              isLoading={isTurnoverLoading} 
            />
          </div>
        </div>
        
        {/* Risk Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Turnover Risk Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Employee Turnover Risk</h3>
            {isLoading ? (
              <div className="animate-pulse flex justify-center items-center h-64">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.byRisk}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.byRisk.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} employees`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Risk Factors Chart */}
          <RiskFactorsChart 
            data={turnoverData.risk_factors} 
            isLoading={isTurnoverLoading} 
          />
        </div>
        
        {/* Action Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Recommended Actions</h3>
          
          <div className="space-y-4">
            {!isLoading && stats.byRisk[2].value > 0 && (
              <div className="flex items-start p-4 border-l-4 border-red-500 bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">High Risk Employees</h4>
                  <p className="text-sm text-red-700">
                    You have {stats.byRisk[2].value} employees at high risk of turnover. 
                    Consider scheduling one-on-one meetings and reviewing their recent survey responses.
                  </p>
                </div>
              </div>
            )}
            
            {!isLoading && stats.pendingSurveys > 0 && (
              <div className="flex items-start p-4 border-l-4 border-blue-500 bg-blue-50">
                <ListChecks className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Pending Surveys</h4>
                  <p className="text-sm text-blue-700">
                    There are {stats.pendingSurveys} surveys pending completion. 
                    Consider sending reminders to increase response rates.
                  </p>
                </div>
              </div>
            )}
            
            {!isTurnoverLoading && turnoverData.overall_rate > 0.15 && (
              <div className="flex items-start p-4 border-l-4 border-purple-500 bg-purple-50">
                <TrendingDown className="h-6 w-6 text-purple-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-800">High Turnover Rate</h4>
                  <p className="text-sm text-purple-700">
                    Your current turnover rate of {(turnoverData.overall_rate * 100).toFixed(1)}% is above the healthy threshold.
                    Review the key risk factors and consider targeted interventions.
                  </p>
                </div>
              </div>
            )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Risk Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Employee Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={filteredStats.byRisk}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {filteredStats.byRisk.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Factors with Standard Deviation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Risk Factors Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredStats.topRiskFactors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="factor" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="avgScore"
                  fill="#EF4444"
                  name="Average Risk Score"
                >
                  {filteredStats.topRiskFactors.map((entry, index) => (
                    <ErrorBar
                      key={`error-bar-${index}`}
                      dataKey="stdDev"
                      width={4}
                      strokeWidth={2}
                      stroke="#666"
                      direction="y"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Departmental Risk Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Risk Level by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredStats.riskByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="highRiskCount" stackId="a" fill="#DC2626" name="High Risk" />
              <Bar dataKey="mediumRiskCount" stackId="a" fill="#EAB308" name="Medium Risk" />
              <Bar dataKey="lowRiskCount" stackId="a" fill="#16A34A" name="Low Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* High Risk Employees Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">High Risk Employees</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Department</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.highRiskEmployees.map((emp, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{emp.name}</td>
                    <td className="px-4 py-2">{emp.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:mx-0 {
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .container {
              max-width: none !important;
              width: 100% !important;
            }
          }
        `}
      </style>
    </HRLayout>
  );
};


export default HRDashboard

