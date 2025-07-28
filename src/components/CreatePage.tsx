import React, { useState, useEffect } from 'react';
import { Plus, FileText, HelpCircle, ArrowLeft } from 'lucide-react';
import { quizAPI } from '../utils/api';
import ProfilePage from './ProfilePage'
import QuestionCreator from './create/QuestionCreator';
import { Navigate } from 'react-router-dom';

interface CreatePageProps {
  onNavigate: (page: string) => void;
}
interface Category {
  id: number;
  name: string;
  slug: string;
  emoji: string;
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
  // const navigate = useNavigate();


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
      console.log(payload);
      const response = await quizAPI.createTest(payload);
      // console.log('Test yaratildi:', response.data);
      alert('Test muvaffaqiyatli yaratildi!');
      
      setActiveTab('overview'); // Yaratilgandan so‘ng asosiy sahifaga qaytamiz
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
       // Yana asosiy sahifaga qaytish
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kontent yaratish</h1>
        <p className="text-gray-600">Nima yaratmoqchi bo'lganingizni tanlang</p>
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
          <h3 className="text-xl font-bold text-gray-900 mb-3">Blok Yaratish</h3>
          <p className="text-gray-600 mb-4">
            Yangi blok yarating va unga bir nechta savollar qo‘shing.<b> Blok nomi, asosiy ma'lumotlari,
            kategoriya va ko‘rinish <i>(visibility)</i></b> sozlamalarini belgilang.
          </p>
          <div className="flex items-center text-indigo-600 font-medium">
            <span>Boshlash</span>
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
          <h3 className="text-xl font-bold text-gray-900 mb-3">Savol Qo‘shish</h3>
          <p className="text-gray-600 mb-4">
            Blok ichiga savol qo‘shing.
            <b>Bitta javobli, Ko'p javobli, To‘g‘ri/Noto'g'ri</b> yoki <b>Matnli</b> turdagi savollar yaratishingiz mumkin.
            Kerak bo‘lsa, har bir savolga tushuntirish ham yozing.
          </p>
          <div className="flex items-center text-purple-600 font-medium">
            <span>Boshlash</span>
            <Plus className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">0</div>
          <div className="text-sm text-blue-700">Blok yaratildi</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">0</div>
          <div className="text-sm text-green-700">Savol qo'shildi</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">0</div>
          <div className="text-sm text-purple-700">Barcha urinishlar</div>
        </div>
      </div> */}
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
          <h1 className="text-2xl font-bold text-gray-900">Yangi blok yaratish</h1>
          <p className="text-gray-600">Sinov tafsilotlari va konfiguratsiyasini sozlang
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <form className="space-y-6" onSubmit={SaveTest}>

          {/* Test Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Blok nomi *
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
              Tavsif *
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
              Turkum *
            </label>
            <select
              id="category"
              name="category"
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Turkumni tanlang</option>
              
              {Array.isArray(categories) &&
                categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                   {category.emoji} {category.title}
                  </option>
              ))}

            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ko'rinish
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
                  <span className="block text-sm font-medium text-gray-700">Ommaviy</span>
                  <span className="block text-sm text-gray-500">Har kim bu testni topishi va topshirishi mumkin</span>
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
                  <span className="block text-sm font-medium text-gray-700">Roʻyxatga kiritilmagan</span>
                  <span className="block text-sm text-gray-500">Faqat havolaga ega odamlar kirishi mumkin
                  </span>
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
                  <span className="block text-sm font-medium text-gray-700">Shaxsiy</span>
                  <span className="block text-sm text-gray-500">Bu blokga faqat siz kirishingiz mumkin</span>
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
              Bekor qilish
            </button>
              
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                Blok yaratish
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
          <h1 className="text-2xl font-bold text-gray-900">Savol qo'shish</h1>
          <p className="text-gray-600">Blokingiz uchun savollar yarating</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <form className="space-y-6" onSubmit={addQuestion}>
          {/* Select Test */}
          <div>
            <label htmlFor="test" className="block text-sm font-medium text-gray-700 mb-2">
              Blockni tanlang *
            </label>
            <select
              id="test"
              name="test"
              required
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Blockni tanlang</option>
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
              Savol *
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
              Savol turi *
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
                  <span className="block text-sm font-medium text-gray-700">Yagona tanlov</span>
                  <span className="block text-sm text-gray-500">Faqat bitta to'g'ri javob
                  </span>
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
                  <span className="block text-sm font-medium text-gray-700">Ko'p tanlov</span>
                  <span className="block text-sm text-gray-500">Bir nechta to'g'ri javoblar</span>
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
                  <span className="block text-sm font-medium text-gray-700">Rost/Yolg'on</span>
                  <span className="block text-sm text-gray-500">Oddiy to'g'ri yoki noto'g'ri savol</span>
                </span>
              </label>
            </div>
          </div>

          {/* Answer Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Javob variantlari *
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
                    placeholder={`variant ${index}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              To'g'ri javoblar yonidagi katakchani belgilang
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Savolni qo'shish
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
        {activeTab === 'questions' && <QuestionCreator theme={''} onClose={() => setActiveTab('overview')}/>}
      </div>
    </div>
  );
};

export default CreatePage;