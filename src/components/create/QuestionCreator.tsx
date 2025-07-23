import React, { useState, useEffect } from 'react';
import { Plus, Save, X, HelpCircle, Trash2, Upload } from 'lucide-react';
import { quizAPI } from '../../utils/api';

interface QuestionCreatorProps {
  theme: string;
  onClose: () => void;
}

interface Answer {
  letter: string;
  answer_text: string;
  is_correct: boolean;
}

const QuestionCreator: React.FC<QuestionCreatorProps> = ({ theme, onClose }) => {
  const [formData, setFormData] = useState({
    test: '',
    question_text: '',
    question_type: 'single',
    order_index: Date.now(), 
    correct_answer_text: '',
    answer_language: '',
    description: ''
  });
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Available letters for answers
  const availableLetters = ['A', 'B', 'D', 'E', 'F'];

  useEffect(() => {
    loadTests();
  }, []);

  useEffect(() => {
    // Initialize answers based on question type
    initializeAnswers();
  }, [formData.question_type]);

  const initializeAnswers = () => {
    switch (formData.question_type) {
      case 'single':
      case 'multiple':
        setAnswers([
          { letter: 'A', answer_text: '', is_correct: false },
          { letter: 'B', answer_text: '', is_correct: false },
          { letter: 'D', answer_text: '', is_correct: false }
        ]);
        break;
      case 'true_false':
        setAnswers([
          { letter: 'A', answer_text: 'True', is_correct: false },
          { letter: 'B', answer_text: 'False', is_correct: false }
        ]);
        break;
      case 'text_input':
        setAnswers([]);
        break;
      default:
        setAnswers([]);
    }
  };

  const loadTests = async () => {
    try {
      const response = await quizAPI.fetchMyTest();
      setTests(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation based on question type
    if (formData.question_type === 'text_input') {
      if (!formData.correct_answer_text.trim()) {
        setError('Correct answer text is required for text input questions');
        setLoading(false);
        return;
      }
      if (!formData.answer_language.trim()) {
        setError('Answer language is required for text input questions');
        setLoading(false);
        return;
      }
    } else {
      const correctAnswers = answers.filter(a => a.is_correct && a.answer_text.trim());
      if (correctAnswers.length === 0) {
        setError('At least one answer must be marked as correct');
        setLoading(false);
        return;
      }

      const validAnswers = answers.filter(a => a.answer_text.trim());
      if (validAnswers.length < 2 && formData.question_type !== 'text_input') {
        setError('At least two answers are required');
        setLoading(false);
        return;
      }

      // For multiple choice, check that user doesn't select all answers as correct
      if (formData.question_type === 'multiple' && correctAnswers.length >= validAnswers.length) {
        setError('For multiple choice, you must have at least one incorrect answer');
        setLoading(false);
        return;
      }
    }

    try {
      const questionData = new FormData();
      questionData.append('test', formData.test);
      questionData.append('question_text', formData.question_text);
      questionData.append('question_type', formData.question_type);
      questionData.append('order_index', formData.order_index.toString());

      if (formData.description.trim()) {
        questionData.append('feedback', formData.description);
      }

      // For text input questions
      if (formData.question_type === 'text_input') {
        questionData.append('correct_answer_text', formData.correct_answer_text);
        questionData.append('answer_language', formData.answer_language);
      }

      if (mediaFile) {
        questionData.append('media', mediaFile);
      }

      if (formData.question_type !== 'text_input') {
        // For choice-based questions, append answers
        answers.forEach((answer, index) => {
          if (answer.answer_text.trim()) {
            questionData.append(`answers[${index}][letter]`, answer.letter);
            questionData.append(`answers[${index}][answer_text]`, answer.answer_text);
            questionData.append(`answers[${index}][is_correct]`, answer.is_correct ? 'true' : 'false');
          }
        });
      }

      // Create question first
      const questionResponse = await quizAPI.createQuestion(questionData);

      // Create answers for choice-based questions using quizAPI
      // if (formData.question_type !== 'text_input') {
      //   const validAnswers = answers.filter(a => a.answer_text.trim());
      //   // Add answers directly to the question via PATCH
      //   await quizAPI.updateQuestion(questionResponse.data.id, {
      //     answers: validAnswers.map(answer => ({
      //   letter: answer.letter,
      //   answer_text: answer.answer_text,
      //   is_correct: answer.is_correct
      //     }))
      //   });
      // }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
    setAnswers(prev => prev.map((answer, i) =>
      i === index ? { ...answer, [field]: value } : answer
    ));
  };

  const addAnswer = () => {
    if (answers.length < 5) { // Maximum 5 answers (A, B, D, E, F)
      const nextLetter = availableLetters[answers.length];
      setAnswers(prev => [...prev, { letter: nextLetter, answer_text: '', is_correct: false }]);
    }
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 3) { // Minimum 3 answers for choice questions
      setAnswers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleCorrectAnswerChange = (index: number, checked: boolean) => {
    if (formData.question_type === 'single' || formData.question_type === 'true_false') {
      // For single choice and true/false, only one can be correct
      setAnswers(prev => prev.map((answer, i) => ({
        ...answer,
        is_correct: i === index ? checked : false
      })));
    } else {
      // For multiple choice, multiple can be correct
      handleAnswerChange(index, 'is_correct', checked);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'audio/mp3', 'audio/ogg', 'video/mp4'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only images, audio, and video files are allowed.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('File size must be less than 10MB');
        return;
      }

      setMediaFile(file);
      setError('');
    }
  };

  const renderAnswerInputs = () => {
    if (formData.question_type === 'text_input') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Correct Answer Text *
            </label>
            <input
              type="text"
              name="correct_answer_text"
              value={formData.correct_answer_text}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter the correct answer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-2">
              Answer Language (manual input) *
            </label>
            <input
              type="text"
              name="answer_language"
              value={formData.answer_language}
              onChange={handleChange}
              placeholder="e.g., uz, en, ru"
              required
              className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-theme-secondary">
            Answer Options *
          </label>
          {(formData.question_type === 'single' || formData.question_type === 'multiple') && answers.length < 5 && (
            <button
              type="button"
              onClick={addAnswer}
              className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
            >
              <Plus size={16} />
              <span>Add Answer</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {answers.map((answer, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 border border-theme-primary rounded-lg">
              <div className="flex items-center min-w-[80px]">
                <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                  {answer.letter}
                </span>
                <div className="flex items-center">
                  <input
                    type={formData.question_type === 'multiple' ? 'checkbox' : 'radio'}
                    name={formData.question_type === 'multiple' ? `correct_${index}` : 'correct'}
                    checked={answer.is_correct}
                    onChange={(e) => handleCorrectAnswerChange(index, e.target.checked)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <label className="ml-2 text-sm text-theme-secondary">Correct</label>
                </div>
              </div>

              <input
                type="text"
                value={answer.answer_text}
                onChange={(e) => handleAnswerChange(index, 'answer_text', e.target.value)}
                placeholder={formData.question_type === 'true_false' ? answer.answer_text : `Answer option ${answer.letter}`}
                disabled={formData.question_type === 'true_false'}
                className="flex-1 px-3 py-2 border border-theme-primary rounded-lg bg-theme-tertiary text-green-600 focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

              {(formData.question_type === 'single' || formData.question_type === 'multiple') && answers.length > 3 && (
                <button
                  type="button"
                  onClick={() => removeAnswer(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-theme-primary">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <HelpCircle size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-primary">Create New Question</h2>
              <p className="text-sm text-theme-secondary">Add a question to your test</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-theme-tertiary rounded-lg transition-theme-normal"
          >
            <X size={20} className="text-theme-secondary" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Test Selection */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Select Test *
              </label>
              <select
                name="test"
                value={formData.test}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose a test</option>
                {tests.map(test => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Question Type
              </label>
              <select
                name="question_type"
                value={formData.question_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="text_input">Text Input</option>
              </select>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Question Text *
              </label>
              <textarea
                name="question_text"
                value={formData.question_text}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your question here..."
              />
            </div>

            {/* Description (Optional for all question types) */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Add additional description or explanation..."
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Media (Optional)
              </label>
              <div className="border-2 border-dashed border-theme-primary rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,audio/*,video/*"
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-theme-secondary mb-2" />
                  <p className="text-theme-secondary">
                    {mediaFile ? mediaFile.name : 'Click to upload image, audio, or video'}
                  </p>
                  <p className="text-xs text-theme-tertiary mt-1">Max size: 10MB</p>
                </label>
              </div>
            </div>

            {/* Dynamic Answer Inputs */}
            {renderAnswerInputs()}

            {/* Auto-generated Order Info
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📋 Bu savol avtomatik ravishda <strong>#{nextOrderIndex}</strong> tartib raqami bilan yaratiladi.
              </p>
            </div> */}

            {/* Tips */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">💡 Question writing tips:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Write clear, unambiguous questions</li>
                <li>• For single choice: only one correct answer allowed</li>
                <li>• For multiple choice: you can have multiple correct answers, but not all</li>
                <li>• For true/false: choose either true or false as correct</li>
                <li>• For text input: provide exact correct answer and specify language manually</li>
                <li>• Include media to make questions more engaging</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-theme-primary rounded-lg text-theme-secondary hover:bg-theme-tertiary transition-theme-normal"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    <span>Create Question</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuestionCreator;