import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { Consultant } from '../../api/mockData';
import { cn } from '../../lib/utils';

interface Podium3DProps {
  consultants: Consultant[];
  theme: 'green' | 'orange';
  onConsultantClick: (consultant: Consultant) => void;
}

export const Podium3D: React.FC<Podium3DProps> = ({ consultants, theme, onConsultantClick }) => {
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // Sort consultants by rank (just in case)
  const sorted = [...consultants].sort((a, b) => a.rank - b.rank);
  
  // Extract top 3 and others
  const first = sorted.find(c => c.rank === 1);
  const second = sorted.find(c => c.rank === 2);
  const third = sorted.find(c => c.rank === 3);

  // Gradient styles based on theme
  const getGradientColors = (rank: number) => {
    if (theme === 'green') {
      if (rank === 1) return {
        top: '#86efac',       // light green
        left: '#22c55e',      // medium green
        right: '#15803d',     // dark green
        glow: 'rgba(34, 197, 94, 0.4)'
      };
      if (rank === 2) return {
        top: '#a7f3d0',
        left: '#10b981',
        right: '#047857',
        glow: 'rgba(16, 185, 129, 0.2)'
      };
      return { // 3rd
        top: '#bbf7d0',
        left: '#059669',
        right: '#065f46',
        glow: 'rgba(5, 150, 105, 0.15)'
      };
    } else { // orange
      if (rank === 1) return {
        top: '#ffedd5',       // light orange
        left: '#f97316',      // medium orange
        right: '#c2410c',     // dark orange
        glow: 'rgba(249, 115, 22, 0.4)'
      };
      if (rank === 2) return {
        top: '#fed7aa',
        left: '#ea580c',
        right: '#9a3412',
        glow: 'rgba(234, 88, 12, 0.2)'
      };
      return { // 3rd
        top: '#ffedd5',
        left: '#d97706',
        right: '#78350f',
        glow: 'rgba(217, 119, 6, 0.15)'
      };
    }
  };

  const renderStand = (c: Consultant | undefined, rank: number, height: number) => {
    if (!c) return null;

    const colors = getGradientColors(rank);
    const isFirst = rank === 1;

    // SVG Isometric Box dimensions
    const width = 120;
    const halfWidth = width / 2;
    const depth = 20;

    return (
      <div className="flex flex-col items-center select-none cursor-pointer" onClick={() => onConsultantClick(c)}>
        {/* User Card Floating Above */}
        <motion.div
          initial={isFirstRender.current ? { opacity: 0, y: -40 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', delay: rank * 0.2, stiffness: 80, damping: 10 }}
          className="flex flex-col items-center mb-2 z-10"
        >
          {/* Avatar Area with Indicator Medal */}
          <div className="relative">
            {isFirst && (
              <motion.div
                animate={{ y: [0, -4, 0], rotate: [0, -3, 3, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 text-yellow-500 filter drop-shadow-md"
              >
                <Crown className="h-6 w-6 fill-yellow-500" />
              </motion.div>
            )}
            
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white border-2 shadow-md relative",
              isFirst ? "w-18 h-18 text-xl" : "",
              theme === 'green' 
                ? isFirst ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-green-300 ring-4 ring-green-500/20' : 'bg-slate-700 border-slate-500'
                : isFirst ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-300 ring-4 ring-orange-500/20' : 'bg-slate-700 border-slate-500'
            )}>
              {c.avatar}

              {/* Medal Badge */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-extrabold shadow-sm",
                rank === 1 ? "bg-yellow-400 text-yellow-950 border-yellow-200" :
                rank === 2 ? "bg-slate-300 text-slate-800 border-slate-100" :
                "bg-amber-600 text-amber-50 border-amber-500"
              )}>
                {rank}º
              </div>
            </div>
          </div>

          {/* Consultant Text */}
          <div className="text-center mt-2">
            <p className={cn(
              "font-semibold text-slate-800 leading-tight",
              isFirst ? "text-base font-bold" : "text-sm"
            )}>
              {c.name.split(' ')[0]} {c.name.split(' ')[1] || ''}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {c.region || 'Regional'}
            </p>
          </div>

          {/* Sales Indicator */}
          <div className={cn(
            "mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs border",
            theme === 'green'
              ? 'bg-green-50 text-green-700 border-green-200/50'
              : 'bg-orange-50 text-orange-700 border-orange-200/50'
          )}>
            <span className="font-extrabold">{c.sales}</span>
            <span className="text-[10px] opacity-80">matrículas</span>
          </div>
        </motion.div>

        {/* 3D SVG Isometric stand */}
        <div className="relative" style={{ height: `${height + depth * 2}px`, width: `${width}px` }}>
          <svg
            width={width}
            height={height + depth * 2}
            viewBox={`0 0 ${width} ${height + depth * 2}`}
            className="overflow-visible"
          >
            {/* Defs for shadow glow */}
            <defs>
              <filter id={`glow-${theme}-${rank}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor={colors.left} floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Stand Group with entrance animation */}
            <motion.g
              initial={isFirstRender.current ? { scaleY: 0, originY: 1 } : false}
              animate={{ scaleY: 1 }}
              transition={{ type: 'spring', delay: rank * 0.15, stiffness: 70, damping: 15 }}
              filter={`url(#glow-${theme}-${rank})`}
            >
              {/* Front Left Face */}
              <path
                d={`M 0 ${depth} L ${halfWidth} ${depth * 2} L ${halfWidth} ${height + depth * 2} L 0 ${height + depth} Z`}
                fill={colors.left}
              />
              
              {/* Front Right Face */}
              <path
                d={`M ${halfWidth} ${depth * 2} L ${width} ${depth} L ${width} ${height + depth} L ${halfWidth} ${height + depth * 2} Z`}
                fill={colors.right}
              />

              {/* Top Face */}
              <path
                d={`M 0 ${depth} L ${halfWidth} 0 L ${width} ${depth} L ${halfWidth} ${depth * 2} Z`}
                fill={colors.top}
              />

              {/* Large Rank number embossed on front face */}
              <text
                x={halfWidth}
                y={height / 2 + depth * 2 + 10}
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.25)"
                className="font-extrabold text-4xl select-none pointer-events-none"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {rank}
              </text>
            </motion.g>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-center items-end gap-2 w-full pt-10 pb-4 h-[350px]">
      {/* 2nd Place Stand */}
      {renderStand(second, 2, 110)}

      {/* 1st Place Stand */}
      {renderStand(first, 1, 155)}

      {/* 3rd Place Stand */}
      {renderStand(third, 3, 80)}
    </div>
  );
};
