import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import FadeInPage from "./FadeInPage.tsx";

interface Category {
    id: number;
    title: string;
    emoji: string;
}

interface Props {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelect: (id: number) => void;
}

export default function CategoryDropdown({
                                             categories,
                                             selectedCategoryId,
                                             onSelect
                                         }: Props) {

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLUListElement>(null);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    // CLOSE WHEN CLICK OUTSIDE
    useEffect(() => {
        const handleClick = (e: any) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);

        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className="relative">
            <FadeInPage delay={200}>
            {/* BUTTON */}
                <button
                    type="button"
                    className="w-full px-4 py-3 rounded-lg text-theme-primary flex justify-between items-center"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                    onClick={() => setOpen((p) => !p)}
                >
                <span>
                    {selectedCategory
                        ? `${selectedCategory.emoji}  ${selectedCategory.title}`
                        : "Kategoriya tanlang"}
                </span>

                    <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
                    <ChevronDown />
                </span>
                </button>
            </FadeInPage>

            {/* DROPDOWN */}
            <AnimatePresence>
                {open && (
                    <motion.ul
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute w-full mt-2 bg-transparent
                                   rounded-lg shadow-lg max-h-60 overflow-auto z-50"
                    >
                        {categories.map((cat) => (
                            <li
                                key={cat.id}
                                onClick={() => {
                                    onSelect(cat.id);
                                    setOpen(false);
                                }}
                                className="px-4 py-3 cursor-pointer hover:bg-gray-500 hover:text-white
                                           text-theme-secondary transition duration-200 backdrop-blur"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                            >
                                {cat.emoji}  {cat.title}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
