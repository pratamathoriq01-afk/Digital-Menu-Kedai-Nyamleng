'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const heightStyles = {
    sm: { maxHeight: '60px', maxWidth: '180px' },
    md: { maxHeight: '90px', maxWidth: '240px' },
    lg: { maxHeight: '120px', maxWidth: '300px' },
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative flex items-center justify-center p-2 sm:p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-parchment-border shadow-soft-card group hover:shadow-lg transition-all duration-300">
        
        {/* Background dot pattern */}
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(#e64a19_0.75px,transparent_0.75px)] [background-size:12px_12px] opacity-10 pointer-events-none" />

        <svg
          viewBox="0 0 400 320"
          className="w-auto relative z-10 drop-shadow-xs"
          style={{ 
            width: '100%', 
            height: 'auto', 
            ...heightStyles[size] 
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <path id="archTextPath" d="M 50,145 A 170,170 0 0,1 350,145" fill="none" />
            <linearGradient id="terracottaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d84315" />
              <stop offset="100%" stopColor="#ac2d00" />
            </linearGradient>
          </defs>

          {/* Arched K E D A I in Emerald Green */}
          <text
            fill="#006837"
            fontSize="42"
            fontWeight="900"
            letterSpacing="22"
            fontFamily="var(--font-inter), system-ui, sans-serif"
          >
            <textPath href="#archTextPath" startOffset="50%" textAnchor="middle">
              KEDAI
            </textPath>
          </text>

          {/* Subtitle - EAST 2026 - */}
          <text
            x="200"
            y="140"
            fill="url(#terracottaGrad)"
            fontSize="20"
            fontWeight="800"
            letterSpacing="4"
            textAnchor="middle"
            fontFamily="var(--font-inter), system-ui, sans-serif"
          >
            - EAST 2026 -
          </text>

          {/* Main Title NYAMLENG in Bold Terracotta */}
          <text
            x="200"
            y="215"
            fill="url(#terracottaGrad)"
            fontSize="68"
            fontWeight="900"
            letterSpacing="2"
            textAnchor="middle"
            fontFamily="var(--font-lexend), system-ui, sans-serif"
          >
            NYAMLENG
          </text>
        </svg>
      </div>
    </div>
  );
};
