'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Card3D from '@/components/Card3D/Card3D';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { sound } from '@/lib/sound';
import styles from './album.module.css';

interface Card {
  id: string;
  name: string;
  description: string;
  rarity: string;
  power: number;
  element: string;
  imageUrl: string;
  set: string;
  owned: boolean;
  countNormal: number;
  levelNormal: number;
  countSpecial: number;
  levelSpecial: number;
}

interface CollectionStats {
  totalCards: number;
  collectedUnique: number;
  completionPercentage: number;
}

export default function AlbumPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  // Estados de Filtro
  const [filterRarity, setFilterRarity] = useState('ALL');
  const [filterElement, setFilterElement] = useState('ALL');
  const [filterOwned, setFilterOwned] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME');

  // Estados del Crafteo
  const { user, refreshProfile, deductCoins, gameConfig } = useUser();
  const [previewShiny, setPreviewShiny] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/collection');
      setCards(data.cards);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la colección.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  const handleInspectCard = (card: Card) => {
    sound.playClick();
    setInspectedCard(card);
    setPreviewShiny(card.countSpecial > 0);
    setUpgradeMessage(null);
  };

  const handleUpgrade = async () => {
    if (!inspectedCard) return;
    setUpgradeMessage(null);
    setUpgradeLoading(true);
    sound.playClick();

    try {
      const res = await apiRequest('/collection/upgrade', {
        method: 'POST',
        body: JSON.stringify({
          cardId: inspectedCard.id,
          isSpecial: previewShiny,
        }),
      });

      // Actualizar monedas en el frontend
      deductCoins(res.coinCost);

      setUpgradeMessage({
        type: 'success',
        text: `¡Fusión exitosa! Carta mejorada a Nivel ${res.newLevel}.`,
      });
      sound.playUpgradeSuccess();

      // Actualizar el estado de la carta inspeccionada localmente
      setInspectedCard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          countNormal: previewShiny ? prev.countNormal : res.newCount,
          levelNormal: previewShiny ? prev.levelNormal : res.newLevel,
          countSpecial: previewShiny ? res.newCount : prev.countSpecial,
          levelSpecial: previewShiny ? res.newLevel : prev.levelSpecial,
        };
      });

      // Refrescar toda la colección
      const data = await apiRequest('/collection');
      setCards(data.cards);
      setStats(data.stats);

      // Sincronizar el perfil
      await refreshProfile();
    } catch (err: any) {
      sound.playError();
      setUpgradeMessage({
        type: 'error',
        text: err.message || 'Error al realizar el crafteo.',
      });
    } finally {
      setUpgradeLoading(false);
    }
  };

  const filteredCards = cards.filter((card) => {
    const matchRarity = filterRarity === 'ALL' || card.rarity === filterRarity;
    const matchElement = filterElement === 'ALL' || card.element === filterElement;

    let matchOwned = true;
    if (filterOwned === 'OWNED') matchOwned = card.owned;
    if (filterOwned === 'UNOWNED') matchOwned = !card.owned;

    return matchRarity && matchElement && matchOwned;
  });

  const getElementName = (el: string) => {
    if (gameConfig && gameConfig.elements) {
      const config = gameConfig.elements.find(
        (item: any) => item.id.toUpperCase() === el.toUpperCase() || item.name.toUpperCase() === el.toUpperCase()
      );
      if (config) return config.name;
    }
    return el;
  };

  const getRarityName = (r: string) => {
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item: any) => item.id.toUpperCase() === r.toUpperCase() || item.name.toUpperCase() === r.toUpperCase()
      );
      if (config) return config.name;
    }
    return r;
  };

  const getRarityColor = (r: string) => {
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item: any) => item.id.toUpperCase() === r.toUpperCase() || item.name.toUpperCase() === r.toUpperCase()
      );
      if (config && config.color) {
        return config.color;
      }
    }
    switch (r.toUpperCase()) {
      case 'COMMON': return 'var(--rarity-common)';
      case 'RARE': return 'var(--rarity-rare)';
      case 'EPIC': return 'var(--rarity-epic)';
      case 'LEGENDARY': return 'var(--rarity-legendary)';
      case 'MYTHIC': return 'var(--rarity-mythic)';
      default: return '#fff';
    }
  };

  const getSetName = (s: string) => {
    if (gameConfig && gameConfig.sets) {
      const config = gameConfig.sets.find(
        (item: any) => item.id.toUpperCase() === s.toUpperCase() || item.name.toUpperCase() === s.toUpperCase()
      );
      if (config) return config.name;
    }
    return s;
  };

  const getRarityPriority = (r: string) => {
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item) => item.id.toUpperCase() === r.toUpperCase() || item.name.toUpperCase() === r.toUpperCase()
      );
      if (config && typeof config.priority === 'number') {
        return config.priority;
      }
    }
    switch (r.toUpperCase()) {
      case 'COMMON': return 1;
      case 'RARE': return 3;
      case 'EPIC': return 5;
      case 'LEGENDARY': return 8;
      case 'MYTHIC': return 10;
      default: return 1;
    }
  };

  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'POWER_DESC') {
      const powerA = Math.round(a.power * (a.countSpecial > 0 ? 1.2 : 1.0) * (1 + ((a.countSpecial > 0 ? a.levelSpecial : a.levelNormal) - 1) * 0.15));
      const powerB = Math.round(b.power * (b.countSpecial > 0 ? 1.2 : 1.0) * (1 + ((b.countSpecial > 0 ? b.levelSpecial : b.levelNormal) - 1) * 0.15));
      return powerB - powerA;
    }
    if (sortBy === 'POWER_ASC') {
      const powerA = Math.round(a.power * (a.countSpecial > 0 ? 1.2 : 1.0) * (1 + ((a.countSpecial > 0 ? a.levelSpecial : a.levelNormal) - 1) * 0.15));
      const powerB = Math.round(b.power * (b.countSpecial > 0 ? 1.2 : 1.0) * (1 + ((b.countSpecial > 0 ? b.levelSpecial : b.levelNormal) - 1) * 0.15));
      return powerA - powerB;
    }
    if (sortBy === 'RARITY_DESC') {
      return getRarityPriority(b.rarity) - getRarityPriority(a.rarity);
    }
    if (sortBy === 'RARITY_ASC') {
      return getRarityPriority(a.rarity) - getRarityPriority(b.rarity);
    }
    return a.name.localeCompare(b.name);
  });

  // Cálculo de poder y costos para previsualización
  const currentLevel = inspectedCard
    ? previewShiny
      ? inspectedCard.levelSpecial
      : inspectedCard.levelNormal
    : 1;

  const currentCount = inspectedCard
    ? previewShiny
      ? inspectedCard.countSpecial
      : inspectedCard.countNormal
    : 0;

  const nextLevel = currentLevel + 1;
  const duplicatesNeeded = currentLevel + 1;
  const goldNeeded = currentLevel * 100;

  const currentPower = inspectedCard
    ? Math.round(inspectedCard.power * (previewShiny ? 1.2 : 1.0) * (1 + (currentLevel - 1) * 0.15))
    : 0;

  const nextPower = inspectedCard
    ? Math.round(inspectedCard.power * (previewShiny ? 1.2 : 1.0) * (1 + (currentLevel) * 0.15))
    : 0;

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content-wrapper">
        <main className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Álbum de Cartas</h1>
            <p className={styles.subtitle}>Gestiona tu colección de criaturas míticas y mejóralas.</p>
          </div>

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <h3>Invocando biblioteca...</h3>
          </div>
        ) : (
          <>
            {/* Panel de Progreso */}
            {stats && (
              <div className={`${styles.progressCard} glass-panel`}>
                <div className={styles.progressInfo}>
                  <div className={styles.progressLabel}>
                    <span>Progreso de Completado</span>
                    <span>
                      {stats.collectedUnique} / {stats.totalCards} únicas
                    </span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${stats.completionPercentage}%` }}
                    />
                  </div>
                </div>
                <div className={styles.percentText}>{stats.completionPercentage}%</div>
              </div>
            )}

            {/* Panel de Filtros */}
            <div className={`${styles.filtersCard} glass-panel`}>
              <h3 className={styles.filtersTitle}>Filtros de Colección</h3>
              <div className={styles.filterGroups}>
                {/* RAREZA */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Rareza</label>
                  <select
                    className={styles.select}
                    value={filterRarity}
                    onChange={(e) => { sound.playClick(); setFilterRarity(e.target.value); }}
                  >
                    <option value="ALL">Todas las rarezas</option>
                    {gameConfig?.rarities?.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* ELEMENTO */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Elemento</label>
                  <select
                    className={styles.select}
                    value={filterElement}
                    onChange={(e) => { sound.playClick(); setFilterElement(e.target.value); }}
                  >
                    <option value="ALL">Todos los elementos</option>
                    {gameConfig?.elements?.map((el: any) => (
                      <option key={el.id} value={el.id}>{el.name}</option>
                    ))}
                  </select>
                </div>

                {/* OBTENCIÓN */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Estado</label>
                  <select
                    className={styles.select}
                    value={filterOwned}
                    onChange={(e) => { sound.playClick(); setFilterOwned(e.target.value); }}
                  >
                    <option value="ALL">Ver todo</option>
                    <option value="OWNED">Obtenidas</option>
                    <option value="UNOWNED">No obtenidas</option>
                  </select>
                </div>

                {/* ORDENACIÓN */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Ordenar por</label>
                  <select
                    className={styles.select}
                    value={sortBy}
                    onChange={(e) => { sound.playClick(); setSortBy(e.target.value); }}
                  >
                    <option value="NAME">Nombre (A-Z)</option>
                    <option value="POWER_DESC">Poder (Mayor a Menor)</option>
                    <option value="POWER_ASC">Poder (Menor a Mayor)</option>
                    <option value="RARITY_DESC">Rareza (Mayor Prioridad)</option>
                    <option value="RARITY_ASC">Rareza (Menor Prioridad)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid de Cartas */}
            {sortedCards.length > 0 ? (
              <div className={styles.grid}>
                {sortedCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleInspectCard(card)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card3D
                      id={card.id}
                      name={card.name}
                      description={card.description}
                      rarity={card.rarity}
                      power={card.power}
                      element={card.element}
                      imageUrl={card.imageUrl}
                      owned={card.owned}
                      countNormal={card.countNormal}
                      countSpecial={card.countSpecial}
                      level={card.countSpecial > 0 ? card.levelSpecial : card.levelNormal}
                      minimal={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noCards}>
                No se encontraron cartas que coincidan con los filtros seleccionados.
              </div>
            )}
          </>
        )}

        {/* Modal de Inspección */}
        {inspectedCard && (
          <div className={styles.modalOverlay} onClick={() => { sound.playClick(); setInspectedCard(null); }}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.cardPreview}>
                <Card3D
                  id={inspectedCard.id}
                  name={inspectedCard.name}
                  description={inspectedCard.description}
                  rarity={inspectedCard.rarity}
                  power={inspectedCard.power}
                  element={inspectedCard.element}
                  imageUrl={inspectedCard.imageUrl}
                  owned={inspectedCard.owned}
                  countNormal={inspectedCard.countNormal}
                  countSpecial={previewShiny ? inspectedCard.countSpecial : 0}
                  isSpecial={previewShiny}
                  level={previewShiny ? inspectedCard.levelSpecial : inspectedCard.levelNormal}
                  minimal={true}
                  illustrationOnly={true}
                />
              </div>

              <div className={styles.detailsArea}>
                <div>
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{inspectedCard.name}</h2>
                    <div className={styles.modalSubtitle}>
                      <span style={{ color: getRarityColor(inspectedCard.rarity), fontWeight: 800 }}>
                        {getRarityName(inspectedCard.rarity)}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{getElementName(inspectedCard.element)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>Poder: {currentPower}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: 'var(--gold-light)', fontWeight: 800 }}>Nivel: {currentLevel}</span>
                    </div>
                  </div>

                  <div className={styles.modalInfoSection}>
                    <h4 className={styles.modalInfoTitle}>Descripción</h4>
                    <p className={styles.modalDescription}>{inspectedCard.description}</p>
                  </div>

                  {/* Selector de versión */}
                  {inspectedCard.owned && (
                    <div className={styles.versionSelector}>
                      <button
                        className={`${styles.versionTab} ${!previewShiny ? styles.versionTabActive : ''}`}
                        onClick={() => {
                          sound.playClick();
                          setPreviewShiny(false);
                          setUpgradeMessage(null);
                        }}
                        onMouseEnter={() => sound.playHover()}
                      >
                        Normal (Nivel {inspectedCard.levelNormal})
                      </button>
                      <button
                        className={`${styles.versionTab} ${previewShiny ? styles.versionTabActive : ''}`}
                        onClick={() => {
                          sound.playClick();
                          setPreviewShiny(true);
                          setUpgradeMessage(null);
                        }}
                        onMouseEnter={() => sound.playHover()}
                        disabled={inspectedCard.countSpecial === 0 && inspectedCard.levelSpecial === 1}
                        style={{
                          opacity: inspectedCard.countSpecial === 0 && inspectedCard.levelSpecial === 1 ? 0.4 : 1,
                        }}
                      >
                        Shiny (Nivel {inspectedCard.levelSpecial})
                      </button>
                    </div>
                  )}

                  {/* Panel de Crafteo / Mejora */}
                  {inspectedCard.owned && (
                    <div className={styles.upgradeSection}>
                      <h4 className={styles.modalInfoTitle}>Transmutación del Alquimista</h4>
                      
                      {upgradeMessage && (
                        <div className={`${styles.upgradeMessage} ${upgradeMessage.type === 'success' ? styles.upgradeSuccess : styles.upgradeError}`}>
                          {upgradeMessage.text}
                        </div>
                      )}

                      <div className={styles.statsGrid}>
                        <div className={styles.statBox}>
                          <span className={styles.statLabel}>Nivel</span>
                          <span className={styles.statValue}>
                            {currentLevel} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{"\u2192"} {nextLevel}</span>
                          </span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.statLabel}>Poder de Ataque</span>
                          <span className={styles.statValue} style={{ color: '#ec4899' }}>
                            Poder: {currentPower} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{"\u2192"} {nextPower}</span>
                          </span>
                        </div>
                      </div>

                      <div className={styles.upgradeCostGrid}>
                        <div className={styles.costItem}>
                          <span className={styles.costLabel}>Duplicados Consumidos</span>
                          <span className={`${styles.costValue} ${currentCount >= duplicatesNeeded ? styles.costSuccess : styles.costFail}`}>
                            {currentCount} / {duplicatesNeeded}
                          </span>
                        </div>
                        <div className={styles.costItem}>
                          <span className={styles.costLabel}>Costo en Esencias</span>
                          <span className={`${styles.costValue} ${(user?.coins || 0) >= goldNeeded ? styles.costSuccess : styles.costFail}`}>
                            {(user?.coins || 0).toFixed(0)} / {goldNeeded}
                          </span>
                        </div>
                      </div>

                      <button
                        className={styles.upgradeBtn}
                        onClick={handleUpgrade}
                        onMouseEnter={() => sound.playHover()}
                        disabled={
                          upgradeLoading ||
                          currentCount < duplicatesNeeded ||
                          (user?.coins || 0) < goldNeeded
                        }
                      >
                        {upgradeLoading ? 'Transmutando Cartas...' : 'Mejorar Carta'}
                      </button>
                    </div>
                  )}

                  <div className={styles.modalInfoSection} style={{ marginTop: 'auto' }}>
                    <h4 className={styles.modalInfoTitle}>Detalles del Set</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Set:{' '}
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {getSetName(inspectedCard.set)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button 
                    onClick={() => { sound.playClick(); setInspectedCard(null); }} 
                    className="btn-primary"
                    onMouseEnter={() => sound.playHover()}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
  );
}
