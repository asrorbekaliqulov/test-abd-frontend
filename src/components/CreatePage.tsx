import React, {useState, useEffect} from 'react';
import {ArrowLeft, RefreshCw, ChevronDown} from 'lucide-react';
import {quizAPI} from '../utils/api';
import {useSpellCheck} from "./useSpellCheck.tsx";
import {useNavigate} from "react-router-dom";
import {getLoremImage} from "../utils/getLoremImage.ts";
import FadeInPage from "./FadeInPage.tsx";

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
    const [imageUrl, setImageUrl] = useState<string>("")

    useEffect(() => {
        setImageUrl(getLoremImage(600, 400))
    }, [])

    return (

        <>
            <div className="max-w-2xl mx-auto my-auto overflow-hidden"
                 style={{
                     backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                     backgroundRepeat: 'no-repeat',
                     backgroundSize: 'cover',
                     backgroundPosition: 'center center',
                 }}>
                <div className="flex flex-col w-full min-h-screen py-6 px-4"
                     style={{backgroundColor: 'rgba(0, 0, 0, 0.6)',}}>
                    <div className={"flex flex-col my-auto justify-around"}>
                        <FadeInPage delay={0}>
                            <div className="flex items-center gap-4 mb-8">
                                <button
                                    onClick={props.onClick}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-theme-secondary hover:text-gray-900"
                                               onClick={() => navigate("/create")}/>
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-200">Yangi blok yaratish</h1>
                                    <p className="text-theme-secondary">Sinov tafsilotlari va konfiguratsiyasini sozlang</p>
                                </div>
                            </div>
                        </FadeInPage>
                        <div className="rounded-2xl bg-transparent">
                            <form className="space-y-6" onSubmit={props.onSubmit}>
                                <div>
                                    {/* Title */}
                                    <FadeInPage delay={100}>
                                        <input
                                            id="title"
                                            name="title"
                                            type="text"
                                            value={props.title.value}
                                            onChange={props.onChange}
                                            required
                                            className="block w-full px-3 py-3 text-white outline-none border bg-theme-primary border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="Test sarlavhasini kiriting"
                                            style={{backgroundColor: 'rgba(0, 0, 0, 0.4)',}}
                                            spellCheck={true}
                                            autoCorrect="on"
                                        />
                                        {props.title.isLoading && (
                                            <div className={`flex flex-row items-center justify-start text-white gap-1 pt-2`}>
                                                <RefreshCw className="animate-spin w-5 h-5 text-white"/> Tuzatyapti...
                                            </div>
                                        )}
                                    </FadeInPage>
                                </div>


                                {/* Description */}
                                <div>
                                    <FadeInPage delay={200}>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    value={props.description.value}
                                    onChange={props.onChange1}
                                    required
                                    className="block w-full px-3 py-3 outline-none text-white border bg-theme-primary border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Ushbu test nimani qamrab olishini tasvirlab bering"
                                    style={{backgroundColor: 'rgba(0, 0, 0, 0.4)',}}
                                    spellCheck={true}
                                    autoCorrect="on"
                                />
                                        {props.description.isLoading && (
                                            <div className="flex flex-row items-center justify-start gap-1 text-white pt-2">
                                                <RefreshCw className="animate-spin w-5 h-5 ttext-white"/> Tuzatyapti...
                                            </div>
                                        )}
                                    </FadeInPage>
                                </div>


                                {/* CATEGORY (Animated Dropdown) */}
                                <div className="relative">
                                    {/* Hidden input — formga value borishi uchun */}
                                    <input type="hidden" name="category" required value={props.selectedCategory?.id ?? ""}/>

                                    {/* Dropdown button */}
                                    <FadeInPage delay={300}>
                                        <button
                                            type="button"
                                            onClick={props.onClick1}
                                            style={{backgroundColor: 'rgba(0, 0, 0, 0.4)',}}
                                            className="w-full flex items-center justify-between px-3 py-3 border bg-theme-primary text-theme-secondary border-transparent rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                      <span
                                          className={props.selectedCategory ? "text-theme-secondary" : "text-theme-secondary"}>
                                        {props.selectedCategory ? `${props.selectedCategory.emoji} ${props.selectedCategory.title}` : "Kategoriyani tanlang"}
                                      </span>

                                            <ChevronDown
                                                className={`w-5 h-5 text-gray-500 transition-transform ${props.dropdownOpen ? "rotate-180" : ""}`}/>
                                        </button>
                                    </FadeInPage>

                                    {/* Dropdown list */}
                                    <div
                                        className={`
                                    absolute z-20 left-0 right-0 shadow-lg border border-transparent
                                    rounded-xl mt-2 overflow-hidden transition-all origin-top duration-200
                                    ${props.dropdownOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"}
                                  `}
                                        style={{backgroundColor: 'rgba(0, 0, 0, 0.3)',}}
                                    >
                                        <div className="max-h-60 overflow-y-scroll backdrop-blur"
                                             style={{backgroundColor: 'rgba(0, 0, 0, 0.4)',}}>
                                            {props.categories.length > 0 ? (
                                                props.categories.map(props.callbackfn)
                                            ) : (
                                                <div className="px-4 py-3 text-theme-secondary text-sm">Hech narsa
                                                    topilmadi</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div>
                                    <div className="space-y-3">
                                        <FadeInPage delay={400}>
                                            <label className="flex items-center -z-20">
                                                <input type="radio" name="visibility" value="public" defaultChecked
                                                       className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
                                                <span className="ml-3">
                                          <span
                                              className="block text-sm font-medium text-theme-secondary">Ommaviy</span>
                                          <span
                                              className="block text-sm text-theme-secondary">Har kim bu testni topishi va topshirishi mumkin</span>
                                        </span>
                                            </label>
                                        </FadeInPage>

                                        <FadeInPage delay={500}>
                                            <label className="flex items-center">
                                                <input type="radio" name="visibility" value="unlisted"
                                                       className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
                                                <span className="ml-3">
                                          <span className="block text-sm font-medium text-theme-secondary">Roʻyxatga kiritilmagan</span>
                                          <span className="block text-sm text-theme-secondary">Faqat havolaga ega odamlar kirishi mumkin</span>
                                        </span>
                                            </label>
                                        </FadeInPage>

                                        <FadeInPage delay={600}>
                                            <label className="flex items-center">
                                                <input type="radio" name="visibility" value="private"
                                                       className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
                                                <span className="ml-3">
                                          <span
                                              className="block text-sm font-medium text-theme-secondary">Shaxsiy</span>
                                          <span className="block text-sm text-theme-secondary">Bu blokga faqat siz kirishingiz mumkin</span>
                                        </span>
                                            </label>
                                        </FadeInPage>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <FadeInPage delay={700}>
                                    <div className="flex gap-4">
                                        <button type="submit"
                                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
                                            Blok yaratish
                                        </button>
                                    </div>
                                </FadeInPage>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export interface CreatePageProps {
    currentPage: 'home' | 'search' | 'quiz' | 'create' | 'new-block' | 'map' | 'profile';
    onPageChange: (page: 'home' | 'search' | 'quiz' | 'create' | 'new-block' | 'map' | 'profile') => void;
}

/* -------------------------
   Main CreatePage component
   ------------------------- */
const CreatePage: React.FC<CreatePageProps> = ({ currentPage, onPageChange })  => {
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
            className="px-4 py-3 cursor-pointer hover:bg-gray-700  flex items-center gap-2 transition-colors text-theme-secondary"
        >
            <span className="text-xl">{cat.emoji}</span>
            <span>{cat.title}</span>
        </div>
    );

    // We render only CreateNewBlock as you requested (no overview/questions)
    return (
        <div className="min-h-screen bg-theme-primary">
            <div className="max-w-6xl mx-auto my-auto">
                <CreateNewBlock
                    onClick={() => { /* you previously used this to go back; keep as no-op or setActiveTab if desired */
                        setActiveTab('overview');
                    }}
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
