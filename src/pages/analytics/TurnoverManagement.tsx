import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Users, FileText, Edit2, Trash2 } from 'lucide-react';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

interface TurnoverRecord {
  id: string;
  employee: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  exit_date: string;
  exit_reason: string;
  department?: {
    id: number;
    name: string;
  };
  position: string;
  tenure_months: number;
  performance_rating: string;
  survey_responses?: any;
  factor?: number;
  factor_name?: string;
}

interface Employee {
  id: number;
  user_details: {
    first_name: string;
    last_name: string;
    email: string;
  };
  position: string;
  department_details?: {
    id: number;
    name: string;
  };
}

interface Factor {
  id: number;
  name: string;
}

const TurnoverManagement: React.FC = () => {
  const [turnoverRecords, setTurnoverRecords] = useState<TurnoverRecord[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    employee: '',
    exit_date: '',
    exit_reason: '',
    department: '',
    position: '',
    tenure_months: 0,
    performance_rating: '',
    survey_responses: {},
    factor: '',
  });

  useEffect(() => {
    fetchTurnoverRecords();
    fetchActiveEmployees();
    fetchFactors();
  }, []);

  const fetchTurnoverRecords = async () => {
    try {
      const response = await api.get('/analytics/turnover/records/');
      setTurnoverRecords(response.data);
    } catch (err) {
      toast.error('Failed to load turnover records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveEmployees = async () => {
    try {
      const response = await api.get('/users/employees/active/');
      setActiveEmployees(response.data);
    } catch {
      toast.error('Failed to load active employees');
    }
  };

  const fetchFactors = async () => {
    try {
      const response = await api.get('/surveys/factors/');
      setFactors(response.data);
    } catch {
      toast.error('Failed to load risk factors');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editMode && editingId
        ? `/analytics/turnover/records/${editingId}/`
        : '/analytics/turnover/records/';
      const method = editMode ? api.put : api.post;

      await method(url, formData);
      toast.success(editMode ? 'Record updated' : 'Record created');
      setShowModal(false);
      setEditMode(false);
      setEditingId(null);
      resetForm();
      fetchTurnoverRecords();
      fetchActiveEmployees();
    } catch {
      toast.error('Failed to save record');
    }
  };

  const handleEdit = (record: TurnoverRecord) => {
    setEditMode(true);
    setEditingId(record.id);
    setFormData({
      employee: record.employee?.id?.toString() ?? '',
      exit_date: record.exit_date,
      exit_reason: record.exit_reason,
      department: record.department?.id?.toString() ?? '',
      position: record.position,
      tenure_months: record.tenure_months,
      performance_rating: record.performance_rating,
      survey_responses: record.survey_responses || {},
      factor: record.factor?.toString() ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/analytics/turnover/records/${id}/`);
      toast.success('Record deleted');
      fetchTurnoverRecords();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const resetForm = () => {
    setFormData({
      employee: '',
      exit_date: '',
      exit_reason: '',
      department: '',
      position: '',
      tenure_months: 0,
      performance_rating: '',
      survey_responses: {},
      factor: '',
    });
  };

  return (
    <HRLayout title="Turnover Management">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Turnover Records</h2>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
              setEditMode(false);
            }}
            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
          >
            <FileText className="h-5 w-5 mr-2" />
            Record Turnover
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {turnoverRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rec.employee?.user?.first_name} {rec.employee?.user?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{rec.employee?.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">{rec.position}</td>
                    <td className="px-6 py-4">{rec.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(rec.exit_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{rec.tenure_months} months</td>
                    <td className="px-6 py-4">{rec.performance_rating}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(rec)} className="text-teal-600 hover:text-teal-900 mr-4">
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">{editMode ? 'Edit Turnover' : 'Record Turnover'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <select
                    required
                    disabled={editMode}
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  >
                    <option value="">Select an employee</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user_details.first_name} {emp.user_details.last_name} ({emp.user_details.email})
                      </option>
                    ))}
                  </select>
                </div>
                <input type="date" required value={formData.exit_date} onChange={e => setFormData({ ...formData, exit_date: e.target.value })} className="w-full border rounded px-3 py-2" />
                <input type="text" required value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Position" />
                <input type="number" required value={formData.tenure_months} onChange={e => setFormData({ ...formData, tenure_months: parseInt(e.target.value) || 0 })} className="w-full border rounded px-3 py-2" placeholder="Tenure (months)" />
                <textarea required value={formData.exit_reason} onChange={e => setFormData({ ...formData, exit_reason: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Exit Reason" />
                <select required value={formData.performance_rating} onChange={e => setFormData({ ...formData, performance_rating: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select rating</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
                <select value={formData.factor} onChange={e => setFormData({ ...formData, factor: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select factor (optional)</option>
                  {factors.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">{editMode ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
};

export default TurnoverManagement;