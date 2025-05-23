import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BookOpen, Plus, Edit2, Trash2, Users } from 'lucide-react';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

interface Training {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  department: number | null;
  department_details?: {
    name: string;
  };
  factors: number[];
  factors_details: {
    id: number;
    name: string;
    type: string;
  }[];
  is_active: boolean;
  is_mandatory: boolean;
  max_participants: number | null;
  participant_count: number;
}

interface Department {
  id: number;
  name: string;
}

interface Factor {
  id: number;
  name: string;
  type: string;
}

interface Employee {
  id: number;
  user_details: {
    email: string;
    first_name: string;
    last_name: string;
    department_details?: {
      name: string;
    };
  };
  position: string;
}

const TrainingManagement: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    department: '',
    factors: [] as number[],
    is_active: true,
    is_mandatory: false,
    max_participants: '',
  });

  useEffect(() => {
    fetchTrainings();
    fetchDepartments();
    fetchFactors();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await api.get('/trainings/programs/');
      setTrainings(response.data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast.error('Failed to load trainings');
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

  const fetchFactors = async () => {
    try {
      const response = await api.get('/surveys/factors/');
      setFactors(response.data);
    } catch (error) {
      console.error('Error fetching factors:', error);
      toast.error('Failed to load factors');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      department: formData.department || null,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
    };

    try {
      if (selectedTraining) {
        await api.put(`/trainings/programs/${selectedTraining.id}/`, payload);
        toast.success('Training updated successfully');
      } else {
        await api.post('/trainings/programs/', payload);
        toast.success('Training created successfully');
      }
      setShowModal(false);
      setSelectedTraining(null);
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        department: '',
        factors: [],
        is_active: true,
        is_mandatory: false,
        max_participants: '',
      });
      fetchTrainings();
    } catch (error) {
      console.error('Error saving training:', error);
      toast.error('Failed to save training');
    }
  };

  const handleAssign = async () => {
    if (!selectedTraining || selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      const response = await api.post(`/trainings/programs/${selectedTraining.id}/assign/`, {
        employee_ids: selectedEmployees,
        notes: assignmentNotes,
      });

      if (response.data.errors) {
        toast.warning(`Assignment completed with some issues: ${response.data.errors.join(', ')}`);
      } else {
        toast.success(`Training assigned to ${response.data.assignments_created} employee(s)`);
      }

      setShowAssignModal(false);
      setSelectedEmployees([]);
      setAssignmentNotes('');
      setEmployeeSearchQuery('');
      fetchTrainings();
    } catch (error) {
      console.error('Error assigning training:', error);
      toast.error('Failed to assign training');
    }
  };

  const handleEdit = (training: Training) => {
    setSelectedTraining(training);
    setFormData({
      title: training.title,
      description: training.description,
      start_date: training.start_date,
      end_date: training.end_date,
      department: training.department?.toString() || '',
      factors: training.factors || [],
      is_active: training.is_active,
      is_mandatory: training.is_mandatory,
      max_participants: training.max_participants?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this training?')) return;

    try {
      await api.delete(`/trainings/programs/${id}/`);
      toast.success('Training deleted successfully');
      fetchTrainings();
    } catch (error) {
      console.error('Error deleting training:', error);
      toast.error('Failed to delete training');
    }
  };

  const handleAssignClick = (training: Training) => {
    setSelectedTraining(training);
    setShowAssignModal(true);
    fetchEmployees();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredEmployees = employees.filter(employee => {
    const searchTerm = employeeSearchQuery.toLowerCase();
    const fullName = `${employee.user_details.first_name} ${employee.user_details.last_name}`.toLowerCase();
    const email = employee.user_details.email.toLowerCase();
    const department = employee.user_details.department_details?.name.toLowerCase() || '';
    const position = employee.position.toLowerCase();

    return (
      fullName.includes(searchTerm) ||
      email.includes(searchTerm) ||
      department.includes(searchTerm) ||
      position.includes(searchTerm)
    );
  });

  return (
    <HRLayout title="Training Management">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Training Programs</h2>
          </div>

          <button
            onClick={() => {
              setSelectedTraining(null);
              setFormData({
                title: '',
                description: '',
                start_date: '',
                end_date: '',
                department: '',
                factors: [],
                is_active: true,
                is_mandatory: false,
                max_participants: '',
              });
              setShowModal(true);
            }}
            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Training
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{training.title}</h3>
                    <div className="flex space-x-2">
                      {training.is_mandatory && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Mandatory
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          training.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {training.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {training.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium mr-2">Department:</span>
                      {training.department_details?.name || 'All Departments'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium mr-2">Duration:</span>
                      {formatDate(training.start_date)} - {formatDate(training.end_date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium mr-2">Participants:</span>
                      {training.participant_count}
                      {training.max_participants && ` / ${training.max_participants}`}
                    </div>
                  </div>

                  {training.factors_details.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Related Factors:</h4>
                      <div className="flex flex-wrap gap-2">
                        {training.factors_details.map(factor => (
                          <span
                            key={factor.id}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              factor.type === 'TURNOVER'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {factor.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleAssignClick(training)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Assign to employees"
                    >
                      <Users className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(training)}
                      className="text-teal-600 hover:text-teal-800"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(training.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Training Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                {selectedTraining ? 'Edit Training' : 'Add New Training'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Related Factors
                    </label>
                    <div className="mt-2 space-y-2">
                      {factors.map(factor => (
                        <label key={factor.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.factors.includes(factor.id)}
                            onChange={(e) => {
                              const newFactors = e.target.checked
                                ? [...formData.factors, factor.id]
                                : formData.factors.filter(id => id !== factor.id);
                              setFormData({ ...formData, factors: newFactors });
                            }}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {factor.name}
                            <span className={`ml-2 text-xs ${
                              factor.type === 'TURNOVER'
                                ? 'text-amber-600'
                                : 'text-blue-600'
                            }`}>
                              ({factor.type === 'TURNOVER' ? 'Turnover' : 'Non-Turnover'})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_mandatory}
                        onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mandatory</span>
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
                    {selectedTraining ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Training Modal */}
        {showAssignModal && selectedTraining && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full">
              <h3 className="text-lg font-semibold mb-4">
                Assign Training: {selectedTraining.title}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Search Employees
                </label>
                <input
                  type="text"
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Search by name, email, department..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Assignment Notes
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  rows={2}
                  placeholder="Optional notes for the assignment..."
                />
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md mb-4">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => {
                        setSelectedEmployees(
                          selectedEmployees.includes(employee.id)
                            ? selectedEmployees.filter(id => id !== employee.id)
                            : [...selectedEmployees, employee.id]
                        );
                      }}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {employee.user_details.first_name} {employee.user_details.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {employee.user_details.email}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.user_details.department_details?.name || 'No Department'} •{' '}
                      {employee.position}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {selectedEmployees.length} employee(s) selected
                </p>
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedEmployees([]);
                      setAssignmentNotes('');
                      setEmployeeSearchQuery('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={selectedEmployees.length === 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Training
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
};

export default TrainingManagement;