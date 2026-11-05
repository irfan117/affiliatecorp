import { useState, useEffect, useRef, useMemo } from 'react';
import { ADVERTISED_PRODUCTS, type AdvertisedProduct } from './data/salesProducts';
import {
  askProductSalesAssistant,
  getComplementaryProducts
} from './lib/assistantEngine';
import './App.css';

interface MessageItem {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
  productCard: {
    id: string;
    name: string;
    price: string;
    priceOriginal: string;
    discountTag: string;
    rating: number;
    salesCount: number;
    url: string;
    badge: string;
    imageUrl: string;
  };
  complementary: AdvertisedProduct[];
}

const MODAL_PAGE_SIZE = 6;

export function App() {
  // Deteksi apakah pengunjung datang dari link iklan spesifik (?p=id)
  const initialUrlProduct = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramId = params.get('p') || params.get('product');
      if (paramId) {
        return (
          ADVERTISED_PRODUCTS.find(
            (p) => p.id.toLowerCase() === paramId.toLowerCase()
          ) || null
        );
      }
    }
    return null;
  }, []);

  const [activeProduct, setActiveProduct] = useState<AdvertisedProduct>(
    () => initialUrlProduct || ADVERTISED_PRODUCTS[0]
  );

  // Ketika belum mulai chat, tampilkan katalog di area awal chat.
  // Begitu chat dimulai, katalog awal disembunyikan dan hanya bisa dibuka dari pop-up header.
  const [hasChatStarted, setHasChatStarted] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // State Pop-up Modal "Lihat Semua Produk" (Aman untuk ratusan produk: Search + Kategori + Load More)
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('Semua');
  const [modalVisibleCount, setModalVisibleCount] = useState<number>(MODAL_PAGE_SIZE);

  // Kategori di tampilan awal sebelum chat dimulai
  const [initialCategory, setInitialCategory] = useState<string>('Semua');

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, hasChatStarted]);

  function buildProductCardData(prod: AdvertisedProduct) {
    return {
      id: prod.id,
      name: prod.name,
      price: prod.price_promo,
      priceOriginal: prod.price_original,
      discountTag: prod.discount_tag,
      rating: prod.rating,
      salesCount: prod.sales_count,
      url: prod.affiliate_url,
      badge: prod.free_shipping_badge,
      imageUrl: prod.image_url
    };
  }

  function startConsultationForProduct(prod: AdvertisedProduct, initialQuestion?: string) {
    setActiveProduct(prod);
    setHasChatStarted(true);
    setIsCatalogModalOpen(false);

    if (typeof window !== 'undefined' && window.history) {
      const newUrl = `${window.location.pathname}?p=${prod.id}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const welcomeMsg: MessageItem = {
      id: `welcome-${prod.id}-${Date.now()}`,
      sender: 'assistant',
      text: `Hai kak, selamat datang 👋 Saya Rian, partner belanja yang bantu pilih produk paling pas—bukan sekadar jualan.\n\nKakak sedang mempertimbangkan ${prod.name}, ya? ${prod.headline}\n\nBoleh ceritakan kebutuhan atau hal yang masih bikin ragu. Saya bisa bantu cek kecocokan, spesifikasi, dan alternatifnya dengan jujur.`,
      time: nowTime,
      productCard: buildProductCardData(prod),
      complementary: getComplementaryProducts(prod)
    };

    if (initialQuestion && initialQuestion.trim()) {
      const cleanQ = initialQuestion.trim();
      const userMsg: MessageItem = {
        id: `usr-${Date.now() + 1}`,
        sender: 'user',
        text: cleanQ,
        time: nowTime,
        productCard: buildProductCardData(prod),
        complementary: []
      };
      const res = askProductSalesAssistant(prod, cleanQ);
      const replyMsg: MessageItem = {
        id: `ast-${Date.now() + 2}`,
        sender: 'assistant',
        text: res.answer,
        time: nowTime,
        productCard: buildProductCardData(prod),
        complementary: res.complementary
      };
      setMessages([welcomeMsg, userMsg, replyMsg]);
    } else {
      setMessages([welcomeMsg]);
    }
  }

  async function handleSendMessage(customText?: string) {
    const query = (customText || inputMessage).trim();
    if (!query || isSending) return;

    if (!hasChatStarted) {
      startConsultationForProduct(activeProduct, query);
      if (!customText) setInputMessage('');
      return;
    }

    setIsSending(true);
    setTimeout(() => setIsSending(false), 1200);

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: nowTime,
      productCard: buildProductCardData(activeProduct),
      complementary: []
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');

    // Coba hubungi Cloudflare Workers AI backend
    let answerText = '';
    const resFallback = askProductSalesAssistant(activeProduct, query);
    const complementaryList = resFallback.complementary;

    const WORKER_API_BASE = 'https://afiliatcorp-shopping-worker.afiliatcorp.workers.dev';
    try {
      const apiRes = await fetch(`${WORKER_API_BASE}/api/sales-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeProduct.id,
          question: query
        })
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.answer) answerText = data.answer;
      } else if (apiRes.status === 429) {
        const data = await apiRes.json();
        answerText = data.answer || 'Mohon tunggu beberapa detik ya kak sebelum mengirim pesan lagi.';
      }
    } catch {
      // Offline fallback
    }

    if (!answerText) {
      answerText = resFallback.answer;
    }

    const assistantMsg: MessageItem = {
      id: `ast-${Date.now() + 1}`,
      sender: 'assistant',
      text: answerText,
      time: nowTime,
      productCard: buildProductCardData(activeProduct),
      complementary: complementaryList
    };

    setMessages((prev) => [...prev, assistantMsg]);
  }

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(ADVERTISED_PRODUCTS.map((p) => p.category)))],
    []
  );

  const initialCatalogProducts = useMemo(() => {
    if (initialCategory === 'Semua') return ADVERTISED_PRODUCTS;
    return ADVERTISED_PRODUCTS.filter((p) => p.category === initialCategory);
  }, [initialCategory]);

  // Filter & Pencarian di dalam Pop-up Modal (Aman untuk ratusan produk)
  const filteredModalProducts = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    return ADVERTISED_PRODUCTS.filter((p) => {
      if (modalCategory !== 'Semua' && p.category !== modalCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [modalSearch, modalCategory]);

  const visibleModalProducts = filteredModalProducts.slice(0, modalVisibleCount);

  const quickQuestions = [
    ...(activeProduct.faq?.slice(0, 2).map((f) => f.q) || []),
    'Apa produk lain yang juga direkomendasikan?'
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#FAF9F5] text-stone-900 font-sans antialiased overflow-hidden">
      {/* 1. HEADER FULL CHAT (Dengan Tombol Pop-up Lihat Produk) */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full bg-stone-900 border border-stone-300 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0 shadow-2xs">
            <span>RP</span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-stone-900 truncate">
                Rian Pratama
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Pemilik Toko
              </span>
            </div>
            <p className="text-[11px] text-stone-500 truncate">
              {hasChatStarted
                ? `Sedang melayani: ${activeProduct.name}`
                : 'Tanya apa saja seputar produk, ukuran, atau pengiriman langsung ke saya'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasChatStarted && (
            <button
              type="button"
              onClick={() => {
                setHasChatStarted(false);
                setMessages([]);
              }}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
            >
              Tampilan Awal
            </button>
          )}

          {/* Tombol Pop-up Lihat Produk di Header */}
          <button
            type="button"
            onClick={() => {
              setModalVisibleCount(MODAL_PAGE_SIZE);
              setIsCatalogModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <span>Katalog Produk ({ADVERTISED_PRODUCTS.length})</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* 2. AREA UTAMA FULL CHAT */}
      <main
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-5"
      >
        <div className="max-w-4xl mx-auto">
          {!hasChatStarted ? (
            /* STATE AWAL SEBELUM CHAT DIMULAI: Menampilkan Produk Unggulan & Katalog di Dalam Area Chat */
            <div className="space-y-6 pb-4">
              {/* Banner Sambutan & Produk yang Sedang Dilihat dari Iklan */}
              <div className="bg-stone-900 rounded-2xl p-5 sm:p-6 text-stone-100 shadow-sm border border-stone-800">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-4">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-800 border border-stone-700/60">
                      <img
                        src={activeProduct.image_url}
                        alt={activeProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-800 text-stone-300 border border-stone-700">
                        Koleksi: {activeProduct.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-stone-950">
                        {activeProduct.discount_tag}
                      </span>
                      <span className="text-xs text-stone-300">
                        Rating {activeProduct.rating}/5.0 • {activeProduct.sales_count.toLocaleString('id-ID')}+ terjual
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {activeProduct.name}
                    </h2>

                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {activeProduct.headline}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-stone-400 line-through mr-2">
                          {activeProduct.price_original}
                        </span>
                        <span className="text-lg sm:text-xl font-extrabold text-amber-300">
                          {activeProduct.price_promo}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startConsultationForProduct(activeProduct)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Tanya ke Rian
                        </button>
                        <a
                          href={activeProduct.affiliate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
                        >
                          Pesan Langsung
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Katalog Awal di Area Chat (Otomatis Hilang Saat Chat Dimulai) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900">
                      Koleksi Pilihan Toko Kami
                    </h3>
                    <p className="text-xs text-stone-500">
                      Klik salah satu produk untuk mulai tanya-jawab langsung ke saya atau memesan
                    </p>
                  </div>

                  {/* Filter Kategori */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {categories.map((cat) => {
                      const active = initialCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setInitialCategory(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-stone-900 text-white shadow-2xs'
                              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/90'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {initialCatalogProducts.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-400 hover:shadow-sm transition flex flex-col justify-between overflow-hidden group"
                    >
                      <div>
                        <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                            {item.category}
                          </span>
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 text-[10px] font-bold">
                            {item.discount_tag}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span className="font-semibold text-amber-700">
                              Rating {item.rating}/5.0
                            </span>
                            <span>{item.sales_count.toLocaleString('id-ID')} terjual</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                            {item.headline}
                          </p>
                          <div className="pt-1 text-sm font-extrabold text-stone-900">
                            {item.price_promo}
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 pt-0 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => startConsultationForProduct(item)}
                          className="py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer"
                        >
                          Tanya Rian
                        </button>
                        <a
                          href={item.affiliate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold text-center transition"
                        >
                          Pesan
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* STATE SAAT CHAT DIMULAI: Katalog Awal Disembunyikan, Fokus Murni Percakapan Chat */
            <div className="space-y-5 pb-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-stone-900 text-stone-50 rounded-tr-xs shadow-2xs'
                        : 'bg-white border border-stone-200/90 text-stone-800 rounded-tl-xs shadow-2xs space-y-3.5'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Kartu Produk Ringkas di Dalam Balasan Toko */}
                    {m.sender === 'assistant' && (
                      <div className="pt-3 border-t border-stone-100 space-y-3">
                        <div className="flex items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                          <a
                            href={m.productCard.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition group"
                          >
                            <img
                              src={m.productCard.imageUrl}
                              alt={m.productCard.name}
                              className="w-11 h-11 rounded-lg object-cover bg-stone-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 group-hover:underline truncate">
                                {m.productCard.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-extrabold text-stone-900">
                                  {m.productCard.price}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {m.productCard.badge}
                                </span>
                              </div>
                            </div>
                          </a>
                        </div>

                        {/* Rekomendasi Produk Pilihan di Dalam Chat */}
                        {m.complementary && m.complementary.length > 0 && (
                          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/70">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                                <svg
                                  className="w-3.5 h-3.5 text-amber-600 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                                  />
                                </svg>
                                Kami juga merekomendasikan produk:
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsCatalogModalOpen(true)}
                                className="text-[11px] font-semibold text-stone-900 hover:underline cursor-pointer"
                              >
                                Lihat semua
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {m.complementary.map((comp) => (
                                <div
                                  key={comp.id}
                                  className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-stone-200/80 shadow-2xs hover:border-stone-400 transition"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-bold text-stone-800 truncate">
                                      {comp.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] font-bold text-stone-900">
                                        {comp.price_promo}
                                      </span>
                                      {comp.recommendation_badge && (
                                        <span className="text-[9px] font-medium text-stone-700 bg-stone-100 px-1.5 py-0.2 rounded">
                                          {comp.recommendation_badge}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => startConsultationForProduct(comp)}
                                      className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-semibold cursor-pointer transition"
                                    >
                                      Tanya
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-stone-400 px-1 mt-1">{m.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 3. FOOTER INPUT CHAT BAR */}
      <footer className="bg-white border-t border-stone-200/90 px-4 sm:px-6 py-3 shrink-0 z-10">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Chip Pertanyaan Cepat */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-stone-700 shrink-0 mr-1">
              Tanya Cepat:
            </span>
            {quickQuestions.map((qText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qText)}
                className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 px-3 py-1 rounded-full transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                {qText}
              </button>
            ))}
          </div>

          {/* Input Text Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-stone-50 border border-stone-200/90 focus-within:border-stone-400 focus-within:bg-white rounded-xl px-3.5 py-1.5 transition shadow-2xs"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Tanyakan apa saja ke Rian tentang ${activeProduct.name.slice(0, 30)}...`}
              className="flex-1 bg-transparent text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none py-1.5"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
            >
              {isSending ? 'Mengirim...' : 'Kirim'}
            </button>
          </form>
        </div>
      </footer>

      {/* 4. POP-UP MODAL "LIHAT SEMUA PRODUK" (Dilengkapi Pencarian, Filter Kategori, & Pagination agar Aman untuk Ratusan Produk) */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header Pop-up */}
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between gap-4 shrink-0">
              <div>
                <h2 className="text-base font-bold">
                  Katalog Lengkap Produk ({filteredModalProducts.length})
                </h2>
                <p className="text-xs text-stone-300">
                  Pilih produk untuk mulai tanya-jawab di chat atau langsung memesan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Sticky Search & Filter Bar (Penting saat jumlah produk sangat banyak) */}
            <div className="p-4 bg-stone-50 border-b border-stone-200 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => {
                    setModalSearch(e.target.value);
                    setModalVisibleCount(MODAL_PAGE_SIZE);
                  }}
                  placeholder="Cari nama produk, fungsi, atau kebutuhan (misal: kabel, meja, lembap, charger)..."
                  className="flex-1 bg-white border border-stone-200 focus:border-stone-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {categories.map((cat) => {
                  const active = modalCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setModalCategory(cat);
                        setModalVisibleCount(MODAL_PAGE_SIZE);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-stone-900 text-white'
                          : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daftar Produk Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {visibleModalProducts.length === 0 ? (
                <div className="text-center py-12 text-sm text-stone-500">
                  Tidak ada produk yang cocok dengan pencarian "{modalSearch}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleModalProducts.map((item) => {
                    const isCurrent = item.id === activeProduct.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition ${
                          isCurrent
                            ? 'border-stone-900 bg-stone-50/60 ring-1 ring-stone-900'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-stone-100">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-stone-900/80 text-white text-[10px] font-semibold">
                              {item.category}
                            </span>
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-400 text-stone-950 text-[10px] font-bold">
                              {item.discount_tag}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[11px] text-stone-500">
                              <span className="font-semibold text-amber-700">
                                Rating {item.rating}/5.0
                              </span>
                              <span>{item.sales_count.toLocaleString('id-ID')} terjual</span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-1 line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                              {item.headline}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-100 space-y-2">
                          <div className="text-sm font-extrabold text-stone-900">
                            {item.price_promo}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => startConsultationForProduct(item)}
                              className="py-1.5 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition cursor-pointer"
                            >
                              Tanya Rian
                            </button>
                            <a
                              href={item.affiliate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold text-center transition"
                            >
                              Pesan
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tombol Load More jika produk lebih banyak dari batas halaman */}
              {visibleModalProducts.length < filteredModalProducts.length && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setModalVisibleCount((prev) => prev + MODAL_PAGE_SIZE)
                    }
                    className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Tampilkan Lebih Banyak ({filteredModalProducts.length - visibleModalProducts.length} produk lagi)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
