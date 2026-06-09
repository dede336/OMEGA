import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, View } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const C1 = '#00ffff'; // cyan
const C2 = '#ff0044'; // red/magenta
const C3 = '#00ff41'; // green
const C4 = '#a855f7'; // purple

// Small pixel square
function Px({ x, y, size = 4, color = C1, opacity = 0.8 }: {
  x: number; y: number; size?: number; color?: string; opacity?: number;
}) {
  return (
    <View style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      backgroundColor: color,
      opacity,
    }} />
  );
}

// L-shaped corner bracket
function Corner({ pos, color, len = 28, thick = 2 }: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
  color: string;
  len?: number;
  thick?: number;
}) {
  const isTop  = pos === 'tl' || pos === 'tr';
  const isLeft = pos === 'tl' || pos === 'bl';

  const edge: any = {
    position: 'absolute',
    [isTop  ? 'top'    : 'bottom']: 0,
    [isLeft ? 'left'   : 'right' ]: 0,
  };

  return (
    <View style={[{ position: 'absolute', width: len + 8, height: len + 8 }, edge]}>
      {/* Horizontal bar */}
      <View style={{
        position: 'absolute',
        [isTop  ? 'top'    : 'bottom']: 0,
        [isLeft ? 'left'   : 'right' ]: 0,
        width: len, height: thick,
        backgroundColor: color, opacity: 0.9,
      }} />
      {/* Vertical bar */}
      <View style={{
        position: 'absolute',
        [isTop  ? 'top'    : 'bottom']: 0,
        [isLeft ? 'left'   : 'right' ]: 0,
        width: thick, height: len,
        backgroundColor: color, opacity: 0.9,
      }} />
      {/* Corner dot */}
      <View style={{
        position: 'absolute',
        [isTop  ? 'top'    : 'bottom']: 0,
        [isLeft ? 'left'   : 'right' ]: 0,
        width: 6, height: 6,
        backgroundColor: color, opacity: 1,
      }} />
      {/* Tip dot on horizontal */}
      <View style={{
        position: 'absolute',
        [isTop  ? 'top'    : 'bottom']: isTop ? -2 : -2,
        [isLeft ? 'left'   : 'right' ]: isLeft ? len - 2 : len - 2,
        width: 5, height: 5,
        backgroundColor: color, opacity: 0.7,
      }} />
      {/* Tip dot on vertical */}
      <View style={{
        position: 'absolute',
        [isTop  ? 'top'    : 'bottom']: isTop ? len - 2 : len - 2,
        [isLeft ? 'left'   : 'right' ]: isLeft ? -2 : -2,
        width: 5, height: 5,
        backgroundColor: color, opacity: 0.7,
      }} />
    </View>
  );
}

// Animated pulsing glow line segment
function GlowSegment({ horizontal, pos, length, offset, color }: {
  horizontal: boolean;
  pos: 'start' | 'end';
  length: number;
  offset: number;
  color: string;
}) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 1200 + Math.random() * 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.25, duration: 1000 + Math.random() * 600, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const style: any = {
    position: 'absolute',
    backgroundColor: color,
    opacity: pulse,
  };

  if (horizontal) {
    style.height = 2;
    style.width  = length;
    style.left   = offset;
    style[pos === 'start' ? 'top' : 'bottom'] = 0;
  } else {
    style.width  = 2;
    style.height = length;
    style.top    = offset;
    style[pos === 'start' ? 'left' : 'right'] = 0;
  }

  return <Animated.View style={style} />;
}

