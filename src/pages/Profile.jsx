import React from 'react';
import { Settings, LogOut, Trash2, User, Ruler } from 'lucide-react';

const Profile = () => {
    return (
        <div className="pb-8 pt-8 px-6 min-h-screen">
            <h1 className="text-3xl font-bold mb-8">Profile</h1>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex-center text-black font-bold text-2xl">
                    S
                </div>
                <div>
                    <h2 className="text-xl font-semibold">Seonghyeon Choe</h2>
                    <p className="text-sm text-muted-foreground">Premium Member</p>
                </div>
            </div>

            <section className="mb-8 ">
                <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4 tracking-wider">Body Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-4 rounded-2xl">
                        <div className="flex items-start justify-between mb-2">
                            <span className="text-muted-foreground text-sm">Height</span>
                            <Ruler size={16} className="text-primary" />
                        </div>
                        <span className="text-2xl font-bold">182 <span className="text-sm font-normal text-muted-foreground">cm</span></span>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl">
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

            <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4 tracking-wider">Settings</h3>
                <div className="space-y-2">
                    <button className="w-full text-left p-4 glass-panel rounded-xl flex items-center justify-between group">
                        <span className="flex items-center gap-3">
                            <Settings size={18} /> Preferences
                        </span>
                    </button>
                    <button className="w-full text-left p-4 glass-panel rounded-xl flex items-center justify-between group text-red-400 border-red-500/20">
                        <span className="flex items-center gap-3">
                            <LogOut size={18} /> Sign Out
                        </span>
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Profile;
