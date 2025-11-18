import transApi from "./transApi";

export const translateDOM = async (lang: string) => {
    const nodes = document.querySelectorAll("[data-i18n]");

    for (const node of nodes) {
        const original = node.getAttribute("data-i18n") || "";
        const translated = await transApi.translate(original, lang);
        node.textContent = translated;
    }

    // title attributlar
    const titleNodes = document.querySelectorAll("[data-i18n-title]");

    for (const node of titleNodes) {
        const original = node.getAttribute("data-i18n-title") || "";
        const translated = await transApi.translate(original, lang);
        node.setAttribute("title", translated);
    }
};
