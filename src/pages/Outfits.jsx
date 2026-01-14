import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Outfits = () => {
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Where are we going today? I can help you find the perfect look.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

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

    return (
        <div className="pb-8 pt-8 px-0 min-h-screen flex flex-col">
            <header className="px-6 mb-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    AI Stylist
                </h1>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.type === 'user'
                            ? 'bg-primary text-black rounded-tr-sm'
                            : 'glass border-white/5 rounded-tl-sm'
                            }`}>
                            <p className="text-sm">{msg.text}</p>

                            {/* Mock Recommendations */}
                            {msg.hasRecommendations && (
                                <div className="mt-4 space-y-3">
                                    <Link to="/outfits/1" className="bg-black/30 p-2 rounded-xl flex gap-3 items-center hover:bg-black/50 transition-colors">
                                        <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                                            <img src="https://images.unsplash.com/photo-1594938298603-c8148c47e356?w=200" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">All Black Chic</p>
                                            <p className="text-xs text-muted-foreground">Match: 98%</p>
                                        </div>
                                    </Link>
                                    <Link to="/outfits/2" className="bg-black/30 p-2 rounded-xl flex gap-3 items-center hover:bg-black/50 transition-colors">
                                        <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                                            <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Textured Layers</p>
                                            <p className="text-xs text-muted-foreground">Match: 85%</p>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4">
                <div className="glass p-1 pl-4 rounded-full flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for an outfit..."
                        className="flex-1 bg-transparent border-none outline-none text-sm h-10 placeholder:text-white/30"
                    />
                    <button className="w-10 h-10 flex-center text-white/50 hover:text-white">
                        <Mic size={20} />
                    </button>
                    <button
                        onClick={handleSend}
                        className="w-10 h-10 rounded-full bg-primary text-black flex-center hover:scale-105 transition-transform"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Outfits;
