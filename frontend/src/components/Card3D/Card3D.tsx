'use client';

import { useRef, useState } from 'react';
import styles from './Card3D.module.css';
import { useUser } from '@/context/UserContext';

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
  level?: number;
  minimal?: boolean; // Minimal mode for album grid
  illustrationOnly?: boolean;
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
  level = 1,
  minimal = false,
  illustrationOnly = false,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');

  let gameConfig: any = null;
  try {
    const context = useUser();
    gameConfig = context?.gameConfig;
  } catch (e) {
    // Fallback if rendered outside of provider
  }

  const getRarityPriority = (r: string) => {
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item: any) => item.id.toUpperCase() === r.toUpperCase()
      );
      if (config && typeof config.priority === 'number') {
        return config.priority;
      }
    }
    switch (r.toUpperCase()) {
      case 'COMMON':
        return 1;
      case 'RARE':
        return 3;
      case 'EPIC':
        return 5;
      case 'LEGENDARY':
        return 8;
      case 'MYTHIC':
        return 10;
      default:
        return 1;
    }
  };

  const getPriorityClass = (pri: number) => {
    if (pri <= 3) return styles.priorityLow;
    if (pri <= 6) return styles.priorityMedium;
    if (pri <= 8) return styles.priorityHigh;
    return styles.priorityMax;
  };

  const getElementName = (el: string) => {
    if (!el) return '';
    if (gameConfig && gameConfig.elements) {
      const config = gameConfig.elements.find(
        (item: any) => item.id.toUpperCase() === el.toUpperCase() || item.name.toUpperCase() === el.toUpperCase()
      );
      if (config) return config.name;
    }
    return el;
  };

  const getRarityName = (r: string) => {
    if (!r) return '';
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item: any) => item.id.toUpperCase() === r.toUpperCase() || item.name.toUpperCase() === r.toUpperCase()
      );
      if (config) return config.name;
    }
    return r;
  };

  const getElementAbbreviation = (el: string) => {
    if (!el) return '';
    const resolvedName = getElementName(el);
    return resolvedName.substring(0, 3).toUpperCase();
  };

  const getRarityColor = (r: string) => {
    if (!r) return 'white';
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item: any) => item.id.toUpperCase() === r.toUpperCase() || item.name.toUpperCase() === r.toUpperCase()
      );
      if (config && config.color) {
        return config.color;
      }
    }
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
    if (!r) return 'none';
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item: any) => item.id.toUpperCase() === r.toUpperCase() || item.name.toUpperCase() === r.toUpperCase()
      );
      if (config && config.color) {
        return `0 4px 15px ${config.color}66`;
      }
    }
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
    if (!el) return '#27272a';
    if (gameConfig && gameConfig.elements) {
      const config = gameConfig.elements.find(
        (item: any) => item.id.toUpperCase() === el.toUpperCase() || item.name.toUpperCase() === el.toUpperCase()
      );
      if (config && config.color) {
        return config.color;
      }
    }
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

    const rotateY = ((x - middleX) / middleX) * 15;
    const rotateX = ((middleY - y) / middleY) * 15;

    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`);

    // Set dynamic reflection coordinates
    const sheenX = (x / rect.width) * 100;
    const sheenY = (y / rect.height) * 100;
    card.style.setProperty('--sheen-x', `${sheenX}%`);
    card.style.setProperty('--sheen-y', `${sheenY}%`);
  };

  const handleMouseLeave = () => {
    setTransform('rotateX(0deg) rotateY(0deg) scale(1)');
    if (cardRef.current) {
      cardRef.current.style.setProperty('--sheen-x', '50%');
      cardRef.current.style.setProperty('--sheen-y', '50%');
    }
  };

  const priority = getRarityPriority(rarity);
  const priorityClass = getPriorityClass(priority);
  const isShiny = isSpecial || countSpecial > 0;
  const scaledPower = Math.round(power * (isShiny ? 1.2 : 1.0) * (1 + (level - 1) * 0.15));
  const borderStyle = owned
    ? ({
        '--border-color': getRarityColor(rarity),
        '--rarity-color': getRarityColor(rarity),
        '--rarity-glow': getRarityGlow(rarity),
        '--rarity-priority': priority,
      } as React.CSSProperties)
    : {};

  return (
    <div
      className={`${styles.cardWrapper} ${minimal ? styles.wrapperMinimal : styles.wrapperHorizontal}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className={`${styles.card} ${priorityClass} ${!owned ? styles.locked : ''} ${minimal ? styles.cardMinimal : styles.cardHorizontal}`}
        style={{ transform, ...borderStyle }}
      >
        {/* Holographic shiny layer */}
        {owned && isShiny && <div className={styles.shinyOverlay} />}

        {/* Hover light sheen sweep */}
        {owned && <div className={styles.cardSheen} />}

        {minimal || illustrationOnly ? (
          /* Minimal Vertical Layout for album grid / illustration only */
          <div className={styles.cardInnerMinimal}>
            <div 
              className={styles.imageAreaMinimal}
              style={illustrationOnly ? { marginBottom: 0 } : {}}
            >
              {imageUrl ? (
                <img
                  src={
                    imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')
                      ? imageUrl
                      : imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')
                      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
                      : imageUrl
                  }
                  alt={name}
                  className={styles.cardImageReal}
                />
              ) : (
                <span className={styles.cardImage}>{getElementAbbreviation(element)}</span>
              )}
            </div>
            {!illustrationOnly && (
              <div className={styles.footerMinimal}>
                <span className={styles.element} style={{ backgroundColor: getElementColor(element) }}>
                  {getElementName(element)}
                </span>
                <span className={styles.rarity} style={{ color: getRarityColor(rarity) }}>
                  {getRarityName(rarity)}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* New Horizontal Layout: 50% left illustration, 50% right details */
          <div className={styles.cardInnerHorizontal}>
            {/* Left 50%: Illustration */}
            <div className={styles.leftHalf}>
              {imageUrl ? (
                <img
                  src={
                    imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')
                      ? imageUrl
                      : imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')
                      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
                      : imageUrl
                  }
                  alt={name}
                  className={styles.cardImageReal}
                />
              ) : (
                <span className={styles.cardImage}>{getElementAbbreviation(element)}</span>
              )}
            </div>

            {/* Right 50%: Details */}
            <div className={styles.rightHalf}>
              {/* Quantities Badges if owned */}
              {owned && (
                <div className={styles.badgeContainerHorizontal}>
                  {countNormal > 0 && <span className={styles.countBadge}>x{countNormal}</span>}
                  {countSpecial > 0 && <span className={styles.specialBadge}>SHINY x{countSpecial}</span>}
                </div>
              )}

              <div className={styles.detailsHeader}>
                <div className={styles.nameAndLevel}>
                  {owned && level > 1 && <span className={styles.levelBadge}>Nivel {level}</span>}
                  <span className={styles.name}>{name}</span>
                </div>
                {owned && <span className={styles.power}>Poder: {scaledPower}</span>}
              </div>

              <p className={styles.descriptionText}>{description}</p>

              <div className={styles.detailsFooter}>
                <span className={styles.element} style={{ backgroundColor: getElementColor(element) }}>
                  {getElementName(element)}
                </span>
                <span className={styles.rarity} style={{ color: getRarityColor(rarity) }}>
                  {getRarityName(rarity)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
