import transApi from "./transApi";

let currentLang = "uz";

export const initRealTimeTranslator = () => {
    const observer = new MutationObserver(async (mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                handleNode(node);
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // ilk yuklanishda ham
    scanDOM();
};

export const setLanguage = async (lang: string) => {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    await scanDOM();
};

// DOM ichidagi barcha text node'larni topish
const scanDOM = async () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        await translateNode(node);
    }
};

// bitta node tarjimasi
const translateNode = async (node: any) => {
    const text = node.nodeValue?.trim();

    if (!text) return;
    if (text.length < 2) return;

    const translated = await transApi.translate(text, currentLang);
    node.nodeValue = translated;
};

const handleNode = async (node: any) => {
    if (node.nodeType === Node.TEXT_NODE) {
        await translateNode(node);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let t;
        while ((t = walker.nextNode())) {
            await translateNode(t);
        }
    }
};