export default function GlitchOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">

      {/* ── Corners ── */}
      <Corner pos="tl" color={C1} len={32} />
      <Corner pos="tr" color={C2} len={32} />
      <Corner pos="bl" color={C3} len={32} />
      <Corner pos="br" color={C4} len={32} />

      {/* ── Top edge segments ── */}
      <GlowSegment horizontal pos="start" offset={W * 0.25} length={W * 0.12} color={C1} />
      <GlowSegment horizontal pos="start" offset={W * 0.62} length={W * 0.10} color={C2} />

      {/* ── Bottom edge segments ── */}
      <GlowSegment horizontal pos="end" offset={W * 0.18} length={W * 0.14} color={C3} />
      <GlowSegment horizontal pos="end" offset={W * 0.65} length={W * 0.12} color={C4} />

      {/* ── Left edge segments ── */}
      <GlowSegment horizontal={false} pos="start" offset={H * 0.28} length={H * 0.08} color={C3} />
      <GlowSegment horizontal={false} pos="start" offset={H * 0.60} length={H * 0.06} color={C1} />

      {/* ── Right edge segments ── */}
      <GlowSegment horizontal={false} pos="end" offset={H * 0.30} length={H * 0.07} color={C2} />
      <GlowSegment horizontal={false} pos="end" offset={H * 0.58} length={H * 0.09} color={C4} />

      {/* ── Pixel clusters — top ── */}
      <Px x={W * 0.25 - 6} y={0}  size={4} color={C1} />
      <Px x={W * 0.25 - 6} y={5}  size={3} color={C1} opacity={0.5} />
      <Px x={W * 0.37 + 3} y={0}  size={3} color={C1} opacity={0.6} />

      <Px x={W * 0.62 - 4} y={0}  size={4} color={C2} />
      <Px x={W * 0.62 - 4} y={5}  size={2} color={C2} opacity={0.4} />
      <Px x={W * 0.72 + 1} y={0}  size={3} color={C2} opacity={0.7} />
      <Px x={W * 0.72 + 5} y={3}  size={2} color={C2} opacity={0.4} />

      {/* ── Pixel clusters — bottom ── */}
      <Px x={W * 0.18 - 5} y={H - 4} size={4} color={C3} />
      <Px x={W * 0.18 - 5} y={H - 9} size={3} color={C3} opacity={0.5} />
      <Px x={W * 0.32 + 2} y={H - 4} size={3} color={C3} opacity={0.6} />

      <Px x={W * 0.65 - 4} y={H - 4} size={4} color={C4} />
      <Px x={W * 0.65 - 4} y={H - 9} size={2} color={C4} opacity={0.4} />
      <Px x={W * 0.77 + 1} y={H - 4} size={3} color={C4} opacity={0.7} />

      {/* ── Pixel clusters — left ── */}
      <Px x={0} y={H * 0.28 - 5} size={4} color={C3} />
      <Px x={5} y={H * 0.28 - 5} size={3} color={C3} opacity={0.5} />
      <Px x={0} y={H * 0.28 + H * 0.08} size={3} color={C3} opacity={0.6} />

      <Px x={0} y={H * 0.60 - 4} size={4} color={C1} />
      <Px x={5} y={H * 0.60 - 4} size={2} color={C1} opacity={0.4} />
      <Px x={0} y={H * 0.60 + H * 0.06 + 1} size={3} color={C1} opacity={0.7} />

      {/* ── Pixel clusters — right ── */}
      <Px x={W - 4} y={H * 0.30 - 5} size={4} color={C2} />
      <Px x={W - 9} y={H * 0.30 - 5} size={3} color={C2} opacity={0.5} />
      <Px x={W - 4} y={H * 0.30 + H * 0.07} size={3} color={C2} opacity={0.6} />

      <Px x={W - 4} y={H * 0.58 - 4} size={4} color={C4} />
      <Px x={W - 9} y={H * 0.58 - 4} size={2} color={C4} opacity={0.4} />
      <Px x={W - 4} y={H * 0.58 + H * 0.09 + 1} size={3} color={C4} opacity={0.7} />

      {/* ── Extra corner pixel detail — tl ── */}
      <Px x={36}  y={0}  size={3} color={C1} opacity={0.6} />
      <Px x={42}  y={0}  size={2} color={C1} opacity={0.4} />
      <Px x={0}   y={36} size={3} color={C1} opacity={0.6} />
      <Px x={0}   y={42} size={2} color={C1} opacity={0.4} />

      {/* ── Extra corner pixel detail — tr ── */}
      <Px x={W - 39} y={0}  size={3} color={C2} opacity={0.6} />
      <Px x={W - 45} y={0}  size={2} color={C2} opacity={0.4} />
      <Px x={W - 4}  y={36} size={3} color={C2} opacity={0.6} />
      <Px x={W - 4}  y={42} size={2} color={C2} opacity={0.4} />

      {/* ── Extra corner pixel detail — bl ── */}
      <Px x={36}  y={H - 4} size={3} color={C3} opacity={0.6} />
      <Px x={42}  y={H - 4} size={2} color={C3} opacity={0.4} />
      <Px x={0}   y={H - 39} size={3} color={C3} opacity={0.6} />
      <Px x={0}   y={H - 45} size={2} color={C3} opacity={0.4} />

      {/* ── Extra corner pixel detail — br ── */}
      <Px x={W - 39} y={H - 4} size={3} color={C4} opacity={0.6} />
      <Px x={W - 45} y={H - 4} size={2} color={C4} opacity={0.4} />
      <Px x={W - 4}  y={H - 39} size={3} color={C4} opacity={0.6} />
      <Px x={W - 4}  y={H - 45} size={2} color={C4} opacity={0.4} />

    </View>
  );
}
