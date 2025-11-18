import { useEffect, useRef, useState } from "react";

export default function ExpandableText({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const textRef = useRef<HTMLParagraphElement>(null);

    const checkOverflow = () => {
        const el = textRef.current;
        if (el) {
            // line-clamp ochiq bo'lmaganda haqiqiy overflow tekshiradi
            if (!expanded) {
                setIsOverflowing(el.scrollHeight > el.clientHeight);
            } else {
                // expanded holatida tugmani yashirishdan qochish uchun true saqlaymiz
                setIsOverflowing(true);
            }
        }
    };

    useEffect(() => {
        checkOverflow();

        const observer = new ResizeObserver(() => {
            checkOverflow(); // width o'zgarganda qayta tekshirish
        });

        if (textRef.current) {
            observer.observe(textRef.current);
        }

        return () => observer.disconnect();
    }, [text, expanded]);

    return (
        <div className="text-sm leading-snug">
            <p
                ref={textRef}
                className={
                    expanded
                        ? "line-clamp-none transition-all"
                        : "line-clamp-2 transition-all"
                }
                style={{ maxWidth: "100%", color: "white" }}
            >
                {text}
            </p>

            {isOverflowing && (
                <button
                    className="text-blue-500 mt-1 font-medium"
                    onClick={() => setExpanded((prev) => !prev)}
                >
                    {expanded ? "Yopish" : "Ko‘proq o‘qish"}
                </button>
            )}
        </div>
    );
}
