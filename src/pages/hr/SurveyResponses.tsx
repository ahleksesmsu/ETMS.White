
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart } from 'lucide-react';
import { toast } from 'react-toastify';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

interface ResponseStats {
  survey_id: number;
  title: string;
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  avg_score: number;
  factor_analysis: {
    id: number;
    name: string;
    type: string;
    avg_score: number;
    response_count: number;
  }[];
}

interface Response {
  id: number;
  employee_details: {
    name: string;
    email: string;
    department: string;
    position: string;
  };
  completed_at: string;
  total_score: number;
  responses: {
    question_text: string;
    answer: any;
    score: number | null;
  }[];
}

const SurveyResponses: React.FC = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Response[]>([]);
  const [stats, setStats] = useState<ResponseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
    fetchStats();
  }, [surveyId]);

  const fetchResponses = async () => {
    try {
      const response = await api.get(`/surveys/responses/by_survey/?survey_id=${surveyId}`);
      setResponses(response.data);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to load responses');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/surveys/forms/${surveyId}/statistics/`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <HRLayout title="">
        <div className="flex justify-center items-center h-screen">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout title="">
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/hr/surveys')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft /> Back to Surveys
          </button>
        </div>

        {stats && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {stats.title} - Survey Statistics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Completion Rate</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.completion_rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-700">
                    {stats.completed_assignments} of {stats.total_assignments} completed
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">Average Score</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.avg_score?.toFixed(1) || 'N/A'}
                  </p>
                  <p className="text-sm text-green-700">Overall survey score</p>
                </div>
              </div>

              {stats.factor_analysis.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Factor Analysis</h3>
                  <div className="grid gap-4">
                    {stats.factor_analysis.map(factor => (
                      <div key={factor.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{factor.name}</h4>
                            <p className="text-sm text-gray-500">{factor.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-semibold text-blue-600">
                              {factor.avg_score?.toFixed(1)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {factor.response_count} responses
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Individual Responses</h3>
            {responses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No responses yet
              </div>
            ) : (
              <div className="space-y-6">
                {responses.map((response) => (
                  <div key={response.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {response.employee_details.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {response.employee_details.department} • {response.employee_details.position}
                        </p>
                        <p className="text-sm text-gray-500">
                          Completed: {new Date(response.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      {response.total_score !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-semibold text-blue-600">
                            {response.total_score.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-500">Total Score</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {response.responses.map((item, index) => (
                        <div key={index} className="border-t pt-4">
                          <p className="font-medium text-gray-700">{item.question_text}</p>
                          <p className="text-gray-600 mt-1">
                            {typeof item.answer === 'object'
                              ? JSON.stringify(item.answer)
                              : item.answer}
                          </p>
                          {item.score !== null && (
                            <p className="text-sm text-blue-600 mt-1">
                              Score: {item.score}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

export default SurveyResponses;