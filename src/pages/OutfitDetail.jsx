import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Calendar as CalendarIcon, Check, Layers, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const OutfitDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wornToday, setWornToday] = useState(false);

    // Mock Data
    const outfit = {
        id: id,
        name: 'All Black Chic',
        occasion: 'Date Night',
        matchScore: 98,
        description: 'A sophisticated monochromatic look perfect for evening venues with dimmer lighting. The mix of textures keeps it interesting.',
        mainImage: 'https://images.unsplash.com/photo-1594938298603-c8148c47e356?w=800',
        items: [
            { id: 201, name: 'Wool Overcoat', brand: 'COS', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200' },
            { id: 202, name: 'Turtleneck Sweater', brand: 'Uniqlo U', img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200' },
            { id: 203, name: 'Pleated Trousers', brand: 'Lemaire', img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200' },
            { id: 204, name: 'Derby Shoes', brand: 'Common Projects', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200' },
        ],
        alternatives: [
            { id: 301, name: 'Substitute: Chelsea Boots', img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200' }
        ]
    };

    return (
        <div className="min-h-screen pb-8 relative bg-[#09090b]">
            {/* Full Screen Image Backdrop */}
            <div className="fixed top-0 left-0 right-0 h-[60vh] z-0">
                <img
                    src={outfit.mainImage}
                    alt={outfit.name}
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#09090b]"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-6 pt-12 flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 glass rounded-full flex-center text-white hover:bg-white/20 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="glass px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-primary border-primary/20">
                    {outfit.matchScore}% Match
                </div>
                <button className="w-10 h-10 glass rounded-full flex-center text-white hover:bg-white/20 transition-colors">
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
                        <h2 className="text-sm font-medium text-muted-foreground mb-1">{outfit.occasion}</h2>
                        <h1 className="text-3xl font-bold">{outfit.name}</h1>
                    </div>
                    <button
                        onClick={() => setWornToday(!wornToday)}
                        className={`p-3 rounded-full transition-all ${wornToday ? 'bg-green-500 text-black' : 'bg-white/10 text-white'
                            }`}
                    >
                        {wornToday ? <Check size={24} /> : <CalendarIcon size={24} />}
                    </button>
                </div>

                <p className="text-text-muted mb-8 leading-relaxed">
                    {outfit.description}
                </p>

                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Layers size={18} className="text-primary" />
                            Constituent Items
                        </h3>
                        <button className="text-xs text-primary">Shuffle</button>
                    </div>

                    <div className="space-y-4">
                        {outfit.items.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-4 group">
                                <Link to={`/wardrobe/${item.id}`} className="block w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-white/20 transition-colors">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground truncate">{item.brand}</p>
                                </div>
                                <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <button className="w-full py-4 bg-primary text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/10">
                    Save to Calendar
                </button>
            </motion.div>
        </div>
    );
};

export default OutfitDetail;
