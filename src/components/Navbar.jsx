import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
    const location = useLocation();
    
    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/profile', label: 'Profile' },
    ];

    return (
        <nav className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-5xl z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-white/5" aria-label="Main navigation">
            <div className="flex items-center justify-center px-8 h-20 safe-area-top">
                <div className="flex items-center gap-2" role="list">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || 
                                       (item.path === '/profile' && location.pathname.startsWith('/profile'));
                        
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`relative px-5 py-2.5 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#09090b] ${
                                    isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-white'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNavIndicator"
                                        className="absolute inset-0 bg-primary/10 rounded-lg"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        aria-hidden="true"
                                    />
                                )}
                                <span className="relative z-10 text-base">
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
