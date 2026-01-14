import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Shirt, Wand2, Calendar, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/wardrobe', icon: Shirt, label: 'Wardrobe' },
        { path: '/outfits', icon: Wand2, label: 'Outfits' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <>
            {/* Hamburger Trigger */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-6 right-6 z-50 p-2 glass rounded-full text-white hover:bg-white/10 transition-colors"
            >
                <Menu size={24} />
            </button>

            {/* Sidebar Overlay & Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Sidebar */}
                        <motion.nav
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-64 bg-[#09090b] z-50 border-l border-white/10 p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-2xl font-black tracking-tighter">MyClo.</h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-muted-foreground hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-primary text-black font-semibold shadow-lg shadow-primary/20'
                                                : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                            }`
                                        }
                                    >
                                        <item.icon size={20} />
                                        <span className="text-sm">{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>

                            <div className="mt-auto">
                                <div className="glass-panel p-4 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
                                    <p className="font-semibold text-sm">Seonghyeon</p>
                                </div>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
