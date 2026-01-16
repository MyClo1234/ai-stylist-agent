import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Calendar as CalendarIcon, RefreshCw, ChevronRight, Plus, Loader2, Send, Mic, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Home = () => {
    const navigate = useNavigate();
    const [outfit, setOutfit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Chat state
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Where are we going today? I can help you find the perfect look.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [savedOutfits, setSavedOutfits] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchRecommendedOutfit = async (forceRefresh = false) => {
        // Load from localStorage if not forcing refresh
        if (!forceRefresh) {
            const savedOutfit = localStorage.getItem('recommendedOutfit');
            const savedTimestamp = localStorage.getItem('recommendedOutfitTimestamp');
            
            // If saved outfit exists and is less than 24 hours old, use it
            if (savedOutfit && savedTimestamp) {
                const timestamp = parseInt(savedTimestamp, 10);
                const now = Date.now();
                const hoursSinceSaved = (now - timestamp) / (1000 * 60 * 60);
                
                if (hoursSinceSaved < 24) {
                    try {
                        const parsedOutfit = JSON.parse(savedOutfit);
                        setOutfit(parsedOutfit);
                        setIsLoading(false);
                        return;
                    } catch (e) {
                        console.error('Error parsing saved outfit:', e);
                    }
                }
            }
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/recommend/outfit?count=1&use_gemini=true`);
            if (!response.ok) {
                throw new Error('Failed to fetch outfit recommendation');
            }
            const data = await response.json();
            if (data.success && data.outfits && data.outfits.length > 0) {
                const newOutfit = data.outfits[0];
                setOutfit(newOutfit);
                
                // Save to localStorage
                localStorage.setItem('recommendedOutfit', JSON.stringify(newOutfit));
                localStorage.setItem('recommendedOutfitTimestamp', Date.now().toString());
            } else {
                setOutfit(null);
            }
        } catch (err) {
            console.error('Error fetching outfit:', err);
            setError(err.message);
            setOutfit(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendedOutfit(false);
        loadSavedOutfits();
    }, []);

    const loadSavedOutfits = () => {
        const calendarOutfits = JSON.parse(localStorage.getItem('calendarOutfits') || '{}');
        const outfits = Object.entries(calendarOutfits)
            .map(([date, outfit]) => ({
                date: date,
                dateObj: new Date(date),
                ...outfit
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first
        
        setSavedOutfits(outfits);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMsg = { id: Date.now(), type: 'user', text: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);

        // Mock LLM Response
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                text: "I've curated 3 outfits for your date night. Based on your preferences, I focused on a sleek, dark aesthetic.",
                hasRecommendations: true
            }]);
        }, 1500);
    };

    const deleteOutfit = (dateKey) => {
        const calendarOutfits = JSON.parse(localStorage.getItem('calendarOutfits') || '{}');
        delete calendarOutfits[dateKey];
        localStorage.setItem('calendarOutfits', JSON.stringify(calendarOutfits));
        loadSavedOutfits();
    };

    return (
        <div className="pb-6 pt-20 px-6 min-h-screen relative">
            <header className="mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold mb-2"
                >
                    Good Morning, <br />
                    <span className="text-primary">Seonghyeon.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-text-muted text-base"
                >
                    Ready to conquer the rain today?
                </motion.p>
            </header>

            {/* Weather & Schedule Summary */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-4 mb-8"
            >
                <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-28">
                    <CloudRain className="text-blue-400" size={24} />
                    <div>
                        <span className="text-2xl font-bold">18°C</span>
                        <p className="text-xs text-text-muted">Rainy intervals</p>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-accent/20 blur-2xl rounded-full"></div>
                    <CalendarIcon className="text-accent" size={24} />
                    <div>
                        <span className="text-lg font-bold">3 Events</span>
                        <p className="text-xs text-text-muted">First: 10:00 AM</p>
                    </div>
                </div>
            </motion.div>

            {/* Today's Outfit Pick */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-semibold">Today's Pick</h2>
                    <button 
                        onClick={() => fetchRecommendedOutfit(true)}
                        className="text-xs text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                        Refresh <ChevronRight size={14} />
                    </button>
                </div>

                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="text-primary animate-spin" size={32} />
                            <p className="text-sm text-text-muted">코디 추천 중...</p>
                        </div>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center p-6"
                    >
                        <div className="text-center">
                            <p className="text-sm text-red-400 mb-3">{error}</p>
                            <button
                                onClick={() => fetchRecommendedOutfit(true)}
                                className="text-xs text-primary hover:opacity-80 transition-opacity"
                            >
                                다시 시도
                            </button>
                        </div>
                    </motion.div>
                ) : outfit ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-2xl shadow-primary/5"
                    >
                        {/* Display actual images if available */}
                        {outfit.top.image_url || outfit.bottom.image_url ? (
                            <div className="w-full h-full relative">
                                {/* Top image (upper half) */}
                                {outfit.top.image_url ? (
                                    <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden">
                                        <img
                                            src={`${API_BASE_URL}${outfit.top.image_url}`}
                                            alt="Top"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 flex items-center justify-center">
                                        <span className="text-2xl">👔</span>
                                    </div>
                                )}
                                
                                {/* Bottom image (lower half) */}
                                {outfit.bottom.image_url ? (
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 overflow-hidden">
                                        <img
                                            src={`${API_BASE_URL}${outfit.bottom.image_url}`}
                                            alt="Bottom"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/5 flex items-center justify-center">
                                        <span className="text-2xl">👖</span>
                                    </div>
                                )}
                                
                                {/* Divider line */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20"></div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <div className="text-center p-6">
                                    <div className="text-4xl mb-2">👔</div>
                                    <p className="text-sm text-white/60">코디 미리보기</p>
                                </div>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                            <div className="glass p-4 rounded-xl backdrop-blur-md border-white/10">
                                <h3 className="font-semibold text-lg mb-1">
                                    {outfit.style_description || `${outfit.top.attributes?.category?.sub || 'Top'} & ${outfit.bottom.attributes?.category?.sub || 'Bottom'}`}
                                </h3>
                                <p className="text-sm text-gray-300 mb-2">
                                    {outfit.top.attributes?.color?.primary || 'Unknown'} &bull; {outfit.bottom.attributes?.color?.primary || 'Unknown'}
                                </p>
                                {outfit.reasoning && (
                                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                        {outfit.reasoning}
                                    </p>
                                )}
                                {outfit.reasons && outfit.reasons.length > 0 && !outfit.reasoning && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {outfit.reasons.map((reason, idx) => (
                                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-primary/20 rounded-full text-primary">
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-gray-400">추천 점수</span>
                                    <span className="text-sm font-bold text-primary">
                                        {Math.round(outfit.score * 100)}%
                                    </span>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => navigate(`/outfits/${outfit.top.id}-${outfit.bottom.id}`)}
                                        className="flex-1 bg-white text-black py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 active:scale-95 transition-all shadow-lg"
                                    >
                                        Wear This
                                    </button>
                                    <button 
                                        onClick={() => fetchRecommendedOutfit(true)}
                                        className="w-12 h-11 flex items-center justify-center bg-white/10 rounded-lg backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all border border-white/10"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center p-6"
                    >
                        <div className="text-center">
                            <p className="text-sm text-text-muted mb-3">옷장에 아이템이 부족합니다</p>
                            <button
                                onClick={() => navigate('/wardrobe/new')}
                                className="text-xs text-primary hover:opacity-80 transition-opacity"
                            >
                                아이템 추가하기
                            </button>
                        </div>
                    </motion.div>
                )}
            </section>

            {/* Chat Interface */}
            <section className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Chat with AI</h2>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-xs text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                        {showHistory ? 'Chat' : `History (${savedOutfits.length})`}
                        <ChevronRight size={14} />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {showHistory ? (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-panel rounded-2xl p-4 max-h-[500px] overflow-y-auto custom-scrollbar"
                        >
                            {savedOutfits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <CalendarIcon size={48} className="text-muted-foreground mb-4" />
                                    <p className="text-sm text-muted-foreground mb-2">저장된 코디가 없습니다</p>
                                    <p className="text-xs text-muted-foreground">코디를 저장해보세요</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {savedOutfits.map((outfit, index) => {
                                        const topImage = outfit.top?.image_url 
                                            ? `${API_BASE_URL}${outfit.top.image_url}` 
                                            : null;
                                        const bottomImage = outfit.bottom?.image_url 
                                            ? `${API_BASE_URL}${outfit.bottom.image_url}` 
                                            : null;
                                        const dateStr = outfit.dateObj.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        });

                                        return (
                                            <motion.div
                                                key={outfit.date}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="glass-panel p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Images */}
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        {topImage ? (
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden">
                                                                <img 
                                                                    src={topImage} 
                                                                    alt="Top" 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                                                <span className="text-2xl">👔</span>
                                                            </div>
                                                        )}
                                                        {bottomImage ? (
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden">
                                                                <img 
                                                                    src={bottomImage} 
                                                                    alt="Bottom" 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                                                <span className="text-2xl">👖</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <h3 className="font-semibold text-base mb-1 truncate">
                                                                    {outfit.styleDescription || 
                                                                        `${outfit.top?.attributes?.category?.sub || 'Top'} & ${outfit.bottom?.attributes?.category?.sub || 'Bottom'}`}
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <CalendarIcon size={12} />
                                                                    {dateStr}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteOutfit(outfit.date);
                                                                }}
                                                                className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs px-2 py-0.5 bg-primary/20 rounded-full text-primary">
                                                                {outfit.score || 85}% Match
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {outfit.top?.attributes?.color?.primary || 'Unknown'} & {outfit.bottom?.attributes?.color?.primary || 'Unknown'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/outfits/${outfit.id}`)}
                                                            className="text-xs text-primary hover:opacity-80 transition-opacity"
                                                        >
                                                            자세히 보기 →
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-panel rounded-2xl p-4 flex flex-col"
                            style={{ maxHeight: '500px' }}
                        >
                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto space-y-3 pb-4 custom-scrollbar min-h-[300px]">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-3 rounded-xl ${msg.type === 'user'
                                            ? 'bg-primary text-black rounded-tr-sm'
                                            : 'glass border-white/5 rounded-tl-sm'
                                            }`}>
                                            <p className="text-xs leading-relaxed">{msg.text}</p>

                                            {/* Mock Recommendations */}
                                            {msg.hasRecommendations && (
                                                <div className="mt-3 space-y-2">
                                                    <Link to="/outfits/1" className="bg-black/30 p-2 rounded-lg flex gap-2.5 items-center hover:bg-black/50 transition-colors">
                                                        <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img src="https://images.unsplash.com/photo-1594938298603-c8148c47e356?w=200" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-xs">All Black Chic</p>
                                                            <p className="text-[10px] text-muted-foreground">Match: 98%</p>
                                                        </div>
                                                    </Link>
                                                    <Link to="/outfits/2" className="bg-black/30 p-2 rounded-lg flex gap-2.5 items-center hover:bg-black/50 transition-colors">
                                                        <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-xs">Textured Layers</p>
                                                            <p className="text-[10px] text-muted-foreground">Match: 85%</p>
                                                        </div>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                        <div className="glass px-3 py-2.5 rounded-xl rounded-tl-sm">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75"></span>
                                                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150"></span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="pt-3 border-t border-white/10">
                                <div className="glass p-1 pl-3 rounded-full flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask for an outfit..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm h-11 placeholder:text-white/30"
                                    />
                                    <button className="w-11 h-11 flex-center text-white/50 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                        <Mic size={20} />
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        className="w-11 h-11 rounded-full bg-primary text-black flex-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Floating Action Button - Center */}
            <button
                onClick={() => navigate('/wardrobe/new')}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#09090b]"
                aria-label="Add new item to wardrobe"
            >
                <Plus size={24} strokeWidth={2.5} />
            </button>
        </div>
    );
};

export default Home;
