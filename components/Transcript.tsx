'use client';

import React, { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { Messages } from '@/types';

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

const Transcript: React.FC<TranscriptProps> = ({ messages, currentMessage, currentUserMessage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8">
        <div className="w-20 h-20 rounded-full bg-indigo-600/10 flex items-center justify-center mb-6 border border-indigo-500/10 shadow-sm">
          <Mic className="size-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">System Ready</h2>
        <p className="text-slate-500 max-w-xs mx-auto font-medium">Click the control button above to initialize voice communication protocol.</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] overflow-y-auto scroll-smooth pr-4 custom-scrollbar" ref={scrollRef}>
      <div className="flex flex-col gap-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] px-6 py-4 rounded-3xl text-sm md:text-base leading-relaxed shadow-md ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none font-medium'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {currentUserMessage && (
          <div className="flex justify-end">
            <div className="max-w-[80%] px-6 py-4 rounded-3xl rounded-tr-none bg-indigo-600 text-white text-sm md:text-base shadow-md relative overflow-hidden">
              {currentUserMessage}
              <span className="inline-block w-1.5 h-4 ml-1 bg-white/50 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {currentMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-6 py-4 rounded-3xl rounded-tl-none bg-white text-slate-700 border border-slate-200 text-sm md:text-base shadow-md relative overflow-hidden font-medium">
              {currentMessage}
              <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-600/50 animate-pulse align-middle" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transcript;
