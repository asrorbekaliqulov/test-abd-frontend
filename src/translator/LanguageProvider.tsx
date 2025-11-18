import { createContext, useEffect, useState } from "react";
import transApi from "./transApi";
import { translateDOM } from "./domTranslator";

export const LanguageContext = createContext({
    lang: "uz",
    setLang: (lang: string) => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLang] = useState(localStorage.getItem("lang") || "uz");

    useEffect(() => {
        // localStorage yangilash
        localStorage.setItem("lang", lang);

        // DOM ichidagi barcha textlarni translate qilish
        translateDOM(lang);

    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang }}>
            {children}
        </LanguageContext.Provider>
    );
};
