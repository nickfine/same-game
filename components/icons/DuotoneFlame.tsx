import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

interface DuotoneFlameProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function DuotoneFlame({ 
  size = 24, 
  primaryColor = COLORS.secondary, 
  accentColor = COLORS.gradientCoralEnd
}: DuotoneFlameProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer flame - Primary */}
      <Path
        d="M12 2C12 2 8 6 8 10C8 14 10 16 10 16C10 16 8 14 8 12C8 10 10 8 12 6C14 8 16 10 16 12C16 14 14 16 14 16C14 16 16 14 16 10C16 6 12 2 12 2Z"
        fill={primaryColor}
        opacity={0.3}
      />
      {/* Main flame body */}
      <Path
        d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 12 2 12 2C12 2 4 9.58172 4 14C4 18.4183 7.58172 22 12 22Z"
        stroke={primaryColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner flame - Accent */}
      <Path
        d="M12 18C14.2091 18 16 16.2091 16 14C16 11.7909 12 8 12 8C12 8 8 11.7909 8 14C8 16.2091 9.79086 18 12 18Z"
        fill={accentColor}
        stroke={accentColor}
        strokeWidth={2}
      />
    </Svg>
  );
}
