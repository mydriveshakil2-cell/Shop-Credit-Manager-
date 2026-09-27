import React from 'react';

interface LockIconProps {
  isUnlocked: boolean;
  className?: string;
}

export const LockIcon: React.FC<LockIconProps> = ({ isUnlocked, className = 'w-24 h-28' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 120 140"
        className="w-full h-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic Silver Gradient for Shackle */}
          <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8d9994" />
            <stop offset="25%" stopColor="#cfdad5" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#b4c2bc" />
            <stop offset="100%" stopColor="#6e7a75" />
          </linearGradient>

          {/* Realistic Metallic Brushed Metal Body Gradient */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d5deda" />
            <stop offset="20%" stopColor="#b0beba" />
            <stop offset="45%" stopColor="#96a5a0" />
            <stop offset="70%" stopColor="#c5d0cc" />
            <stop offset="100%" stopColor="#7a8883" />
          </linearGradient>

          {/* Bevel highlight */}
          <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>

          {/* Keyhole inner shadow */}
          <radialGradient id="keyholeGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#1a2420" />
            <stop offset="100%" stopColor="#080e0c" />
          </radialGradient>
        </defs>

        {/* Shackle (Arch) with smooth unlock animation */}
        <g
          className="transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[35px_58px]"
          style={{
            transform: isUnlocked
              ? 'translateY(-14px) rotate(-38deg)'
              : 'translateY(0px) rotate(0deg)',
          }}
        >
          {/* Shackle shadow */}
          <path
            d="M 35 60 V 38 C 35 22 46 12 60 12 C 74 12 85 22 85 38 V 60"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
            transform="translate(0, 3)"
          />
          {/* Main Shackle tube */}
          <path
            d="M 35 60 V 38 C 35 22 46 12 60 12 C 74 12 85 22 85 38 V 60"
            stroke="url(#shackleGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
          {/* Shackle inner groove shine */}
          <path
            d="M 37 54 V 38 C 37 25 47 16 60 16 C 73 16 83 25 83 38 V 54"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
            fill="none"
          />
        </g>

        {/* Lock Body */}
        <g id="lock-body">
          {/* Base shape with curved corners matching image.jpeg */}
          <rect
            x="20"
            y="54"
            width="80"
            height="72"
            rx="12"
            fill="url(#bodyGrad)"
            stroke="#65726d"
            strokeWidth="1.5"
          />

          {/* Top highlight plate */}
          <rect
            x="22"
            y="56"
            width="76"
            height="68"
            rx="10"
            fill="none"
            stroke="url(#bevelGrad)"
            strokeWidth="1.5"
          />

          {/* Brushed metallic horizontal streaks */}
          <line x1="24" y1="72" x2="96" y2="72" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1" />
          <line x1="24" y1="88" x2="96" y2="88" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="24" y1="104" x2="96" y2="104" stroke="#000000" strokeOpacity="0.08" strokeWidth="1" />

          {/* Keyhole Housing Rim */}
          <ellipse cx="60" cy="85" rx="9" ry="9" fill="#586560" stroke="#7e8c87" strokeWidth="1" />

          {/* Keyhole Silhouette */}
          <path
            d="M 60 80 A 5 5 0 0 0 56 86 L 57.5 95 C 57.5 96.5 58.5 97.5 60 97.5 C 61.5 97.5 62.5 96.5 62.5 95 L 64 86 A 5 5 0 0 0 60 80 Z"
            fill="url(#keyholeGrad)"
          />

          {/* Unlocked green glow inside keyhole if unlocked */}
          {isUnlocked && (
            <circle cx="60" cy="86" r="6" fill="#10b981" opacity="0.8" className="animate-ping" />
          )}
        </g>
      </svg>
    </div>
  );
};
