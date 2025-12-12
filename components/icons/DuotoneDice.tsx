import React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

interface DuotoneDiceProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function DuotoneDice({ 
  size = 24, 
  primaryColor = COLORS.primary, 
  accentColor = COLORS.secondary 
}: DuotoneDiceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Dice body - Primary outline */}
      <Rect
        x={3}
        y={3}
        width={18}
        height={18}
        rx={3}
        stroke={primaryColor}
        strokeWidth={4}
        fill="none"
      />
      {/* Dots - Accent fill */}
      <Circle cx={8} cy={8} r={1.5} fill={accentColor} />
      <Circle cx={12} cy={12} r={1.5} fill={accentColor} />
      <Circle cx={16} cy={16} r={1.5} fill={accentColor} />
      <Circle cx={16} cy={8} r={1.5} fill={accentColor} />
      <Circle cx={8} cy={16} r={1.5} fill={accentColor} />
    </Svg>
  );
}


