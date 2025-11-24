import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, ChevronDown } from 'lucide-react';
import { quizAPI } from '../utils/api';
import { useSpellCheck } from "./useSpellCheck.tsx";
import {useNavigate} from "react-router-dom";

export interface Category {
    id: number;
    title: string;
    slug: string;
    emoji: string;
}

interface Test {
    id: number;
    user: { id: number };
    title: string;
    description: string;
    category: Category;
    created_at: string;
    visibility: string;
    difficulty_percentage: number;
    calculated_difficulty: number;
    total_questions: number;
}

function CreateNewBlock(props: {
    onClick: () => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    title: { value: string; setValue: (v: string) => void; isLoading: boolean };
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    description: { value: string; setValue: (v: string) => void; isLoading: boolean };
    onChange1: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    selectedCategory: Category | null;
    onClick1: () => void;
    dropdownOpen: boolean;
    categories: Category[];
    callbackfn: (cat: Category) => React.JSX.Element;
}) {

    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={props.onClick}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-theme-secondary hover:text-gray-900" onClick={() => navigate("/create")} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-theme-secondary">Yangi blok yaratish</h1>
                    <p className="text-theme-secondary">Sinov tafsilotlari va konfiguratsiyasini sozlang</p>
                </div>
            </div>
            <div className="rounded-2xl shadow-lg p-8 border border-gray-200 bg-theme-primary">
                <form className="space-y-6" onSubmit={props.onSubmit}>
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-theme-secondary mb-2">
                            Blok nomi *
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={props.title.value}
                            onChange={props.onChange}
                            required
                            className="block w-full px-3 py-3 outline-none border bg-theme-primary border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Enter test title"
                            spellCheck={true}
                            autoCorrect="on"
                        />
                        {props.title.isLoading && (
                            <div className={`flex flex-row items-center justify-start text-theme-secondary gap-1 pt-2`}>
                                <RefreshCw className="animate-spin w-5 h-5 text-theme-secondary" /> Tuzatyapti...
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-theme-secondary mb-2">
                            Tavsif *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={props.description.value}
                            onChange={props.onChange1}
                            required
                            className="block w-full px-3 py-3 outline-none border bg-theme-primary border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Describe what this test covers"
                            spellCheck={true}
                            autoCorrect="on"
                        />
                        {props.description.isLoading && (
                            <div className="flex flex-row items-center justify-start gap-1 text-theme-secondary pt-2">
                                <RefreshCw className="animate-spin w-5 h-5 text-theme-secondary" /> Tuzatyapti...
                            </div>
                        )}
                    </div>

                    {/* CATEGORY (Animated Dropdown) */}
                    <div className="relative">
                        <label htmlFor="category" className="block text-sm font-medium text-theme-secondary mb-2">
                            Kategoriya *
                        </label>

                        {/* Hidden input — formga value borishi uchun */}
                        <input type="hidden" name="category" required value={props.selectedCategory?.id ?? ""} />

                        {/* Dropdown button */}
                        <button
                            type="button"
                            onClick={props.onClick1}
                            className="w-full flex items-center justify-between px-3 py-3 border bg-theme-primary text-theme-secondary border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
              <span className={props.selectedCategory ? "text-theme-secondary" : "text-theme-secondary"}>
                {props.selectedCategory ? `${props.selectedCategory.emoji} ${props.selectedCategory.title}` : "Kategoriyani tanlang"}
              </span>

                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${props.dropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {/* Dropdown list */}
                        <div
                            className={`
                absolute z-20 left-0 right-0 bg-theme-primary shadow-lg border border-gray-200
                rounded-xl mt-2 overflow-hidden transition-all origin-top duration-200
                ${props.dropdownOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"}
              `}
                        >
                            <div className="max-h-60 overflow-y-scroll bg-theme-primary">
                                {props.categories.length > 0 ? (
                                    props.categories.map(props.callbackfn)
                                ) : (
                                    <div className="px-4 py-3 text-theme-secondary text-sm">Hech narsa topilmadi</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Visibility */}
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-3">Ko'rinish</label>
                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input type="radio" name="visibility" value="public" defaultChecked className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                                <span className="ml-3">
                  <span className="block text-sm font-medium text-theme-secondary">Ommaviy</span>
                  <span className="block text-sm text-theme-secondary">Har kim bu testni topishi va topshirishi mumkin</span>
                </span>
                            </label>

                            <label className="flex items-center">
                                <input type="radio" name="visibility" value="unlisted" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                                <span className="ml-3">
                  <span className="block text-sm font-medium text-theme-secondary">Roʻyxatga kiritilmagan</span>
                  <span className="block text-sm text-theme-secondary">Faqat havolaga ega odamlar kirishi mumkin</span>
                </span>
                            </label>

                            <label className="flex items-center">
                                <input type="radio" name="visibility" value="private" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                                <span className="ml-3">
                  <span className="block text-sm font-medium text-theme-secondary">Shaxsiy</span>
                  <span className="block text-sm text-theme-secondary">Bu blokga faqat siz kirishingiz mumkin</span>
                </span>
                            </label>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
                            Blok yaratish
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* -------------------------
   Main CreatePage component
   ------------------------- */
const CreatePage: React.FC<CreatePageProps> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'test' | 'questions'>('test'); // default -> show form
    const [categories, setCategories] = useState<Category[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    // dropdown state + selected category
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // spellcheck hooks for title & description
    const title = useSpellCheck("");
    const description = useSpellCheck("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await quizAPI.fetchCategories();
                // adapt if response shape different: response.data or response
                setCategories(response.data ?? response);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await quizAPI.fetchMyTest();
                setTests(response.data ?? response);
            } catch (error) {
                console.error('Error fetching my tests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, []);

    const SaveTest = async (e: React.FormEvent) => {
        e.preventDefault();

        // use controlled values (spellchecked) rather than querying DOM
        const payload = {
            title: title.value,
            description: description.value,
            visibility: (document.querySelector('input[name="visibility"]:checked') as HTMLInputElement)?.value ?? 'public',
            category_id: selectedCategory?.id ?? null
        };

        try {
            await quizAPI.createTest(payload);
            alert('Test muvaffaqiyatli yaratildi!');
            // keep original behavior: set active tab to overview after create
            setActiveTab('overview');
        } catch (error: any) {
            console.error('Xatolik:', error?.response?.data ?? error?.message ?? error);
            alert('Xatolik yuz berdi!');
        }
    };

    // callback function used to render each category item in dropdown
    const renderCategoryItem = (cat: Category) => (
        <div
            key={cat.id}
            onClick={() => {
                setSelectedCategory(cat);
                setDropdownOpen(false);
            }}
            className="px-4 py-3 cursor-pointer hover:bg-indigo-50 hover:text-gray-900 flex items-center gap-2 transition-colors text-theme-secondary"
        >
            <span className="text-xl">{cat.emoji}</span>
            <span>{cat.title}</span>
        </div>
    );

    // We render only CreateNewBlock as you requested (no overview/questions)
    return (
        <div className="min-h-screen bg-theme-primary pt-20 pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <CreateNewBlock
                    onClick={() => { /* you previously used this to go back; keep as no-op or setActiveTab if desired */ setActiveTab('overview'); }}
                    onSubmit={SaveTest}
                    title={title}
                    onChange={(e) => title.setValue(e.target.value)}
                    description={description}
                    onChange1={(e) => description.setValue(e.target.value)}
                    selectedCategory={selectedCategory}
                    onClick1={() => setDropdownOpen(!dropdownOpen)}
                    dropdownOpen={dropdownOpen}
                    categories={categories}
                    callbackfn={renderCategoryItem}
                />
            </div>
        </div>
    );
};

export default CreatePage;
