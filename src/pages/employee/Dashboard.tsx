import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmployeeLayout from '../../components/layout/EmployeeLayout';
import { ClipboardList, BookOpen, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';

interface SurveyAssignment {
  id: number;
  survey_details: {
    id: number;
    title: string;
    category: string;
  };
  due_date: string | null;
}

interface TrainingAssignment {
  id: number;
  training_details: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
  };
  status: string;
}

const EmployeeDashboard: React.FC = () => {
  const [pendingSurveys, setPendingSurveys] = useState<SurveyAssignment[]>([]);
  const [trainings, setTrainings] = useState<TrainingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveysRes, trainingsRes] = await Promise.all([
          api.get('/surveys/assignments/my_assignments/'),
          api.get('/trainings/assignments/my_trainings/')
        ]);
        
        setPendingSurveys(surveysRes.data);
        setTrainings(trainingsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <EmployeeLayout title="Employee Dashboard">
      <div className="container mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to Your Dashboard</h2>
          <p className="text-gray-600">
            From here, you can view and complete your assigned surveys and trainings.
            Stay on top of your tasks to help us improve your workplace experience.
          </p>
        </div>
        
        {/* Pending Surveys */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Pending Surveys</h3>
            {pendingSurveys.length > 0 && (
              <span className="bg-amber-100 text-amber-800 py-1 px-3 rounded-full text-sm font-medium">
                {pendingSurveys.length} pending
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ) : pendingSurveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSurveys.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
                  <div className="bg-amber-50 px-4 py-2 border-l-4 border-amber-500">
                    <div className="flex items-center">
                      <ClipboardList className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-sm font-medium text-amber-800">
                        {getCategoryLabel(assignment.survey_details.category)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">{assignment.survey_details.title}</h4>
                    
                    {assignment.due_date && (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      </div>
                    )}
                    
                    <Link 
                      to={`/employee/surveys/${assignment.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium inline-block transition-colors"
                    >
                      Complete Survey
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No pending surveys at the moment. Great job!</p>
            </div>
          )}
        </div>
        
        {/* Assigned Trainings */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Your Trainings</h3>
            
            <Link 
              to="/employee/trainings"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ) : trainings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainings.slice(0, 4).map((training) => (
                <div key={training.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Training</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(training.status)}`}>
                        {training.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">{training.training_details.title}</h4>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <span className="font-medium">Start:</span>
                      <span className="ml-2">{formatDate(training.training_details.start_date)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">End:</span>
                      <span className="ml-2">{formatDate(training.training_details.end_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No trainings have been assigned to you yet.</p>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
};

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'END_CONTRACT':
      return 'End-of-Contract Evaluation';
    case 'RENEWAL':
      return 'Renewal Consideration';
    case 'MID_CONTRACT':
      return 'Mid-Contract Satisfaction';
    case 'ONBOARDING':
      return 'Onboarding Satisfaction';
    default:
      return category;
  }
}

function getStatusColor(status: string): string {
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
}

export default EmployeeDashboard;