'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user, coins, logout } = useUser();

  if (!user) return null;

  const isActive = (path: string) => {
    return pathname === path ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;
  };

  return (
    <nav className={styles.navbar}>
      <Link href="/dashboard" className={styles.brand}>
        AETHERIA
      </Link>

      <div className={styles.navLinks}>
        <Link href="/dashboard" className={isActive('/dashboard')}>
          Dashboard
        </Link>
        <Link href="/album" className={isActive('/album')}>
          Colección
        </Link>
        <Link href="/shop" className={isActive('/shop')}>
          Tienda
        </Link>
        {user.role === 'ADMIN' && (
          <Link href="/admin" className={isActive('/admin')}>
            Administrador
          </Link>
        )}

      </div>

      <div className={styles.actions}>
        <div className={styles.currency} title="Tus Esencias de Aether acumuladas">
          <span className={styles.coinIcon}>✨</span>
          <span>{Math.floor(coins).toLocaleString()}</span>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>
          Salir
        </button>
      </div>
    </nav>
  );
}
