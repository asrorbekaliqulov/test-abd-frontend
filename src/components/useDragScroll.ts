import { useRef } from "react"

export function useDragScroll() {
    const ref = useRef<HTMLDivElement | null>(null)
    const isDown = useRef(false)
    const startX = useRef(0)
    const scrollLeft = useRef(0)

    const onMouseDown = (e: React.MouseEvent) => {
        if (!ref.current) return
        isDown.current = true
        startX.current = e.pageX
        scrollLeft.current = ref.current.scrollLeft
    }

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !ref.current) return
        e.preventDefault()
        const walk = (e.pageX - startX.current) * 1.1
        ref.current.scrollLeft = scrollLeft.current - walk
    }

    const stop = () => {
        isDown.current = false
    }

    return {
        ref,
        onMouseDown,
        onMouseMove,
        onMouseUp: stop,
        onMouseLeave: stop,
    }
}
