// src/pages/CardsMarket.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Advanced Cards Marketplace Page
 * - React + TypeScript + Tailwind
 * - Single-file implementation with many features:
 *   fetch API (with mock fallback), filters, favorites, tilt, modal,
 *   skeleton, carousel, infinite scroll, load-more, mobile iOS styling.
 *
 * TO DO: replace image paths and/or API endpoint to your real ones.
 */

/* ---------------------------
   Types
----------------------------*/
type CardItem = {
    id: number;
    title: string; // may include \n for line breaks
    description: string;
    category: string;
    price: number;
    image: string;
    bg?: string;
    created_at?: string;
    trendingScore?: number;
};

/* ---------------------------
   Config / Constants
----------------------------*/
const API_ENDPOINT = "/api/cards"; // change to real endpoint
const PAGE_SIZE = 4;

/* ---------------------------
   Mock data (fallback)
----------------------------*/
const MOCK_CARDS: CardItem[] = [
    {
        id: 1,
        title: "SMALL\nPROGRESS\nIS STILL\nPROGRESS.",
        description: "Motivation poster — har kuni oz bo‘lsa ham oldinga.",
        category: "Motivation",
        price: 600,
        image: "/cards/portrait1.jpg",
        bg: "/cards/bg1.jpg",
        created_at: "2025-10-01",
        trendingScore: 80,
    },
    {
        id: 2,
        title: "KEEP\nLEARNING\nEVERYDAY.",
        description: "Kundalik rivojlanish uchun poster.",
        category: "Education",
        price: 450,
        image: "/cards/portrait2.jpg",
        bg: "/cards/bg2.jpg",
        created_at: "2025-10-10",
        trendingScore: 60,
    },
    {
        id: 3,
        title: "ONE STEP\nAT A TIME.",
        description: "Slow progress > no progress",
        category: "Motivation",
        price: 300,
        image: "/cards/portrait3.jpg",
        bg: "/cards/bg3.jpg",
        created_at: "2025-09-20",
        trendingScore: 40,
    },
    {
        id: 4,
        title: "FOCUS\nAND\nBUILD.",
        description: "Focus — build — repeat.",
        category: "Productivity",
        price: 520,
        image: "/cards/portrait4.jpg",
        bg: "/cards/bg4.jpg",
        created_at: "2025-11-01",
        trendingScore: 70,
    },
    {
        id: 5,
        title: "SMALL\nWINS\nDAILY",
        description: "Celebrate little achievements.",
        category: "Motivation",
        price: 380,
        image: "/cards/portrait5.jpg",
        bg: "/cards/bg5.jpg",
        created_at: "2025-11-02",
        trendingScore: 50,
    },
];

/* ---------------------------
   Utility helpers
----------------------------*/
const formatPrice = (p: number) => `${p.toLocaleString()} so'm`;

/* ---------------------------
   Skeleton card (improved)
----------------------------*/
function SkeletonCard({ wide = false }: { wide?: boolean }) {
    return (
        <div
            className={`w-full max-w-[520px] h-[420px] rounded-2xl overflow-hidden bg-gradient-to-r from-gray-700/60 to-gray-800 animate-pulse`}
        >
            {/* some layered blocks to look like a real card skeleton */}
            <div className="flex h-full">
                <div className="w-1/2 p-6">
                    <div className="h-12 w-3/4 bg-gray-600 rounded mb-4" />
                    <div className="h-6 w-1/2 bg-gray-600 rounded mb-2" />
                    <div className="h-4 w-5/6 bg-gray-600 rounded mt-6" />
                </div>
                <div className="w-1/2 relative">
                    <div className="absolute inset-0 bg-gray-600/30" />
                </div>
            </div>
        </div>
    );
}

