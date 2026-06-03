'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Card3D from '@/components/Card3D/Card3D';
import { useUser } from '@/context/UserContext';
import { apiRequest } from '@/lib/api';
import { sound } from '@/lib/sound';
import styles from './upgrader.module.css';

interface CollectionCard {
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

interface SacrificedSelection {
  cardId: string;
  name: string;
  rarity: string;
  isSpecial: boolean;
  quantity: number;
  maxAvailable: number;
}

export default function UpgraderPage() {
  const { coins, addCoinsLocally, claimIdleCoins, loading: userLoading, gameConfig } = useUser();
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [sacrificed, setSacrificed] = useState<SacrificedSelection[]>([]);
  const [targetCard, setTargetCard] = useState<CollectionCard | null>(null);

  // Upgrader Animation States
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{ success: boolean; rolledValue: number } | null>(null);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [betResult, setBetResult] = useState<{
    success: boolean;
    probability: number;
    obtainedOrbs: number;
    targetCard: CollectionCard;
  } | null>(null);

  const rouletteRef = useRef<HTMLDivElement>(null);

  const fetchCollection = async () => {
    try {
      setLoadingCards(true);
      const data = await apiRequest('/collection');
      setCards(data.cards);
    } catch (err: any) {
      setError(err.message || 'Error al cargar inventario.');
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, []);

  const getRarityWeight = (rarity: string): number => {
    if (!rarity) return 1;
    if (gameConfig && gameConfig.rarities) {
      const config = gameConfig.rarities.find(
        (item: any) => item.id.toUpperCase() === rarity.toUpperCase() || item.name.toUpperCase() === rarity.toUpperCase()
      );
      if (config && typeof config.weight === 'number') {
        return config.weight;
      }
    }
    switch (rarity.toUpperCase()) {
      case 'COMMON': return 1;
      case 'RARE': return 3;
      case 'EPIC': return 9;
      case 'LEGENDARY': return 27;
      case 'MYTHIC': return 81;
      default: return 1;
    }
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

  const getRarityColor = (r: string) => {
    if (!r) return '#fff';
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

  // Calcula el peso total de las cartas sacrificadas
  const totalSacrificedWeight = sacrificed.reduce(
    (sum, item) => sum + getRarityWeight(item.rarity) * item.quantity,
    0
  );

  // Calcula la probabilidad
  const targetWeight = targetCard ? getRarityWeight(targetCard.rarity) : 1;
  const rawProb = targetCard ? (totalSacrificedWeight / targetWeight) * 0.7 : 0;
  const calculatedProbability = Math.min(0.95, Math.max(0.0, rawProb));

  const handleAddSacrifice = (card: CollectionCard, isSpecial: boolean) => {
    if (spinning) return;
    const maxAvailable = isSpecial ? card.countSpecial : card.countNormal;
    if (maxAvailable <= 0) return;

    sound.playClick();
    setSacrificed((prev) => {
      const existing = prev.find((item) => item.cardId === card.id && item.isSpecial === isSpecial);
      if (existing) {
        if (existing.quantity >= maxAvailable) return prev;
        return prev.map((item) =>
          item.cardId === card.id && item.isSpecial === isSpecial
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          cardId: card.id,
          name: card.name,
          rarity: card.rarity,
          isSpecial,
          quantity: 1,
          maxAvailable,
        },
      ];
    });
  };

  const handleRemoveSacrifice = (cardId: string, isSpecial: boolean) => {
    if (spinning) return;
    sound.playClick();
    setSacrificed((prev) =>
      prev
        .map((item) =>
          item.cardId === cardId && item.isSpecial === isSpecial
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleSelectTarget = (card: CollectionCard) => {
    if (spinning) return;
    sound.playClick();
    setTargetCard(card);
  };

  const handleUpgradeBet = async () => {
    if (spinning || sacrificed.length === 0 || !targetCard) return;

    sound.playClick();
    setSpinning(true);
    setBetResult(null);

    const payload = {
      sacrificedCards: sacrificed.map((s) => ({
        cardId: s.cardId,
        isSpecial: s.isSpecial,
        quantity: s.quantity,
      })),
      targetCardId: targetCard.id,
    };

    try {
      const res = await apiRequest('/collection/upgrader', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Calcular ángulo de parada de la ruleta
      // 0 a (calculatedProbability * 360) es Éxito.
      // (calculatedProbability * 360) a 360 es Fracaso.
      // Si tuvo éxito, hacemos que el ángulo caiga en la zona de éxito.
      // Si falló, hacemos que caiga en la zona de fallo.
      const winningArc = calculatedProbability * 360;
      let stopAngle = 0;
      if (res.success) {
        // Cae en éxito (por ejemplo, mitad del arco de éxito)
        stopAngle = Math.random() * winningArc;
      } else {
        // Cae en fallo (arco de fallo)
        stopAngle = winningArc + Math.random() * (360 - winningArc);
      }

      // Queremos que dé 5 vueltas completas (1800 grados) y luego pare en stopAngle
      const finalRotation = 1800 + stopAngle;
      setRotationAngle(finalRotation);

      // Reproducir sonido de ticks simulando la ruleta girando (ralentizándose)
      let ticks = 0;
      const totalTicks = 22;
      const playTick = () => {
        if (ticks >= totalTicks) return;
        sound.playHover();
        ticks++;
        setTimeout(playTick, 80 + ticks * ticks * 7);
      };
      playTick();

      // Esperar que termine el giro (4 segundos)
      setTimeout(() => {
        setSpinning(false);
        setBetResult({
          success: res.success,
          probability: res.probability,
          obtainedOrbs: res.obtainedOrbs,
          targetCard: res.targetCard,
        });

        if (res.success) {
          sound.playUpgradeSuccess();
        } else {
          sound.playError();
          addCoinsLocally(res.obtainedOrbs);
        }

        // Limpiar selección de sacrificios
        setSacrificed([]);
        setTargetCard(null);

        // Refrescar inventario y balance final
        fetchCollection();
        claimIdleCoins();
      }, 4000);

    } catch (err: any) {
      sound.playError();
      alert(err.message || 'Error en la ruleta.');
      setSpinning(false);
    }
  };

  const sacrificedMap = new Map(sacrificed.map((s) => [`${s.cardId}-${s.isSpecial}`, s.quantity]));

  // Filtrar cartas que el usuario tiene disponibles para apostar
  const sacrificeCandidates = cards.filter((c) => c.owned && (c.countNormal > 0 || c.countSpecial > 0));

  // Cartas elegibles como objetivo (de mayor rareza que el promedio sacrificado, o simplemente cualquiera)
  const targetCandidates = cards.filter((c) => {
    // Si no se ha sacrificado nada, mostrar raras, épicas, legendarias y míticas
    if (sacrificed.length === 0) {
      return getRarityWeight(c.rarity) > 1;
    }
    // Si hay sacrificadas, mostrar cartas con rareza igual o mayor al máximo ofrecido
    const maxSacrificedRarity = sacrificed.reduce(
      (max, item) => Math.max(max, getRarityWeight(item.rarity)),
      0
    );
    return getRarityWeight(c.rarity) >= maxSacrificedRarity;
  });

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content-wrapper">
        <main className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Alquimia</h1>
            <p className={styles.subtitle}>
              Funde duplicados para transmutar criaturas superiores.
            </p>
          </div>

          <div className={styles.mainGrid}>
            
            {/* PANEL IZQUIERDO: SELECCIÓN DE CARTAS A SACRIFICAR */}
            <div className={`${styles.panel} glass-panel`}>
              <h2 className={styles.panelTitle}>Cartas a Sacrificar</h2>
              <p className={styles.helpText}>Selecciona copias de tu colección. Máximo 10 cartas en total.</p>
              
              {loadingCards ? (
                <p className={styles.loadingText}>Cargando tu colección...</p>
              ) : sacrificeCandidates.length === 0 ? (
                <p className={styles.emptyText}>No tienes cartas en tu colección para sacrificar.</p>
              ) : (
                <div className={styles.candidateGrid}>
                  {sacrificeCandidates.map((card) => {
                    const normalSacrificed = sacrificedMap.get(`${card.id}-false`) || 0;
                    const specialSacrificed = sacrificedMap.get(`${card.id}-true`) || 0;
                    const normalAvail = card.countNormal - normalSacrificed;
                    const specialAvail = card.countSpecial - specialSacrificed;

                    return (
                      <div key={card.id} className={styles.candidateCard}>
                        <div className={styles.cardPreviewMini}>
                          <Card3D
                            id={card.id}
                            name={card.name}
                            description={card.description}
                            rarity={card.rarity}
                            power={card.power}
                            element={card.element}
                            imageUrl={card.imageUrl}
                            owned={card.owned}
                            minimal={true}
                          />
                        </div>
                        <div className={styles.candidateActions}>
                          <div className={styles.candidateName}>{card.name}</div>
                          {card.countNormal > 0 && (
                            <button
                              disabled={normalAvail <= 0 || spinning}
                              onClick={() => handleAddSacrifice(card, false)}
                              className={styles.addBtn}
                            >
                              Normal ({normalAvail} disp.)
                            </button>
                          )}
                          {card.countSpecial > 0 && (
                            <button
                              disabled={specialAvail <= 0 || spinning}
                              onClick={() => handleAddSacrifice(card, true)}
                              className={`${styles.addBtn} ${styles.addShinyBtn}`}
                            >
                              Shiny ({specialAvail} disp.)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PANEL CENTRAL: LA RULETA Y PROBABILIDADES */}
            <div className={`${styles.panel} ${styles.centerPanel} glass-panel`}>
              <h2 className={styles.panelTitle}>La Ruleta</h2>

              <div className={styles.selectedSacrificesBox}>
                <h3 className={styles.boxTitle}>Aportes Seleccionados</h3>
                {sacrificed.length === 0 ? (
                  <p className={styles.emptyText}>Ninguna carta seleccionada aún.</p>
                ) : (
                  <div className={styles.sacrificedList}>
                    {sacrificed.map((item) => (
                      <div key={`${item.cardId}-${item.isSpecial}`} className={styles.sacrificedRow}>
                        <span className={styles.sacRowName}>
                          {item.name} {item.isSpecial ? '(Shiny)' : ''}
                        </span>
                        <span className={styles.sacRowQty}>x{item.quantity}</span>
                        <button
                          disabled={spinning}
                          onClick={() => handleRemoveSacrifice(item.cardId, item.isSpecial)}
                          className={styles.removeBtn}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RULETA VISUAL */}
              <div className={styles.rouletteContainer}>
                <div className={styles.rouletteWrapper}>
                  {/* El disco de la ruleta dividido según la probabilidad */}
                  <div 
                    className={styles.rouletteWheel}
                    style={{
                      background: `conic-gradient(
                        var(--gold-primary) 0deg ${calculatedProbability * 360}deg,
                        #1f1f2e ${calculatedProbability * 360}deg 360deg
                      )`
                    }}
                  >
                    <div className={styles.innerWheelCenter}>
                      <div className={styles.probValue}>
                        {(calculatedProbability * 100).toFixed(0)}%
                      </div>
                      <div className={styles.probLabel}>Éxito</div>
                    </div>
                  </div>
                  {/* Aguja / Puntero que gira */}
                  <div 
                    ref={rouletteRef}
                    className={styles.roulettePointer}
                    style={{
                      transform: `rotate(${rotationAngle}deg)`,
                      transition: spinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
                    }}
                  />
                </div>
              </div>

              <div className={styles.betControls}>
                <div className={styles.weightStatus}>
                  <div>Poder Ofrecido: <span className={styles.highlightText}>{totalSacrificedWeight}</span></div>
                  {targetCard && (
                    <div>Poder Objetivo: <span className={styles.highlightText}>{targetWeight}</span></div>
                  )}
                </div>

                <button
                  onClick={handleUpgradeBet}
                  disabled={spinning || sacrificed.length === 0 || !targetCard}
                  className="btn-primary"
                  style={{ width: '100%', padding: '16px' }}
                >
                  {spinning ? 'Transmutando...' : 'Girar Alquimia'}
                </button>
              </div>

              {/* RESULTADO DE LA APUESTA */}
              {betResult && (
                <div className={`${styles.resultBanner} ${betResult.success ? styles.resultSuccess : styles.resultFail}`}>
                  {betResult.success ? (
                    <div>
                      <h3 className={styles.resultTitle}>¡Éxito en la Fusión!</h3>
                      <p className={styles.resultText}>
                        Has invocado correctamente a {betResult.targetCard.name} ({getRarityName(betResult.targetCard.rarity)}).
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className={styles.resultTitle}>¡La transmutación falló!</h3>
                      <p className={styles.resultText}>
                        Las cartas se desintegraron. Como consuelo, la energía liberada te otorga{' '}
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>
                          ✦ {betResult.obtainedOrbs}
                        </span>{' '}
                        esencias.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PANEL DERECHO: SELECCIÓN DE CARTA OBJETIVO */}
            <div className={`${styles.panel} glass-panel`}>
              <h2 className={styles.panelTitle}>Carta Objetivo</h2>
              <p className={styles.helpText}>Elige la criatura a la que deseas aspirar.</p>

              {targetCard ? (
                <div className={styles.selectedTargetBox}>
                  <div className={styles.targetCardWrapper}>
                    <Card3D
                      id={targetCard.id}
                      name={targetCard.name}
                      description={targetCard.description}
                      rarity={targetCard.rarity}
                      power={targetCard.power}
                      element={targetCard.element}
                      imageUrl={targetCard.imageUrl}
                      owned={true}
                    />
                  </div>
                  <button
                    disabled={spinning}
                    onClick={() => { sound.playClick(); setTargetCard(null); }}
                    className="btn-secondary"
                    style={{ width: '100%', marginTop: '16px' }}
                  >
                    Elegir Otra Carta
                  </button>
                </div>
              ) : (
                <div className={styles.targetGrid}>
                  {targetCandidates.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleSelectTarget(card)}
                      className={styles.targetSelectorCard}
                    >
                      <div className={styles.miniPreviewContainer}>
                        <Card3D
                          id={card.id}
                          name={card.name}
                          description={card.description}
                          rarity={card.rarity}
                          power={card.power}
                          element={card.element}
                          imageUrl={card.imageUrl}
                          owned={true}
                          minimal={true}
                        />
                      </div>
                      <div className={styles.targetInfo}>
                        <div className={styles.targetName}>{card.name}</div>
                        <div className={styles.targetRarity} style={{ color: getRarityColor(card.rarity) }}>
                          {getRarityName(card.rarity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
