'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import styles from './Navbar.module.css';
import { useState, useEffect } from 'react';
import { sound } from '@/lib/sound';

export default function Navbar() {
  const pathname = usePathname();
  const { user, coins, logout } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load initial collapsed state from localStorage
  useEffect(() => {
    const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    setIsCollapsed(collapsed);
  }, []);

  if (!user) return null;

  const toggleSidebar = () => {
    sound.playClick();
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const isActive = (path: string) => {
    return pathname === path ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;
  };

  return (
    <nav className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <button 
        className={styles.toggleBtn} 
        onClick={toggleSidebar} 
        onMouseEnter={() => sound.playHover()}
        title={isCollapsed ? "Expandir" : "Colapsar"}
      >
        {isCollapsed ? '>' : '<'}
      </button>

      <div className={styles.brandWrapper}>
        <Link 
          href="/dashboard" 
          className={styles.brand} 
          onMouseEnter={() => sound.playHover()} 
          onClick={() => sound.playClick()}
        >
          {isCollapsed ? 'AE' : 'AETHERIA'}
        </Link>
      </div>

      <div className={styles.navLinks}>
        <Link 
          href="/dashboard" 
          className={isActive('/dashboard')} 
          onMouseEnter={() => sound.playHover()} 
          onClick={() => sound.playClick()}
        >
          <span className={styles.icon}>DS</span>
          {!isCollapsed && <span className={styles.label}>Dashboard</span>}
        </Link>
        <Link 
          href="/album" 
          className={isActive('/album')} 
          onMouseEnter={() => sound.playHover()} 
          onClick={() => sound.playClick()}
        >
          <span className={styles.icon}>CL</span>
          {!isCollapsed && <span className={styles.label}>Colección</span>}
        </Link>
        <Link 
          href="/upgrader" 
          className={isActive('/upgrader')} 
          onMouseEnter={() => sound.playHover()} 
          onClick={() => sound.playClick()}
        >
          <span className={styles.icon}>UP</span>
          {!isCollapsed && <span className={styles.label}>Upgrader</span>}
        </Link>
        <Link 
          href="/shop" 
          className={isActive('/shop')} 
          onMouseEnter={() => sound.playHover()} 
          onClick={() => sound.playClick()}
        >
          <span className={styles.icon}>SH</span>
          {!isCollapsed && <span className={styles.label}>Tienda</span>}
        </Link>
        {user.role === 'ADMIN' && (
          <Link 
            href="/admin" 
            className={isActive('/admin')} 
            onMouseEnter={() => sound.playHover()} 
            onClick={() => sound.playClick()}
          >
            <span className={styles.icon}>AD</span>
            {!isCollapsed && <span className={styles.label}>Admin</span>}
          </Link>
        )}
      </div>

      <div className={styles.footerActions}>
        <div className={styles.currency} title="Esencias de Aether">
          <span className={styles.coinText}>{isCollapsed ? 'AE' : 'AETHER'}</span>
          {!isCollapsed && <span className={styles.currencyValue}>{Math.floor(coins).toLocaleString()}</span>}
        </div>
        <button 
          onClick={() => { sound.playClick(); logout(); }} 
          className={styles.logoutBtn} 
          onMouseEnter={() => sound.playHover()}
        >
          <span className={styles.icon}>GT</span>
          {!isCollapsed && <span className={styles.label}>Salir</span>}
        </button>
      </div>
    </nav>
  );
}
