import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Image, Modal, TouchableOpacity,
  PanResponder, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { useColors } from '@/hooks/useColors';
import { pixelStyle } from '@/constants/pixelStyle';

const FRAME_W = 280;

interface Props {
  visible: boolean;
  imageUri: string;
  targetWidth: number;
  targetHeight: number;
  onConfirm: (base64: string, mimeType: string) => void;
  onCancel: () => void;
}

export default function ImageCropEditor({ visible, imageUri, targetWidth, targetHeight, onConfirm, onCancel }: Props) {
  const colors = useColors();
  const frameW = FRAME_W;
  const frameH = Math.min(Math.round(FRAME_W * (targetHeight / targetWidth)), 380);

  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  // Refs that PanResponder always reads (avoids stale closure)
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const panBase = useRef({ x: 0, y: 0 });
  const imgSizeRef = useRef({ w: 0, h: 0 });
  const frameHRef = useRef(frameH);
  frameHRef.current = frameH;

  function syncZoom(z: number) { zoomRef.current = z; setZoom(z); }
  function syncPan(p: { x: number; y: number }) { panRef.current = p; setPan({ ...p }); }
  function syncImgSize(s: { w: number; h: number }) { imgSizeRef.current = s; setImgSize({ ...s }); }

  function calcDisplayDims(z: number) {
    const { w, h } = imgSizeRef.current;
    const dW = frameW * z;
    const dH = h > 0 ? Math.round(dW * (h / w)) : frameHRef.current;
    return { dW, dH };
  }

  function clampCoords(x: number, y: number, dW: number, dH: number) {
    return {
      x: Math.max(Math.min(0, frameW - dW), Math.min(0, x)),
      y: Math.max(Math.min(0, frameHRef.current - dH), Math.min(0, y)),
    };
  }

  function getMinZoom(w = imgSizeRef.current.w, h = imgSizeRef.current.h) {
    if (!w || !h) return 1;
    return Math.max(1, (frameHRef.current * w) / (frameW * h));
  }

  // PanResponder created ONCE — reads from refs, never stale
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panBase.current = { ...panRef.current };
      },
      onPanResponderMove: (_, gs) => {
        const { dW, dH } = calcDisplayDims(zoomRef.current);
        const next = clampCoords(panBase.current.x + gs.dx, panBase.current.y + gs.dy, dW, dH);
        panRef.current = next;
        setPan({ ...next });
      },
      onPanResponderRelease: (_, gs) => {
        const { dW, dH } = calcDisplayDims(zoomRef.current);
        const next = clampCoords(panBase.current.x + gs.dx, panBase.current.y + gs.dy, dW, dH);
        panBase.current = next;
        panRef.current = next;
        setPan({ ...next });
      },
    })
  ).current;

  useEffect(() => {
    if (!imageUri || !visible) return;
    syncImgSize({ w: 0, h: 0 });
    Image.getSize(
      imageUri,
      (w, h) => {
        syncImgSize({ w, h });
        const minZ = getMinZoom(w, h);
        const { dW, dH } = calcDisplayDims(minZ);
        const initPan = {
          x: Math.round((frameW - dW) / 2),
          y: Math.round((frameHRef.current - dH) / 2),
        };
        const clamped = clampCoords(initPan.x, initPan.y, dW, dH);
        syncZoom(minZ);
        syncPan(clamped);
        panBase.current = clamped;
      },
      () => {}
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUri, visible]);

  // Derived render values (from state, not refs — fine for rendering)
  const displayW = frameW * zoom;
  const displayH = imgSize.h > 0 ? Math.round(displayW * (imgSize.h / imgSize.w)) : frameH;

  function adjustZoom(delta: number) {
    const minZ = getMinZoom();
    const newZoom = Math.max(minZ, Math.min(zoomRef.current + delta, 6));
    const { dW, dH } = calcDisplayDims(newZoom);
    const next = clampCoords(panRef.current.x, panRef.current.y, dW, dH);
    zoomRef.current = newZoom;
    panBase.current = next;
    syncZoom(newZoom);
    syncPan(next);
  }

  async function handleConfirm() {
    const { w, h } = imgSizeRef.current;
    if (!w || !h) return;
    setProcessing(true);
    try {
      const z = zoomRef.current;
      const p = panRef.current;
      const dW = frameW * z;
      const dH = Math.round(dW * (h / w));
      const scaleX = w / dW;
      const scaleY = h / dH;
      const originX = Math.max(0, Math.round(-p.x * scaleX));
      const originY = Math.max(0, Math.round(-p.y * scaleY));
      const cropW = Math.max(1, Math.min(w - originX, Math.round(frameW * scaleX)));
      const cropH = Math.max(1, Math.min(h - originY, Math.round(frameHRef.current * scaleY)));

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { crop: { originX, originY, width: cropW, height: cropH } },
          { resize: { width: targetWidth, height: targetHeight } },
        ],
        { base64: true, compress: 0.92, format: ImageManipulator.SaveFormat.PNG }
      );
      if (result.base64) onConfirm(result.base64, 'image/png');
    } catch {
      onCancel();
    }
    setProcessing(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Ajustar imagem</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Arraste para mover • +/− para zoom • {targetWidth}×{targetHeight}px
          </Text>

          <View
            style={[styles.frame, { width: frameW, height: frameH, borderColor: colors.primary }]}
            {...panResponder.panHandlers}
          >
            {imgSize.w > 0 ? (
              <Image
                source={{ uri: imageUri }}
                style={{ position: 'absolute', width: displayW, height: displayH, left: pan.x, top: pan.y }}
                resizeMode="stretch"
              />
            ) : (
              <ActivityIndicator color={colors.primary} />
            )}
            <View style={[styles.corner, styles.tl, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.tr, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bl, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.br, { borderColor: colors.primary }]} />
          </View>

          <View style={styles.zoomRow}>
            <TouchableOpacity style={[styles.zoomBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => adjustZoom(-0.25)}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', lineHeight: 26 }}>−</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, flex: 1, textAlign: 'center' }}>
              Zoom {Math.round(zoom * 100)}%
            </Text>
            <TouchableOpacity style={[styles.zoomBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => adjustZoom(0.25)}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', lineHeight: 26 }}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, { borderColor: colors.border }]} onPress={onCancel} disabled={processing}>
              <Text style={{ color: colors.mutedForeground }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={handleConfirm}
              disabled={processing || imgSize.w === 0}
            >
              {processing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '700' }}>Confirmar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  container: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', gap: 14, width: 320, maxWidth: '95%' },
  title: { fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 11, textAlign: 'center' },
  frame: { overflow: 'hidden', borderRadius: 4, borderWidth: 2, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 18, height: 18, borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  zoomBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
});