/* ---------------------------
   Modal (Details + purchase)
----------------------------*/
function DetailsModal({
                          open,
                          onClose,
                          item,
                      }: {
    open: boolean;
    onClose: () => void;
    item: CardItem | null;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open || !item) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative max-w-3xl w-full bg-[#0f0f10] rounded-2xl shadow-2xl overflow-hidden z-10">
                <button
                    aria-label="Close modal"
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-300 hover:text-white z-20"
                >
                    ✖
                </button>

                <div className="md:flex">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="w-full md:w-1/2 h-80 object-cover"
                    />
                    <div className="p-6 md:w-1/2">
                        <h2 className="text-2xl font-extrabold whitespace-pre-line">
                            {item.title}
                        </h2>
                        <p className="mt-3 text-gray-300">{item.description}</p>

                        <div className="flex items-center justify-between mt-6">
                            <div>
                                <div className="text-sm text-gray-400">Narx</div>
                                <div className="text-xl font-semibold text-yellow-300">
                                    {formatPrice(item.price)}
                                </div>
                            </div>

                            <div className="space-x-3">
                                <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                                    Sotib olish
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-3 py-2 rounded-xl border text-gray-200"
                                >
                                    Yopish
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 text-sm text-gray-500">
                            Kategoriya: <span className="text-gray-300">{item.category}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------------------------
   Small Tilt hook for 3D effect
----------------------------*/
function useTilt(ref: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let width = 0;
        let height = 0;
        const onMove = (ev: PointerEvent) => {
            if (!(el instanceof HTMLElement)) return;
            if (!width || !height) {
                const rect = el.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
            }
            const rect = el.getBoundingClientRect();
            const x = ev.clientX - rect.left - width / 2;
            const y = ev.clientY - rect.top - height / 2;
            const rx = (-y / height) * 8;
            const ry = (x / width) * 8;
            el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
            el.style.transition = "transform 0.05s ease-out";
        };
        const onLeave = () => {
            if (!(el instanceof HTMLElement)) return;
            el.style.transform = "";
            el.style.transition = "transform 0.4s cubic-bezier(.2,.9,.3,1)";
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        el.addEventListener("pointercancel", onLeave);

        return () => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
            el.removeEventListener("pointercancel", onLeave);
        };
    }, [ref]);
}

