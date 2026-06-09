import React, { useState, useCallback } from 'react';
import { Platform, View, LayoutChangeEvent, ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const STEP = 6;

const PIXEL_POLYGON_WEB =
  'polygon(' +
  `${STEP}px 0px, calc(100% - ${STEP}px) 0px,` +
  `calc(100% - 4px) 0px, calc(100% - 4px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 4px, 100% 4px,` +
  `100% calc(100% - ${STEP}px),` +
  `100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px), calc(100% - 4px) 100%,` +
  `calc(100% - ${STEP}px) 100%, ${STEP}px 100%,` +
  `4px 100%, 4px calc(100% - 2px), 2px calc(100% - 2px), 2px calc(100% - 4px), 0px calc(100% - 4px),` +
  `0px ${STEP}px,` +
  `0px 4px, 2px 4px, 2px 2px, 4px 2px, 4px 0px` +
  ')';

interface PixelBoxProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  bgColor?: string;
  [key: string]: any;
}

/**
 * Cross-platform pixel-art chamfered corners.
 * Web  → CSS clipPath polygon (no borders, no rounded corners).
 * Native → overflow:hidden square + SVG corner-cutters drawn on top.
 *
 * Pass `bgColor` matching the PARENT background so the corner triangles blend in.
 * Defaults to '#0a0a0f' (app root background).
 */
export default function PixelBox({
  style,
  children,
  bgColor = '#0a0a0f',
  ...rest
}: PixelBoxProps) {
  if (Platform.OS === 'web') {
    return (
      <View
        style={[style, { clipPath: PIXEL_POLYGON_WEB, borderRadius: 0, borderWidth: 0 } as any]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      const w = Math.round(width);
      const h = Math.round(height);
      if (w !== size.w || h !== size.h) setSize({ w, h });
    },
    [size.w, size.h],
  );

  const { w, h } = size;
  const s = STEP;

  return (
    <View style={[style, { borderRadius: 0, overflow: 'hidden' }]} onLayout={onLayout} {...rest}>
      {children}
      {w > 0 && h > 0 && (
        <Svg
          width={w}
          height={h}
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Top-left corner cutter */}
          <Polygon points={`0,0 ${s},0 0,${s}`} fill={bgColor} />
          {/* Top-right corner cutter */}
          <Polygon points={`${w - s},0 ${w},0 ${w},${s}`} fill={bgColor} />
          {/* Bottom-right corner cutter */}
          <Polygon points={`${w},${h - s} ${w},${h} ${w - s},${h}`} fill={bgColor} />
          {/* Bottom-left corner cutter */}
          <Polygon points={`0,${h - s} ${s},${h} 0,${h}`} fill={bgColor} />
        </Svg>
      )}
    </View>
  );
}
