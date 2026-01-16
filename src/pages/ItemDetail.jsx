import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Tag, Calendar as CalendarIcon, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock Data - In a real app, fetch based on ID
    const item = {
        id: id,
        name: 'Classic Camel Coat',
        brand: 'Burberry',
        category: 'Outerwear',
        color: 'Camel',
        price: '£1,890',
        purchaseDate: '2023-10-15',
        img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
        wearCount: 12,
        lastWorn: '2 days ago',
        tags: ['Winter', 'Formal', 'Work', 'Date Night']
    };

    const similarItems = [
        { id: 101, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300', name: 'Beige Knit' },
        { id: 102, img: 'https://images.unsplash.com/photo-1551028919-ac6635f0e5b9?w=300', name: 'Leather Boots' }
    ];

    return (
        <div className="min-h-screen pb-6 pt-20 relative">
            {/* Header Image Area */}
            <div className="w-full h-[50vh] relative">
                <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#09090b]"></div>

                {/* Navbar style Header for this page */}
                <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 glass rounded-full flex-center text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        <button 
                            className="w-10 h-10 glass rounded-full flex-center text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
                            aria-label="Share item"
                        >
                            <Share2 size={20} />
                        </button>
                        <button 
                            className="w-10 h-10 glass rounded-full flex-center text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
                            aria-label="Add to favorites"
                        >
                            <Heart size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Sheet */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="px-6 -mt-12 relative z-10"
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-sm font-medium text-primary mb-1">{item.brand}</h2>
                        <h1 className="text-3xl font-bold">{item.name}</h1>
                    </div>
                    <button className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                        <Edit2 size={18} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg text-primary">
                            <Tag size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Worn</p>
                            <p className="font-bold text-lg">{item.wearCount} times</p>
                        </div>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg text-accent">
                            <CalendarIcon size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Last worn</p>
                            <p className="font-bold text-lg">{item.lastWorn}</p>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <section className="space-y-6 mb-8">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3 tracking-wider">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {item.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3 tracking-wider">Details</h3>
                        <div className="glass-panel rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-muted-foreground">Category</span>
                                <span className="font-medium">{item.category}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-muted-foreground">Color</span>
                                <span className="font-medium">{item.color}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-medium">{item.price}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3 tracking-wider">Pairs Well With</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {similarItems.map(sim => (
                                <div key={sim.id} className="space-y-2">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-white/5">
                                        <img src={sim.img} alt={sim.name} className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-sm font-medium">{sim.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </motion.div>
        </div>
    );
};

export default ItemDetail;
