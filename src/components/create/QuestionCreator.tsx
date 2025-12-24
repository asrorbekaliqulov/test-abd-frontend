"use client"

import type React from "react"
import {useState, useEffect, useRef} from "react";
import {Plus, Save, Trash2, Globe, Lock, EyeOff, ChevronDown, ChevronLeft} from "lucide-react"
import {quizAPI} from "../../utils/api"
import {useNavigate} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import CategoryDropdown from "../components/CategoryDropdown.tsx";
import {getLoremImage} from "../../utils/getLoremImage.ts";
import FadeInPage from "../components/FadeInPage.tsx";

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
    created_at?: string
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

    // Category
    const [categories, setCategories] = useState<Category[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const [createdQuestions, setCreatedQuestions] = useState<string[]>([]);

    // Available letters for answers
    const availableLetters = ["A", "B", "D", "E", "F"]

    // Animated Dropdown for tests
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const rootRef = useRef(null);

    // Animated Dropdown for question type
    const [openType, setOpenType] = useState(false);
    const dropdownRef = useRef(null);

    const navigate = useNavigate();

    const questionTypes = [
        {value: "single", label: "Bitta tanlov"},
        {value: "multiple", label: "Ko'p tanlov"},
        {value: "true_false", label: "To'g'ri/Noto'g'ri"},
        {value: "text_input", label: "Matn kiritish"}
    ];

    const selectedType = questionTypes.find(
        (t) => t.value === formData.question_type
    );

    // Sort tests by creation date (newest first)
    const sortTestsByDate = (tests: Test[]) => {
        return [...tests].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    };

    useEffect(() => {
        loadTests()
    }, [])

    useEffect(() => {
        // Initialize answers based on question type
        initializeAnswers()
    }, [formData.question_type])

    // Click outside handlers
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }

            if (rootRef.current && !(rootRef.current as any).contains(e.target)) {
                setOpen(false);
                setHighlightedIndex(-1);
            }

            if (dropdownRef.current && !(dropdownRef.current as any).contains(e.target)) {
                setOpenType(false);
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
                created_at: test.created_at,
                visibility:
                    test.visibility || (test.is_public === true ? "public" : test.is_public === false ? "private" : "unlisted"),
            }))

            // Sort tests by creation date (newest first)
            const sortedTests = sortTestsByDate(mappedTests);
            setTests(sortedTests)
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

    const handleSelect = (val: string) => {
        handleChange({target: {name: "test", value: val}} as React.ChangeEvent<HTMLInputElement>);
        setOpen(false);
    }

    const handleSelectType = (value: string) => {
        handleChange({
            target: {
                name: "question_type",
                value: value
            }
        } as React.ChangeEvent<HTMLInputElement>);
        setOpenType(false);
    };

    const resetForm = () => {
        setFormData({
            test: "",
            question_text: "",
            question_type: "single",
            order_index: Date.now(),
            correct_answer_text: "",
            answer_language: "",
            description: "",
            category_id: null,
        });

        setAnswers([
            {letter: "A", answer_text: "", is_correct: false},
            {letter: "B", answer_text: "", is_correct: false},
            {letter: "D", answer_text: "", is_correct: false},
        ]);

        setMediaFile(null);
        setError("");
    };

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

            // Reset form for new question creation
            resetForm();

            // Reload tests to get the latest order
            await loadTests();

            alert("Savol muvaffaqiyatli yaratildi! Endi yangi savol yaratishingiz mumkin.")

        } catch (err: any) {
            console.error("Savol yaratishda xatolik:", err)
            setError(err.response?.data?.detail || err.response?.data?.message || "Savol yaratishda xatolik yuz berdi")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target;

        // Update formData
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

    const selectedTest = tests.find((t) => String(t.id) === String(formData.test));

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
                        <FadeInPage key={index} delay={900}>
                            <div
                                className="flex items-center space-x-3 border border-theme-primary rounded-full overflow-x-scroll scrollbar-hide backdrop-blur"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                            >
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

                                <div className="flex flex-row w-full">
                                    <input
                                        type="text"
                                        value={answer.answer_text}
                                        onChange={(e) => handleAnswerChange(index, "answer_text", e.target.value)}
                                        placeholder={
                                            formData.question_type === "true_false"
                                                ? answer.answer_text
                                                : `Javob varianti ${answer.letter}`
                                        }
                                        disabled={formData.question_type === "true_false"}
                                        className="flex-1 px-5 py-4 outline-none rounded-lg focus:border-green-600 text-theme-secondary bg-transparent"
                                    />
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
        <div className="min-h-screen bg-theme-primary bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-theme-primary shadow-theme-xl max-w-2xl w-full h-full min-h-screen"
                 style={{
                     backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                     backgroundRepeat: 'no-repeat',
                     backgroundSize: 'cover',
                     backgroundPosition: 'center center',
                     backgroundAttachment: 'fixed'
                 }}>
                <div className={"w-full h-full min-h-screen py-5"} style={{backgroundColor: 'rgba(0, 0, 0, 0.6)'}}>
                    {/* Form */}
                    <div className="p-6 h-full">
                        <div className="mb-6 flex flex-row items-center justify-between">
                            <button className={"flex text-white"} onClick={() => {navigate(`/profile`)}}><ChevronLeft size={30}/></button>
                            <h2 className="text-xl font-semibold text-white mb-2">Yangi Savol Yaratish</h2>
                        </div>

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
                                                        onClick={() => handleSelect(test.id.toString())}
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
                                            value={formData.question_text}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            className="w-full px-4 py-3 outline-none rounded-lg backdrop-blur text-theme-primary focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                                            placeholder="Savolingizni bu yerga yozing..."
                                        />
                                </FadeInPage>
                            </div>

                            {/* Dynamic Answer Inputs */}
                            {renderAnswerInputs()}

                            {/* Action Buttons */}
                            <div className="flex md:flex-row flex-col gap-2 mx-auto pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || createdQuestions.includes(formData.question_text.trim())}
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

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition-all"
                                >
                                    Formani tozalash
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