'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useUser } from '@/context/UserContext';
import { apiRequest } from '@/lib/api';
import styles from './admin.module.css';

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

export default function AdminPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  // Card Form State
  const [cardId, setCardId] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardRarity, setCardRarity] = useState('COMMON');
  const [cardPower, setCardPower] = useState('10');
  const [cardElement, setCardElement] = useState('FIRE');
  const [cardSet, setCardSet] = useState('Genesis');
  const [cardImage, setCardImage] = useState<File | null>(null);

  // Pack Form State
  const [selectedPackId, setSelectedPackId] = useState<string>('new');
  const [packId, setPackId] = useState('');
  const [packName, setPackName] = useState('');
  const [packCost, setPackCost] = useState('100');
  const [packCardsCount, setPackCardsCount] = useState('3');
  const [probCommon, setProbCommon] = useState('80');
  const [probRare, setProbRare] = useState('18');
  const [probEpic, setProbEpic] = useState('2');
  const [probLegendary, setProbLegendary] = useState('0');
  const [probMythic, setProbMythic] = useState('0');

  // Page States
  const [packs, setPacks] = useState<Pack[]>([]);
  const [cardMessage, setCardMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [packMessage, setPackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingCard, setSubmittingCard] = useState(false);
  const [submittingPack, setSubmittingPack] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const fetchPacks = async () => {
    try {
      const data = await apiRequest('/packs');
      setPacks(data);
    } catch (err) {
      console.error('Error fetching packs:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPacks();
    }
  }, [user]);

  const handlePackSelect = (packId: string) => {
    setSelectedPackId(packId);
    if (packId === 'new') {
      setPackId('');
      setPackName('');
      setPackCost('100');
      setPackCardsCount('3');
      setProbCommon('100');
      setProbRare('0');
      setProbEpic('0');
      setProbLegendary('0');
      setProbMythic('0');
    } else {
      const pack = packs.find((p) => p.id === packId);
      if (pack) {
        setPackId(pack.id);
        setPackName(pack.name);
        setPackCost(pack.cost.toString());
        setPackCardsCount(pack.cardsCount.toString());
        setProbCommon(pack.probCommon.toString());
        setProbRare(pack.probRare.toString());
        setProbEpic(pack.probEpic.toString());
        setProbLegendary(pack.probLegendary.toString());
        setProbMythic(pack.probMythic.toString());
      }
    }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardMessage(null);

    if (!cardId.trim() || !cardName.trim() || !cardDesc.trim() || !cardImage) {
      setCardMessage({ type: 'error', text: 'Todos los campos son obligatorios, incluyendo la imagen.' });
      return;
    }

    setSubmittingCard(true);

    const formData = new FormData();
    formData.append('id', cardId.trim());
    formData.append('name', cardName.trim());
    formData.append('description', cardDesc.trim());
    formData.append('rarity', cardRarity);
    formData.append('power', cardPower);
    formData.append('element', cardElement);
    formData.append('set', cardSet.trim());
    formData.append('image', cardImage);

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/cards`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al crear la carta.');
      }

      setCardMessage({ type: 'success', text: `Carta "${cardName}" creada exitosamente.` });
      setCardId('');
      setCardName('');
      setCardDesc('');
      setCardPower('10');
      setCardImage(null);
      const fileInput = document.getElementById('card-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setCardMessage({ type: 'error', text: err.message || 'Error de conexión.' });
    } finally {
      setSubmittingCard(false);
    }
  };

  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPackMessage(null);

    if (!packId.trim() || !packName.trim()) {
      setPackMessage({ type: 'error', text: 'El ID y Nombre del sobre son obligatorios.' });
      return;
    }

    const totalProbs =
      Number(probCommon) + Number(probRare) + Number(probEpic) + Number(probLegendary) + Number(probMythic);
    if (Math.abs(totalProbs - 100) > 0.01) {
      setPackMessage({ type: 'error', text: `Las probabilidades deben sumar exactamente 100% (Suma actual: ${totalProbs}%).` });
      return;
    }

    setSubmittingPack(true);

    const payload = {
      id: packId.trim().toLowerCase(),
      name: packName.trim(),
      cost: Number(packCost),
      cardsCount: Number(packCardsCount),
      probCommon: Number(probCommon),
      probRare: Number(probRare),
      probEpic: Number(probEpic),
      probLegendary: Number(probLegendary),
      probMythic: Number(probMythic),
    };

    try {
      await apiRequest('/admin/packs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setPackMessage({ type: 'success', text: `Sobre "${packName}" guardado correctamente.` });
      fetchPacks();
      setSelectedPackId(payload.id);
    } catch (err: any) {
      setPackMessage({ type: 'error', text: err.message || 'Error al guardar el sobre.' });
    } finally {
      setSubmittingPack(false);
    }
  };

  if (loading || !user || user.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel administrativo...</div>;
  }

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <h1 className={styles.title}>Panel de Control</h1>
        <p className={styles.subtitle}>Gestión administrativa de cartas y configuraciones de sobres.</p>

        <div className={styles.layout}>
          {/* Creador de Cartas */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Crear Nueva Carta</h2>

            {cardMessage && (
              <div className={`${styles.message} ${cardMessage.type === 'success' ? styles.success : styles.error}`}>
                {cardMessage.text}
              </div>
            )}

            <form onSubmit={handleCardSubmit}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>ID Carta (Ej: fire-5)</label>
                  <input
                    type="text"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className={styles.input}
                    placeholder="fire-5"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre de la Carta</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className={styles.input}
                    placeholder="Fénix Oscuro"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Descripción</label>
                <textarea
                  value={cardDesc}
                  onChange={(e) => setCardDesc(e.target.value)}
                  className={styles.textarea}
                  placeholder="Detalla la historia y habilidades mágicas..."
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rareza</label>
                  <select
                    value={cardRarity}
                    onChange={(e) => setCardRarity(e.target.value)}
                    className={styles.select}
                  >
                    <option value="COMMON">Común</option>
                    <option value="RARE">Raro</option>
                    <option value="EPIC">Épico</option>
                    <option value="LEGENDARY">Legendario</option>
                    <option value="MYTHIC">Mítico</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Poder de Ataque (Power)</label>
                  <input
                    type="number"
                    value={cardPower}
                    onChange={(e) => setCardPower(e.target.value)}
                    className={styles.input}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Elemento</label>
                  <select
                    value={cardElement}
                    onChange={(e) => setCardElement(e.target.value)}
                    className={styles.select}
                  >
                    <option value="FIRE">Fuego (Fire)</option>
                    <option value="WATER">Agua (Water)</option>
                    <option value="EARTH">Tierra (Earth)</option>
                    <option value="AIR">Aire (Air)</option>
                    <option value="LIGHT">Luz (Light)</option>
                    <option value="SHADOW">Sombra (Shadow)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Set / Expansión</label>
                  <input
                    type="text"
                    value={cardSet}
                    onChange={(e) => setCardSet(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Imagen de la Carta</label>
                <input
                  id="card-image-input"
                  type="file"
                  onChange={(e) => setCardImage(e.target.files?.[0] || null)}
                  className={styles.input}
                  accept="image/*"
                  required
                />
              </div>

              <button type="submit" disabled={submittingCard} className={styles.submitBtn}>
                {submittingCard ? 'Creando Carta...' : 'Registrar Carta'}
              </button>
            </form>
          </section>

          {/* Configuración de Sobres */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Configurar Sobres (Gacha)</h2>

            <div className={styles.packSelector}>
              <button
                type="button"
                onClick={() => handlePackSelect('new')}
                className={`${styles.packSelectBtn} ${selectedPackId === 'new' ? styles.packSelectBtnActive : ''}`}
              >
                [+] Nuevo Sobre
              </button>
              {packs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePackSelect(p.id)}
                  className={`${styles.packSelectBtn} ${selectedPackId === p.id ? styles.packSelectBtnActive : ''}`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {packMessage && (
              <div className={`${styles.message} ${packMessage.type === 'success' ? styles.success : styles.error}`}>
                {packMessage.text}
              </div>
            )}

            <form onSubmit={handlePackSubmit}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>ID del Sobre (Ej: basic)</label>
                  <input
                    type="text"
                    value={packId}
                    onChange={(e) => setPackId(e.target.value)}
                    disabled={selectedPackId !== 'new'}
                    className={styles.input}
                    placeholder="basic"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre Visible</label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    className={styles.input}
                    placeholder="Sobre de Bronce"
                    required
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Costo (Esencias)</label>
                  <input
                    type="number"
                    value={packCost}
                    onChange={(e) => setPackCost(e.target.value)}
                    className={styles.input}
                    min="10"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cartas Otorgadas</label>
                  <input
                    type="number"
                    value={packCardsCount}
                    onChange={(e) => setPackCardsCount(e.target.value)}
                    className={styles.input}
                    min="1"
                    required
                  />
                </div>
              </div>

              <h3 style={{ margin: '20px 0 12px 0', fontSize: '1rem', textTransform: 'uppercase', fontWeight: 800 }}>
                Pesos / Probabilidades (%)
              </h3>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Común (Common)</label>
                  <input
                    type="number"
                    value={probCommon}
                    onChange={(e) => setProbCommon(e.target.value)}
                    className={styles.input}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Raro (Rare)</label>
                  <input
                    type="number"
                    value={probRare}
                    onChange={(e) => setProbRare(e.target.value)}
                    className={styles.input}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Épico (Epic)</label>
                  <input
                    type="number"
                    value={probEpic}
                    onChange={(e) => setProbEpic(e.target.value)}
                    className={styles.input}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Legendario (Legendary)</label>
                  <input
                    type="number"
                    value={probLegendary}
                    onChange={(e) => setProbLegendary(e.target.value)}
                    className={styles.input}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ maxWidth: '50%' }}>
                <label className={styles.label}>Mítico (Mythic)</label>
                <input
                  type="number"
                  value={probMythic}
                  onChange={(e) => setProbMythic(e.target.value)}
                  className={styles.input}
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <button type="submit" disabled={submittingPack} className={styles.submitBtn}>
                {submittingPack ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
