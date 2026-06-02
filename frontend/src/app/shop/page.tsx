'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Card3D from '@/components/Card3D/Card3D';
import { useUser } from '@/context/UserContext';
import { apiRequest } from '@/lib/api';
import styles from './shop.module.css';

interface RollCard {
  card: {
    id: string;
    name: string;
    description: string;
    rarity: string;
    power: number;
    element: string;
    imageUrl: string;
    set: string;
  };
  isSpecial: boolean;
}


interface Pack {
  id: string;
  name: string;
  cost: number;
  cardsCount: number;
  probCommon: number;
  probRare: number;
  probEpic: number;
  probLegendary: number;
  probMythic: number;
}

export default function ShopPage() {
  const { coins, deductCoins, claimIdleCoins } = useUser();
  const [openingPack, setOpeningPack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rolledCards, setRolledCards] = useState<RollCard[]>([]);
  const [revealedCards, setRevealedCards] = useState<Record<number, boolean>>({});
  const [isPackUnwrapped, setIsPackUnwrapped] = useState(false);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const data = await apiRequest('/packs');
        setPacks(data);
      } catch (err) {
        console.error('Error fetching packs:', err);
      } finally {
        setLoadingPacks(false);
      }
    };
    fetchPacks();
  }, []);

  const getPackGraphic = (id: string) => {
    const graphics: Record<string, string> = {
      basic: '🟤',
      standard: '⚪',
      legendary: '🟡',
    };
    return graphics[id] || '🎁';
  };

  const getPackProbs = (pack: Pack) => {
    const probs: { name: string; val: string }[] = [];
    if (pack.probCommon > 0) probs.push({ name: 'Común', val: `${pack.probCommon}%` });
    if (pack.probRare > 0) probs.push({ name: 'Raro', val: `${pack.probRare}%` });
    if (pack.probEpic > 0) probs.push({ name: 'Épico', val: `${pack.probEpic}%` });
    if (pack.probLegendary > 0) probs.push({ name: 'Legendario', val: `${pack.probLegendary}%` });
    if (pack.probMythic > 0) probs.push({ name: 'Mítico', val: `${pack.probMythic}%` });
    return probs;
  };

  const handleBuyPack = async (pack: Pack) => {
    if (coins < pack.cost) {
      alert('Esencias insuficientes para comprar este sobre.');
      return;
    }

    setLoading(true);
    setError(null);
    setOpeningPack(pack.name);
    setRolledCards([]);
    setRevealedCards({});
    setIsPackUnwrapped(false);
    setIsUnwrapping(false);
    setShowFlash(false);

    // Descuento optimista localmente
    deductCoins(pack.cost);

    try {
      const res = await apiRequest('/packs/buy', {
        method: 'POST',
        body: JSON.stringify({ packType: pack.id }),
      });

      setRolledCards(res.cards);
    } catch (err: any) {
      setError(err.message || 'Error al comprar el sobre.');
      // Revertir descuento si falla (sincronizando con base de datos)
      claimIdleCoins();
      setOpeningPack(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUnwrapPack = () => {
    if (isUnwrapping) return;
    setIsUnwrapping(true);
    setTimeout(() => {
      setIsPackUnwrapped(true);
      setIsUnwrapping(false);
      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
      }, 500);
    }, 1500);
  };

  const handleCardReveal = (index: number) => {
    setRevealedCards((prev) => ({ ...prev, [index]: true }));
  };

  const handleCloseOverlay = () => {
    setOpeningPack(null);
    setRolledCards([]);
    setRevealedCards({});
    setIsPackUnwrapped(false);
    setIsUnwrapping(false);
    setShowFlash(false);
    // Sincronizar el balance definitivo con la BD
    claimIdleCoins();
  };

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tienda de Sobres</h1>
          <p className={styles.subtitle}>
            Gasta tus esencias de Aether para invocar nuevos y poderosos aliados.
          </p>
        </div>

        {loadingPacks ? (
          <div className={styles.loadingContainer}>Cargando sobres...</div>
        ) : (
          <div className={styles.grid}>
            {packs.map((pack) => (
              <div key={pack.id} className={`${styles.packCard} glass-panel`}>
                <span className={styles.packGraphic}>{getPackGraphic(pack.id)}</span>
                <h2 className={styles.packName}>{pack.name}</h2>
                <p className={styles.packInfo}>Contiene {pack.cardsCount} cartas místicas</p>
                <div className={styles.packPrice}>✨ {pack.cost} Esencias</div>

                <button
                  onClick={() => handleBuyPack(pack)}
                  className="btn-primary"
                  style={{ width: '100%', marginBottom: '24px' }}
                  disabled={loading || coins < pack.cost}
                >
                  Comprar Sobre
                </button>

                <div className={styles.probabilities}>
                  <h4 style={{ marginBottom: '8px', fontWeight: 700 }}>Probabilidades de Rareza</h4>
                  {getPackProbs(pack).map(({ name, val }) => (
                    <div key={name} className={styles.probRow}>
                      <span>{name}:</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Modal / Pack Opening Stage */}
        {openingPack && (
          <div className={styles.overlay}>
            {error && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
                <button onClick={handleCloseOverlay} className="btn-secondary">
                  Cerrar
                </button>
              </div>
            )}

            {!error && !isPackUnwrapped && (
              <div className={styles.packOpener}>
                {isUnwrapping && <div className={styles.glowingRays} />}
                <div
                  className={`${styles.unopenedPack} ${isUnwrapping ? styles.packUnwrapping : ''}`}
                  onClick={handleUnwrapPack}
                >
                  🎁
                </div>
                <p className={styles.prompt}>
                  {isUnwrapping ? '¡La energía mística se acumula!' : '¡Haz clic sobre el sobre para abrirlo!'}
                </p>
              </div>
            )}

            {!error && isPackUnwrapped && rolledCards.length > 0 && (
              <div className={styles.revealStage}>
                <h2 className={styles.revealTitle}>Apertura de: {openingPack}</h2>
                <div className={styles.cardsGrid}>
                  {rolledCards.map((roll, index) => (
                    <div
                      key={index}
                      className={styles.cardContainer}
                      onMouseEnter={() => handleCardReveal(index)}
                      onClick={() => handleCardReveal(index)}
                    >
                      <div
                        className={`${styles.flipper} ${revealedCards[index] ? styles.flipped : ''}`}
                      >
                        <div className={styles.front}>
                          <Card3D
                            id={roll.card.id}
                            name={roll.card.name}
                            description={roll.card.description}
                            rarity={roll.card.rarity}
                            power={roll.card.power}
                            element={roll.card.element}
                            imageUrl={roll.card.imageUrl}
                            isSpecial={roll.isSpecial}
                            owned={true}
                          />
                        </div>
                        <div className={styles.back}>
                          <div className={styles.backLogo}>⭐</div>
                          <div className={styles.backDecoration}>AETHERIA</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mostrar botón cerrar solo si el usuario reveló todas las cartas */}
                {Object.keys(revealedCards).length === rolledCards.length && (
                  <button onClick={handleCloseOverlay} className="btn-primary styles.closeBtn">
                    Confirmar y Regresar a la Tienda
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {showFlash && <div className={styles.flashOverlay} />}
      </main>
    </>
  );
}
