import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

interface DuotoneEyeProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function DuotoneEye({ 
  size = 24, 
  primaryColor = COLORS.primary, 
  accentColor = COLORS.secondary 
}: DuotoneEyeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Eye outline - Primary */}
      <Path
        d="M2.5 12C2.5 12 6 5 12 5C18 5 21.5 12 21.5 12C21.5 12 18 19 12 19C6 19 2.5 12 2.5 12Z"
        stroke={primaryColor}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Iris - Accent */}
      <Circle
        cx={12}
        cy={12}
        r={3.5}
        fill={accentColor}
        stroke={accentColor}
        strokeWidth={2}
      />
      {/* Pupil highlight */}
      <Circle
        cx={13}
        cy={11}
        r={1}
        fill="#FFFFFF"
        opacity={0.8}
      />
    </Svg>
  );
}



