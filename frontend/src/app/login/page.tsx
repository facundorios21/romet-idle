'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, setCookie } from '@/lib/api';
import { sound } from '@/lib/sound';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playClick();

    const cleanEmail = email.trim();
    const cleanPassword = password;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      sound.playError();
      setError('El formato de correo electrónico no es válido.');
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      sound.playError();
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Guardar token en cookies (1 día)
      setCookie('token', res.accessToken, 1);

      // Guardar datos básicos del usuario
      localStorage.setItem('user', JSON.stringify(res.user));

      sound.playUpgradeSuccess();
      router.push('/dashboard');
    } catch (err: any) {
      sound.playError();
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <h1 className={styles.title}>Aetheria</h1>
        <p className={styles.subtitle}>Juego de Coleccionismo Místico</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              className="glass-input"
              placeholder="ejemplo@aetheria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="glass-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
            onMouseEnter={() => sound.playHover()}
          >
            {loading ? 'Iniciando Sesión...' : 'Entrar al Reino'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿No tienes una cuenta?{' '}
          <Link 
            href="/register" 
            className={styles.link}
            onClick={() => sound.playClick()}
            onMouseEnter={() => sound.playHover()}
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
