'use client';

import { useRef, useState } from 'react';
import styles from './Card3D.module.css';

interface CardProps {
  id: string;
  name: string;
  description: string;
  rarity: string; // COMMON, RARE, EPIC, LEGENDARY, MYTHIC
  power: number;
  element: string; // FIRE, WATER, EARTH, AIR, LIGHT, SHADOW
  imageUrl?: string;
  owned?: boolean;
  countNormal?: number;
  countSpecial?: number;
  isSpecial?: boolean; // Force-render como holographic (para la animación de apertura)
}

export default function Card3D({
  id,
  name,
  description,
  rarity,
  power,
  element,
  imageUrl,
  owned = true,
  countNormal = 0,
  countSpecial = 0,
  isSpecial = false,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');

  const getElementEmoji = (el: string) => {
    switch (el.toUpperCase()) {
      case 'FIRE':
        return '🔥';
      case 'WATER':
        return '💧';
      case 'EARTH':
        return '🗿';
      case 'AIR':
        return '🌀';
      case 'SHADOW':
        return '🌑';
      case 'LIGHT':
        return '👑';
      default:
        return '🃏';
    }
  };

  const getRarityColor = (r: string) => {
    switch (r.toUpperCase()) {
      case 'COMMON':
        return 'var(--rarity-common)';
      case 'RARE':
        return 'var(--rarity-rare)';
      case 'EPIC':
        return 'var(--rarity-epic)';
      case 'LEGENDARY':
        return 'var(--rarity-legendary)';
      case 'MYTHIC':
        return 'var(--rarity-mythic)';
      default:
        return 'white';
    }
  };

  const getRarityGlow = (r: string) => {
    switch (r.toUpperCase()) {
      case 'COMMON':
        return 'var(--glow-common)';
      case 'RARE':
        return 'var(--glow-rare)';
      case 'EPIC':
        return 'var(--glow-epic)';
      case 'LEGENDARY':
        return 'var(--glow-legendary)';
      case 'MYTHIC':
        return 'var(--glow-mythic)';
      default:
        return 'none';
    }
  };

  const getElementColor = (el: string) => {
    switch (el.toUpperCase()) {
      case 'FIRE':
        return 'var(--element-fire)';
      case 'WATER':
        return 'var(--element-water)';
      case 'EARTH':
        return 'var(--element-earth)';
      case 'AIR':
        return 'var(--element-air)';
      case 'SHADOW':
        return 'var(--element-shadow)';
      case 'LIGHT':
        return 'var(--element-light)';
      default:
        return '#27272a';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !owned) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const middleX = rect.width / 2;
    const middleY = rect.height / 2;

    // Máximo 15 grados de inclinación
    const rotateY = ((x - middleX) / middleX) * 15;
    const rotateX = ((middleY - y) / middleY) * 15;

    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`);
  };

  const handleMouseLeave = () => {
    setTransform('rotateX(0deg) rotateY(0deg) scale(1)');
  };

  const isShiny = isSpecial || countSpecial > 0;
  const borderStyle = owned
    ? ({
        borderColor: getRarityColor(rarity),
        '--rarity-glow': getRarityGlow(rarity),
      } as React.CSSProperties)
    : {};

  return (
    <div
      className={styles.cardWrapper}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className={`${styles.card} ${!owned ? styles.locked : ''}`}
        style={{ transform, ...borderStyle }}
      >
        {/* Capa holográfica especial */}
        {owned && isShiny && <div className={styles.shinyOverlay} />}

        {/* Badges de cantidades */}
        {owned && (
          <div className={styles.badgeContainer}>
            {countNormal > 0 && <span className={styles.countBadge}>x{countNormal}</span>}
            {countSpecial > 0 && <span className={styles.specialBadge}>SHINY x{countSpecial}</span>}
          </div>
        )}

        <div className={styles.cardInner}>
          <div className={styles.header}>
            <span className={styles.name}>{name}</span>
            {owned && <span className={styles.power}>⚔️ {power}</span>}
          </div>

          <div className={styles.imageArea}>
            {imageUrl ? (
              <img
                src={imageUrl.startsWith('/') ? imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${imageUrl}`}
                alt={name}
                className={styles.cardImageReal}
              />
            ) : (
              <span className={styles.cardImage}>{getElementEmoji(element)}</span>
            )}
          </div>

          <p className={styles.description}>{description}</p>

          <div className={styles.footer}>
            <span className={styles.element} style={{ backgroundColor: getElementColor(element) }}>
              {element}
            </span>
            <span className={styles.rarity} style={{ color: getRarityColor(rarity) }}>
              {rarity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
