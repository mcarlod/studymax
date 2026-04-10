"use client";

import React from "react";

const LoadingOverlay = () => {
  return (
    <div className="loading-wrapper fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="loading-shadow-wrapper">
        <div className="loading-shadow">
          <div className="loading-animation">
            <div className="loading-title font-serif text-2xl mb-4">Processing...</div>
            <div className="loading-progress">
              <div className="loading-progress-item bg-white/20 h-2 w-48 rounded-full overflow-hidden">
                <div className="loading-progress-status bg-[#f3e4c7] h-full w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
