import React from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Calendar as CalendarIcon, RefreshCw, ChevronRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="pb-8 pt-8 px-6 min-h-screen">
            <header className="mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold mb-1"
                >
                    Good Morning, <br />
                    <span className="text-primary">Seonghyeon.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-text-muted"
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
                <div className="glass-panel p-4 rounded-3xl flex flex-col justify-between h-32">
                    <CloudRain className="text-blue-400" size={28} />
                    <div>
                        <span className="text-2xl font-bold">18°C</span>
                        <p className="text-xs text-text-muted">Rainy intervals</p>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-3xl flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent/20 blur-2xl rounded-full"></div>
                    <CalendarIcon className="text-accent" size={28} />
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
                    <button className="text-xs text-primary flex items-center gap-1">
                        Customize <ChevronRight size={14} />
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative aspect-[3/4] rounded-[32px] overflow-hidden group shadow-2xl shadow-primary/5"
                >
                    <img
                        src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=60"
                        alt="Outfit"
                        className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                        <div className="glass p-4 rounded-2xl backdrop-blur-md border-white/10">
                            <h3 className="font-semibold text-lg">Smart Casual Rain</h3>
                            <p className="text-sm text-gray-300 mb-3">Trench Coat &bull; Navy Chinos</p>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-white text-black py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors">
                                    Wear This
                                </button>
                                <button className="w-12 h-10 flex items-center justify-center bg-white/10 rounded-xl backdrop-blur-md">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default Home;
