import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle2, Download, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WardrobeNew = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [processingFiles, setProcessingFiles] = useState([]);
    const [completedFiles, setCompletedFiles] = useState([]);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [overallProgress, setOverallProgress] = useState(0);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const handleFiles = (fileList) => {
        const imageFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            setError('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        const newFiles = imageFiles.map(file => ({
            id: Date.now() + Math.random(),
            file,
            preview: URL.createObjectURL(file),
            status: 'pending', // pending, processing, completed, error
            attributes: null,
            progress: 0
        }));
        
        setFiles(prev => [...prev, ...newFiles]);
        setError(null);
        
        // Auto-start processing
        newFiles.forEach(fileObj => {
            extractAttributes(fileObj);
        });
    };

    const handleFileInput = (e) => {
        const fileList = e.target.files;
        if (fileList && fileList.length > 0) {
            handleFiles(fileList);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const fileList = e.dataTransfer.files;
        if (fileList && fileList.length > 0) {
            handleFiles(fileList);
        }
    };

    const extractAttributes = async (fileObj) => {
        if (!fileObj || fileObj.status === 'processing' || fileObj.status === 'completed') return;

        setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, status: 'processing', progress: 0 } : f
        ));

        try {
            const formData = new FormData();
            formData.append('image', fileObj.file);

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setFiles(prev => prev.map(f => {
                    if (f.id === fileObj.id && f.progress < 90) {
                        return { ...f, progress: Math.min(f.progress + 10, 90) };
                    }
                    return f;
                }));
            }, 300);

            const response = await fetch(`${API_BASE_URL}/api/extract`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '특징 추출에 실패했습니다.');
            }

            const data = await response.json();
            
            setFiles(prev => prev.map(f => 
                f.id === fileObj.id 
                    ? { ...f, status: 'completed', attributes: data.attributes, progress: 100 }
                    : f
            ));
        } catch (err) {
            setFiles(prev => prev.map(f => 
                f.id === fileObj.id 
                    ? { ...f, status: 'error', error: err.message, progress: 0 }
                    : f
            ));
            console.error('Error extracting attributes:', err);
        }
    };

    const removeFile = (fileId) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === fileId);
            if (file && file.preview) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter(f => f.id !== fileId);
        });
    };

    const downloadJSON = (fileObj) => {
        if (!fileObj.attributes) return;

        const jsonStr = JSON.stringify(fileObj.attributes, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clothing_attributes_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFinish = () => {
        navigate('/profile?tab=wardrobe');
    };

    // Calculate overall progress
    React.useEffect(() => {
        if (files.length === 0) {
            setOverallProgress(0);
            return;
        }
        
        const totalProgress = files.reduce((sum, f) => sum + f.progress, 0);
        const avgProgress = totalProgress / files.length;
        setOverallProgress(avgProgress);
    }, [files]);

    // Cleanup preview URLs
    React.useEffect(() => {
        return () => {
            files.forEach(fileObj => {
                if (fileObj.preview) {
                    URL.revokeObjectURL(fileObj.preview);
                }
            });
        };
    }, []);

    const processingCount = files.filter(f => f.status === 'processing').length;
    const completedCount = files.filter(f => f.status === 'completed').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    const allCompleted = files.length > 0 && completedCount + errorCount === files.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] relative flex flex-col overflow-hidden">
            {/* 배경 장식 요소 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(207,250,254,0.02),transparent_50%)]"></div>
            </div>

            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/profile?tab=wardrobe')}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/40 rounded-full flex-center backdrop-blur-xl text-white hover:bg-black/60 transition-all border border-white/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
                aria-label="Close and return to wardrobe"
            >
                <X size={18} />
            </motion.button>

            <div className="flex-1 flex flex-col p-4 relative z-10 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-1 mb-6"
                >
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                        Add New Items
                    </h2>
                    <p className="text-muted-foreground text-sm">여러 옷의 특징을 한 번에 AI로 추출합니다</p>
                </motion.div>

                {files.length === 0 ? (
                    <>
                        <motion.div
                            ref={dropZoneRef}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => galleryInputRef.current?.click()}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className={`relative w-full border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer ${
                                isDragging
                                    ? 'border-primary bg-primary/10 scale-105 shadow-2xl shadow-primary/20'
                                    : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
                                <motion.div
                                    animate={isDragging ? { 
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    } : {}}
                                    transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                                >
                                    {isDragging ? (
                                        <Sparkles size={48} className="text-primary" />
                                    ) : (
                                        <ImageIcon size={48} className="text-muted-foreground" />
                                    )}
                                </motion.div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-base">
                                        {isDragging ? (
                                            <span className="text-primary">이미지를 놓아주세요</span>
                                        ) : (
                                            '이미지를 드래그하거나 클릭하여 선택하세요'
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">여러 이미지 동시 업로드 가능 • JPG, PNG, GIF, WEBP 지원</p>
                                </div>
                            </div>
                            {isDragging && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 pointer-events-none"
                                />
                            )}
                        </motion.div>
                        
                        {/* Alternative button for file selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4"
                        >
                            <button
                                onClick={() => galleryInputRef.current?.click()}
                                className="w-full glass rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all border border-white/10"
                            >
                                <Upload size={20} />
                                <span className="font-medium text-sm">파일 선택하기</span>
                            </button>
                        </motion.div>
                    </>
                ) : (
                    <>
                        {/* Overall Progress */}
                        {processingCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 space-y-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        처리 중: {processingCount}개
                                    </span>
                                    <span className="text-primary font-semibold">
                                        {Math.round(overallProgress)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${overallProgress}%` }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* File List */}
                        <div className="space-y-4 mb-6">
                            {files.map((fileObj, index) => (
                                <motion.div
                                    key={fileObj.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-panel p-4 rounded-xl border border-white/10"
                                >
                                    <div className="flex gap-4">
                                        {/* Preview */}
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                            <img
                                                src={fileObj.preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-sm font-medium truncate">{fileObj.file.name}</p>
                                                <button
                                                    onClick={() => removeFile(fileObj.id)}
                                                    className="text-muted-foreground hover:text-white transition-colors flex-shrink-0 ml-2"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            {/* Progress Bar */}
                                            {fileObj.status === 'processing' && (
                                                <div className="space-y-1">
                                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                                            initial={{ width: "0%" }}
                                                            animate={{ width: `${fileObj.progress}%` }}
                                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <Loader2 size={12} className="animate-spin text-primary" />
                                                        AI 분석 중... {Math.round(fileObj.progress)}%
                                                    </p>
                                                </div>
                                            )}

                                            {/* Completed */}
                                            {fileObj.status === 'completed' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs text-green-400">
                                                        <CheckCircle2 size={14} />
                                                        <span>추출 완료</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-muted-foreground">
                                                            {fileObj.attributes?.category?.main} / {fileObj.attributes?.category?.sub}
                                                        </span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground">
                                                            {fileObj.attributes?.color?.primary}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Error */}
                                            {fileObj.status === 'error' && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-red-400">{fileObj.error || '오류 발생'}</p>
                                                    <button
                                                        onClick={() => extractAttributes(fileObj)}
                                                        className="text-xs text-primary hover:opacity-80"
                                                    >
                                                        다시 시도
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => galleryInputRef.current?.click()}
                                className="flex-1 glass rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all border border-white/10"
                            >
                                <Upload size={20} />
                                <span className="font-medium text-sm">더 추가하기</span>
                            </motion.button>
                            {allCompleted && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleFinish}
                                    className="flex-1 bg-primary text-black rounded-xl py-3 font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg"
                                >
                                    완료 ({completedCount}개)
                                </motion.button>
                            )}
                        </div>
                    </>
                )}

                {/* Hidden Inputs */}
                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                />
            </div>
        </div>
    );
};

export default WardrobeNew;
