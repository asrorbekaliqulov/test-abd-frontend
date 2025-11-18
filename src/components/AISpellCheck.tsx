import axios from "axios";

export async function spellCheck(text) {
    if (!text) return text;

    try {
        const cleaned = text.replace(/<[^>]*>/g, "").trim();

        const res = await axios.post(
            "https://backend.testabd.uz/spell/check/",
            { text: cleaned },
            { headers: { "Content-Type": "application/json" } }
        );

        return res.data?.result ?? cleaned;
    } catch (err) {
        console.error("SPELLCHECK ERROR:", err);
        return text;
    }
}
