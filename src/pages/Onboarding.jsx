import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Mock State
    const [styles, setStyles] = useState([]);

    const styleOptions = ['Minimal', 'Streetwear', 'Formal', 'Vintage', 'Athleisure'];

    return (
        <div className="min-h-screen p-6 pb-24 flex flex-col justify-between">
            <div className="mt-8">
                <div className="w-full bg-white/10 h-1 rounded-full mb-8">
                    <motion.div
                        animate={{ width: `${(step / 3) * 100}%` }}
                        className="bg-primary h-full rounded-full"
                    />
                </div>

                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-3xl font-bold mb-2">Your Style DNA</h1>
                        <p className="text-muted-foreground mb-8">Select the vibes that resonate with you.</p>

                        <div className="flex flex-wrap gap-3">
                            {styleOptions.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style])}
                                    className={`px-6 py-3 rounded-full border transition-all ${styles.includes(style)
                                            ? 'bg-primary border-primary text-black font-semibold'
                                            : 'border-white/20 text-white hover:border-white/50'
                                        }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-3xl font-bold mb-2">Usual TPO</h1>
                        <p className="text-muted-foreground mb-8">Where do you spend most of your time?</p>

                        <div className="space-y-3">
                            {['Office / Business', 'University / Campus', 'Remote / Home', 'Field Work'].map(tpo => (
                                <button key={tpo} className="w-full text-left p-4 rounded-xl border border-white/20 hover:bg-white/5 active:bg-primary/20">
                                    {tpo}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-3xl font-bold mb-2">Any Dealbreakers?</h1>
                        <p className="text-muted-foreground mb-8">Fabrics or fits you absolutely hate.</p>

                        <div className="space-y-3">
                            {['Wool (Itchy)', 'Tight Skinny Jeans', 'Polyester'].map(opt => (
                                <button key={opt} className="w-full text-left p-4 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-200">
                                    Ban {opt}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            <button
                onClick={() => step < 3 ? setStep(s => s + 1) : navigate('/')}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
                {step === 3 ? 'Finish Setup' : 'Continue'}
            </button>
        </div>
    );
};

export default Onboarding;
