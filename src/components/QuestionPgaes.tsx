import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { quizAPI } from '../utils/api';
import { Bookmark, CheckCircle, Share } from 'lucide-react';

interface Answer {
    id: number;
    letter: string;
    answer_text: string;
    is_correct: boolean;
}

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    media: string | null;
    answers: Answer[];
    correct_count: number;
    wrong_count: number;
    difficulty_percentage: number;
    user_attempt_count: number;
    is_bookmarked?: boolean;
    user: {
        id: number;
        username: string;
        profile_image: string | null;
        is_badged: boolean;
    };
}

const QuestionPage: React.FC = () => {
    const { id } = useParams();
    const [question, setQuestion] = useState<Question | null>(null);
    const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            quizAPI.fetchQuestionById(id)
                .then(res => {
                    setQuestion(res.data);
                })
                .catch(err => {
                    console.error("Savolni yuklashda xatolik:", err);
                });
        }
    }, [id]);

    const handleAnswer = (answerId: number) => {
        if (!question || selectedAnswerId) return;

        quizAPI.submitAnswers({
            question_id: question.id,
            selected_answer_id: answerId,
            duration: 2,
        }).then(res => {
            setSelectedAnswerId(answerId);
            const updated = {
                ...question,
                correct_count: res.data.is_correct
                    ? question.correct_count + 1
                    : question.correct_count,
                wrong_count: !res.data.is_correct
                    ? question.wrong_count + 1
                    : question.wrong_count,
            };
            setQuestion(updated);
        }).catch(err => {
            console.error("Javob yuborishda xatolik:", err);
        });
    };

    const handleBookmarkToggle = () => {
        if (!question) return;
        quizAPI.bookmarkTest(question.id)
            .then(() => {
                setQuestion({
                    ...question,
                    is_bookmarked: !question.is_bookmarked,
                });
            })
            .catch(err => console.error("Toggle error:", err));
    };
      

    const shareQuestion = () => {
        const url = `${window.location.origin}/questions/${question?.id}`;
        if (navigator.share) {
            navigator.share({
                title: "TestAbd savoli",
                text: "Mana qiziqarli savol!",
                url,
            });
        } else {
            navigator.clipboard.writeText(url);
            alert("Havola nusxalandi: " + url);
        }
    };

    if (!question) {
        return <p className="text-center mt-10 text-theme-secondary">Yuklanmoqda...</p>;
    }

    return (
        <div className="max-w-xl mx-auto px-4 py-10 bg-theme-secondary min-h-screen">
            <div className="bg-theme-primary p-6 rounded-2xl shadow-theme-md">
                {/* User Info */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                            {question.user.profile_image ? (
                                <img src={question.user.profile_image} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                                    {question.user.username.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center space-x-1">
                                <span className="font-semibold">{question.user.username}</span>
                                {question.user.is_badged && <CheckCircle size={16} className="text-blue-500" />}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={shareQuestion} className="p-2 hover:bg-theme-tertiary rounded-full">
                            <Share size={18} />
                        </button>
                        <button onClick={handleBookmarkToggle} className="p-2 hover:bg-theme-tertiary rounded-full">
                            <Bookmark
                                size={18}
                                className={question.is_bookmarked ? 'text-yellow-500 fill-current' : 'text-theme-secondary'}
                            />
                        </button>
                    </div>
                </div>

                {/* Question */}
                <h2 className="text-lg font-semibold mb-4">{question.question_text}</h2>

                {/* Options */}
                <div className="space-y-3">
                    {question.answers.map((answer) => {
                        let statusClass = "bg-theme-secondary border-theme-primary hover:bg-theme-tertiary";
                        if (selectedAnswerId) {
                            if (answer.id === selectedAnswerId) {
                                statusClass = answer.is_correct
                                    ? 'bg-green-50 border-green-500 text-green-700'
                                    : 'bg-red-50 border-red-500 text-red-700';
                            } else if (answer.is_correct) {
                                statusClass = 'bg-green-50 border-green-500 text-green-700';
                            }
                        }

                        return (
                            <button
                                key={answer.id}
                                disabled={!!selectedAnswerId}
                                onClick={() => handleAnswer(answer.id)}
                                className={`w-full p-3 border-2 rounded-lg text-left transition-theme-normal ${statusClass}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-7 h-7 rounded-full bg-theme-tertiary flex items-center justify-center font-semibold">
                                        {answer.letter}
                                    </div>
                                    <span>{answer.answer_text}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Stats */}
                <div className="flex justify-between mt-6 text-sm">
                    <span className="text-green-600">T: {question.correct_count}</span>
                    <span className="text-red-600">F: {question.wrong_count}</span>
                    <span className="text-theme-secondary">Qiyinlik: {Math.round(question.difficulty_percentage)}%</span>
                </div>
            </div>
        </div>
    );
};

export default QuestionPage;
