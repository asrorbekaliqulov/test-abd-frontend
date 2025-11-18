import { useContext } from "react";
import { LanguageContext } from "./LanguageProvider";

export const useLanguage = () => {
    return useContext(LanguageContext);
};
