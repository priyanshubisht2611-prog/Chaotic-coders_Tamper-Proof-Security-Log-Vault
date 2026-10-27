import React from 'react';
import { motion } from 'framer-motion';

export const SpiderWebCrack: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 rounded-xl">
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Radiating Fracture Lines */}
        <motion.path
          d="M100 60 L20 15 M100 60 L180 20 M100 60 L190 100 M100 60 L30 110 M100 60 L100 10 M100 60 L100 115 M100 60 L140 5 M100 60 L60 118 M100 60 L10 65 M100 60 L195 55"
          stroke="#e11d2e"
          strokeWidth="1.6"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        {/* Inner Web Rings */}
        <motion.path
          d="M80 48 L100 42 L120 48 L125 65 L118 78 L100 82 L82 78 L75 62 Z"
          stroke="#ff4d5a"
          strokeWidth="1.2"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.75 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
        />

        {/* Outer Web Rings */}
        <motion.path
          d="M55 35 L100 25 L145 35 L160 65 L145 95 L100 102 L55 95 L40 62 Z"
          stroke="#e11d2e"
          strokeWidth="1.0"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.65 }}
          transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
        />

        {/* Secondary Web Filaments */}
        <motion.path
          d="M30 20 L55 35 M170 30 L145 35 M175 90 L145 95 M40 100 L55 95"
          stroke="#ff6b77"
          strokeWidth="0.8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
};
