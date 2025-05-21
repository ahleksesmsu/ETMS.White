import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ListChecks, Plus, Edit2, Trash2 } from 'lucide-react';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

interface Factor {
  id: number;
  name: string;
  description: string;
  type: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const FactorManagement: React.FC = () => {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'NON_TURNOVER',
  });

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    try {
      const response = await api.get('/surveys/factors/');
      setFactors(response.data);
    } catch (error) {
      console.error('Error fetching factors:', error);
      toast.error('Failed to load factors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedFactor) {
        await api.put(`/surveys/factors/${selectedFactor.id}/`, formData);
        toast.success('Factor updated successfully');
      } else {
        await api.post('/surveys/factors/', formData);
        toast.success('Factor created successfully');
      }
      setShowModal(false);
      setSelectedFactor(null);
      setFormData({ name: '', description: '', type: 'NON_TURNOVER' });
      fetchFactors();
    } catch (error) {
      console.error('Error saving factor:', error);
      toast.error('Failed to save factor');
    }
  };

  const handleEdit = (factor: Factor) => {
    setSelectedFactor(factor);
    setFormData({
      name: factor.name,
      description: factor.description,
      type: factor.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this factor?')) return;

    try {
      await api.delete(`/surveys/factors/${id}/`);
      toast.success('Factor deleted successfully');
      fetchFactors();
    } catch (error) {
      console.error('Error deleting factor:', error);
      toast.error('Failed to delete factor');
    }
  };

  return (
    <HRLayout title="Factor Management">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <ListChecks className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Survey Factors</h2>
          </div>

          <button
            onClick={() => {
              setSelectedFactor(null);
              setFormData({ name: '', description: '', type: 'NON_TURNOVER' });
              setShowModal(true);
            }}
            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Factor
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{factor.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        factor.type === 'TURNOVER'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {factor.type === 'TURNOVER' ? 'Turn-over Indicator' : 'Non-Indicator'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {factor.description || 'No description provided'}
                  </p>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(factor)}
                      className="text-teal-600 hover:text-teal-800"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(factor.id)}
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

        {/* Add/Edit Factor Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                {selectedFactor ? 'Edit Factor' : 'Add New Factor'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Factor Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    >
                      <option value="NON_TURNOVER">Non-Indicator</option>
                      <option value="TURNOVER">Turn-over Indicator</option>
                    </select>
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
                    {selectedFactor ? 'Update' : 'Create'}
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

export default FactorManagement;