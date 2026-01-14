import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Shoes', 'Accessories'];

const dummyItems = [
    { id: 1, img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', name: 'Camel Coat', category: 'Outerwear' },
    { id: 2, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', name: 'White Tee', category: 'Tops' },
    { id: 3, img: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=400', name: 'Blue Jeans', category: 'Bottoms' },
    { id: 4, img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', name: 'White Hoodie', category: 'Tops' },
    { id: 5, img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', name: 'Chelsea Boots', category: 'Shoes' },
    { id: 6, img: 'https://images.unsplash.com/photo-1551028919-ac6635f0e5b9?w=400', name: 'Leather Jacket', category: 'Outerwear' },
];

const Wardrobe = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    return (
        <div className="pb-8 pt-8 px-6 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Wardrobe</h1>
                <Link to="/wardrobe/new" className="icon-btn bg-white/10 hover:bg-white/20">
                    <Plus size={24} />
                </Link>
            </div>

            {/* Filters */}
            <div className="flex overflow-x-auto gap-3 pb-4 mb-4 scrollbar-hide -mx-6 px-6">
                <button
                    className="p-2 bg-white/5 rounded-full border border-white/10 flex-shrink-0"
                >
                    <Filter size={18} />
                </button>
                {categories.map((cat, i) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                            ? 'bg-primary text-black'
                            : 'bg-white/5 border border-white/10 text-white'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
                {dummyItems.map((item, index) => (
                    <Link to={`/wardrobe/${item.id}`} key={item.id}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5"
                        >
                            <img
                                src={item.img}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-sm font-medium">{item.name}</span>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Wardrobe;
