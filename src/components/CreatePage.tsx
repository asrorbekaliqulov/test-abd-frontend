import React, { useState, useEffect } from 'react';
import { Plus, FileText, HelpCircle, ArrowLeft } from 'lucide-react';
import { quizAPI } from '../utils/api';

interface CreatePageProps {
  onNavigate: (page: string) => void;
}
interface Category {
  id: number;
  name: string;
}


interface Test {
  id: number;
  user: {
    id: number;
  };
  title: string;
  description: string;
  category: Category;
  created_at: string;
  visibility: string;
  difficulty_percentage: number;
  calculated_difficulty: number;
  total_questions: number;
}


const CreatePage: React.FC<CreatePageProps> = ({  }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'test' | 'questions'>('overview');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // console.log(categories);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await quizAPI.fetchCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const SaveTest = async (e: React.FormEvent) => {
    e.preventDefault(); // Formani default submitini to‘xtatamiz

    const titleInput = document.getElementById('title') as HTMLInputElement;
    const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    const visibilityInput = document.querySelector('input[name="visibility"]:checked') as HTMLInputElement;

    const payload = {
      title: titleInput.value,
      description: descriptionInput.value,
      visibility: visibilityInput?.value || 'public',
      category_id: parseInt(categorySelect.value) || null
    };

    try {
      const response = await quizAPI.createTest(payload);
      console.log('Test yaratildi:', response.data);
      alert('Test muvaffaqiyatli yaratildi!');
    } catch (error: any) {
      console.error('Xatolik:', error.response?.data || error.message);
      alert('Xatolik yuz berdi!');
    }
  };

  const addQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const testId = Number((form.test as HTMLSelectElement).value);
    const questionText = (form.question_text as HTMLTextAreaElement).value;
    const questionType = (form.question_type as RadioNodeList).value;

    // Variantlar (answers)
    const answerInputs = form.querySelectorAll('input[type="text"]');
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');

    const letters = ['A', 'B', 'D'];
    const answers = [];

    for (let i = 0; i < answerInputs.length; i++) {
      const answer_text = (answerInputs[i] as HTMLInputElement).value.trim();
      const is_correct = (checkboxes[i] as HTMLInputElement).checked;

      if (answer_text === '') continue; // bo'sh variantlar yuborilmaydi

      answers.push({
        answer_text,
        is_correct,
        letter: letters[i],
      });
    }

    if (answers.length < 2) {
      alert('Kamida 2 ta to‘ldirilgan variant kerak');
      return;
    }

    const payload = {
      test: testId,
      question_text: questionText,
      question_type: questionType,
      order_index: Date.now(), // vaqtga asoslangan order_index
      answers: answers,
    };

    try {
      await quizAPI.createQuestion(payload);
      alert('Savol muvaffaqiyatli yaratildi!');
      form.reset(); // Formani tozalash
    } catch (error) {
      console.error('Failed to create question:', error);
      alert('Xatolik yuz berdi!');
    }
  };
   


  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await quizAPI.fetchMyTest();
        setTests(response.data);
      } catch (error) {
        console.error('Error fetching my tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);
  


  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Plus className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Content</h1>
        <p className="text-gray-600">Choose what you'd like to create</p>
      </div>

      {/* Creation Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Create Test */}
        <div
          onClick={() => setActiveTab('test')}
          className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-200 transition-colors">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Create Test</h3>
          <p className="text-gray-600 mb-4">
            Create a new test with multiple questions. Set up the basic information, 
            category, and visibility settings.
          </p>
          <div className="flex items-center text-indigo-600 font-medium">
            <span>Get Started</span>
            <Plus className="w-4 h-4 ml-2" />
          </div>
        </div>

        {/* Add Questions */}
        <div
          onClick={() => setActiveTab('questions')}
          className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        >
          <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
            <HelpCircle className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Add Questions</h3>
          <p className="text-gray-600 mb-4">
            Add questions to existing tests. Create single choice, multiple choice, 
            or true/false questions with detailed explanations.
          </p>
          <div className="flex items-center text-purple-600 font-medium">
            <span>Get Started</span>
            <Plus className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">0</div>
          <div className="text-sm text-blue-700">Tests Created</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">0</div>
          <div className="text-sm text-green-700">Questions Added</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">0</div>
          <div className="text-sm text-purple-700">Total Attempts</div>
        </div>
      </div>
    </div>
  );

  
  

  const renderTestCreation = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Test</h1>
          <p className="text-gray-600">Set up your test details and configuration</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <form className="space-y-6" onSubmit={SaveTest}>

          {/* Test Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Test Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Enter test title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Describe what this test covers"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Select a category</option>
              
              {Array.isArray(categories) &&
                categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
              ))}

            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visibility
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Public</span>
                  <span className="block text-sm text-gray-500">Anyone can find and take this test</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="unlisted"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Unlisted</span>
                  <span className="block text-sm text-gray-500">Only people with the link can access</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Private</span>
                  <span className="block text-sm text-gray-500">Only you can access this test</span>
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
              
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                Create Test
              </button>


          </div>
        </form>
      </div>
    </div>
  );

  const renderQuestionCreation = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Questions</h1>
          <p className="text-gray-600">Create questions for your tests</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <form className="space-y-6" onSubmit={addQuestion}>
          {/* Select Test */}
          <div>
            <label htmlFor="test" className="block text-sm font-medium text-gray-700 mb-2">
              Select Test *
            </label>
            <select
              id="test"
              name="test"
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Choose a test</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-2">
              Question *
            </label>
            <textarea
              id="question_text"
              name="question_text"
              rows={3}
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Enter your question"
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Question Type *
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="question_type"
                  value="single"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Single Choice</span>
                  <span className="block text-sm text-gray-500">Only one correct answer</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="question_type"
                  value="multiple"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Multiple Choice</span>
                  <span className="block text-sm text-gray-500">Multiple correct answers</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="question_type"
                  value="true_false"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">True/False</span>
                  <span className="block text-sm text-gray-500">Simple true or false question</span>
                </span>
              </label>
            </div>
          </div>

          {/* Answer Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Answer Options *
            </label>
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder={`Option ${index}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Check the box next to correct answers
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'test' && renderTestCreation()}
        {activeTab === 'questions' && renderQuestionCreation()}
      </div>
    </div>
  );
};

export default CreatePage;