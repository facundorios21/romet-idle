'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import { useUser } from '@/context/UserContext';
import { sound } from '@/lib/sound';
import styles from './dashboard.module.css';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  value: string;
}

export default function DashboardPage() {
  const { user, coins, claimIdleCoins, addCoinsLocally, loading } = useUser();
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const [syncing, setSyncing] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#f3f4f6',
        }}
      >
        <h2>Cargando reino de Aetheria...</h2>
      </div>
    );
  }

  if (!user) return null;

  const handleOrbClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const value = '+5';
    addCoinsLocally(5);
    sound.playOrbClick();

    const newParticle: ClickParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      value,
    };

    setParticles((prev) => [...prev, newParticle]);

    // Eliminar partícula después de que finalice la animación
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 800);
  };

  const handleManualSync = async () => {
    sound.playClick();
    setSyncing(true);
    await claimIdleCoins();
    setSyncing(false);
  };

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content-wrapper">
        <main className={styles.container}>
          <div className={`${styles.welcomeCard} glass-panel`}>
            <h1 className={styles.welcomeTitle}>¡Saludos, {user.username}!</h1>
            <p className={styles.welcomeSubtitle}>
              Bienvenido al extractor de esencias de Aetheria. Tu colección te espera.
            </p>
          </div>

          <div className={styles.grid}>
            {/* Extractor de esencias */}
            <div className={`${styles.extractorCard} glass-panel`}>
              <h2 className={styles.extractorTitle}>Extractor de Esencias</h2>

              <div className={styles.orbContainer} onClick={handleOrbClick}>
                <div className={styles.orb} />
                {particles.map((p) => (
                  <span key={p.id} className={styles.particle} style={{ left: p.x, top: p.y }}>
                    {p.value}
                  </span>
                ))}
              </div>

              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Haz clic sobre el Orbe Aether para extraer energía activamente.
              </p>
            </div>

            {/* Estadísticas del jugador */}
            <div className={`${styles.statsCard} glass-panel`}>
              <div>
                <h2 className={styles.statsTitle}>Tus Estadísticas</h2>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Esencias de Aether:</span>
                  <span className={`${styles.statValue} ${styles.coinsValue}`}>
                    {Math.floor(coins).toLocaleString()}
                  </span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Generación Pasiva:</span>
                  <span className={styles.statValue}>+10 esencias / min</span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Último reclamo guardado:</span>
                  <span className={styles.statValue}>
                    {new Date(user.lastClaim).toLocaleTimeString()}
                  </span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Rango del Coleccionista:</span>
                  <span className={styles.statValue} style={{ color: 'var(--gold-primary)' }}>
                    Novicio
                  </span>
                </div>
              </div>

              <div className={styles.syncContainer}>
                <p className={styles.syncText}>
                  Las esencias se guardan automáticamente cada 20 segundos en la base de datos.
                </p>
                <button
                  onClick={handleManualSync}
                  className="btn-secondary"
                  style={{ width: '100%' }}
                  disabled={syncing}
                  onMouseEnter={() => sound.playHover()}
                >
                  {syncing ? 'Guardando...' : 'Guardar Progreso Manual'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
