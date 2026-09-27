import React, { useEffect, useState } from 'react';
import { Store, ShieldCheck } from 'lucide-react';

interface ShopShutterProps {
  onShutterComplete: () => void;
  shopName?: string;
}

export const ShopShutter: React.FC<ShopShutterProps> = ({
  onShutterComplete,
  shopName = 'Shop Credit Master',
}) => {
  const [isLifting, setIsLifting] = useState(false);

  useEffect(() => {
    // Small pause to let user see the closed shutter (300ms), then start lifting for 1700ms (total ~2000ms)
    const liftTimer = setTimeout(() => {
      setIsLifting(true);
    }, 250);

    const finishTimer = setTimeout(() => {
      onShutterComplete();
    }, 2000);

    return () => {
      clearTimeout(liftTimer);
      clearTimeout(finishTimer);
    };
  }, [onShutterComplete]);

  // Generate 26 horizontal rolling slats for a realistic shop shutter look
  const slats = Array.from({ length: 26 });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none select-none">
      {/* The Shutter Curtain */}
      <div
        className={`w-full h-full bg-[#182622] transition-transform duration-[1700ms] ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-between shadow-2xl ${
          isLifting ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Shutter Top Roll Box */}
        <div className="w-full h-12 bg-gradient-to-b from-[#091512] to-[#1c2c26] border-b-2 border-emerald-950 flex items-center justify-between px-6 shrink-0 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
              STORE ACCESS GRANTED
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">UAE SECURITY GATE</span>
        </div>

        {/* Slats Body Container */}
        <div className="flex-1 w-full flex flex-col justify-around py-2 px-1 relative shutter-slats">
          {/* Shop Sign Board mounted on shutter center */}
          <div className="my-auto mx-auto max-w-xs w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-[#0c4a42]/95 via-[#083832]/95 to-[#052722]/95 border-2 border-emerald-500/40 text-center shadow-[0_15px_35px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-2 text-emerald-300">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
              {shopName}
            </h2>
            <div className="text-[10px] text-emerald-300 font-semibold tracking-wider mt-0.5">
              OPENING STORE KHATA...
            </div>
            {/* Shutter status bar */}
            <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>

          {/* Slat lines rendering */}
          {slats.map((_, i) => (
            <div
              key={i}
              className="w-full h-3 border-t border-white/5 border-b border-black/40 bg-gradient-to-b from-[#2a3c36] via-[#1c2c26] to-[#121e1a] opacity-80"
            />
          ))}
        </div>

        {/* Heavy Bottom Handle Bar of the Shutter */}
        <div className="w-full h-14 bg-gradient-to-r from-[#111f1a] via-[#22352e] to-[#111f1a] border-t-4 border-[#334e45] flex items-center justify-center gap-4 px-6 shrink-0 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-3 rounded-full bg-[#0a1411] border border-white/10" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              SHUTTER OPENING
            </span>
          </div>
          <div className="w-20 h-3 rounded-full bg-[#0a1411] border border-white/10" />
        </div>
      </div>
    </div>
  );
};
