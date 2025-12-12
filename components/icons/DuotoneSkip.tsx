import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

interface DuotoneSkipProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function DuotoneSkip({ 
  size = 24, 
  primaryColor = COLORS.primary, 
  accentColor = COLORS.secondary 
}: DuotoneSkipProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* First arrow - Primary */}
      <Path
        d="M5 5L12 12L5 19"
        stroke={primaryColor}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Second arrow - Accent */}
      <Path
        d="M13 5L20 12L13 19"
        stroke={accentColor}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}


