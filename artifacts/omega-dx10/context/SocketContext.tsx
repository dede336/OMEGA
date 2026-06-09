import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: number;
  from: string;
  to: string;
  content: string;
  createdAt: string;
}

export interface GlobalChatMessage {
  id: number;
  from: string;
  content: string;
  createdAt: string;
}

export interface ActiveBattleMember {
  characterId: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  attackName: string;
  spiritName: string;
  level: number;
}

export interface BattlePlayerState {
  team: ActiveBattleMember[];
  activeIdx: number;
  defending: boolean;
}

export interface BattleStatePayload {
  battleId: string;
  turn: string;
  log: string[];
  phase: string;
  winner?: string;
  players: Record<string, BattlePlayerState>;
}

export interface BattleInvite {
  inviteId: string;
  from: string;
  fromPlayerName: string;
  team: ActiveBattleMember[];
}

export interface ActiveBattleInfo {
  battleId: string;
  state: BattleStatePayload;
  yourTurn: boolean;
  opponentName: string;
  opponentPlayerName: string;
  ended: boolean;
  youWon?: boolean;
  surrendered?: boolean;
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: Set<string>;
  unreadCounts: Record<string, number>;
  recentMessages: Record<string, ChatMessage[]>;
  markRead: (username: string) => void;
  sendMessage: (to: string, content: string) => void;
  totalUnread: number;
  // Global chat
  globalMessages: GlobalChatMessage[];
  sendGlobalMessage: (content: string) => void;
  globalError: string | null;
  clearGlobalError: () => void;
  // Battle
  pendingBattleInvite: BattleInvite | null;
  activeBattle: ActiveBattleInfo | null;
  battleInviteSent: { inviteId: string; to: string } | null;
  battleDeclined: string | null;
  sendBattleInvite: (to: string, team: ActiveBattleMember[], playerName: string) => void;
  acceptBattle: (inviteId: string, team: ActiveBattleMember[], playerName: string) => void;
  declineBattle: (inviteId: string) => void;
  sendBattleAction: (battleId: string, action: 'normal' | 'special' | 'defend') => void;
  surrenderBattle: (battleId: string) => void;
  clearBattle: () => void;
  clearBattleDeclined: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  onlineUsers: new Set(),
  unreadCounts: {},
  recentMessages: {},
  markRead: () => {},
  sendMessage: () => {},
  totalUnread: 0,
  globalMessages: [],
  sendGlobalMessage: () => {},
  globalError: null,
  clearGlobalError: () => {},
  pendingBattleInvite: null,
  activeBattle: null,
  battleInviteSent: null,
  battleDeclined: null,
  sendBattleInvite: () => {},
  acceptBattle: () => {},
  declineBattle: () => {},
  sendBattleAction: () => {},
  surrenderBattle: () => {},
  clearBattle: () => {},
  clearBattleDeclined: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

function getSocketUrl(apiUrl: string): string {
  if (!apiUrl || apiUrl === '/api') return '';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, getApiUrl, isAuthLoaded } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [recentMessages, setRecentMessages] = useState<Record<string, ChatMessage[]>>({});

