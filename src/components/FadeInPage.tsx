import { useEffect, useState } from "react"

interface FadeInSectionProps {
    children: React.ReactNode
    delay?: number
}

const FadeInSection = ({ children, delay = 0 }: FadeInSectionProps) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsVisible(true)
        }, delay)
        return () => clearTimeout(timeout)
    }, [delay])

    return (
        <div
            className={`w-full opacity-0 transform translate-y-5 ${
                isVisible ? 'animate-fadeUp' : ''
            }`}
        >
            {children}
        </div>
    )
}

export default FadeInSection
