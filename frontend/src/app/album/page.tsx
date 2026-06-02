'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Card3D from '@/components/Card3D/Card3D';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/context/UserContext';
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

  // Estados del Crafteo
  const { user, refreshProfile, deductCoins } = useUser();
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
    setInspectedCard(card);
    setPreviewShiny(card.countSpecial > 0);
    setUpgradeMessage(null);
  };

  const handleUpgrade = async () => {
    if (!inspectedCard) return;
    setUpgradeMessage(null);
    setUpgradeLoading(true);

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
    <>
      <Navbar />
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
                    onChange={(e) => setFilterRarity(e.target.value)}
                  >
                    <option value="ALL">Todas las rarezas</option>
                    <option value="COMMON">Común</option>
                    <option value="RARE">Raro</option>
                    <option value="EPIC">Épico</option>
                    <option value="LEGENDARY">Legendario</option>
                    <option value="MYTHIC">Mítico</option>
                  </select>
                </div>

                {/* ELEMENTO */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Elemento</label>
                  <select
                    className={styles.select}
                    value={filterElement}
                    onChange={(e) => setFilterElement(e.target.value)}
                  >
                    <option value="ALL">Todos los elementos</option>
                    <option value="FIRE">Fuego 🔥</option>
                    <option value="WATER">Agua 💧</option>
                    <option value="EARTH">Tierra 🗿</option>
                    <option value="AIR">Viento 🌀</option>
                    <option value="LIGHT">Luz 👑</option>
                    <option value="SHADOW">Sombra 🌑</option>
                  </select>
                </div>

                {/* OBTENCIÓN */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Estado</label>
                  <select
                    className={styles.select}
                    value={filterOwned}
                    onChange={(e) => setFilterOwned(e.target.value)}
                  >
                    <option value="ALL">Ver todo</option>
                    <option value="OWNED">Obtenidas</option>
                    <option value="UNOWNED">No obtenidas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid de Cartas */}
            {filteredCards.length > 0 ? (
              <div className={styles.grid}>
                {filteredCards.map((card) => (
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
          <div className={styles.modalOverlay} onClick={() => setInspectedCard(null)}>
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
                />
              </div>

              <div className={styles.detailsArea}>
                <div>
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{inspectedCard.name}</h2>
                    <div className={styles.modalSubtitle}>
                      <span
                        style={{
                          color: `var(--rarity-${inspectedCard.rarity.toLowerCase()})`,
                        }}
                      >
                        {inspectedCard.rarity}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span>{inspectedCard.element}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span>⚔️ {currentPower} PODER</span>
                    </div>
                  </div>

                  {/* Selector de versión */}
                  {inspectedCard.owned && (
                    <div className={styles.versionSelector}>
                      <button
                        className={`${styles.versionTab} ${!previewShiny ? styles.versionTabActive : ''}`}
                        onClick={() => {
                          setPreviewShiny(false);
                          setUpgradeMessage(null);
                        }}
                      >
                        Normal (Lvl.{inspectedCard.levelNormal})
                      </button>
                      <button
                        className={`${styles.versionTab} ${previewShiny ? styles.versionTabActive : ''}`}
                        onClick={() => {
                          setPreviewShiny(true);
                          setUpgradeMessage(null);
                        }}
                        disabled={inspectedCard.countSpecial === 0 && inspectedCard.levelSpecial === 1}
                        style={{
                          opacity: inspectedCard.countSpecial === 0 && inspectedCard.levelSpecial === 1 ? 0.4 : 1,
                        }}
                      >
                        Shiny (Lvl.{inspectedCard.levelSpecial})
                      </button>
                    </div>
                  )}

                  <div className={styles.modalInfoSection}>
                    <h4 className={styles.modalInfoTitle}>Descripción</h4>
                    <p className={styles.modalDescription}>{inspectedCard.description}</p>
                  </div>

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
                            {currentLevel} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>➔ {nextLevel}</span>
                          </span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.statLabel}>Poder de Ataque</span>
                          <span className={styles.statValue} style={{ color: '#ec4899' }}>
                            ⚔️ {currentPower} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>➔ {nextPower}</span>
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
                        {inspectedCard.set}
                      </span>
                    </p>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button onClick={() => setInspectedCard(null)} className="btn-primary">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