  // Global chat state
  const [globalMessages, setGlobalMessages] = useState<GlobalChatMessage[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Battle state
  const [pendingBattleInvite, setPendingBattleInvite] = useState<BattleInvite | null>(null);
  const [activeBattle, setActiveBattle] = useState<ActiveBattleInfo | null>(null);
  const [battleInviteSent, setBattleInviteSent] = useState<{ inviteId: string; to: string } | null>(null);
  const [battleDeclined, setBattleDeclined] = useState<string | null>(null);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const markRead = useCallback((username: string) => {
    setUnreadCounts((prev) => ({ ...prev, [username]: 0 }));
    const apiUrl = getApiUrl();
    const tok = token;
    if (tok) {
      fetch(`${apiUrl}/chat/messages/${username}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {});
    }
  }, [getApiUrl, token]);

  const sendGlobalMessage = useCallback((content: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('global:send', { content });
    } else {
      const apiUrl = getApiUrl();
      const tok = token;
      const myUsername = user?.username;
      if (!tok || !myUsername) return;
      fetch(`${apiUrl}/chat/global`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setGlobalError(data.error);
          } else if (data.message) {
            const msg: GlobalChatMessage = data.message;
            setGlobalMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        })
        .catch(() => {});
    }
  }, [getApiUrl, token, user?.username]);

  const clearGlobalError = useCallback(() => setGlobalError(null), []);

  const sendMessage = useCallback((to: string, content: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:send', { to, content });
    } else {
      // REST fallback — persists message even if socket is disconnected
      const apiUrl = getApiUrl();
      const tok = token;
      const myUsername = user?.username;
      if (!tok || !myUsername) return;
      fetch(`${apiUrl}/chat/messages/${to}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.message) {
            const msg: ChatMessage = data.message;
            setRecentMessages((prev) => {
              const existing = prev[to] ?? [];
              const existingIds = new Set(existing.map((m) => m.id));
              if (existingIds.has(msg.id)) return prev;
              return { ...prev, [to]: [...existing, msg] };
            });
          }
        })
        .catch(() => {});
    }
  }, [getApiUrl, token, user?.username]);

  // Battle actions
  const sendBattleInvite = useCallback((to: string, team: ActiveBattleMember[], playerName: string) => {
    socketRef.current?.emit('battle:invite', { to, team, playerName });
  }, []);

  const acceptBattle = useCallback((inviteId: string, team: ActiveBattleMember[], playerName: string) => {
    socketRef.current?.emit('battle:accept', { inviteId, team, playerName });
    setPendingBattleInvite(null);
  }, []);

  const declineBattle = useCallback((inviteId: string) => {
    socketRef.current?.emit('battle:decline', { inviteId });
    setPendingBattleInvite(null);
  }, []);

  const sendBattleAction = useCallback((battleId: string, action: 'normal' | 'special' | 'defend') => {
    socketRef.current?.emit('battle:action', { battleId, action });
  }, []);

  const surrenderBattle = useCallback((battleId: string) => {
    socketRef.current?.emit('battle:surrender', { battleId });
  }, []);

  const clearBattle = useCallback(() => {
    setActiveBattle(null);
    setBattleInviteSent(null);
  }, []);

  const clearBattleDeclined = useCallback(() => {
    setBattleDeclined(null);
  }, []);

  useEffect(() => {
    if (!isAuthLoaded || !user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setOnlineUsers(new Set());
      return;
    }

    const apiUrl = getApiUrl();
    const socketUrl = getSocketUrl(apiUrl);

    const socket = io(socketUrl || undefined!, {
      path: '/api/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 15,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('presence:list', (usernames: string[]) => {
      setOnlineUsers(new Set(usernames));
    });

    socket.on('presence:update', ({ username, online }: { username: string; online: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) next.add(username);
        else next.delete(username);
        return next;
      });
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      const partner = msg.from === user.username ? msg.to : msg.from;
      setRecentMessages((prev) => {
        const existing = prev[partner] ?? [];
        const existingIds = new Set(existing.map((m) => m.id));
        if (existingIds.has(msg.id)) return prev;
        return { ...prev, [partner]: [...existing, msg] };
      });
      if (msg.from !== user.username) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.from]: (prev[msg.from] ?? 0) + 1,
        }));
      }
    });

    socket.on('global:message', (msg: GlobalChatMessage) => {
      setGlobalMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('global:error', ({ message }: { message: string }) => {
      setGlobalError(message);
    });

    // Battle events
    socket.on('battle:invite', (data: BattleInvite) => {
      setPendingBattleInvite(data);
    });

    socket.on('battle:invite_sent', (data: { inviteId: string; to: string }) => {
      setBattleInviteSent(data);
    });

    socket.on('battle:invite_expired', () => {
      setBattleInviteSent(null);
      setPendingBattleInvite(null);
    });

    socket.on('battle:declined', ({ from }: { from: string }) => {
      setBattleInviteSent(null);
      setBattleDeclined(from);
    });

    socket.on('battle:start', (data: {
      battleId: string;
      state: BattleStatePayload;
      yourTurn: boolean;
      opponentName: string;
      opponentPlayerName: string;
    }) => {
      setBattleInviteSent(null);
      setPendingBattleInvite(null);
      setActiveBattle({
        battleId: data.battleId,
        state: data.state,
        yourTurn: data.yourTurn,
        opponentName: data.opponentName,
        opponentPlayerName: data.opponentPlayerName,
        ended: false,
      });
    });

    socket.on('battle:state', (data: { state: BattleStatePayload; yourTurn: boolean }) => {
      setActiveBattle((prev) => prev ? {
        ...prev,
        state: data.state,
        yourTurn: data.yourTurn,
      } : prev);
    });

    socket.on('battle:end', (data: {
      state: BattleStatePayload;
      winner: string;
      youWon: boolean;
      surrendered?: boolean;
      forfeit?: boolean;
    }) => {
      setActiveBattle((prev) => prev ? {
        ...prev,
        state: data.state,
        yourTurn: false,
        ended: true,
        youWon: data.youWon,
        surrendered: data.surrendered || data.forfeit,
      } : prev);
    });

    socket.on('battle:error', ({ message }: { message: string }) => {
      setBattleInviteSent(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setOnlineUsers(new Set());
    };
  }, [isAuthLoaded, user?.username, token]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      onlineUsers,
      unreadCounts,
      recentMessages,
      markRead,
      sendMessage,
      totalUnread,
      globalMessages,
      sendGlobalMessage,
      globalError,
      clearGlobalError,
      pendingBattleInvite,
      activeBattle,
      battleInviteSent,
      battleDeclined,
      sendBattleInvite,
      acceptBattle,
      declineBattle,
      sendBattleAction,
      surrenderBattle,
      clearBattle,
      clearBattleDeclined,
    }}>
      {children}
    </SocketContext.Provider>
  );
}
