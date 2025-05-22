import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import EmployeeLayout from '../../components/layout/EmployeeLayout';
import api from '../../services/api';

interface SurveyAssignment {
  id: number;
  survey_details: {
    id: number;
    title: string;
    description: string;
    category: string;
  };
  due_date: string | null;
  is_completed: boolean;
}

const SurveysList: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await api.get('/surveys/assignments/');
        setSurveys(response.data);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        toast.error('Failed to load surveys');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  return (
    <EmployeeLayout title="My Surveys">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-6 h-6 text-amber-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.length === 0 ? (
            <p className="text-gray-600">No surveys assigned to you.</p>
          ) : (
            surveys.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white shadow-md rounded p-4 border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {assignment.survey_details.title}
                </h3>
                <p className="text-sm text-gray-600">{assignment.survey_details.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                </p>
                <div className="mt-4">
                  <Link
                    to={`/employee/surveys/${assignment.id}?readonly=${assignment.is_completed}`}
                    className={`inline-block text-sm font-medium px-4 py-2 rounded text-white ${assignment.is_completed ? 'bg-gray-500 hover:bg-gray-600' : 'bg-amber-600 hover:bg-amber-700'}`}
                  >
                    {assignment.is_completed ? 'View Response' : 'Start Survey'}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </EmployeeLayout>
  );
};

export default SurveysList;
