import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, Trash2, FileText, Users, AlertCircle, Search,
   X
} from 'lucide-react';
import { toast } from 'react-toastify';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

// Types
interface Survey {
  id: number;
  title: string;
  description: string;
  category: string;
  created_at: string;
  is_active: boolean;
  response_count?: number;
  assigned_count?: number;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
}

const SurveyList = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  
  // Assignment modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Fetch surveys
  useEffect(() => {
    fetchSurveys();
  }, []);
  
  const fetchSurveys = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/surveys/forms/');
      setSurveys(response.data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to load surveys');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle survey deletion
  const handleDeleteClick = (survey: Survey) => {
    setSelectedSurvey(survey);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedSurvey) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/surveys/forms/${selectedSurvey.id}/`);
      setSurveys(surveys.filter(s => s.id !== selectedSurvey.id));
      toast.success('Survey deleted successfully');
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error('Failed to delete survey');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle survey assignment
  const handleAssignClick = async (survey: Survey) => {
    setSelectedSurvey(survey);
    setIsAssignModalOpen(true);
    
    // Fetch employees
    try {
      const response = await api.get('/users/employees/');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };
  
  const toggleEmployeeSelection = (employeeId: number) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };
  
  const assignSurvey = async () => {
    if (!selectedSurvey || selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    
    if (!assignmentDueDate) {
      toast.error('Please set a due date');
      return;
    }
    
    setIsAssigning(true);
    try {
      // Create assignments for each selected employee
      const assignments = selectedEmployees.map(employeeId => ({
        survey: selectedSurvey.id,
        employee: employeeId,
        due_date: assignmentDueDate
      }));
      
      // Send assignments in batch
      await Promise.all(
        assignments.map(assignment => 
          api.post('/surveys/assignments/', assignment)
        )
      );
      
      toast.success('Survey assigned successfully');
      setIsAssignModalOpen(false);
      
      // Reset state
      setSelectedEmployees([]);
      setAssignmentDueDate('');
      
      // Refresh surveys to update assigned count
      fetchSurveys();
    } catch (error) {
      console.error('Error assigning survey:', error);
      toast.error('Failed to assign survey');
    } finally {
      setIsAssigning(false);
    }
  };
  
  // Filter surveys based on search query
  const filteredSurveys = surveys.filter(survey => 
    survey.title.includes(searchQuery) ||
    survey.description.includes(searchQuery)
  );
  
  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => 
    employee.name.includes(employeeSearchQuery) ||
    employee.email.includes(employeeSearchQuery) ||
    employee.department.includes(employeeSearchQuery) ||
    employee.position.includes(employeeSearchQuery)
  );
  
  // Get category label
  const getCategoryLabel = (category: string) => {
    const categories: {[key: string]: string} = {
      'END_CONTRACT': 'End-of-Contract',
      'RENEWAL': 'Renewal Consideration',
      'MID_CONTRACT': 'Mid-Contract',
      'ONBOARDING': 'Onboarding'
    };
    return categories[category] || category;
  };
  
  return (
    <HRLayout title=''>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
          <p className="mt-2 text-gray-600">Manage and monitor all employee engagement surveys</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search surveys..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="ml-4">
                <button
                  onClick={() => navigate('/hr/surveys/builder')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Survey
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredSurveys.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchQuery ? 'No surveys match your search criteria' : 'No surveys available yet'}
                </p>
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/hr/surveys/builder')}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create your first survey
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredSurveys.map(survey => (
                  <div key={survey.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Created on {new Date(survey.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            survey.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {survey.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {getCategoryLabel(survey.category)}
                          </span>
                          <div className="ml-1 text-sm text-gray-600">
                            {survey.assigned_count ? (
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {survey.assigned_count} assigned
                              </span>
                            ) : null}
                          </div>
                          <div className="text-sm text-gray-600">
                            {survey.response_count ? (
                              <span className="flex items-center">
                                <FileText className="w-4 h-4 mr-1" />
                                {survey.response_count} responses
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAssignClick(survey)}
                          className="p-2 text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                          title="Assign to employees"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => navigate(`/hr/surveys/builder/${survey.id}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                          title="Edit survey"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(survey)}
                          className="p-2 text-gray-600 hover:text-red-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                          title="Delete survey"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedSurvey?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Survey Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Survey: {selectedSurvey?.title}
              </h3>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={assignmentDueDate}
                onChange={(e) => setAssignmentDueDate(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Employees
                </label>
                <div className="text-sm text-gray-500">
                  {selectedEmployees.length} selected
                </div>
              </div>
              <div className="relative mb-2">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="border border-gray-200 rounded-md overflow-y-auto max-h-64">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No employees match your search
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredEmployees.map(employee => (
                      <li 
                        key={employee.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleEmployeeSelection(employee.id)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                            <p className="text-xs text-gray-500">{employee.email}</p>
                          </div>
                          <div className="ml-auto text-xs text-gray-500">
                            {employee.department} • {employee.position}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {selectedEmployees.length > 0 && (
                <div className="mt-2 flex justify-between items-center">
                  <button
                    onClick={() => setSelectedEmployees([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear selection
                  </button>
                  <button
                    onClick={() => setSelectedEmployees(employees.map(e => e.id))}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select all
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isAssigning}
              >
                Cancel
              </button>
              <button
                onClick={assignSurvey}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={isAssigning || selectedEmployees.length === 0 || !assignmentDueDate}
              >
                {isAssigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Assign Survey
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </HRLayout>
  );
};

export default SurveyList;