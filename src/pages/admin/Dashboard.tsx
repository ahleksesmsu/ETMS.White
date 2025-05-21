import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Users, Building2, ClipboardList } from 'lucide-react';
import api from '../../services/api';

interface Stats {
  userCount: number;
  departmentCount: number;
  surveyCount: number;
  activeEmployees: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    userCount: 0,
    departmentCount: 0,
    surveyCount: 0,
    activeEmployees: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // For demo purposes, we're making separate API calls
        // In a real app, you might want a dedicated stats endpoint
        const [usersRes, departmentsRes, surveysRes, employeesRes] = await Promise.all([
          api.get('/users/accounts/'),
          api.get('/departments/'),
          api.get('/surveys/forms/'),
          api.get('/users/employees/')
        ]);

        setStats({
          userCount: usersRes.data.length,
          departmentCount: departmentsRes.data.length,
          surveyCount: surveysRes.data.length,
          activeEmployees: employeesRes.data.filter((e: any) => e.is_active).length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="container mx-auto px-4">
        <h3 className="text-xl font-medium text-gray-700 mb-5">System Overview</h3>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                <div className="rounded-full bg-gray-300 w-10 h-10 mb-4"></div>
                <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-10 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center">
                <Users className="h-10 w-10 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-semibold text-gray-800">{stats.userCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center">
                <Users className="h-10 w-10 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Employees</p>
                  <p className="text-3xl font-semibold text-gray-800">{stats.activeEmployees}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-amber-500">
              <div className="flex items-center">
                <Building2 className="h-10 w-10 text-amber-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Departments</p>
                  <p className="text-3xl font-semibold text-gray-800">{stats.departmentCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center">
                <ClipboardList className="h-10 w-10 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Surveys</p>
                  <p className="text-3xl font-semibold text-gray-800">{stats.surveyCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        <h3 className="text-xl font-medium text-gray-700 mt-12 mb-5">Recent Activities</h3>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <p className="text-gray-600">
              Welcome to the admin dashboard. From here, you can manage user accounts and departments.
              Use the navigation menu on the left to access different sections of the admin portal.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;