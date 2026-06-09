import React, { useEffect, useState } from 'react';
import { View, Image, Platform } from 'react-native';

interface SpriteSheetProps {
  source: any;
  totalWidth: number;
  frameHeight: number;
  frameCount: number;
  fps?: number;
  displaySize?: number;
  frameSequence?: number[];
}

export function SpriteSheet({ source, totalWidth, frameHeight, frameCount, fps = 4, displaySize = 64, frameSequence }: SpriteSheetProps) {
  const sequence = frameSequence ?? Array.from({ length: frameCount }, (_, i) => i);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % sequence.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [sequence.length, fps]);

  const frame = sequence[step];
  const frameW = totalWidth / frameCount;
  const scale = displaySize / frameW;
  const scaledH = frameHeight * scale;
  const scaledTotalW = totalWidth * scale;
  const offsetX = Math.round(-frame * displaySize);

  const pixelatedStyle = Platform.OS === 'web'
    ? ({ imageRendering: 'pixelated' } as any)
    : {};

  return (
    <View style={{ width: displaySize, height: scaledH, overflow: 'hidden' }}>
      <Image
        source={source}
        style={{
          width: scaledTotalW,
          height: scaledH,
          transform: [{ translateX: offsetX }],
          ...pixelatedStyle,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