/* ---------------------------
   Card component (with tilt, favorites, actions)
----------------------------*/
function MarketplaceCard({
                             item,
                             isFavorite,
                             onToggleFavorite,
                             onOpen,
                         }: {
    item: CardItem;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onOpen: () => void;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    useTilt(ref);

    return (
        <article
            ref={ref}
            className="relative w-full max-w-[560px] h-[420px] rounded-3xl overflow-hidden bg-gradient-to-r from-[#191919] to-[#262626] shadow-2xl border border-black"
            // clicking opens modal; favorite has its own handler
            onClick={onOpen}
        >
            {/* left text / texture */}
            <div
                className="absolute inset-0 flex"
                style={{ minWidth: 0 /* prevent flex overflow issues */ }}
            >
                <div
                    className="w-1/2 p-8 flex items-start"
                    style={{
                        backgroundImage: item.bg ? `url(${item.bg})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#1b1b1b",
                    }}
                >
                    <div className="text-left">
                        <h3
                            className="font-extrabold text-[#EFD9A7] text-[34px] md:text-[40px] leading-tight whitespace-pre-line"
                            style={{ textShadow: "0 2px 0 rgba(0,0,0,0.4)" }}
                        >
                            {item.title}
                        </h3>
                        <p className="mt-4 text-sm text-gray-300/80">{item.description}</p>
                    </div>
                </div>

                <div className="w-1/2 relative">
                    <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute left-0 top-0 h-full w-2 bg-[#0b0b0b]" />

                    {/* price badge */}
                    <div
                        className="absolute bottom-6 left-6 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg"
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.35))",
                            backdropFilter: "blur(6px)",
                        }}
                    >
                        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-lg shadow-inner">
                            ★
                        </div>
                        <div className="text-yellow-100 font-semibold">{formatPrice(item.price)}</div>
                    </div>

                    {/* favorite toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite();
                        }}
                        aria-label={isFavorite ? "Remove favorite" : "Add to favorites"}
                        className="absolute top-5 right-5 text-2xl"
                    >
                        {isFavorite ? "❤️" : "🤍"}
                    </button>

                    {/* quick-buy button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // open modal or go to buy flow
                            onOpen();
                        }}
                        className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                        aria-label="Buy"
                    >
                        Sotib olish
                    </button>
                </div>
            </div>
        </article>
    );
}

/* ---------------------------
   Featured Carousel (drag-scroll)
----------------------------*/
function FeaturedCarousel({ items }: { items: CardItem[] }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onDown = (e: PointerEvent) => {
            isDragging.current = true;
            el.classList.add("cursor-grabbing");
            startX.current = e.pageX - el.offsetLeft;
            scrollLeft.current = el.scrollLeft;
            (e.target as Element).setPointerCapture(e.pointerId);
        };
        const onUp = (e: PointerEvent) => {
            isDragging.current = false;
            el.classList.remove("cursor-grabbing");
        };
        const onMove = (e: PointerEvent) => {
            if (!isDragging.current) return;
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX.current) * 1; // scroll-fast factor
            el.scrollLeft = scrollLeft.current - walk;
        };

        el.addEventListener("pointerdown", onDown);
        window.addEventListener("pointerup", onUp);
        el.addEventListener("pointermove", onMove);

        return () => {
            el.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointerup", onUp);
            el.removeEventListener("pointermove", onMove);
        };
    }, []);

    if (!items.length) return null;

    return (
        <div className="mb-8">
            <h3 className="mb-3 text-lg font-semibold">Featured</h3>
            <div
                ref={ref}
                className="flex gap-6 overflow-x-auto no-scrollbar py-2 px-1"
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                {items.map((it) => (
                    <div key={it.id} className="min-w-[360px] flex-shrink-0">
                        <div className="rounded-2xl overflow-hidden shadow-lg">
                            <img
                                src={it.image}
                                alt={it.title}
                                className="w-full h-52 object-cover"
                            />
                            <div className="p-3 bg-[#0f0f10]">
                                <div className="font-semibold whitespace-pre-line">{it.title}</div>
                                <div className="text-sm text-gray-400 mt-1">{formatPrice(it.price)}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------------------------
   Main page component
----------------------------*/
export default function CardsMarketPage() {
    // fetch / data
    const [cards, setCards] = useState<CardItem[]>([]);
    const [page, setPage] = useState(1);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [useMock, setUseMock] = useState(false);

    // filters & UI state
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [sort, setSort] = useState("newest");
    const [favorites, setFavorites] = useState<number[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeCard, setActiveCard] = useState<CardItem | null>(null);

    // intersection observer for infinite scroll
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // load favorites from localStorage
        try {
            const raw = localStorage.getItem("tb_favorites");
            if (raw) setFavorites(JSON.parse(raw));
        } catch (e) {
            console.warn("favorite load fail", e);
        }
    }, []);

    // Save favorites on change
    useEffect(() => {
        localStorage.setItem("tb_favorites", JSON.stringify(favorites));
    }, [favorites]);

    // Data fetch: try API, fallback to mock
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await fetch(`${API_ENDPOINT}?page=${page}&limit=${PAGE_SIZE}`, {
                    cache: "no-store",
                });
                if (!res.ok) throw new Error("API not available");
                const data = (await res.json()) as CardItem[];
                if (cancelled) return;
                // if api returns empty, fallback to mock
                if (!Array.isArray(data) || data.length === 0) {
                    setUseMock(true);
                    setCards(MOCK_CARDS);
                } else {
                    setCards((prev) => (page === 1 ? data : [...prev, ...data]));
                }
            } catch (err) {
                // fallback
                setUseMock(true);
                // mimic network delay
                await new Promise((r) => setTimeout(r, 450));
                setCards(MOCK_CARDS);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page]);

    // derived categories for filters
    const categories = useMemo(() => {
        const set = new Set<string>(cards.map((c) => c.category));
        return ["All", ...Array.from(set)];
    }, [cards]);

    // filter & sort results
    const results = useMemo(() => {
        let data = [...cards];

        if (query.trim()) {
            const q = query.trim().toLowerCase();
            data = data.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
        }
        if (category !== "All") data = data.filter((c) => c.category === category);
        data = data.filter((c) => c.price >= priceRange[0] && c.price <= priceRange[1]);

        if (sort === "cheapest") data.sort((a, b) => a.price - b.price);
        else if (sort === "expensive") data.sort((a, b) => b.price - a.price);
        else if (sort === "trending") data.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
        else data.sort((a, b) => (new Date(b.created_at || "").getTime() || 0) - (new Date(a.created_at || "").getTime() || 0));

        return data;
    }, [cards, query, category, priceRange, sort]);

    // visible slice for pagination / load more
    const visible = results.slice(0, visibleCount);

    // intersection observer to auto-load more
    useEffect(() => {
        const node = endRef.current;
        if (!node) return;
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !loading && visibleCount < results.length) {
                        setVisibleCount((v) => Math.min(results.length, v + PAGE_SIZE));
                    } else if (entry.isIntersecting && !loading && results.length === 0 && useMock) {
                        // nothing
                    }
                });
            },
            { root: null, rootMargin: "200px", threshold: 0.1 }
        );
        obs.observe(node);
        return () => obs.disconnect();
    }, [endRef, loading, results.length, visibleCount, useMock]);

    // toggle favorite
    const toggleFavorite = (id: number) => {
        setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    // UI helpers
    const resetFilters = () => {
        setQuery("");
        setCategory("All");
        setPriceRange([0, 1000]);
        setSort("newest");
    };

    // sample min/max for UI slider
    const maxPrice = Math.max(1000, ...cards.map((c) => c.price));
    const minPrice = 0;

    /* UI - render */
    return (
        <div className="min-h-screen pb-20 bg-gradient-to-b from-[#050507] to-[#0b0b0b] text-white px-4 md:px-6 lg:px-8 pt-safe-top">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="pt-6 pb-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold">Premium Cards Marketplace</h1>
                    <p className="text-gray-400 mt-2">Premium poster-style cards — ko‘rish, sevimlilarga qo‘shish va sotib olish.</p>
                </header>

                {/* Featured carousel */}
                <FeaturedCarousel items={cards.slice(0, 5)} />

                {/* Controls: search / filters */}
                <section className="bg-[#0b0b0d] rounded-2xl p-4 md:p-6 mb-6 shadow-lg border border-black/40">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Qidiruv (title / description)..."
                            className="flex-1 min-w-0 px-4 py-2 rounded-xl bg-white/5 border placeholder:text-gray-400 outline-none"
                            aria-label="Search"
                        />

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full md:w-44 px-3 py-2 rounded-xl bg-white/5 border"
                            aria-label="Category"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="w-full md:w-44 px-3 py-2 rounded-xl bg-white/5 border"
                            aria-label="Sort"
                        >
                            <option value="newest">Eng yangi</option>
                            <option value="cheapest">Arzon</option>
                            <option value="expensive">Qimmat</option>
                            <option value="trending">Trending</option>
                        </select>
                    </div>

                    {/* Price slider / range */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 md:items-center">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-400">Narx:</div>
                                <input
                                    type="range"
                                    min={minPrice}
                                    max={maxPrice}
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                                    className="w-full"
                                />
                                <div className="text-sm font-semibold">{formatPrice(priceRange[1])}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button onClick={resetFilters} className="px-3 py-2 rounded-xl border bg-white/5">
                                Reset
                            </button>
                            <button
                                onClick={() => {
                                    // manual reload (simulate)
                                    setLoading(true);
                                    setTimeout(() => {
                                        setLoading(false);
                                        // If using mock, keep; otherwise re-fetch would happen by page change
                                    }, 600);
                                }}
                                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </section>

                {/* Favorites quick row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-400">
                        Natijalar: <span className="text-gray-200 font-semibold">{results.length}</span>
                    </div>
                    <div className="text-sm">
                        <button
                            onClick={() => {
                                // show only favorites
                                if (category !== "Favorites") {
                                    setCategory("Favorites");
                                } else {
                                    setCategory("All");
                                }
                            }}
                            className={`px-3 py-2 rounded-xl ${category === "Favorites" ? "bg-yellow-500 text-black" : "bg-white/5"}`}
                        >
                            ❤️ Sevimlilar ({favorites.length})
                        </button>
                    </div>
                </div>

                {/* Cards list (flex column) */}
                <main className="flex flex-col gap-8 items-center">
                    {loading
                        ? // show skeletons
                        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                        : // results after filtering
                        (category === "Favorites"
                                ? results.filter((r) => favorites.includes(r.id))
                                : results
                        ).slice(0, visibleCount).map((c) => (
                            <MarketplaceCard
                                key={c.id}
                                item={c}
                                isFavorite={favorites.includes(c.id)}
                                onToggleFavorite={() => toggleFavorite(c.id)}
                                onOpen={() => {
                                    setActiveCard(c);
                                    setModalOpen(true);
                                }}
                            />
                        ))}

                    {/* show empty state */}
                    {!loading && results.length === 0 && (
                        <div className="text-gray-400 text-center">Hech narsa topilmadi 😔</div>
                    )}
                </main>

                {/* Load more / infinite hint */}
                <div ref={endRef} className="mt-8" />

                <div className="mt-6 mb-12 flex items-center justify-center gap-4">
                    {visibleCount < results.length && !loading && (
                        <button
                            onClick={() => setVisibleCount((v) => Math.min(results.length, v + PAGE_SIZE))}
                            className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700"
                        >
                            Yana ko‘rsatish
                        </button>
                    )}

                    {/* Show page fetch control (only relevant if using API) */}
                    {!useMock && (
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            className="px-4 py-2 rounded-xl border bg-white/5"
                        >
                            Next page (API)
                        </button>
                    )}

                    <div className="text-sm text-gray-400">Scroll to load more automatically</div>
                </div>

                {/* modal */}
                <DetailsModal open={modalOpen} onClose={() => setModalOpen(false)} item={activeCard} />
            </div>
        </div>
    );
}
