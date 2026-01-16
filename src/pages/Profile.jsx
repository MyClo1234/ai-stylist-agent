import React, { useState, useEffect } from 'react';
import { Settings, LogOut, User, Ruler, Filter, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const categories = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Shoes', 'Accessories'];

const categoryMap = {
    'outer': 'Outerwear',
    'top': 'Tops',
    'bottom': 'Bottoms',
    'shoes': 'Shoes',
    'bag': 'Accessories',
    'accessory': 'Accessories'
};

const Profile = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';

    // Wardrobe state
    const [activeCategory, setActiveCategory] = useState('All');
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarOutfits, setCalendarOutfits] = useState({});
    const [wornOutfits, setWornOutfits] = useState({});

    useEffect(() => {
        if (activeTab === 'wardrobe') {
            fetchWardrobeItems();
        } else if (activeTab === 'calendar') {
            loadCalendarData();
        }
    }, [activeTab]);

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    // Wardrobe functions
    const fetchWardrobeItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/wardrobe/items`);
            if (!response.ok) {
                throw new Error('Failed to fetch wardrobe items');
            }
            const data = await response.json();
            if (data.success) {
                setItems(data.items || []);
            }
        } catch (err) {
            console.error('Error fetching wardrobe items:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryName = (mainCategory) => {
        return categoryMap[mainCategory?.toLowerCase()] || 'Other';
    };

    const filteredItems = activeCategory === 'All' 
        ? items 
        : items.filter(item => {
            const itemCategory = getCategoryName(item.attributes?.category?.main);
            return itemCategory === activeCategory;
          });

    // Calendar functions
    const loadCalendarData = () => {
        const saved = JSON.parse(localStorage.getItem('calendarOutfits') || '{}');
        const worn = JSON.parse(localStorage.getItem('wornOutfits') || '{}');
        setCalendarOutfits(saved);
        setWornOutfits(worn);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        return { daysInMonth, startingDayOfWeek };
    };

    const formatDateKey = (year, month, day) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getOutfitForDay = (day) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dateKey = formatDateKey(year, month, day);
        return calendarOutfits[dateKey] || null;
    };

    const isWornToday = (day) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dateKey = formatDateKey(year, month, day);
        return !!wornOutfits[dateKey];
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    // Get upcoming outfits (next 7 days)
    const upcomingOutfits = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const outfit = calendarOutfits[dateKey];
        if (outfit) {
            upcomingOutfits.push({
                date: date,
                dateKey: dateKey,
                outfit: outfit
            });
        }
    }

    const tabs = [
        { id: 'profile', label: 'Body Profile' },
        { id: 'wardrobe', label: 'Wardrobe' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'settings', label: 'Settings' }
    ];

    return (
        <div className="pb-6 pt-20 px-6 min-h-screen">
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex-center text-black font-bold text-2xl">
                    S
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Seonghyeon Choe</h2>
                    <p className="text-sm text-muted-foreground">Premium Member</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                            activeTab === tab.id
                                ? 'bg-primary text-black shadow-lg shadow-primary/20 font-semibold'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <section className="mb-8">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-4 tracking-wider">Body Profile</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-panel p-4 rounded-xl">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-muted-foreground text-sm">Height</span>
                                        <Ruler size={16} className="text-primary" />
                                    </div>
                                    <span className="text-2xl font-bold">182 <span className="text-sm font-normal text-muted-foreground">cm</span></span>
                                </div>
                                <div className="glass-panel p-4 rounded-xl">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-muted-foreground text-sm">Weight</span>
                                        <User size={16} className="text-accent" />
                                    </div>
                                    <span className="text-2xl font-bold">75 <span className="text-sm font-normal text-muted-foreground">kg</span></span>
                                </div>
                            </div>
                            <button className="w-full mt-4 py-3 rounded-xl bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors">
                                Edit Body Profile
                            </button>
                        </section>
                    </motion.div>
                )}

                {activeTab === 'wardrobe' && (
                    <motion.div
                        key="wardrobe"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative"
                    >
                        {/* Filters */}
                        <div className="relative mb-6 -mx-6">
                            <div className="flex overflow-x-auto gap-3 pb-3 scrollbar-hide pl-6" style={{ paddingRight: '5rem' }}>
                                <button
                                    className="p-2 bg-white/5 rounded-full border border-white/10 flex-shrink-0 hover:bg-white/10 transition-colors"
                                >
                                    <Filter size={20} />
                                </button>
                                {categories.map((cat) => {
                                    const isActive = activeCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                                isActive
                                                    ? 'bg-primary text-black shadow-lg shadow-primary/20 font-semibold border border-primary'
                                                    : 'bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30'
                                            }`}
                                            style={{
                                                color: isActive ? '#000000' : '#fafafa',
                                                WebkitFontSmoothing: 'antialiased',
                                                MozOsxFontSmoothing: 'grayscale',
                                                textRendering: 'optimizeLegibility'
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                                <div className="flex-shrink-0 w-4"></div>
                            </div>
                        </div>

                        {/* Content */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="text-primary animate-spin" size={32} />
                                    <p className="text-sm text-muted-foreground">옷장을 불러오는 중...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <p className="text-sm text-red-400 mb-3">{error}</p>
                                    <button
                                        onClick={fetchWardrobeItems}
                                        className="text-xs text-primary hover:opacity-80"
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {activeCategory === 'All' 
                                            ? '옷장이 비어있습니다' 
                                            : `${activeCategory} 카테고리에 아이템이 없습니다`}
                                    </p>
                                    <button
                                        onClick={() => navigate('/wardrobe/new')}
                                        className="text-xs text-primary hover:opacity-80"
                                    >
                                        아이템 추가하기
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredItems.map((item, index) => {
                                    const itemName = item.attributes?.category?.sub || item.attributes?.category?.main || 'Unknown';
                                    const itemColor = item.attributes?.color?.primary || 'unknown';
                                    const imageUrl = item.image_url 
                                        ? `${API_BASE_URL}${item.image_url}` 
                                        : null;

                                    return (
                                        <Link to={`/wardrobe/${item.id}`} key={item.id}>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-white/5"
                                            >
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={itemName}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div 
                                                    className={`w-full h-full ${imageUrl ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20`}
                                                >
                                                    <span className="text-4xl">👔</span>
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                    <div className="w-full">
                                                        <p className="text-sm font-medium truncate">{itemName}</p>
                                                        <p className="text-xs text-gray-300 truncate">{itemColor}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* Floating Action Button */}
                        <button
                            onClick={() => navigate('/wardrobe/new')}
                            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#09090b]"
                            aria-label="Add new item to wardrobe"
                        >
                            <Plus size={24} strokeWidth={2.5} />
                        </button>
                    </motion.div>
                )}

                {activeTab === 'calendar' && (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-bold">{monthName}</h1>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => navigateMonth(-1)}
                                    className="icon-btn bg-white/5 border border-white/10 w-11 h-11 hover:bg-white/10"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button 
                                    onClick={() => navigateMonth(1)}
                                    className="icon-btn bg-white/5 border border-white/10 w-11 h-11 hover:bg-white/10"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 text-center mb-3">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <span key={d} className="text-sm text-muted-foreground font-medium">{d}</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {/* Empty cells for days before month starts */}
                            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-[4/5]"></div>
                            ))}
                            
                            {/* Days of the month */}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const outfit = getOutfitForDay(day);
                                const worn = isWornToday(day);
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth();
                                const dateKey = formatDateKey(year, month, day);
                                const isToday = dateKey === new Date().toISOString().split('T')[0];
                                
                                const topImage = outfit?.top?.image_url 
                                    ? `${API_BASE_URL}${outfit.top.image_url}` 
                                    : null;
                                const bottomImage = outfit?.bottom?.image_url 
                                    ? `${API_BASE_URL}${outfit.bottom.image_url}` 
                                    : null;

                                return (
                                    <motion.div
                                        key={day}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: day * 0.01 }}
                                        className={`aspect-[4/5] relative bg-white/5 rounded-lg overflow-hidden flex items-start justify-center pt-1.5 group border ${
                                            isToday ? 'border-primary' : 'border-transparent'
                                        }`}
                                        onClick={() => {
                                            if (outfit) {
                                                navigate(`/outfits/${outfit.id}`);
                                            }
                                        }}
                                    >
                                        <span className={`text-xs z-10 ${outfit ? 'text-white drop-shadow-md font-semibold' : 'text-muted-foreground'} ${isToday ? 'text-primary' : ''}`}>
                                            {day}
                                        </span>
                                        {outfit && (
                                            <div className="absolute inset-0">
                                                {topImage || bottomImage ? (
                                                    <div className="w-full h-full relative">
                                                        {topImage && (
                                                            <div className="absolute top-0 left-0 w-full h-1/2">
                                                                <img 
                                                                    src={topImage} 
                                                                    alt="Top" 
                                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                            </div>
                                                        )}
                                                        {bottomImage && (
                                                            <div className="absolute bottom-0 left-0 w-full h-1/2">
                                                                <img 
                                                                    src={bottomImage} 
                                                                    alt="Bottom" 
                                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                                )}
                                                {worn && (
                                                    <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                )}
                                            </div>
                                        )}
                                        {!outfit && (
                                            <button className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-white/5">
                                                <span className="text-2xl">+</span>
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {upcomingOutfits.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-semibold mb-4">Upcoming Plans</h2>
                                {upcomingOutfits.map(({ date, outfit }) => {
                                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    const topImage = outfit.top?.image_url 
                                        ? `${API_BASE_URL}${outfit.top.image_url}` 
                                        : null;
                                    
                                    return (
                                        <motion.div
                                            key={date.toISOString()}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass-panel p-4 rounded-xl flex items-center gap-4 mb-3 cursor-pointer hover:bg-white/5 transition-colors"
                                            onClick={() => navigate(`/outfits/${outfit.id}`)}
                                        >
                                            <div className="bg-primary/20 w-12 h-12 rounded-lg flex-center text-primary font-bold text-base flex-shrink-0">
                                                {date.getDate()}
                                            </div>
                                            {topImage && (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img 
                                                        src={topImage} 
                                                        alt="Outfit" 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-base truncate">
                                                    {outfit.styleDescription || `${outfit.top?.attributes?.category?.sub || 'Top'} & ${outfit.bottom?.attributes?.category?.sub || 'Bottom'}`}
                                                </p>
                                                <p className="text-sm text-muted-foreground">Planned: {dateStr}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <section>
                            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-4 tracking-wider">Settings</h3>
                            <div className="space-y-3">
                                <button className="w-full text-left p-4 glass-panel rounded-xl flex items-center justify-between group">
                                    <span className="flex items-center gap-3 text-base">
                                        <Settings size={18} /> Preferences
                                    </span>
                                </button>
                                <button className="w-full text-left p-4 glass-panel rounded-xl flex items-center justify-between group text-red-400 border border-red-500/20">
                                    <span className="flex items-center gap-3 text-base">
                                        <LogOut size={18} /> Sign Out
                                    </span>
                                </button>
                            </div>
                        </section>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
