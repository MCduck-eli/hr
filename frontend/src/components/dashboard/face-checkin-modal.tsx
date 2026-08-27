"use client";

import { useState, useRef, useEffect } from "react";
import { checkInWithFace } from "@/src/services/attendance-service";

interface FaceCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export default function FaceCheckInModal({
    isOpen,
    onClose,
    onSuccess,
}: FaceCheckInModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [successData, setSuccessData] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const startCamera = async () => {
        setCameraError(null);
        setCameraReady(false);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCameraReady(true);
        } catch (err: any) {
            setCameraError(
                err.name === "NotAllowedError"
                    ? "Kameraga ruxsat berilmadi. Iltimos, brauzerda kamera ruxsatini yoqing."
                    : "Kamera bilan bog'lanishda xatolik yuz berdi.",
            );
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setCameraReady(false);
    };

    useEffect(() => {
        if (isOpen) {
            startCamera();
            setSuccessData(null);
            setErrorMsg(null);
            setIsScanning(false);
            setScanProgress(0);
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const captureImage = (): string | undefined => {
        if (!videoRef.current || !canvasRef.current) return undefined;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL("image/jpeg", 0.8);
        }
        return undefined;
    };

    const handleScanAndCheckIn = async () => {
        if (isScanning || successData) return;
        setIsScanning(true);
        setErrorMsg(null);
        setScanProgress(0);

        const progressInterval = setInterval(() => {
            setScanProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 15;
            });
        }, 150);

        try {
            const imageData = captureImage();
            await new Promise((r) => setTimeout(r, 1200));
            clearInterval(progressInterval);
            setScanProgress(100);

            const res = await checkInWithFace({
                image: imageData,
                note: "Face ID orqali qayd etildi",
            });

            setSuccessData(res);
            stopCamera();
            setTimeout(() => {
                onSuccess(res);
                onClose();
            }, 2200);
        } catch (err: any) {
            clearInterval(progressInterval);
            setIsScanning(false);
            setScanProgress(0);
            setErrorMsg(err.message || "Face ID tekshiruvida xatolik");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#121212] border border-gray-800 text-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">
                            Face ID Davomat (Check In)
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-5">
                    {successData ? (
                        <div className="py-8 flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-3xl font-black shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                ✓
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                                    Check In Muvaffaqiyatli!
                                </h3>
                                <p className="text-xs text-gray-400 font-medium">
                                    Yuz muvaffaqiyatli tanildi va davomat qayd etildi.
                                </p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 px-6 py-3 rounded-lg flex items-center gap-6 mt-2">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                                        Vaqt
                                    </span>
                                    <span className="text-sm font-black text-white">
                                        {new Date(
                                            successData.checkIn || Date.now(),
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-gray-800" />
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                                        Holat
                                    </span>
                                    <span
                                        className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                                            successData.status === "LATE"
                                                ? "bg-amber-500/20 text-amber-400"
                                                : "bg-emerald-500/20 text-emerald-400"
                                        }`}
                                    >
                                        {successData.status === "LATE"
                                            ? "Kechikdi"
                                            : "Vaqtida"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center group shadow-inner">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover -scale-x-100"
                                />
                                <canvas ref={canvasRef} className="hidden" />

                                {!cameraReady && !cameraError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90">
                                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            Kamera yuklanmoqda...
                                        </span>
                                    </div>
                                )}

                                {cameraError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-black/95">
                                        <span className="text-3xl">📷</span>
                                        <p className="text-xs text-red-400 font-medium max-w-xs">
                                            {cameraError}
                                        </p>
                                        <button
                                            onClick={startCamera}
                                            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Qayta urinish
                                        </button>
                                    </div>
                                )}

                                {cameraReady && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="relative w-56 h-64 border-2 border-emerald-500/60 rounded-[48px] flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                                            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                                            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                                            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                                            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                                            {isScanning && (
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-[0_0_15px_#10b981]" />
                                            )}
                                        </div>

                                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                Liveness: Active
                                            </span>
                                            <span>Face Detection ON</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {errorMsg && (
                                <div className="w-full p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs font-medium rounded-md text-center">
                                    {errorMsg}
                                </div>
                            )}

                            {isScanning && (
                                <div className="w-full flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                        <span>Yuz skaner qilinmoqda...</span>
                                        <span>{scanProgress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-200"
                                            style={{ width: `${scanProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="w-full flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isScanning}
                                    className="flex-1 py-3.5 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleScanAndCheckIn}
                                    disabled={!cameraReady || isScanning}
                                    className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                                >
                                    {isScanning ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Tekshirilmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>📷</span>
                                            <span>Skanerlash va Check In</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
