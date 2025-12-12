import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

interface DuotoneShareProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function DuotoneShare({ 
  size = 24, 
  primaryColor = COLORS.primary, 
  accentColor = COLORS.secondary 
}: DuotoneShareProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Connecting lines - Primary */}
      <Path
        d="M6 15L18 9"
        stroke={primaryColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M6 9L18 15"
        stroke={primaryColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Nodes - Mixed */}
      <Circle cx={18} cy={6} r={3} fill={accentColor} stroke={accentColor} strokeWidth={2} />
      <Circle cx={6} cy={12} r={3} fill={primaryColor} stroke={primaryColor} strokeWidth={2} />
      <Circle cx={18} cy={18} r={3} fill={accentColor} stroke={accentColor} strokeWidth={2} />
    </Svg>
  );
}
