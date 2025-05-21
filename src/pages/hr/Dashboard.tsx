import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import HRLayout from '../../components/layout/HRLayout';
import { AlertTriangle, CheckCircle, Users, ListChecks } from 'lucide-react';
import api from '../../services/api';

interface EmployeeStats {
  total: number;
  byRisk: { name: string; value: number; color: string }[];
  byDepartment: { name: string; count: number }[];
  pendingSurveys: number;
  completedSurveys: number;
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
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <HRLayout title="HR Dashboard">
      <div className="container mx-auto">
        
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
                  {isLoading ? '-' : stats.byRisk.find(r => r.name === 'High Risk')?.value || 0}
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
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          
          {/* Department Distribution Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Employees by Department</h3>
            {isLoading ? (
              <div className="animate-pulse flex flex-col justify-center items-center h-64">
                <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.byDepartment}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Employees" fill="#0D9488" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Action Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Recommended Actions</h3>
          
          <div className="space-y-4">
            {stats.byRisk[2].value > 0 && (
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
            
            {stats.pendingSurveys > 0 && (
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
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default HRDashboard;