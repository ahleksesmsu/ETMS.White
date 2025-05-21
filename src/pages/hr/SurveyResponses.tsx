import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, AlertCircle, Star, Info, Download, 
  User, Calendar, CheckCircle, Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

// Types
interface Question {
  id: number;
  text: string;
  type: string;
  options: any;
  is_required: boolean;
  factor?: {
    id: number;
    name: string;
    type: string;
  };
}

interface SurveyResponse {
  id: number;
  question: number;
  question_text: string;
  question_type: string;
  answer: any;
  factor: {
    id: number;
    name: string;
    type: string;
  } | null;
  submitted_at: string;
  rating?: number;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
}

interface SurveyAssignment {
  id: number;
  survey: number;
  survey_details: {
    id: number;
    title: string;
    description: string;
    category: string;
    created_at: string;
  };
  employee: number;
  employee_name: string;
  assigned_at: string;
  due_date: string;
  is_completed: boolean;
  completed_at: string | null;
  employee_details?: Employee;
}

interface Survey {
  id: number;
  title: string;
  description: string;
  category: string;
  created_at: string;
  questions: Question[];
}

const SurveyResponses = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  
  // Filters
  const [showOnlyRated, setShowOnlyRated] = useState(false);
  const [filterByFactor, setFilterByFactor] = useState<number | null>(null);
  const [factors, setFactors] = useState<{id: number, name: string}[]>([]);
  
  // Fetch survey details
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await api.get(`/surveys/forms/${surveyId}/`);
        setSurvey(response.data);
      } catch (error) {
        console.error('Error fetching survey:', error);
        toast.error('Failed to load survey details');
      }
    };
    
    fetchSurvey();
  }, [surveyId]);
  
  // Fetch assignments for this survey
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get('/surveys/assignments/', {
          params: { survey: surveyId, is_completed: true }
        });
        
        // Get detailed employee info for each assignment
        const assignmentsWithDetails = await Promise.all(
          response.data.map(async (assignment: SurveyAssignment) => {
            try {
              const employeeResponse = await api.get(`/users/employees/${assignment.employee}/`);
              return {
                ...assignment,
                employee_details: employeeResponse.data
              };
            } catch (error) {
              console.error(`Error fetching employee ${assignment.employee}:`, error);
              return assignment;
            }
          })
        );
        
        setAssignments(assignmentsWithDetails);
        
        // Select the first assignment by default if available
        if (assignmentsWithDetails.length > 0) {
          setSelectedAssignment(assignmentsWithDetails[0].id);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        toast.error('Failed to load survey assignments');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (surveyId) {
      fetchAssignments();
    }
  }, [surveyId]);
  
  // Extract unique factors from responses
  useEffect(() => {
    if (responses.length > 0) {
      const uniqueFactors = responses
        .filter(r => r.factor)
        .reduce((acc: {id: number, name: string}[], response) => {
          if (response.factor && !acc.some(f => f.id === response.factor!.id)) {
            acc.push({
              id: response.factor.id,
              name: response.factor.name
            });
          }
          return acc;
        }, []);
      
      setFactors(uniqueFactors);
    }
  }, [responses]);
  
  // Fetch responses when an assignment is selected
  useEffect(() => {
    const fetchResponses = async () => {
      if (!selectedAssignment) return;
      
      setIsLoading(true);
      try {
        const response = await api.get('/surveys/responses/', {
          params: { assignment: selectedAssignment }
        });
        
        // Get stored ratings if any
        const ratingsStr = localStorage.getItem(`survey_ratings_${selectedAssignment}`);
        const ratings = ratingsStr ? JSON.parse(ratingsStr) : {};
        
        // Apply stored ratings to responses
        const responsesWithRatings = response.data.map((resp: SurveyResponse) => ({
          ...resp,
          rating: ratings[resp.id] || 0
        }));
        
        setResponses(responsesWithRatings);
      } catch (error) {
        console.error('Error fetching responses:', error);
        toast.error('Failed to load survey responses');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResponses();
  }, [selectedAssignment]);
  
  // Handle rating change
  const handleRatingChange = (responseId: number, rating: number) => {
    // Update the responses state
    const updatedResponses = responses.map(response => {
      if (response.id === responseId) {
        return { ...response, rating };
      }
      return response;
    });
    
    setResponses(updatedResponses);
    
    // Save to localStorage
    const ratingsKey = `survey_ratings_${selectedAssignment}`;
    const ratingsStr = localStorage.getItem(ratingsKey);
    const ratings = ratingsStr ? JSON.parse(ratingsStr) : {};
    
    ratings[responseId] = rating;
    localStorage.setItem(ratingsKey, JSON.stringify(ratings));
    
    // In a real application, you might want to save this to the backend
    // api.post('/surveys/rate-response/', { response_id: responseId, rating });
  };
  
  // Export responses as CSV
  const exportResponses = () => {
    if (!responses.length) return;
    
    const assignment = assignments.find(a => a.id === selectedAssignment);
    if (!assignment) return;
    
    // Prepare CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "Question,Answer,Factor,Rating\n";
    
    // Rows
    responses.forEach(response => {
      const question = `"${response.question_text.replace(/"/g, '""')}"`;
      const answer = typeof response.answer === 'object' 
        ? `"${JSON.stringify(response.answer).replace(/"/g, '""')}"`
        : `"${String(response.answer).replace(/"/g, '""')}"`;
      const factor = response.factor ? `"${response.factor.name}"` : '""';
      const rating = response.rating || 0;
      
      csvContent += `${question},${answer},${factor},${rating}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Survey_Responses_${assignment.employee_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter responses based on current filters
  const filteredResponses = responses.filter(response => {
    if (showOnlyRated && (!response.rating || response.rating === 0)) {
      return false;
    }
    
    if (filterByFactor && (!response.factor || response.factor.id !== filterByFactor)) {
      return false;
    }
    
    return true;
  });
  
  // Calculate average rating
  const averageRating = responses.length > 0
    ? (responses.reduce((sum, r) => sum + (r.rating || 0), 0) / responses.length).toFixed(1)
    : '0.0';
  
  return (
    <HRLayout title="">
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/hr/surveys')}
            className="flex items-center text-gray-600 hover:text-blue-600 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Surveys
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {survey ? survey.title : 'Survey Responses'}
          </h1>
          {survey && (
            <p className="mt-2 text-gray-600">{survey.description}</p>
          )}
        </div>

        {isLoading && !survey ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Responses Yet</h3>
            <p className="text-gray-600">
              No one has completed this survey yet. Check back later or assign it to more employees.
            </p>
            <button
              onClick={() => navigate('/hr/surveys')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Surveys
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - List of respondents */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Respondents</h2>
              <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                {assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    onClick={() => setSelectedAssignment(assignment.id)}
                    className={`p-3 rounded-lg cursor-pointer flex items-center ${
                      selectedAssignment === assignment.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{assignment.employee_name}</p>
                      <p className="text-xs text-gray-500">
                        Completed: {new Date(assignment.completed_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle className={`w-5 h-5 ${
                      selectedAssignment === assignment.id
                        ? 'text-blue-600'
                        : 'text-gray-300'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main content - Survey responses */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-3">
              {!selectedAssignment ? (
                <div className="text-center py-12">
                  <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Select a respondent to view their answers</p>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Header with respondent info */}
                  {assignments.find(a => a.id === selectedAssignment) && (
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <div className="flex flex-wrap justify-between items-center">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {assignments.find(a => a.id === selectedAssignment)?.employee_name}'s Responses
                          </h2>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Completed: {new Date(assignments.find(a => a.id === selectedAssignment)?.completed_at || '').toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1 text-yellow-500" />
                              Average Rating: {averageRating}/5
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-2 sm:mt-0">
                          <button
                            onClick={exportResponses}
                            className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                            title="Export as CSV"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Export
                          </button>
                        </div>
                      </div>
                      
                      {/* Filters */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
                        <div className="flex items-center">
                          <Filter className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="ratedFilter"
                            checked={showOnlyRated}
                            onChange={(e) => setShowOnlyRated(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="ratedFilter" className="ml-2 text-sm text-gray-700">
                            Show only rated
                          </label>
                        </div>
                        
                        {factors.length > 0 && (
                          <div className="flex items-center ml-4">
                            <select
                              value={filterByFactor || ''}
                              onChange={(e) => setFilterByFactor(e.target.value ? parseInt(e.target.value) : null)}
                              className="text-sm border-gray-300 rounded-md py-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All factors</option>
                              {factors.map(factor => (
                                <option key={factor.id} value={factor.id}>
                                  {factor.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {(showOnlyRated || filterByFactor) && (
                          <button
                            onClick={() => {
                              setShowOnlyRated(false);
                              setFilterByFactor(null);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Response list */}
                  {filteredResponses.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No responses match your current filters</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredResponses.map(response => (
                        <div 
                          key={response.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900">{response.question_text}</h3>
                            {response.factor && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {response.factor.name}
                              </span>
                            )}
                          </div>
                          
                          {/* Display different answer types */}
                          <div className="mt-2 mb-4">
                            {response.question_type === 'Text Input' || response.question_type === 'Text Area' ? (
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{response.answer}</p>
                            ) : response.question_type === 'Radio Buttons' ? (
                              <p className="text-gray-800 font-medium">{response.answer}</p>
                            ) : response.question_type === 'Rating Scale' ? (
                              <div className="flex items-center">
                                <div className="bg-blue-50 text-blue-800 font-bold text-xl rounded-md px-3 py-1">
                                  {response.answer}/5
                                </div>
                              </div>
                            ) : response.question_type === 'Checkboxes' ? (
                              <ul className="list-disc pl-5 text-gray-800">
                                {Array.isArray(response.answer) && response.answer.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-800">{JSON.stringify(response.answer)}</p>
                            )}
                          </div>
                          
                          {/* Rating stars */}
                          <div className="mt-3 border-t border-gray-100 pt-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">Rate this response:</div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-6 h-6 cursor-pointer ${
                                      (response.rating || 0) >= star
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                    onClick={() => handleRatingChange(response.id, star)}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </HRLayout>
  );
};

export default SurveyResponses;