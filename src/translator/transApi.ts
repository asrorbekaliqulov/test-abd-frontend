const API_URL = "https://backend.testabd.uz/spell/check/";

const transApi = {
    translate: async (text: string, lang: string) => {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lang }),
        });

        const data = await res.json();
        return data?.result || text;
    },
};

export default transApi;
