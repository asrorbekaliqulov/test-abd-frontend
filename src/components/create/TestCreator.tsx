import React, { useState, useEffect } from 'react';
import { Save, X, FileText } from 'lucide-react';
import { quizAPI } from '../../utils/api';

interface TestCreatorProps {
  theme: string;
  onClose: () => void;
}

const TestCreator: React.FC<TestCreatorProps> = ({ theme, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    visibility: 'public'
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await quizAPI.getCategories();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await quizAPI.createTest({
        ...formData,
        category_id: parseInt(formData.category_id)
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create test');
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

  return (
    <div className="bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-primary rounded-2xl shadow-theme-xl max-w-2xl w-full max-h-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-theme-primary">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-primary">Create New Test</h2>
              <p className="text-sm text-theme-secondary">Design your quiz for the community</p>
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
            {/* Test Title */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Test Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter an engaging test title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what this test covers and what users will learn"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Visibility
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-theme-primary rounded-lg bg-theme-secondary text-theme-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="public">Public - Anyone can find and take this test</option>
                <option value="unlisted">Unlisted - Only people with the link can access</option>
                <option value="private">Private - Only you can access this test</option>
              </select>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for creating great tests:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Choose a clear, descriptive title that tells users what to expect</li>
                <li>• Write a detailed description explaining the test's purpose and difficulty</li>
                <li>• Select the most appropriate category for better discoverability</li>
                <li>• After creating the test, you'll be able to add questions</li>
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
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    <span>Create Test</span>
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

export default TestCreator;