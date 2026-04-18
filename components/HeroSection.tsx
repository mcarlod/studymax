'use client';

import React from 'react'
import Link from 'next/link'
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const HeroSection = () => {
    const { isSignedIn } = useUser();
    const router = useRouter();

    const handleAddBookClick = (e: React.MouseEvent) => {
        if (!isSignedIn) {
            e.preventDefault();
            alert("Please sign in to add a new book.");
        }
    };

    return (
        <section className="wrapper mb-10 md:mb-16">
            <div 
                className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 p-8 md:p-14 shadow-2xl shadow-slate-200/50"
                style={{ background: 'var(--bg-hero-gradient)' }}
            >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    {/* Left Part */}
                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                            Master Your <span className="text-indigo-600">Knowledge</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            Upload your documents and engage in intelligent voice conversations with our AI. Deep learning meets natural interaction.
                        </p>
                        <Link 
                            href="/books/new" 
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                            onClick={handleAddBookClick}
                        >
                            <span className="text-2xl font-light">+</span>
                            <span>Create New Session</span>
                        </Link>
                    </div>

                    {/* Right Part - Steps */}
                    <div className="w-full max-w-md bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 md:p-10">
                        <div className="space-y-10">
                            {[
                                { step: "01", title: "Upload PDF", desc: "Securely process documents", color: "indigo" },
                                { step: "02", title: "AI Analysis", desc: "Instant contextual mapping", color: "blue" },
                                { step: "03", title: "Voice Chat", desc: "Interactive vocal dialogue", color: "violet" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-5">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-serif font-bold text-indigo-600 text-xl shadow-sm">
                                        {item.step}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                                        <p className="text-slate-500 text-sm leading-snug font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection