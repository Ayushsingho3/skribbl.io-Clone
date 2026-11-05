import React from 'react';
import { AvatarConfig } from '../types/game';

interface AvatarProps {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1'  // indigo
];

export const Avatar: React.FC<AvatarProps> = ({
  avatar,
  size = 56,
  className = '',
  animate = false
}) => {
  const { color, eyes = 0, mouth = 0 } = avatar;

  // Eyes SVG paths
  const renderEyes = () => {
    switch (eyes % 6) {
      case 1: // Happy inverted arcs
        return (
          <>
            <path d="M 28 36 Q 36 26 44 36" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 56 36 Q 64 26 72 36" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 2: // Wink (left open, right closed wink)
        return (
          <>
            <circle cx="36" cy="36" r="6" fill="#1e293b" />
            <circle cx="34" cy="34" r="2" fill="#ffffff" />
            <path d="M 56 36 Q 64 42 72 36" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 3: // Sunglasses cool
        return (
          <g>
            <rect x="24" y="30" width="22" height="15" rx="4" fill="#0f172a" />
            <rect x="54" y="30" width="22" height="15" rx="4" fill="#0f172a" />
            <line x1="44" y1="35" x2="56" y2="35" stroke="#0f172a" strokeWidth="4" />
            <line x1="22" y1="34" x2="28" y2="42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="52" y1="34" x2="58" y2="42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 4: // Dizzy spirals/crosses
        return (
          <>
            <line x1="30" y1="30" x2="42" y2="42" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <line x1="42" y1="30" x2="30" y2="42" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <line x1="58" y1="30" x2="70" y2="42" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <line x1="70" y1="30" x2="58" y2="42" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          </>
        );
      case 5: // Curious / wide eyes
        return (
          <>
            <ellipse cx="36" cy="36" rx="8" ry="10" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
            <circle cx="37" cy="37" r="4" fill="#1e293b" />
            <ellipse cx="64" cy="36" rx="8" ry="10" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
            <circle cx="65" cy="37" r="4" fill="#1e293b" />
          </>
        );
      case 0:
      default: // Classic cute round eyes with shiny reflections
        return (
          <>
            <circle cx="36" cy="36" r="6" fill="#1e293b" />
            <circle cx="34" cy="33" r="2.2" fill="#ffffff" />
            <circle cx="64" cy="36" r="6" fill="#1e293b" />
            <circle cx="62" cy="33" r="2.2" fill="#ffffff" />
          </>
        );
    }
  };

  // Mouth SVG paths
  const renderMouth = () => {
    switch (mouth % 6) {
      case 1: // Big wide open smile
        return (
          <path
            d="M 32 54 Q 50 78 68 54 Z"
            fill="#881337"
            stroke="#1e293b"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        );
      case 2: // Tongue out cheeky
        return (
          <g>
            <path d="M 34 56 Q 50 68 66 56" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 44 60 C 44 72 56 72 56 60 Z" fill="#f43f5e" stroke="#1e293b" strokeWidth="2.5" />
          </g>
        );
      case 3: // Surprised 'O'
        return (
          <ellipse cx="50" cy="62" rx="7" ry="10" fill="#881337" stroke="#1e293b" strokeWidth="3" />
        );
      case 4: // Smirk / sideways grin
        return (
          <path d="M 38 60 Q 58 64 66 52" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
        );
      case 5: // Derp / wavy line
        return (
          <path d="M 34 62 Q 42 56 50 62 T 66 62" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        );
      case 0:
      default: // Sweet simple smile
        return (
          <path d="M 35 56 Q 50 70 65 56" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className} ${
        animate ? 'transition-transform duration-200 hover:scale-110 active:scale-95' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        {/* Shadow base */}
        <ellipse cx="50" cy="88" rx="36" ry="7" fill="rgba(0,0,0,0.12)" />

        {/* Blob body */}
        <circle
          cx="50"
          cy="48"
          r="40"
          fill={color || '#3b82f6'}
          stroke="#1e293b"
          strokeWidth="4"
        />

        {/* Soft highlight on top left */}
        <path
          d="M 24 24 Q 50 14 74 24"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Rosy cheeks */}
        <circle cx="25" cy="52" r="5" fill="rgba(239, 68, 68, 0.25)" />
        <circle cx="75" cy="52" r="5" fill="rgba(239, 68, 68, 0.25)" />

        {/* Eyes & Mouth */}
        {renderEyes()}
        {renderMouth()}
      </svg>
    </div>
  );
};
