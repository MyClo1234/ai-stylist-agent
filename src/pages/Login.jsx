import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col justify-center px-8 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[50%] bg-primary/20 blur-[100px] rounded-full point-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-accent/20 blur-[100px] rounded-full point-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10"
            >
                <div className="mb-12">
                    <h1 className="text-5xl font-black tracking-tighter mb-2">AI Stylist Agent</h1>
                    <p className="text-xl text-text-muted">Your intelligent wardrobe.</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] transition-transform"
                    >
                        Continue with Apple
                    </button>
                    <button className="w-full py-4 glass rounded-2xl font-bold border border-white/10 hover:bg-white/5 transition-colors">
                        Continue with Google
                    </button>
                    <button
                        className="w-full py-4 rounded-2xl font-bold text-text-muted hover:text-white transition-colors"
                    >
                        Log in with Email
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
