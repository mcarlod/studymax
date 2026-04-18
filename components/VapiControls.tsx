'use client';
import {Mic, MicOff} from 'lucide-react';
import useVapi from "@/hooks/useVapi";
import {IBook} from "@/types";
import Image from "next/image";
import Transcript from "@/components/Transcript";
import {PLAN_LIMITS, getPlanFromClerk} from "@/lib/subscription-constants";
import {useAuth} from "@clerk/nextjs";

const VapiControls = ({ book }: { book: IBook }) => {
    const { status, isActive, isStopping, messages, currentMessage, currentUserMessage, duration, maxDurationSeconds, start, stop, clearError, limitError } = useVapi(book);

    return (
        <>
            <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-8">
                {/* Modern Header Card */}
                <div 
                    className="relative w-full border border-slate-200 rounded-[2.5rem] p-8 md:p-12 mb-10 overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-10"
                    style={{ background: 'var(--bg-card-gradient)' }}
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600" />
                    
                    <div className="relative group">
                        <div className="relative w-[160px] h-[240px] rounded-2xl overflow-hidden shadow-xl transition-transform duration-500 group-hover:scale-105">
                            <Image
                                src={book.coverURL || "/book-placeholder.png"}
                                alt={book.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        
                        {/* Mic Button - Redesigned */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20">
                            <button
                                onClick={isActive ? stop : start}
                                disabled={status === 'connecting' || isStopping}
                                className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 shadow-xl active:scale-90 ${isActive ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                    {isActive ? (
                                        <Mic className="size-8 text-white" />
                                    ) : (
                                        <MicOff className="size-8 text-white" />
                                    )}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col flex-1 text-center md:text-left pt-6 md:pt-0">
                        <div className="mb-6">
                            <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-2 leading-tight tracking-tight">
                                {book.title}
                            </h1>
                            <div className="flex items-center gap-3">
                                <p className="text-xl text-slate-500 font-semibold">by {book.author}</p>
                                {book.persona && (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">voiced by {book.persona}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`}></span>
                                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{status}</span>
                            </div>
                            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                                <span className="text-sm font-bold text-indigo-600">SESSION</span>
                                <span className="text-sm text-slate-600 font-medium">
                                    {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} / 
                                    {Math.floor(maxDurationSeconds / 60)}:00
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-4xl bg-slate-50/50 border border-slate-200 rounded-[2rem] p-6 min-h-[400px] shadow-inner">
                    {limitError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3" role="alert">
                            <span className="text-lg">⚠️</span>
                            <span className="font-medium">{limitError}</span>
                        </div>
                    )}
                    <Transcript
                        messages={messages}
                        currentMessage={currentMessage}
                        currentUserMessage={currentUserMessage}
                    />
                </div>
            </div>
        </>
    )
}

export default VapiControls;
