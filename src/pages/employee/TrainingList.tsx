import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BookOpen, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import EmployeeLayout from '../../components/layout/EmployeeLayout';
import api from '../../services/api';

interface Training {
  id: number;
  training_details: {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    is_mandatory: boolean;
    max_participants: number | null;
  };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completion_date: string | null;
  assigned_at: string;
  notes: string;
}

const TrainingList: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await api.get('/trainings/assignments/my_trainings/');
      setTrainings(response.data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast.error('Failed to load trainings');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Training['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Training['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const filteredTrainings = trainings.filter(training => {
    if (activeTab === 'completed') {
      return training.status === 'COMPLETED';
    }
    return training.status !== 'COMPLETED';
  });

  if (isLoading) {
    return (
      <EmployeeLayout title="My Trainings">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout title="My Trainings">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 text-gray-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">My Trainings</h1>
          </div>

          <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'upcoming'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Upcoming & In Progress
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'completed'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredTrainings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab === 'completed' ? 'completed' : 'upcoming'} trainings
            </h3>
            <p className="text-gray-600">
              {activeTab === 'completed'
                ? "You haven't completed any trainings yet."
                : "You don't have any upcoming trainings at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainings.map((training) => (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {training.training_details.title}
                    </h3>
                    <div className={`flex items-center px-2 py-1 rounded-full ${getStatusColor(training.status)}`}>
                      {getStatusIcon(training.status)}
                      <span className="ml-1 text-xs font-medium">
                        {training.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {training.training_details.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {formatDate(training.training_details.start_date)} - {formatDate(training.training_details.end_date)}
                      </span>
                    </div>

                    {training.training_details.is_mandatory && (
                      <div className="flex items-center text-amber-600 font-medium">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>Mandatory Training</span>
                      </div>
                    )}

                    {training.training_details.max_participants && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>Limited to {training.training_details.max_participants} participants</span>
                      </div>
                    )}

                    {training.completion_date && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>Completed on {formatDate(training.completion_date)}</span>
                      </div>
                    )}
                  </div>

                  {training.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">{training.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default TrainingList;