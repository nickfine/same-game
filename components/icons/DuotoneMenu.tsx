import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

interface DuotoneMenuProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function DuotoneMenu({ 
  size = 24, 
  primaryColor = COLORS.primary, 
  accentColor = COLORS.secondary 
}: DuotoneMenuProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top line - Primary */}
      <Line
        x1={3}
        y1={6}
        x2={21}
        y2={6}
        stroke={primaryColor}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Middle line - Accent (shorter) */}
      <Line
        x1={3}
        y1={12}
        x2={16}
        y2={12}
        stroke={accentColor}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Bottom line - Primary */}
      <Line
        x1={3}
        y1={18}
        x2={21}
        y2={18}
        stroke={primaryColor}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
