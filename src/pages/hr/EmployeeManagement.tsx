import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Users, UserPlus, Edit2, Trash2 } from 'lucide-react';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  department_details?: {
    name: string;
  };
}

interface Employee {
  id: number;
  user_details: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    department_details?: {
      name: string;
    };
  };
  position: string;
  hire_date: string;
  is_active: boolean;
  turnover_risk: string;
}

interface Department {
  id: number;
  name: string;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    user: '',
    position: '',
    hire_date: '',
    is_active: true,
    turnover_risk: 'LOW'
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchAvailableUsers();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments/');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users/employees/available_users/');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast.error('Failed to load available users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEmployee) {
        // Update existing employee
        await api.put(`/users/employees/${selectedEmployee.id}/`, {
          position: formData.position,
          hire_date: formData.hire_date,
          is_active: formData.is_active,
          turnover_risk: formData.turnover_risk
        });
        toast.success('Employee updated successfully');
      } else {
        // Create new employee profile
        await api.post('/users/employees/', {
          user: formData.user,
          position: formData.position,
          hire_date: formData.hire_date,
          is_active: formData.is_active,
          turnover_risk: formData.turnover_risk
        });
        toast.success('Employee created successfully');
      }

      setShowModal(false);
      setSelectedEmployee(null);
      setFormData({
        user: '',
        position: '',
        hire_date: '',
        is_active: true,
        turnover_risk: 'LOW'
      });
      fetchEmployees();
      fetchAvailableUsers();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save employee');
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      user: employee.user_details.id.toString(),
      position: employee.position,
      hire_date: employee.hire_date,
      is_active: employee.is_active,
      turnover_risk: employee.turnover_risk
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      await api.delete(`/users/employees/${id}/`);
      toast.success('Employee deleted successfully');
      fetchEmployees();
      fetchAvailableUsers();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <HRLayout title="Employee Management">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Employees</h2>
          </div>

          <button
            onClick={() => {
              setSelectedEmployee(null);
              setFormData({
                user: '',
                position: '',
                hire_date: '',
                is_active: true,
                turnover_risk: 'LOW'
              });
              setShowModal(true);
            }}
            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.user_details.first_name} {employee.user_details.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.user_details.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.user_details.department_details?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadgeColor(
                          employee.turnover_risk
                        )}`}
                      >
                        {employee.turnover_risk} Risk
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-teal-600 hover:text-teal-900 mr-4"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Employee Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {!selectedEmployee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Select User
                      </label>
                      <select
                        required
                        value={formData.user}
                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      >
                        <option value="">Select a user</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Turnover Risk
                    </label>
                    <select
                      value={formData.turnover_risk}
                      onChange={(e) => setFormData({ ...formData, turnover_risk: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    >
                      <option value="LOW">Low Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="HIGH">High Risk</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
                  >
                    {selectedEmployee ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
};

export default EmployeeManagement;