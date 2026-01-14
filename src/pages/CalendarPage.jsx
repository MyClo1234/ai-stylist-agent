import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarPage = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);

    // Mock data
    const outfits = {
        5: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200',
        12: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
        15: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
        24: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200',
    };

    return (
        <div className="pb-8 pt-8 px-6 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">October</h1>
                <div className="flex gap-2">
                    <button className="icon-btn bg-white/5"><ChevronLeft /></button>
                    <button className="icon-btn bg-white/5"><ChevronRight /></button>
                </div>
            </header>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <span key={d} className="text-xs text-muted-foreground font-medium">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map(d => (
                    <div key={d} className="aspect-[4/5] relative bg-white/5 rounded-lg overflow-hidden flex items-start justify-center pt-1 group">
                        <span className={`text-xs z-10 ${outfits[d] ? 'text-white drop-shadow-md' : 'text-muted-foreground'}`}>{d}</span>
                        {outfits[d] && (
                            <div className="absolute inset-0">
                                <img src={outfits[d]} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                        {!outfits[d] && (
                            <button className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/5">
                                <span className="text-xl">+</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Upcoming Plans</h2>
                <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 mb-3">
                    <div className="bg-primary/20 w-12 h-12 rounded-xl flex-center text-primary font-bold">
                        28
                    </div>
                    <div>
                        <p className="font-medium">Gallery Opening</p>
                        <p className="text-sm text-muted-foreground">Planned: Navy Suit</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
