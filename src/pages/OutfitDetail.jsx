import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Calendar as CalendarIcon, Check, Layers, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OutfitDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wornToday, setWornToday] = useState(false);
    const [outfit, setOutfit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOutfitData();
        checkWornToday();
    }, [id]);

    const fetchOutfitData = async () => {
        if (!id) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Parse ID: "topId-bottomId"
            const [topId, bottomId] = id.split('-');
            
            if (!topId || !bottomId) {
                throw new Error('Invalid outfit ID format');
            }

            // Fetch both items
            const [topResponse, bottomResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/wardrobe/items`),
                fetch(`${API_BASE_URL}/api/wardrobe/items`)
            ]);

            if (!topResponse.ok || !bottomResponse.ok) {
                throw new Error('Failed to fetch wardrobe items');
            }

            const [topData, bottomData] = await Promise.all([
                topResponse.json(),
                bottomResponse.json()
            ]);

            const topItem = topData.items?.find(item => item.id === topId);
            const bottomItem = bottomData.items?.find(item => item.id === bottomId);

            if (!topItem || !bottomItem) {
                throw new Error('Outfit items not found');
            }

            // Get outfit recommendation score using dedicated endpoint
            let score = 85; // Default score
            let reasoning = '';
            let styleDescription = '';
            let reasons = [];

            try {
                const scoreResponse = await fetch(
                    `${API_BASE_URL}/api/outfit/score?top_id=${topId}&bottom_id=${bottomId}`
                );
                if (scoreResponse.ok) {
                    const scoreData = await scoreResponse.json();
                    if (scoreData.success) {
                        score = scoreData.score_percent || Math.round(scoreData.score * 100);
                        reasons = scoreData.reasons || [];
                        reasoning = reasons.join(', ') || '';
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch outfit score:', err);
            }

            // Try to get style description from recommendation if available
            try {
                const recommendResponse = await fetch(
                    `${API_BASE_URL}/api/recommend/outfit?count=5&use_gemini=true`
                );
                if (recommendResponse.ok) {
                    const recommendData = await recommendResponse.json();
                    if (recommendData.outfits && recommendData.outfits.length > 0) {
                        const recommended = recommendData.outfits.find(
                            o => o.top.id === topId && o.bottom.id === bottomId
                        );
                        if (recommended) {
                            styleDescription = recommended.style_description || '';
                            if (recommended.reasoning && !reasoning) {
                                reasoning = recommended.reasoning;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch style description:', err);
            }

            setOutfit({
                id: id,
                top: topItem,
                bottom: bottomItem,
                score: score,
                reasoning: reasoning,
                styleDescription: styleDescription,
                reasons: reasons,
                items: [
                    {
                        id: topItem.id,
                        name: topItem.attributes?.category?.sub || 'Top',
                        category: topItem.attributes?.category?.main || 'top',
                        color: topItem.attributes?.color?.primary || 'unknown',
                        image_url: topItem.image_url,
                        attributes: topItem.attributes
                    },
                    {
                        id: bottomItem.id,
                        name: bottomItem.attributes?.category?.sub || 'Bottom',
                        category: bottomItem.attributes?.category?.main || 'bottom',
                        color: bottomItem.attributes?.color?.primary || 'unknown',
                        image_url: bottomItem.image_url,
                        attributes: bottomItem.attributes
                    }
                ]
            });
        } catch (err) {
            console.error('Error fetching outfit data:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkWornToday = () => {
        const today = new Date().toISOString().split('T')[0];
        const wornOutfits = JSON.parse(localStorage.getItem('wornOutfits') || '{}');
        setWornToday(wornOutfits[today] === id);
    };

    const handleWornToday = () => {
        const newWornToday = !wornToday;
        setWornToday(newWornToday);
        
        const today = new Date().toISOString().split('T')[0];
        const wornOutfits = JSON.parse(localStorage.getItem('wornOutfits') || '{}');
        
        if (newWornToday) {
            wornOutfits[today] = id;
        } else {
            delete wornOutfits[today];
        }
        
        localStorage.setItem('wornOutfits', JSON.stringify(wornOutfits));
    };

    const handleSaveToCalendar = () => {
        const today = new Date().toISOString().split('T')[0];
        const calendarOutfits = JSON.parse(localStorage.getItem('calendarOutfits') || '{}');
        
        calendarOutfits[today] = {
            id: id,
            top: outfit.top,
            bottom: outfit.bottom,
            score: outfit.score,
            styleDescription: outfit.styleDescription,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('calendarOutfits', JSON.stringify(calendarOutfits));
        
        // Show success feedback
        alert('캘린더에 저장되었습니다!');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pb-6 pt-20 relative bg-[#09090b] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="text-primary animate-spin" size={32} />
                    <p className="text-sm text-muted-foreground">코디 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error || !outfit) {
        return (
            <div className="min-h-screen pb-6 pt-20 relative bg-[#09090b] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm text-red-400 mb-3">{error || '코디를 찾을 수 없습니다'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-xs text-primary hover:opacity-80"
                    >
                        돌아가기
                    </button>
                </div>
            </div>
        );
    }

    // Get main image (prefer top, fallback to bottom)
    const mainImage = outfit.top.image_url 
        ? `${API_BASE_URL}${outfit.top.image_url}`
        : outfit.bottom.image_url
        ? `${API_BASE_URL}${outfit.bottom.image_url}`
        : null;

    const outfitName = outfit.styleDescription || 
        `${outfit.top.attributes?.category?.sub || 'Top'} & ${outfit.bottom.attributes?.category?.sub || 'Bottom'}`;

    return (
        <div className="min-h-screen pb-6 pt-20 relative bg-[#09090b]">
            {/* Full Screen Image Backdrop */}
            <div className="fixed top-0 left-0 right-0 h-[60vh] z-0">
                {mainImage ? (
                    <img
                        src={mainImage}
                        alt={outfitName}
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#09090b]"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 pt-12 flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 glass rounded-full flex-center text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="glass px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary border-primary/20" aria-label={`Match score: ${outfit.score} percent`}>
                    {outfit.score}% Match
                </div>
                <button 
                    className="w-10 h-10 glass rounded-full flex-center text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
                    aria-label="Share outfit"
                >
                    <Share2 size={20} />
                </button>
            </div>

            {/* Content Card */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 mt-[35vh] bg-[#09090b] rounded-t-[32px] px-6 pt-8 min-h-[50vh] border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
                {/* Drag Handle Indicator */}
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6"></div>

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-sm font-medium text-muted-foreground mb-1">Today's Pick</h2>
                        <h1 className="text-3xl font-bold">{outfitName}</h1>
                    </div>
                    <button
                        onClick={handleWornToday}
                        className={`p-3 rounded-full transition-all ${wornToday ? 'bg-green-500 text-black' : 'bg-white/10 text-white'
                            }`}
                    >
                        {wornToday ? <Check size={24} /> : <CalendarIcon size={24} />}
                    </button>
                </div>

                {outfit.reasoning && (
                    <p className="text-text-muted mb-8 leading-relaxed">
                        {outfit.reasoning}
                    </p>
                )}

                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Layers size={18} className="text-primary" />
                            Constituent Items
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {outfit.items.map((item) => {
                            const imageUrl = item.image_url ? `${API_BASE_URL}${item.image_url}` : null;
                            return (
                                <div key={item.id} className="flex items-center gap-4 group">
                                    <Link to={`/wardrobe/${item.id}`} className="block w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-white/20 transition-colors">
                                        {imageUrl ? (
                                            <img 
                                                src={imageUrl} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-full h-full ${imageUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20`}>
                                            <span className="text-2xl">👔</span>
                                        </div>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {item.color} • {item.attributes?.category?.main}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <button 
                    onClick={handleSaveToCalendar}
                    className="w-full py-4 bg-primary text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/10"
                >
                    Save to Calendar
                </button>
            </motion.div>
        </div>
    );
};

export default OutfitDetail;
