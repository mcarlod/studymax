"use client";

import React from "react";

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] p-12 max-w-md w-full mx-4 flex flex-col items-center text-center shadow-2xl">
        {/* Spinner */}
        <div className="mb-10">
          <div className="w-16 h-16 border-4 border-[#4a2e2a]/10 border-t-[#4a2e2a] rounded-full animate-spin" />
        </div>

        {/* Text Content */}
        <h2 className="text-[32px] font-bold text-[#212a3b] mb-6 leading-tight">
          Synthesizing Your Book
        </h2>
        
        <p className="text-xl text-[#212a3b]/60 leading-relaxed max-w-[320px]">
          Please wait while we process your PDF and prepare your interactive literary experience.
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
