'use client';
import {Mic, MicOff} from 'lucide-react';
import useVapi from "@/hooks/useVapi";
import {IBook} from "@/types";
import Image from "next/image";
import Transcript from "@/components/Transcript";

const VapiControls = ({ book }: { book: IBook }) => {
    const { status, isActive, messages, currentMessage, currentUserMessage, duration, start, stop, clearErrors } = useVapi(book);

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
                                disabled={status === 'connecting'}
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
                                <span className="vapi-status-dot vapi-status-dot-ready"></span>
                                <span className="vapi-status-text">Ready</span>
                            </div>
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">Voice: {book.persona || "Default"}</span>
                            </div>
                            <div className="vapi-status-indicator">
                                <span className="vapi-status-text">0:00/15:00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="vapi-transcript-wrapper">
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
