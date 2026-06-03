'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, setCookie } from '@/lib/api';
import { sound } from '@/lib/sound';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    sound.playClick();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password; // Preserve spaces in passwords if user wants, but check length

    if (cleanUsername.length < 3) {
      sound.playError();
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      setLoading(false);
      return;
    }

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
      // 1. Registrar usuario
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });

      // 2. Iniciar sesión automáticamente
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // 3. Guardar token
      setCookie('token', res.accessToken, 1);
      localStorage.setItem('user', JSON.stringify(res.user));

      sound.playUpgradeSuccess();
      router.push('/dashboard');
    } catch (err: any) {
      sound.playError();
      setError(err.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <h1 className={styles.title}>Crear Cuenta</h1>
        <p className={styles.subtitle}>Únete al reino de Aetheria</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              className="glass-input"
              placeholder="Tu apodo guerrero"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
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
            {loading ? 'Creando Cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Ya tienes una cuenta?{' '}
          <Link 
            href="/login" 
            className={styles.link}
            onClick={() => sound.playClick()}
            onMouseEnter={() => sound.playHover()}
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
