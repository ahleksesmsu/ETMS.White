// src/pages/hr/Dashboard.tsx
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
  highRiskEmployees: { name: string; department: string }[];
  topRiskFactors: { factor: string; avgScore: number }[];
  riskByDepartment: {
    department: string;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  }[];
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
    highRiskEmployees: [],
    topRiskFactors: [],
    riskByDepartment: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/analytics/turnover/');
        setStats(response.data);
      } catch (error) {
        console.error('Error loading turnover analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <HRLayout title="HR Dashboard">
      <div className="container mx-auto">
        {/* Existing Stats Cards */}
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

        {/* Risk Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Employee Turnover Risk</h3>
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
        </div>

        {/* Top Risk Factors */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Top Turnover Risk Factors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topRiskFactors}>
              <XAxis dataKey="factor" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#EF4444" name="Avg Risk Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Departmental Risk Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Risk Level by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.riskByDepartment}>
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="highRiskCount" fill="#DC2626" name="High" />
              <Bar dataKey="mediumRiskCount" fill="#EAB308" name="Medium" />
              <Bar dataKey="lowRiskCount" fill="#16A34A" name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* High Risk Employees Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
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
                {stats.highRiskEmployees.map((emp, idx) => (
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
    </HRLayout>
  );
};

export default HRDashboard;
