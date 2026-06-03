'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest, deleteCookie, getCookie } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  coins: number;
  role: string;
  lastClaim: string;
}


interface ElementConfig {
  id: string;
  name: string;
  color: string;
}

interface RarityConfig {
  id: string;
  name: string;
  color: string;
  weight: number;
  priority?: number;
}

interface SetConfig {
  id: string;
  name: string;
}

interface GameConfig {
  elements: ElementConfig[];
  rarities: RarityConfig[];
  sets: SetConfig[];
}

interface UserContextProps {
  user: User | null;
  coins: number;
  loading: boolean;
  gameConfig: GameConfig | null;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  claimIdleCoins: () => Promise<void>;
  deductCoins: (amount: number) => void;
  addCoinsLocally: (amount: number) => void;
  refreshGameConfig: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingClicks, setPendingClicks] = useState<number>(0);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  const refreshGameConfig = async () => {
    try {
      const data = await apiRequest('/collection/game-config');
      setGameConfig(data);
    } catch (err) {
      console.error('Error fetching game config in provider:', err);
    }
  };

  useEffect(() => {
    refreshGameConfig();
  }, []);

  // Generación pasiva: 10 monedas por minuto (0.166667 por segundo)
  const COINS_PER_SECOND = 0.166667;

  const refreshProfile = async () => {
    const token = getCookie('token');
    if (!token) {
      setUser(null);
      setCoins(0);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/users/profile');
      setUser(data);
      setCoins(data.coins);
      await refreshGameConfig();
    } catch (err) {
      console.error('Error fetching profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const claimIdleCoins = async () => {
    if (!user) return;
    const clicksToSync = pendingClicks;
    setPendingClicks(0);

    try {
      const res = await apiRequest('/users/claim-idle', {
        method: 'POST',
        body: JSON.stringify({ clicks: clicksToSync }),
      });
      setCoins(res.totalCoins);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              coins: res.totalCoins,
              lastClaim: res.lastClaim,
            }
          : null,
      );
    } catch (err) {
      console.error('Error claiming idle coins:', err);
      setPendingClicks((prev) => prev + clicksToSync);
    }
  };

  const deductCoins = (amount: number) => {
    setCoins((prev) => Math.max(0, prev - amount));
    setUser((prev) => (prev ? { ...prev, coins: Math.max(0, prev.coins - amount) } : null));
  };

  const addCoinsLocally = (amount: number) => {
    setCoins((prev) => prev + amount);
    setUser((prev) => (prev ? { ...prev, coins: prev.coins + amount } : null));
    setPendingClicks((prev) => prev + 1); // +1 click (cada click suma 5 monedas)
  };

  const logout = () => {
    deleteCookie('token');
    localStorage.removeItem('user');
    setUser(null);
    setCoins(0);
    router.push('/login');
  };

  useEffect(() => {
    const isAuthRoute = pathname === '/login' || pathname === '/register';
    if (!isAuthRoute) {
      const syncAndRefresh = async () => {
        await claimIdleCoins();
        await refreshProfile();
      };
      syncAndRefresh();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  // Tilde del contador local cliente cada 100ms para efecto visual "ticking" fluido
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      setCoins((prev) => prev + COINS_PER_SECOND * 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [user]);

  // Sincronización automática de monedas con la base de datos (cada 20 segundos)
  useEffect(() => {
    if (!user) return;

    const syncInterval = setInterval(() => {
      claimIdleCoins();
    }, 20000);

    return () => clearInterval(syncInterval);
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        coins,
        loading,
        gameConfig,
        logout,
        refreshProfile,
        claimIdleCoins,
        deductCoins,
        addCoinsLocally,
        refreshGameConfig,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
}
