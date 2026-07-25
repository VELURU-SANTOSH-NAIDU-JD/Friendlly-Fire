import React from 'react';

export function Bottle() {
  return (
    <div className="relative w-16 h-48 flex flex-col items-center scale-[0.8]" style={{ filter: 'drop-shadow(0 20px 15px rgba(0,0,0,0.4))' }}>
      {/* Cap */}
      <div className="w-5 h-6 bg-[#600000] rounded-t-md z-10 border-b-2 border-black/40 shadow-inner relative">
        <div className="absolute top-0 left-1 w-1 h-6 bg-white/20 rounded-full" />
      </div>
      
      {/* Neck */}
      <div className="w-5 h-10 bg-emerald-600/90 backdrop-blur-md z-10 relative shadow-[inset_-3px_0_6px_rgba(0,0,0,0.6)] border-x border-white/10">
        <div className="absolute inset-y-1 left-1 w-0.5 bg-white/40 rounded-full" />
      </div>
      
      {/* Shoulders */}
      <div className="w-16 h-10 bg-emerald-600/90 backdrop-blur-md rounded-t-[1.5rem] z-10 relative shadow-[inset_-4px_0_8px_rgba(0,0,0,0.6)] overflow-hidden border-x border-white/10">
         <div className="absolute top-2 left-2 w-1.5 h-6 bg-white/30 rounded-full transform -rotate-[20deg]" />
      </div>
      
      {/* Body */}
      <div className="w-16 h-24 bg-emerald-600/90 backdrop-blur-md rounded-b-xl relative z-10 flex flex-col items-center justify-center border-b-[6px] border-emerald-900/60 shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.7)] overflow-hidden border-x border-white/10">
        
        {/* Glass Reflection */}
        <div className="absolute inset-y-2 left-1.5 w-1.5 bg-white/30 rounded-full blur-[0.5px]" />
        
        {/* Label */}
        <div className="w-14 py-2.5 bg-[#F4E1C1] shadow-lg flex flex-col items-center justify-center border-y-2 border-[#8B0000] relative z-20">
          <div className="absolute inset-0 bg-black/5 mix-blend-multiply" />
          <span className="text-[7.5px] font-black text-[#4A0000] leading-none font-display uppercase tracking-tight z-10">
            Friendlly
          </span>
          <span className="text-[11px] font-black text-[#8B0000] leading-none font-display uppercase tracking-widest mt-0.5 z-10">
            Fire
          </span>
        </div>
      </div>
    </div>
  );
}
