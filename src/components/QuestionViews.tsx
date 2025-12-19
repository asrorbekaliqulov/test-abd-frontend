import { useEffect, useState } from "react"
import { quizAPI } from "../utils/api.ts"

interface Props {
    questionId: number
}

const QuizQuestionView = ({ questionId }: Props) => {
    const [views, setViews] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const fetchViews = async () => {
            try {
                const res = await quizAPI.fetchQuestionViewStats(questionId)
                if (mounted) {
                    setViews(res.data.views)
                }
            } catch (e) {
                console.error("View stats error", e)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchViews()

        return () => {
            mounted = false
        }
    }, [questionId])

    return (
        <span className="text-xs text-white/70">
      👁 {loading ? "..." : views}
    </span>
    )
}

export default QuizQuestionView
