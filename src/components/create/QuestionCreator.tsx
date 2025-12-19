"use client"

import type React from "react"
import {useState, useEffect, useRef} from "react";
import {Plus, Save, HelpCircle, Trash2, Globe, Lock, EyeOff, RefreshCw, ChevronDown} from "lucide-react"
import {quizAPI} from "../../utils/api"
import {useSpellCheck} from "../useSpellCheck.tsx";
import {useNavigate} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import {spellCheck} from "../AISpellCheck.tsx";
import CategoryDropdown from "../CategoryDropdown.tsx";
import {getLoremImage} from "../../utils/getLoremImage.ts";
import FadeInPage from "../FadeInPage.tsx";

declare global {
    interface Window {
        spellTimer: Record<number, any>;
    }
}
if (!window.spellTimer) window.spellTimer = {};

interface QuestionCreatorProps {
    theme: string,
    onClose: () => void,
    onNavigate?: (page: string) => void,
    categories: Category[]
}

interface Answer {
    letter: string
    answer_text: string
    is_correct: boolean
}

interface Category {
    id: number;
    title: string;
    emoji: string;
}

interface Test {
    id: number
    title: string
    visibility: "public" | "private" | "unlisted"
}

const QuestionCreator: React.FC<QuestionCreatorProps> = ({theme, onClose, onNavigate}) => {
    const [formData, setFormData] = useState({
        test: "",
        question_text: "",
        question_type: "single",
        order_index: Date.now(),
        correct_answer_text: "",
        answer_language: "",
        description: "",
        category_id: null as number | null,
    })
    const [answers, setAnswers] = useState<Answer[]>([])
    const [tests, setTests] = useState<Test[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const {value, setValue, isLoading} = useSpellCheck("");

    const questionText = useSpellCheck(formData.question_text);
    const descriptionText = useSpellCheck(formData.description);

    //category
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const [createdQuestions, setCreatedQuestions] = useState<string[]>([]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        quizAPI.fetchCategories()
            .then(res => setCategories(res.data))
            .catch(err => console.log("Category error:", err));
    }, []);
    ///category

    // Available letters for answers
    const availableLetters = ["A", "B", "D", "E", "F"]

    //AISpellCheck
    const [spellCheckedAnswers, setSpellCheckedAnswers] = useState(
        answers.map(a => a.answer_text)
    );

    const [spellLoading, setSpellLoading] = useState(
        answers.map(() => false)
    );

    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        spellCheckedAnswers.forEach((text, index) => {
            // ❗ 1. text yo‘q bo‘lsa, bo‘sh bo‘lsa, yoki undefined bo‘lsa → to‘xtatamiz
            if (!text || typeof text !== "string") {
                setSpellLoading(prev => {
                    const c = [...prev];
                    c[index] = false;
                    return c;
                });
                return;
            }

            const cleaned = text.trim();

            // ❗ 2. Agar matn bo‘sh bo‘lsa → loading OFF
            if (cleaned === "") {
                setSpellLoading(prev => {
                    const c = [...prev];
                    c[index] = false;
                    return c;
                });
                return;
            }

            // ❗ 3. Agar matn 2 harfdan kam bo‘lsa → spellcheck qilma
            if (cleaned.length < 2) {
                setSpellLoading(prev => {
                    const c = [...prev];
                    c[index] = false;
                    return c;
                });
                return;
            }

            // ❗ spellcheck boshlanadi
            setSpellLoading(prev => {
                const c = [...prev];
                c[index] = true;
                return c;
            });

            const t = setTimeout(async () => {
                const fixed = await spellCheck(cleaned);

                if (fixed !== text) {
                    // UI uchun
                    setSpellCheckedAnswers(prev => {
                        const copy = [...prev];
                        copy[index] = fixed;
                        return copy;
                    });

                    // backend uchun
                    handleAnswerChange(index, "answer_text", fixed);
                }

                // ❗ spellcheck tugadi
                setSpellLoading(prev => {
                    const c = [...prev];
                    c[index] = false;
                    return c;
                });
            }, 600);

            timers.push(t);
        });

        return () => timers.forEach(t => clearTimeout(t));
    }, [spellCheckedAnswers]);
    //

    //Animated Dropdown
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const rootRef = useRef(null);

    const selectedTest = tests.find((t) => String(t.id) === String(formData.test));

    useEffect(() => {
        function handleClickOutside(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
                setHighlightedIndex(-1);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleSelect(val) {
        handleChange({target: {name: "test", value: val}});
        setOpen(false);
    }////////////////////

    // Animated Dropdown 2
    const [openType, setOpenType] = useState(false);
    const dropdownRef = useRef(null);

    const questionTypes = [
        {value: "single", label: "Bitta tanlov"},
        {value: "multiple", label: "Ko'p tanlov"},
        {value: "true_false", label: "To'g'ri/Noto'g'ri"}
    ];

    const selectedType = questionTypes.find(
        (t) => t.value === formData.question_type
    );

    const handleSelectType = (value) => {
        handleChange({
            target: {
                name: "question_type",
                value: value
            }
        });
        setOpenType(false);
    };

    // CLICK OUTSIDE
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenType(false); // 👈 TO‘G‘RI STATE
            }
        }

        if (openType) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openType]);
    //////////////////////////

    const navigate = useNavigate();

    useEffect(() => {
        loadTests()
    }, [])

    useEffect(() => {
        // Initialize answers based on question type
        initializeAnswers()
    }, [formData.question_type])

    const initializeAnswers = () => {
        switch (formData.question_type) {
            case "single":
            case "multiple":
                setAnswers([
                    {letter: "A", answer_text: "", is_correct: false},
                    {letter: "B", answer_text: "", is_correct: false},
                    {letter: "D", answer_text: "", is_correct: false},
                ])
                break
            case "true_false":
                setAnswers([
                    {letter: "A", answer_text: "To'g'ri", is_correct: false},
                    {letter: "B", answer_text: "Noto'g'ri", is_correct: false},
                ])
                break
            case "text_input":
                setAnswers([])
                break
            default:
                setAnswers([])
        }
    }

    const loadTests = async () => {
        try {
            const response = await quizAPI.fetchMyTest()
            const testsData = response.data.results || response.data

            // Map tests with correct visibility info
            const mappedTests = testsData.map((test: any) => ({
                id: test.id,
                title: test.title,
                // Fix visibility mapping based on actual API response
                visibility:
                    test.visibility || (test.is_public === true ? "public" : test.is_public === false ? "private" : "unlisted"),
            }))
            setTests(mappedTests)
        } catch (error) {
            console.error("Testlarni yuklashda xatolik:", error)
        }
    }

    const getTestTypeIcon = (visibility: string) => {
        switch (visibility) {
            case "public":
                return <Globe size={16} className="text-green-600" title="Ommaviy"/>
            case "private":
                return <Lock size={16} className="text-red-600" title="Shaxsiy"/>
            case "unlisted":
                return <EyeOff size={16} className="text-yellow-600" title="Yashirin"/>
            default:
                return <Lock size={16} className="text-gray-600"/>
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedQuestion = formData.question_text.trim();

        if (createdQuestions.includes(trimmedQuestion)) {
            setError("Bu savol allaqachon yaratilgan!");
            return;
        }

        setLoading(true);
        setError("");

        if (formData.question_type === "text_input") {
            if (!formData.correct_answer_text.trim()) {
                setError("Matn kiritish savollari uchun to'g'ri javob matni talab qilinadi")
                setLoading(false)
                return
            }
            if (!formData.answer_language.trim()) {
                setError("Matn kiritish savollari uchun javob tili talab qilinadi")
                setLoading(false)
                return
            }
        } else {
            const correctAnswers = answers.filter((a) => a.is_correct && a.answer_text.trim())
            if (correctAnswers.length === 0) {
                setError("Kamida bitta javob to'g'ri deb belgilanishi kerak")
                setLoading(false)
                return
            }

            const validAnswers = answers.filter((a) => a.answer_text.trim())
            if (validAnswers.length < 2 && formData.question_type !== "text_input") {
                setError("Kamida ikkita javob talab qilinadi")
                setLoading(false)
                return
            }

            if (formData.question_type === "multiple" && correctAnswers.length >= validAnswers.length) {
                setError("Ko'p tanlovli savollar uchun kamida bitta noto'g'ri javob bo'lishi kerak")
                setLoading(false)
                return
            }
        }

        try {
            const questionData: any = {
                test: Number.parseInt(formData.test),
                question_text: formData.question_text,
                question_type: formData.question_type,
                order_index: formData.order_index,
                category_id: formData.category_id,
            }

            if (formData.description.trim()) questionData.feedback = formData.description

            if (formData.question_type === "text_input") {
                questionData.correct_answer_text = formData.correct_answer_text
                questionData.answer_language = formData.answer_language
            } else {
                const validAnswers = answers.filter((a) => a.answer_text.trim())
                questionData.answers = validAnswers.map((answer) => ({
                    letter: answer.letter,
                    answer_text: answer.answer_text,
                    is_correct: answer.is_correct,
                }))
            }

            if (mediaFile) {
                const formDataToSend = new FormData()
                Object.keys(questionData).forEach((key) => {
                    if (key === "answers") {
                        formDataToSend.append("answers", JSON.stringify(questionData.answers))
                    } else {
                        formDataToSend.append(key, questionData[key].toString())
                    }
                });
                formDataToSend.append("media", mediaFile)
                await quizAPI.createQuestion(formDataToSend)
            } else {
                await quizAPI.createQuestion(questionData)
            }

            setCreatedQuestions(prev => [...prev, trimmedQuestion]);

            onClose()
            alert("Savol muvaffaqiyatli yaratildi!")

        } catch (err: any) {
            console.error("Savol yaratishda xatolik:", err)
            // setError(err.response?.data?.detail || err.response?.data?.message || "Savol yaratishda xatolik yuz berdi")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target;

        // Faqat tegishli inputni yangilaymiz
        if (name === "question_text") {
            questionText.setValue(value);
        }

        if (name === "description") {
            descriptionText.setValue(value);
        }

        // formData-ni yangilaymiz
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
        setAnswers((prev) => prev.map((answer, i) => (i === index ? {...answer, [field]: value} : answer)))
    }

    const addAnswer = () => {
        if (answers.length < 5) {
            // Maximum 5 answers (A, B, D, E, F)
            const nextLetter = availableLetters[answers.length]
            setAnswers((prev) => [...prev, {letter: nextLetter, answer_text: "", is_correct: false}])
        }
    }

    const removeAnswer = (index: number) => {
        if (answers.length > 3) {
            // Minimum 3 answers for choice questions
            setAnswers((prev) => prev.filter((_, i) => i !== index))
        }
    }

    const handleCorrectAnswerChange = (index: number, checked: boolean) => {
        if (formData.question_type === "single" || formData.question_type === "true_false") {
            // For single choice and true/false, only one can be correct
            setAnswers((prev) =>
                prev.map((answer, i) => ({
                    ...answer,
                    is_correct: i === index ? checked : false,
                })),
            )
        } else {
            // For multiple choice, multiple can be correct
            handleAnswerChange(index, "is_correct", checked)
        }
    }

    const renderAnswerInputs = () => {
        if (formData.question_type === "text_input") {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">To'g'ri javob matni
                            *</label>
                        <input
                            type="text"
                            name="correct_answer_text"
                            value={formData.correct_answer_text}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 backdrop-blur rounded-lg text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                            placeholder="To'g'ri javobni kiriting"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                            Javob tili (qo'lda kiritish) *
                        </label>
                        <input
                            type="text"
                            name="answer_language"
                            value={formData.answer_language}
                            onChange={handleChange}
                            placeholder="masalan: uz, en, ru"
                            required
                            className="w-full px-4 py-3 rounded-lg backdrop-blur text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                        />
                    </div>
                </div>
            )
        }

        return (
            <div>
                <FadeInPage delay={800}>
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-theme-secondary">Javob variantlari *</label>
                        {(formData.question_type === "single" || formData.question_type === "multiple") && answers.length < 5 && (
                            <button
                                type="button"
                                onClick={addAnswer}
                                className="flex items-center space-x-2 px-3 py-1 text-white rounded-lg backdrop-blur transition-all"
                                style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                            >
                                <Plus size={16}/>
                                <span>Javob qo'shish</span>
                            </button>
                        )}
                    </div>
                </FadeInPage>

                <div className="space-y-3">
                    {answers.map((answer, index) => (
                        <FadeInPage delay={900}>
                            <div key={index}
                                 className="flex items-center space-x-3 border border-theme-primary rounded-full overflow-x-scroll scrollbar-hide backdrop-blur" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        <label className="ml-2 text-sm text-theme-secondary flex flex-row">
                                            <input
                                                type={formData.question_type === "multiple" ? "checkbox" : "radio"}
                                                name={formData.question_type === "multiple" ? `correct_${index}` : "correct"}
                                                checked={answer.is_correct}
                                                onChange={(e) => handleCorrectAnswerChange(index, e.target.checked)}
                                                className="peer hidden"
                                            />
                                            <span
                                                className="w-10 h-10 cursor-pointer bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-lg peer-checked:bg-blue-400 peer-checked:text-white">
                                                {answer.letter}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                {/* INPUT SPELLCHECK BILAN */}
                                <div className="flex flex-row w-full relative">
                                    <input
                                        type="text"
                                        value={spellCheckedAnswers[index] ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;

                                            // UI matni
                                            setSpellCheckedAnswers(prev => {
                                                const copy = [...prev];
                                                copy[index] = v;
                                                return copy;
                                            });

                                            // backend matni
                                            handleAnswerChange(index, "answer_text", v);
                                        }}
                                        placeholder={
                                            formData.question_type === "true_false"
                                                ? answer.answer_text
                                                : `Javob varianti ${answer.letter}`
                                        }
                                        disabled={formData.question_type === "true_false"}
                                        className="flex-1 px-5 py-4 outline-none rounded-lg focus:border-green-600 text-theme-secondary bg-transparent"
                                    />

                                    {spellLoading[index] && (
                                        <span
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-blue-500 animate-pulse">
                                    AI tekshirmoqda…
                                </span>
                                    )}
                                </div>


                                {(formData.question_type === "single" || formData.question_type === "multiple") && answers.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() => removeAnswer(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                )}
                            </div>
                        </FadeInPage>
                    ))}
                </div>

            </div>
        )
    }

    const [imageUrl, setImageUrl] = useState<string>("")

    useEffect(() => {
        setImageUrl(getLoremImage(600, 400))
    }, [])

    return (
        <div className="bg-theme-primary bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-theme-primary shadow-theme-xl max-w-3xl w-full max-h-auto"
                 style={{
                     backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                     backgroundRepeat: 'no-repeat',
                     backgroundSize: 'cover',
                     backgroundPosition: 'center center',
                 }}>
                <div className={"w-full h-full py-5"} style={{backgroundColor: 'rgba(0, 0, 0, 0.6)'}}>
                    {/* Form */}
                    <div className="p-6 max-h-auto">
                        {error &&
                            <div
                                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Test Selection */}
                            <div>
                                <div ref={rootRef} className="relative">
                                    {/* BUTTON */}
                                    <FadeInPage delay={100}>
                                        <button
                                            type="button"
                                            className="w-full px-4 py-3 rounded-lg text-theme-primary flex justify-between items-center"
                                            style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                                            onClick={() => setOpen((prev) => !prev)}
                                        >
                                        <span>
                                            {selectedTest ? selectedTest.title : "Blok tanlang"}
                                        </span>

                                            <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
                                            <ChevronDown/>
                                        </span>
                                        </button>
                                    </FadeInPage>

                                    {/* DROPDOWN */}
                                    <AnimatePresence>
                                        {open && (
                                            <motion.ul
                                                initial={{opacity: 0, y: -8}}
                                                animate={{opacity: 1, y: 0}}
                                                exit={{opacity: 0, y: -8}}
                                                transition={{duration: 0.15}}
                                                className="absolute mt-2 w-full bg-transparent rounded-lg shadow-lg z-50 max-h-60 overflow-auto"
                                            >
                                                {/* NEW BLOCK */}
                                                <li className="flex flex-row items-center backdrop-blur justify-between px-4 py-3 text-theme-secondary hover:bg-gray-500 hover:text-white transition duration-200 cursor-pointer"
                                                    onClick={() => navigate("/create/new-block")}
                                                    style={{backgroundColor: 'rgba(0, 0, 0, 0.6)'}}>
                                                    <span className={"bg-transparent"}>Yangi blok yaratish</span>
                                                    <Plus/>
                                                </li>

                                                {/* TEST ITEMS */}
                                                {tests.map((test) => (
                                                    <li
                                                        key={test.id}
                                                        onClick={() => handleSelect(test.id)}
                                                        style={{backgroundColor: 'rgba(0, 0, 0, 0.6)'}}
                                                        className="px-4 py-3 text-theme-secondary backdrop-blur hover:bg-gray-500 hover:text-white transition duration-200 cursor-pointer flex justify-between items-center"
                                                    >
                                                        <span>{test.title}</span>
                                                        <span>{getTestTypeIcon(test.visibility)}</span>
                                                    </li>
                                                ))}
                                            </motion.ul>
                                        )}
                                    </AnimatePresence>

                                    {/* HIDDEN INPUT (form uchun) */}
                                    <input
                                        type="hidden"
                                        name="test"
                                        value={formData.test}
                                        required
                                    />
                                </div>

                                {/* Show selected test type */}
                                {formData.test && (
                                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                                        {(() => {
                                            const selectedTest = tests.find((t) => t.id.toString() === formData.test)
                                            if (selectedTest) {
                                                return (
                                                    <>
                                                        {getTestTypeIcon(selectedTest.visibility)}
                                                        <span>
                            {selectedTest.visibility === "public"
                                ? "Ommaviy test"
                                : selectedTest.visibility === "private"
                                    ? "Shaxsiy test"
                                    : "Yashirin test"}
                          </span>
                                                    </>
                                                )
                                            }
                                            return null
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <CategoryDropdown
                                categories={categories}
                                selectedCategoryId={formData.category_id}
                                onSelect={(id) => {
                                    console.log("Dropdowndan kelayotgan ID:", id)
                                    setFormData((prev) => {
                                        const next = {...prev, category_id: id};
                                        console.log("SET QILINDI → formData.category_id:", next.category_id);
                                        return next;
                                    });
                                }}
                            />

                            {/* Question Type */}
                            <div className="relative">
                                <FadeInPage delay={300}>
                                    {/* BUTTON */}
                                    <button
                                        type="button"
                                        className="w-full px-4 py-3 rounded-lg text-theme-primary flex justify-between items-center"
                                        style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                                        onClick={() => setOpenType((p) => !p)}
                                    >
                                        <span>{selectedType?.label || "Savol turini tanlang"}</span>

                                        <span className={`transition-transform ${openType ? "rotate-180" : ""}`}>
                        <ChevronDown/>
                    </span>
                                    </button>
                                </FadeInPage>

                                {/* ANIMATED DROPDOWN */}
                                <AnimatePresence>
                                    {openType && (
                                        <motion.ul
                                            ref={dropdownRef}
                                            initial={{opacity: 0, y: -8}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -8}}
                                            transition={{duration: 0.15}}
                                            className="absolute w-full mt-2 bg-transparent rounded-lg shadow-lg max-h-60 overflow-auto z-50"
                                        >
                                            {questionTypes.map((item) => (
                                                <li
                                                    key={item.value}
                                                    onClick={() => handleSelectType(item.value)}
                                                    className="px-4 py-3 cursor-pointer hover:bg-gray-500 hover:text-white backdrop-blur text-theme-secondary transition duration-200"
                                                    style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                                                >
                                                    {item.label}
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>

                                {/* HIDDEN INPUT — form uchun zarur */}
                                <input
                                    type="hidden"
                                    name="question_type"
                                    value={formData.question_type}
                                />
                            </div>

                            {/* Question Text */}
                            <div className={"relative"}>
                                <FadeInPage delay={400}>
                                        <textarea
                                            name="question_text"
                                            value={questionText.value}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 outline-none rounded-lg backdrop-blur text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                                            placeholder="Savolingizni bu yerga yozing..."
                                        />
                                </FadeInPage>

                                {questionText.isLoading &&
                                    <span
                                        className={`flex flex-row items-center justify-start py-2 gap-1 text-white absolute right-1.5 bottom-1.5`}> <RefreshCw
                                        className="animate-spin w-5 h-5 text-white"/> Tekshirilmoqda...</span>}
                            </div>

                            {/* Dynamic Answer Inputs */}
                            {renderAnswerInputs()}

                            {/* Action Buttons */}
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || createdQuestions.includes(formData.question_text.trim())} // ❗ Duplicate tekshiruv qo'shildi
                                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {loading ? (
                                        <div
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    ) : (
                                        <>
                                            <Save size={20}/>
                                            <span>Savol yaratish</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuestionCreator