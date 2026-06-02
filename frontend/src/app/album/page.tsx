'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Card3D from '@/components/Card3D/Card3D';
import { apiRequest } from '@/lib/api';
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
  countSpecial: number;
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

  const filteredCards = cards.filter((card) => {
    const matchRarity = filterRarity === 'ALL' || card.rarity === filterRarity;
    const matchElement = filterElement === 'ALL' || card.element === filterElement;

    let matchOwned = true;
    if (filterOwned === 'OWNED') matchOwned = card.owned;
    if (filterOwned === 'UNOWNED') matchOwned = !card.owned;

    return matchRarity && matchElement && matchOwned;
  });

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Álbum de Cartas</h1>
          <p className={styles.subtitle}>Gestiona tu colección de criaturas míticas.</p>
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
                    onClick={() => setInspectedCard(card)}
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
                  countSpecial={inspectedCard.countSpecial}
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
                      <span>⚔️ {inspectedCard.power} PODER</span>
                    </div>
                  </div>

                  <div className={styles.modalInfoSection}>
                    <h4 className={styles.modalInfoTitle}>Descripción</h4>
                    <p className={styles.modalDescription}>{inspectedCard.description}</p>
                  </div>

                  <div className={styles.modalInfoSection}>
                    <h4 className={styles.modalInfoTitle}>Estado del Inventario</h4>
                    <div className={styles.inventoryDetails}>
                      <div className={styles.invCol}>
                        <span className={styles.invLabel}>Copias Comunes</span>
                        <span className={styles.invValue}>{inspectedCard.countNormal}</span>
                      </div>
                      <div className={styles.invCol}>
                        <span className={styles.invLabel}>Copias Shiny (Holo)</span>
                        <span className={styles.invValue}>{inspectedCard.countSpecial}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalInfoSection}>
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
