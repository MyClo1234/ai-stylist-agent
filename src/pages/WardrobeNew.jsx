import React, { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WardrobeNew = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImage(url);
        }
    };

    return (
        <div className="min-h-screen bg-black relative flex flex-col">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/50 rounded-full flex-center backdrop-blur-md text-white"
            >
                <X size={20} />
            </button>

            {!image ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Add New Item</h2>
                        <p className="text-muted-foreground">Snap a photo or upload from gallery</p>
                    </div>

                    <div className="flex gap-4 w-full max-w-sm">
                        <label className="flex-1 aspect-[4/3] glass rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                            <Camera size={32} className="text-primary" />
                            <span className="font-medium">Camera</span>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
                        </label>
                        <label className="flex-1 aspect-[4/3] glass rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                            <Upload size={32} className="text-accent" />
                            <span className="font-medium">Gallery</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        </label>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 relative">
                        <img src={image} className="w-full h-full object-contain bg-neutral-900" alt="Preview" />
                    </div>
                    <div className="p-6 glass rounded-t-3xl -mt-6">
                        <h3 className="text-lg font-bold mb-4">Processing...</h3>
                        <div className="space-y-4">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3 animate-pulse"></div>
                            </div>
                            <p className="text-sm text-muted-foreground">Removing background and analyzing tags...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WardrobeNew;
