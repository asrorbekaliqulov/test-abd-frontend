import { useEffect, useState, useRef } from "react";
import { spellCheck } from "./AISpellCheck";

export function useSpellCheck(initial = "") {
    const [value, setValue] = useState(initial);
    const [isLoading, setLoading] = useState(false);
    const lastFixed = useRef("");       // oxirgi tozalangan qiymat
    const timerRef = useRef(null);      // debounce timer

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // Bo‘sh bo‘lsa hech narsa qilmaymiz
        if (!value.trim()) return;

        // USER Yozishni tugatishini kutamiz
        timerRef.current = setTimeout(async () => {
            setLoading(true);

            const fixed = await spellCheck(value);

            // O'zgargan bo‘lsa va infinite loop bo‘lmasligi uchun
            if (fixed !== value && fixed !== lastFixed.current) {
                lastFixed.current = fixed;
                setValue(fixed);
            }

            setLoading(false);
        }, 1000);

        return () => clearTimeout(timerRef.current);
    }, [value]);

    return { value, setValue, isLoading };
}
