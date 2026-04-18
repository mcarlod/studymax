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
            <div className="vapi-main-container">
                {/* Header Card */}
                <div className="vapi-header-card w-full max-w-4xl mb-6">
                    <div className="vapi-cover-wrapper">
                        <Image
                            src={book.coverURL || "/book-placeholder.png"}
                            alt={book.title}
                            width={130}
                            height={195}
                            className="vapi-cover-image"
                        />
                        {/* Mic Button overlapping */}
                        <div className="vapi-mic-wrapper">
                            <button
                                onClick={isActive ? stop : start}
                                disabled={status === 'connecting' || isStopping}
                                aria-label={isActive ? "Stop voice assistant" : "Start voice assistant"}
                                title={isActive ? "Stop voice assistant" : "Start voice assistant"}
                                className={`vapi-mic-btn vapi-mic-btn-inactive shadow-soft ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'}`}>
                                    {isActive ? (
                                        <Mic className={"size-7 text-white"} />
                                    ) : (
                                        <MicOff className={"size-7 text-[#2123ab]"} />
                                    )}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-serif text-black leading-tight">
                                {book.title}
                            </h1>
                            <p className="text-lg text-[var(--text-secondary)]">by {book.author}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <div className="vapi-status-indicator">
                                <span className={`vapi-status-dot vapi-status-dot-${status}`}></span>
                                <span className="vapi-status-text capitalize">{status}</span>
                            </div>
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">Voice: {book.persona || "Default"}</span>
                            </div>
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">
                                    {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}/
                                    {Math.floor(maxDurationSeconds / 60)}:00
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vapi-transcript-wrapper">
                    {limitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{limitError}</span>
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
