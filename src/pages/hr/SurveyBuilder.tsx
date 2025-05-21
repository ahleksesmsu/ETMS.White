import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';
import { 
  PlusCircle, Save, ArrowLeft, Trash2, 
  GripVertical, AlertCircle
} from 'lucide-react';
import HRLayout from '../../components/layout/HRLayout';
import api from '../../services/api';

// Survey form types
interface Question {
  id?: number;
  text: string;
  type: string;
  options: string[] | null;
  is_required: boolean;
  order: number;
  factor: number | null;
  temp_id?: string;
}

interface Factor {
  id: number;
  name: string;
  type: string;
}

interface Survey {
  id?: number;
  title: string;
  description: string;
  category: string;
  is_active: boolean;
}

const QUESTION_TYPES = [
  { value: 'TEXT', label: 'Text Input' },
  { value: 'TEXTAREA', label: 'Text Area' },
  { value: 'RADIO', label: 'Radio Buttons' },
  { value: 'CHECKBOX', label: 'Checkboxes' },
  { value: 'DROPDOWN', label: 'Dropdown Selection' },
  { value: 'RATING', label: 'Rating Scale' }
];

const CATEGORY_OPTIONS = [
  { value: 'END_CONTRACT', label: 'End-of-Contract Evaluation' },
  { value: 'RENEWAL', label: 'Renewal Consideration Questionnaire' },
  { value: 'MID_CONTRACT', label: 'Mid-Contract Job Satisfaction' },
  { value: 'ONBOARDING', label: 'First-Day Onboarding Satisfaction' }
];

const SurveyBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // State
  const [survey, setSurvey] = useState<Survey>({
    title: '',
    description: '',
    category: 'MID_CONTRACT',
    is_active: true,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch survey data if in edit mode
  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/surveys/forms/${id}/`);
        setSurvey({
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
          category: response.data.category,
          is_active: response.data.is_active,
        });
        
        // Sort questions by order
        const sortedQuestions = [...response.data.questions].sort(
          (a, b) => a.order - b.order
        );
        setQuestions(sortedQuestions);
      } catch (error) {
        console.error('Error fetching survey:', error);
        toast.error('Failed to load survey');
      } finally {
        setIsLoading(false);
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
    
    fetchFactors();
    if (isEditMode) {
      fetchSurvey();
    }
  }, [id, isEditMode]);
  
  // Survey details handlers
  const handleSurveyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSurvey({
      ...survey,
      [name]: value,
    });
  };
  
  const handleSurveyCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSurvey({
      ...survey,
      [name]: checked,
    });
  };
  
  // Question handlers
  const addQuestion = () => {
    const newQuestion: Question = {
      text: '',
      type: 'TEXT',
      options: null,
      is_required: true,
      order: questions.length,
      factor: null,
      temp_id: Date.now().toString(), // Temporary ID for new questions
    };
    setQuestions([...questions, newQuestion]);
  };
  
  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    
    // If changing type to something that doesn't need options, reset options
    if (field === 'type' && !['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(value)) {
      updatedQuestions[index].options = null;
    }
    
    // If changing type to something that needs options and options is null, initialize it
    if (field === 'type' && ['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(value) && !updatedQuestions[index].options) {
      updatedQuestions[index].options = [''];
    }
    
    setQuestions(updatedQuestions);
  };
  
  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const currentOptions = updatedQuestions[questionIndex].options || [];
    updatedQuestions[questionIndex].options = [...currentOptions, ''];
    setQuestions(updatedQuestions);
  };
  
  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options![optionIndex] = value;
      setQuestions(updatedQuestions);
    }
  };
  
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter(
        (_, i) => i !== optionIndex
      );
      setQuestions(updatedQuestions);
    }
  };
  
  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    // Update the order of questions
    updatedQuestions.forEach((q, i) => {
      q.order = i;
    });
    setQuestions(updatedQuestions);
  };
  
  const moveQuestion = (dragIndex: number, hoverIndex: number) => {
    const updatedQuestions = [...questions];
    const draggedQuestion = updatedQuestions[dragIndex];
    
    // Remove the dragged question
    updatedQuestions.splice(dragIndex, 1);
    // Insert it at the new position
    updatedQuestions.splice(hoverIndex, 0, draggedQuestion);
    
    // Update order property
    updatedQuestions.forEach((q, i) => {
      q.order = i;
    });
    
    setQuestions(updatedQuestions);
  };
  
  // Save the survey
  const saveSurvey = async () => {
    if (!survey.title || !survey.category) {
      toast.error('Survey title and category are required');
      return;
    }
    
    if (questions.length === 0) {
      toast.error('Survey must have at least one question');
      return;
    }
    
    // Validate all questions have text
    const invalidQuestions = questions.filter(q => !q.text.trim());
    if (invalidQuestions.length > 0) {
      toast.error('All questions must have text');
      return;
    }
    
    // Validate all options have text
    const invalidOptions = questions.some(q => 
      q.options && q.options.some(opt => !opt.trim())
    );
    if (invalidOptions) {
      toast.error('All options must have text');
      return;
    }
    
    setIsSaving(true);
    
    try {
      let surveyId: number;
      
      // Create or update the survey
      if (isEditMode && survey.id) {
        const surveyResponse = await api.put(`/surveys/forms/${survey.id}/`, {
          title: survey.title,
          description: survey.description,
          category: survey.category,
          is_active: survey.is_active,
        });
        surveyId = surveyResponse.data.id;
      } else {
        const surveyResponse = await api.post('/surveys/forms/', {
          title: survey.title,
          description: survey.description,
          category: survey.category,
          is_active: survey.is_active,
        });
        surveyId = surveyResponse.data.id;
      }
      
      // Handle questions - create, update, or delete
      if (isEditMode) {
        // Get existing questions
        const existingQuestionsRes = await api.get(`/surveys/questions/?survey_id=${surveyId}`);
        const existingQuestions = existingQuestionsRes.data;
        
        // Determine which questions to update, create, or delete
        const existingIds = existingQuestions.map((q: any) => q.id);
        const currentIds = questions.filter(q => q.id).map(q => q.id);
        
        // Questions to delete (exist in database but not in current form)
        const deleteIds = existingIds.filter((id: number) => !currentIds.includes(id));
        
        // Delete questions that are no longer in the form
        for (const id of deleteIds) {
          await api.delete(`/surveys/questions/${id}/`);
        }
      }
      
      // Create or update questions
      for (const question of questions) {
        const questionData = {
          survey: surveyId,
          text: question.text,
          type: question.type,
          options: question.options,
          is_required: question.is_required,
          order: question.order,
          factor: question.factor,
        };
        
        if (question.id) {
          // Update existing question
          await api.put(`/surveys/questions/${question.id}/`, questionData);
        } else {
          // Create new question
          await api.post('/surveys/questions/', questionData);
        }
      }
      
      toast.success(`Survey ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/hr/surveys');
    } catch (error) {
      console.error('Error saving survey:', error);
      toast.error('Failed to save survey');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <HRLayout title="Loading Survey...">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </HRLayout>
    );
  }
  
  return (
    <HRLayout title={isEditMode ? "Edit Survey" : "Create Survey"}>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/hr/surveys')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Surveys
          </button>
          
          <button
            onClick={saveSurvey}
            disabled={isSaving}
            className={`flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Survey'}
          </button>
        </div>
        
        {/* Survey Details */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Survey Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={survey.title}
                onChange={handleSurveyChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
                placeholder="Enter survey title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={survey.category}
                onChange={handleSurveyChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
                required
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={survey.description}
              onChange={handleSurveyChange}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
              placeholder="Enter survey description (optional)"
            />
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={survey.is_active}
                onChange={handleSurveyCheckboxChange}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-200"
              />
              <span className="ml-2 text-sm text-gray-700">
                Active (available for assignment)
              </span>
            </label>
          </div>
        </div>
        
        {/* Questions */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Questions</h3>
            
            <button
              onClick={addQuestion}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Question
            </button>
          </div>
          
          {questions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No questions yet. Click "Add Question" to get started.</p>
            </div>
          ) : (
            <DndProvider backend={HTML5Backend}>
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <QuestionItem
                    key={question.id || question.temp_id}
                    question={question}
                    index={index}
                    factors={factors}
                    updateQuestion={(field, value) => updateQuestion(index, field, value)}
                    removeQuestion={() => removeQuestion(index)}
                    addOption={() => addOption(index)}
                    updateOption={(optIndex, value) => updateOption(index, optIndex, value)}
                    removeOption={(optIndex) => removeOption(index, optIndex)}
                    moveQuestion={moveQuestion}
                  />
                ))}
              </div>
            </DndProvider>
          )}
          
          {questions.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={addQuestion}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mx-auto"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Another Question
              </button>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
};

// QuestionItem component
interface QuestionItemProps {
  question: Question;
  index: number;
  factors: Factor[];
  updateQuestion: (field: string, value: any) => void;
  removeQuestion: () => void;
  addOption: () => void;
  updateOption: (optionIndex: number, value: string) => void;
  removeOption: (optionIndex: number) => void;
  moveQuestion: (dragIndex: number, hoverIndex: number) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  factors,
  updateQuestion,
  removeQuestion,
  addOption,
  updateOption,
  removeOption,
  moveQuestion
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start">
        <div className="mr-3 cursor-move mt-1 text-gray-400">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-12 md:col-span-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={question.text}
                onChange={(e) => updateQuestion('text', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
                placeholder="Enter question text"
                required
              />
            </div>
            
            <div className="col-span-6 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={question.type}
                onChange={(e) => updateQuestion('type', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
              >
                {QUESTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-span-6 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factor
              </label>
              <select
                value={question.factor || ''}
                onChange={(e) => updateQuestion('factor', e.target.value ? Number(e.target.value) : null)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
              >
                <option value="">No Factor</option>
                {factors.map(factor => (
                  <option key={factor.id} value={factor.id}>
                    {factor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Options for multiple choice questions */}
          {['RADIO', 'CHECKBOX', 'DROPDOWN'].includes(question.type) && (
            <div className="mt-3 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              
              {question.options && question.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(optIndex, e.target.value)}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
                    placeholder={`Option ${optIndex + 1}`}
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeOption(optIndex)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addOption}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                + Add Option
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={question.is_required}
                onChange={(e) => updateQuestion('is_required', e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-200"
              />
              <span className="ml-2 text-sm text-gray-700">Required</span>
            </label>
            
            <button
              type="button"
              onClick={removeQuestion}
              className="text-red-500 hover:text-red-700 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyBuilder;