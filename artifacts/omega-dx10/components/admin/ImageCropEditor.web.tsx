import { useEffect } from 'react';

interface Props {
  visible: boolean;
  imageUri: string;
  targetWidth: number;
  targetHeight: number;
  onConfirm: (base64: string, mimeType: string) => void;
  onCancel: () => void;
}

export default function ImageCropEditor({ visible, imageUri, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!visible || !imageUri) return;

    let cancelled = false;

    async function convertToBase64() {
      try {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const mimeType = blob.type || 'image/png';
        const reader = new FileReader();
        reader.onload = () => {
          if (cancelled) return;
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          if (base64) onConfirm(base64, mimeType);
          else onCancel();
        };
        reader.onerror = () => { if (!cancelled) onCancel(); };
        reader.readAsDataURL(blob);
      } catch {
        if (!cancelled) onCancel();
      }
    }

    convertToBase64();
    return () => { cancelled = true; };
  }, [visible, imageUri]);

  return null;
}
