import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

const SYNC_DEBOUNCE = 10_000;
const SAVE_KEY = 'omega_dx10_save_v3';

async function pushSaveToServer(apiUrl: string, token: string): Promise<void> {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  if (!raw) return;
  const saveData = JSON.parse(raw);
  await fetch(`${apiUrl}/saves`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ saveData }),
  });
}

export function useCloudSync() {
  const { token, getApiUrl } = useAuth();
  const { collection, tamerLevel, tamerExp, playerName, team, tamerId, messages, clearedStages, loadFromCloud } = useGame();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(token);
  const getApiUrlRef = useRef(getApiUrl);
  const initialLoadDone = useRef(false);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { getApiUrlRef.current = getApiUrl; }, [getApiUrl]);

  // Ao abrir o app com sessão ativa, busca o save do servidor imediatamente
  useEffect(() => {
    if (!token || initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadFromCloud(getApiUrl());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const claimedCount = messages.filter((m) => m.rewardClaimed).length;
  const clearedCount = Object.keys(clearedStages).length;

  useEffect(() => {
    const tok = tokenRef.current;
    if (!tok) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const currentTok = tokenRef.current;
      if (!currentTok) return;
      try {
        await pushSaveToServer(getApiUrlRef.current(), currentTok);
      } catch {}
    }, SYNC_DEBOUNCE);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.length, tamerLevel, tamerExp, playerName, team.length, tamerId, token, claimedCount, clearedCount]);

  return { saveNow: () => {
    const tok = tokenRef.current;
    if (!tok) return;
    pushSaveToServer(getApiUrlRef.current(), tok).catch(() => {});
  }};
}
