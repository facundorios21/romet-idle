'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useUser } from '@/context/UserContext';
import { apiRequest } from '@/lib/api';
import { sound } from '@/lib/sound';
import styles from './admin.module.css';

interface Card {
  id: string;
  name: string;
  description: string;
  rarity: string;
  power: number;
  element: string;
  imageUrl: string;
  set: string;
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

interface ElementConfig {
  id: string;
  name: string;
  color: string;
}

interface RarityConfig {
  id: string;
  name: string;
  color: string;
  weight: number;
  priority?: number;
}

interface SetConfig {
  id: string;
  name: string;
}

interface GameConfig {
  elements: ElementConfig[];
  rarities: RarityConfig[];
  sets: SetConfig[];
}

export default function AdminPage() {
  const { user, loading, refreshGameConfig } = useUser();
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'create' | 'packs' | 'edit-cards' | 'config'>('create');

  // Dynamic Game Config State
  const [gameConfig, setGameConfig] = useState<GameConfig>({ elements: [], rarities: [], sets: [] });

  // List of all cards for editing
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'id' | 'name' | 'rarity' | 'element' | 'power' | 'set'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Editing Card Modal State
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPower, setEditPower] = useState('10');
  const [editRarity, setEditRarity] = useState('COMMON');
  const [editElement, setEditElement] = useState('FIRE');
  const [editSet, setEditSet] = useState('Genesis');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Card Creation Form State
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

  // Page Status Messages
  const [cardMessage, setCardMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [packMessage, setPackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [submittingCard, setSubmittingCard] = useState(false);
  const [submittingPack, setSubmittingPack] = useState(false);
  const [submittingConfig, setSubmittingConfig] = useState(false);

  const [packs, setPacks] = useState<Pack[]>([]);

  // Helper for generating UUIDs on frontend (primarily for config IDs)
  const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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

  const getSetName = (s: string) => {
    if (!s) return '';
    if (gameConfig && gameConfig.sets) {
      const config = gameConfig.sets.find(
        (item: any) => item.id.toUpperCase() === s.toUpperCase() || item.name.toUpperCase() === s.toUpperCase()
      );
      if (config) return config.name;
    }
    return s;
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

  // Custom Modal Overlay States for Dialogless Forms
  const [modalType, setModalType] = useState<'none' | 'addElement' | 'addRarity' | 'deleteCard' | 'deleteElement' | 'deleteRarity'>('none');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Modal form states
  const [newElementName, setNewElementName] = useState('');
  const [newElementColor, setNewElementColor] = useState('#ff3b30');

  const [newRarityName, setNewRarityName] = useState('');
  const [newRarityColor, setNewRarityColor] = useState('#8e8e93');
  const [newRarityWeight, setNewRarityWeight] = useState('1');
  const [newRarityPriority, setNewRarityPriority] = useState('1');

  // Deletion tracking states
  const [activeDeleteId, setActiveDeleteId] = useState<string | null>(null);
  const [activeDeleteName, setActiveDeleteName] = useState<string | null>(null);

  // Verification redirect for roles
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const loadGameConfig = async () => {
    try {
      const data = await apiRequest('/collection/game-config');
      setGameConfig(data);
      if (data.rarities.length > 0) {
        setCardRarity(data.rarities[0].id);
        setEditRarity(data.rarities[0].id);
      }
      if (data.elements.length > 0) {
        setCardElement(data.elements[0].id);
        setEditElement(data.elements[0].id);
      }
      if (data.sets && data.sets.length > 0) {
        setCardSet(data.sets[0].id);
        setEditSet(data.sets[0].id);
      }
    } catch (err) {
      console.error('Error fetching game-config:', err);
    }
  };

  const fetchPacks = async () => {
    try {
      const data = await apiRequest('/packs');
      setPacks(data);
    } catch (err) {
      console.error('Error fetching packs:', err);
    }
  };

  const fetchAllCards = async () => {
    try {
      setLoadingCards(true);
      const data = await apiRequest('/collection');
      setAllCards(data.cards);
    } catch (err) {
      console.error('Error loading cards list:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadGameConfig();
      fetchPacks();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'edit-cards') {
      fetchAllCards();
    }
  }, [activeTab]);

  const handleTabChange = (tab: 'create' | 'packs' | 'edit-cards' | 'config') => {
    sound.playClick();
    setActiveTab(tab);
    setCardMessage(null);
    setPackMessage(null);
    setEditMessage(null);
    setConfigMessage(null);
  };

  const handlePackSelect = (packId: string) => {
    sound.playClick();
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

  // 1. Submit New Card
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardMessage(null);

    if (!cardName.trim() || !cardDesc.trim() || !cardImage) {
      sound.playError();
      setCardMessage({ type: 'error', text: 'Todos los campos son obligatorios, incluyendo la imagen.' });
      return;
    }

    sound.playClick();
    setSubmittingCard(true);

    const formData = new FormData();
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

      sound.playUpgradeSuccess();
      setCardMessage({ type: 'success', text: `Carta "${cardName}" creada exitosamente.` });
      setCardName('');
      setCardDesc('');
      setCardPower('10');
      setCardImage(null);
      const fileInput = document.getElementById('card-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      sound.playError();
      setCardMessage({ type: 'error', text: err.message || 'Error de conexión.' });
    } finally {
      setSubmittingCard(false);
    }
  };

  // 2. Submit Pack Config
  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPackMessage(null);

    if (!packName.trim()) {
      sound.playError();
      setPackMessage({ type: 'error', text: 'El nombre del sobre es obligatorio.' });
      return;
    }

    const totalProbs =
      Number(probCommon) + Number(probRare) + Number(probEpic) + Number(probLegendary) + Number(probMythic);
    if (Math.abs(totalProbs - 100) > 0.01) {
      sound.playError();
      setPackMessage({ type: 'error', text: `Las probabilidades deben sumar exactamente 100% (Suma actual: ${totalProbs}%).` });
      return;
    }

    sound.playClick();
    setSubmittingPack(true);

    const payload = {
      id: selectedPackId === 'new' ? undefined : selectedPackId,
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
      const res = await apiRequest('/admin/packs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      sound.playUpgradeSuccess();
      setPackMessage({ type: 'success', text: `Sobre "${packName}" guardado correctamente.` });
      fetchPacks();
      setSelectedPackId(res.id);
    } catch (err: any) {
      sound.playError();
      setPackMessage({ type: 'error', text: err.message || 'Error al guardar el sobre.' });
    } finally {
      setSubmittingPack(false);
    }
  };

  // 3. Edit Existing Card Stats
  const handleOpenEditModal = (card: Card) => {
    sound.playClick();
    setEditingCard(card);
    setEditName(card.name);
    setEditDesc(card.description);
    setEditPower(card.power.toString());
    setEditRarity(card.rarity);
    setEditElement(card.element);
    setEditSet(card.set);
    setEditImageUrl(card.imageUrl);
    setEditMessage(null);
  };

  const handleEditCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setEditMessage(null);

    sound.playClick();
    try {
      const payload = {
        name: editName.trim(),
        description: editDesc.trim(),
        rarity: editRarity,
        power: Number(editPower),
        element: editElement,
        set: editSet.trim(),
        imageUrl: editImageUrl,
      };

      await apiRequest(`/admin/cards/${editingCard.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      sound.playUpgradeSuccess();
      setEditMessage({ type: 'success', text: `Carta "${editName}" actualizada.` });
      fetchAllCards();
      setTimeout(() => setEditingCard(null), 1000);
    } catch (err: any) {
      sound.playError();
      setEditMessage({ type: 'error', text: err.message || 'Error al guardar cambios de la carta.' });
    }
  };

  // 4. Update Game Config (Elements & Rarities)
  const handleElementChange = (idx: number, field: 'name' | 'color', value: string) => {
    const updated = [...gameConfig.elements];
    updated[idx] = { ...updated[idx], [field]: value };
    setGameConfig({ ...gameConfig, elements: updated });
  };

  const handleRarityChange = (
    idx: number,
    field: 'name' | 'color' | 'weight' | 'priority',
    value: string | number
  ) => {
    const updated = [...gameConfig.rarities];
    if (field === 'weight') {
      updated[idx] = { ...updated[idx], weight: Number(value) };
    } else if (field === 'priority') {
      updated[idx] = { ...updated[idx], priority: Number(value) };
    } else {
      updated[idx] = { ...updated[idx], [field]: value as string };
    }
    setGameConfig({ ...gameConfig, rarities: updated });
  };

  const handleAddElement = () => {
    sound.playClick();
    setNewElementName('');
    setNewElementColor('#ff3b30');
    setModalError(null);
    setModalSuccess(null);
    setModalType('addElement');
  };

  const submitAddElement = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    const name = newElementName.trim();
    if (!name) {
      setModalError('El nombre es obligatorio.');
      return;
    }

    const color = newElementColor.trim();

    if (gameConfig.elements.some(el => el.name.toLowerCase() === name.toLowerCase())) {
      setModalError('Ya existe un elemento con ese nombre.');
      return;
    }

    const cleanId = generateUUID().toUpperCase();

    setGameConfig({
      ...gameConfig,
      elements: [...gameConfig.elements, { id: cleanId, name, color }]
    });

    sound.playUpgradeSuccess();
    setNewElementName('');
    setNewElementColor('#ff3b30');
    setModalType('none');
  };

  const handleOpenDeleteElement = (el: ElementConfig) => {
    sound.playClick();
    setActiveDeleteId(el.id);
    setActiveDeleteName(el.name);
    setModalError(null);
    setModalSuccess(null);
    setModalType('deleteElement');
  };

  const submitDeleteElement = () => {
    if (!activeDeleteId) return;
    sound.playClick();
    setGameConfig({
      ...gameConfig,
      elements: gameConfig.elements.filter(el => el.id !== activeDeleteId)
    });
    setModalType('none');
    setActiveDeleteId(null);
    setActiveDeleteName(null);
  };

  const handleAddRarity = () => {
    sound.playClick();
    setNewRarityName('');
    setNewRarityColor('#8e8e93');
    setNewRarityWeight('1');
    setNewRarityPriority('1');
    setModalError(null);
    setModalSuccess(null);
    setModalType('addRarity');
  };

  const submitAddRarity = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    const name = newRarityName.trim();
    if (!name) {
      setModalError('El nombre es obligatorio.');
      return;
    }

    const color = newRarityColor.trim();
    const weight = Number(newRarityWeight);
    const priority = parseInt(newRarityPriority, 10);

    if (isNaN(weight) || weight < 1) {
      setModalError('El peso debe ser un número positivo.');
      return;
    }

    if (isNaN(priority) || priority < 1 || priority > 10) {
      setModalError('La prioridad debe ser un número entero entre 1 y 10.');
      return;
    }

    if (gameConfig.rarities.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      setModalError('Ya existe una rareza con ese nombre.');
      return;
    }

    const cleanId = generateUUID().toUpperCase();

    setGameConfig({
      ...gameConfig,
      rarities: [
        ...gameConfig.rarities,
        {
          id: cleanId,
          name,
          color,
          weight,
          priority,
        },
      ],
    });

    sound.playUpgradeSuccess();
    setNewRarityName('');
    setNewRarityColor('#8e8e93');
    setNewRarityWeight('1');
    setNewRarityPriority('1');
    setModalType('none');
  };

  const handleOpenDeleteRarity = (r: RarityConfig) => {
    sound.playClick();
    setActiveDeleteId(r.id);
    setActiveDeleteName(r.name);
    setModalError(null);
    setModalSuccess(null);
    setModalType('deleteRarity');
  };

  const submitDeleteRarity = () => {
    if (!activeDeleteId) return;
    sound.playClick();
    setGameConfig({
      ...gameConfig,
      rarities: gameConfig.rarities.filter(r => r.id !== activeDeleteId)
    });
    setModalType('none');
    setActiveDeleteId(null);
    setActiveDeleteName(null);
  };

  const moveElement = (idx: number, direction: 'up' | 'down') => {
    sound.playClick();
    const updated = [...gameConfig.elements];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setGameConfig({ ...gameConfig, elements: updated });
  };

  const moveRarity = (idx: number, direction: 'up' | 'down') => {
    sound.playClick();
    const updated = [...gameConfig.rarities];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setGameConfig({ ...gameConfig, rarities: updated });
  };

  const handleSortRaritiesByPriority = () => {
    sound.playClick();
    const sorted = [...gameConfig.rarities].sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));
    setGameConfig({ ...gameConfig, rarities: sorted });
  };

  const handleSaveGameConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMessage(null);
    sound.playClick();
    setSubmittingConfig(true);

    // Auto-sort rarities by priority on save
    const sortedRarities = [...gameConfig.rarities].sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));
    const sortedConfig = {
      ...gameConfig,
      rarities: sortedRarities,
    };

    try {
      await apiRequest('/admin/game-config', {
        method: 'PUT',
        body: JSON.stringify(sortedConfig),
      });

      sound.playUpgradeSuccess();
      setConfigMessage({ type: 'success', text: 'Configuración de elementos y rarezas actualizada.' });
      loadGameConfig();
      refreshGameConfig(); // Refresh global user context configurations
    } catch (err: any) {
      sound.playError();
      setConfigMessage({ type: 'error', text: err.message || 'Error al guardar la configuración.' });
    } finally {
      setSubmittingConfig(false);
    }
  };

  const filteredCards = allCards.filter(
    (card) =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.element.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.rarity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.set.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRarityPriority = (r: string) => {
    const config = gameConfig.rarities.find((item) => item.id.toUpperCase() === r.toUpperCase());
    return config?.priority ?? 1;
  };

  const handleSort = (field: 'id' | 'name' | 'rarity' | 'element' | 'power' | 'set') => {
    sound.playClick();
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenDeleteCard = (card: Card) => {
    sound.playClick();
    setActiveDeleteId(card.id);
    setActiveDeleteName(card.name);
    setModalError(null);
    setModalSuccess(null);
    setModalType('deleteCard');
  };

  const submitDeleteCard = async () => {
    if (!activeDeleteId) return;
    sound.playClick();
    try {
      await apiRequest(`/admin/cards/${activeDeleteId}`, {
        method: 'DELETE',
      });
      sound.playUpgradeSuccess();
      setModalSuccess(`Carta "${activeDeleteName}" eliminada exitosamente.`);
      fetchAllCards();
      setTimeout(() => {
        setModalType('none');
        setActiveDeleteId(null);
        setActiveDeleteName(null);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      sound.playError();
      setModalError(err.message || 'Error al eliminar la carta.');
    }
  };

  const sortedCards = [...filteredCards].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'power') {
      valA = Number(a.power);
      valB = Number(b.power);
    } else if (sortField === 'rarity') {
      valA = getRarityPriority(a.rarity);
      valB = getRarityPriority(b.rarity);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading || !user || user.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Cargando panel administrativo...</div>;
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content-wrapper">
        <main className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Panel de Control</h1>
            <p className={styles.subtitle}>Configurador global de criaturas, gacha, elementos y rarezas del reino.</p>
          </div>

          {/* TAB NAVIGATION */}
          <div className={styles.tabsContainer}>
            <button
              onClick={() => handleTabChange('create')}
              className={`${styles.tabButton} ${activeTab === 'create' ? styles.tabButtonActive : ''}`}
            >
              Crear Carta
            </button>
            <button
              onClick={() => handleTabChange('packs')}
              className={`${styles.tabButton} ${activeTab === 'packs' ? styles.tabButtonActive : ''}`}
            >
              Configurar Sobres
            </button>
            <button
              onClick={() => handleTabChange('edit-cards')}
              className={`${styles.tabButton} ${activeTab === 'edit-cards' ? styles.tabButtonActive : ''}`}
            >
              Editar Cartas
            </button>
            <button
              onClick={() => handleTabChange('config')}
              className={`${styles.tabButton} ${activeTab === 'config' ? styles.tabButtonActive : ''}`}
            >
              Elementos y Rarezas
            </button>
          </div>

          {/* TAB 1: CREATE CARD */}
          {activeTab === 'create' && (
            <div className={styles.fullWidthSection}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Crear Nueva Carta</h2>

                {cardMessage && (
                  <div className={`${styles.message} ${cardMessage.type === 'success' ? styles.success : styles.error}`}>
                    {cardMessage.text}
                  </div>
                )}

                <form onSubmit={handleCardSubmit}>
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
                        {gameConfig.rarities.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.id})
                          </option>
                        ))}
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
                        {gameConfig.elements.map((el) => (
                          <option key={el.id} value={el.id}>
                            {el.name} ({el.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Set / Expansión</label>
                      <select
                        value={cardSet}
                        onChange={(e) => setCardSet(e.target.value)}
                        className={styles.select}
                      >
                        {gameConfig.sets?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.id})
                          </option>
                        ))}
                      </select>
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
            </div>
          )}

          {/* TAB 2: CONFIGURE PACKS */}
          {activeTab === 'packs' && (
            <div className={styles.fullWidthSection}>
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
                      <label className={styles.label}>Cartas Otorgadas (Máx 10)</label>
                      <input
                        type="number"
                        value={packCardsCount}
                        onChange={(e) => setPackCardsCount(e.target.value)}
                        className={styles.input}
                        min="1"
                        max="10"
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
          )}

          {/* TAB 3: EDIT CARDS */}
          {activeTab === 'edit-cards' && (
            <div className={styles.fullWidthSection}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Editar Estadísticas de Cartas</h2>
                
                <div className={styles.searchBar}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar cartas por nombre, rareza, elemento..."
                    className={styles.input}
                  />
                </div>

                {loadingCards ? (
                  <p className={styles.loadingText}>Cargando catálogo del juego...</p>
                ) : sortedCards.length === 0 ? (
                  <p className={styles.emptyText}>No se encontraron cartas.</p>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr className={styles.tableHeader}>
                          <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            ID {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Nombre {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th onClick={() => handleSort('rarity')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Rareza {sortField === 'rarity' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th onClick={() => handleSort('element')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Elemento {sortField === 'element' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th onClick={() => handleSort('power')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Poder {sortField === 'power' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th onClick={() => handleSort('set')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Set {sortField === 'set' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCards.map((card) => (
                          <tr key={card.id} className={styles.tableRow}>
                            <td style={{ color: 'var(--text-muted)' }}>{card.id}</td>
                            <td style={{ fontWeight: 700 }}>{card.name}</td>
                            <td style={{ color: getRarityColor(card.rarity), fontWeight: 800 }}>
                              {getRarityName(card.rarity)}
                            </td>
                            <td>{getElementName(card.element)}</td>
                            <td style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>{card.power}</td>
                            <td>{getSetName(card.set)}</td>
                            <td>
                              <button
                                onClick={() => handleOpenEditModal(card)}
                                className={styles.actionBtn}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleOpenDeleteCard(card)}
                                className={styles.actionBtn}
                                style={{ borderColor: '#ff453a', color: '#ff453a', background: 'rgba(255, 69, 58, 0.05)', marginLeft: '8px' }}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 4: GAME CONFIG (ELEMENTS AND RARITIES) */}
          {activeTab === 'config' && (
            <div className={styles.fullWidthSection}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Configurar Elementos y Rarezas</h2>
                <p className={styles.helpText}>
                  Modifica colores, etiquetas visibles de los elementos y los multiplicadores de rareza (pesos).
                </p>

                {configMessage && (
                  <div className={`${styles.message} ${configMessage.type === 'success' ? styles.success : styles.error}`}>
                    {configMessage.text}
                  </div>
                )}

                <form onSubmit={handleSaveGameConfig}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--gold-light)' }}>
                      Configuración de Elementos
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddElement}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      [+] Agregar Elemento
                    </button>
                  </div>
                  <div className={styles.configList}>
                    {gameConfig.elements.map((el, idx) => (
                      <div key={el.id} className={styles.configRow}>
                        <span className={styles.configRowLabel}>{el.name}</span>
                        <div className={styles.reorderButtons}>
                          <button
                            type="button"
                            onClick={() => moveElement(idx, 'up')}
                            disabled={idx === 0}
                            className={styles.reorderBtn}
                            title="Subir"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveElement(idx, 'down')}
                            disabled={idx === gameConfig.elements.length - 1}
                            className={styles.reorderBtn}
                            title="Bajar"
                          >
                            ▼
                          </button>
                        </div>
                        <input
                          type="text"
                          value={el.name}
                          onChange={(e) => handleElementChange(idx, 'name', e.target.value)}
                          className={styles.input}
                          required
                          placeholder="Nombre"
                        />
                        <div className={styles.colorPickerContainer}>
                          <label className={styles.colorPickerLabel}>Color:</label>
                          <input
                            type="color"
                            value={el.color}
                            onChange={(e) => handleElementChange(idx, 'color', e.target.value)}
                            className={styles.colorPicker}
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteElement(el)}
                          className={styles.actionBtn}
                          style={{ borderColor: '#ff453a', color: '#ff453a', background: 'rgba(255, 69, 58, 0.05)' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '30px 0 16px 0' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--gold-light)' }}>
                      Configuración de Rarezas
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSortRaritiesByPriority}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        Ordenar por Prioridad
                      </button>
                      <button
                        type="button"
                        onClick={handleAddRarity}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        [+] Agregar Rareza
                      </button>
                    </div>
                  </div>
                  <div className={styles.configList}>
                    {gameConfig.rarities.map((r, idx) => (
                      <div key={r.id} className={styles.configRow}>
                        <span className={styles.configRowLabel}>{r.name}</span>
                        <div className={styles.reorderButtons}>
                          <button
                            type="button"
                            onClick={() => moveRarity(idx, 'up')}
                            disabled={idx === 0}
                            className={styles.reorderBtn}
                            title="Subir"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRarity(idx, 'down')}
                            disabled={idx === gameConfig.rarities.length - 1}
                            className={styles.reorderBtn}
                            title="Bajar"
                          >
                            ▼
                          </button>
                        </div>
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => handleRarityChange(idx, 'name', e.target.value)}
                          className={styles.input}
                          required
                          placeholder="Nombre"
                        />
                        <div className={styles.colorPickerContainer}>
                          <label className={styles.colorPickerLabel}>Color:</label>
                          <input
                            type="color"
                            value={r.color}
                            onChange={(e) => handleRarityChange(idx, 'color', e.target.value)}
                            className={styles.colorPicker}
                            required
                          />
                        </div>
                        <input
                          type="number"
                          value={r.weight}
                          onChange={(e) => handleRarityChange(idx, 'weight', e.target.value)}
                          className={styles.input}
                          min="1"
                          required
                          placeholder="Peso"
                        />
                        <input
                          type="number"
                          value={r.priority ?? 1}
                          onChange={(e) => handleRarityChange(idx, 'priority', e.target.value)}
                          className={styles.input}
                          min="1"
                          max="10"
                          required
                          placeholder="Prioridad"
                          title="Prioridad (1-10)"
                          style={{ maxWidth: '80px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteRarity(r)}
                          className={styles.actionBtn}
                          style={{ borderColor: '#ff453a', color: '#ff453a', background: 'rgba(255, 69, 58, 0.05)' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingConfig}
                    className={styles.submitBtn}
                    style={{ marginTop: '30px' }}
                  >
                    {submittingConfig ? 'Guardando Configuración...' : 'Guardar Parámetros Globales'}
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* EDIT CARD MODAL */}
          {editingCard && (
            <div className={styles.modalOverlay} onClick={() => setEditingCard(null)}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '1.3rem' }}>
                  Editar Carta: {editingCard.id}
                </h3>

                {editMessage && (
                  <div className={`${styles.message} ${editMessage.type === 'success' ? styles.success : styles.error}`}>
                    {editMessage.text}
                  </div>
                )}

                <form onSubmit={handleEditCardSubmit}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre de la Carta</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Descripción</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className={styles.textarea}
                      required
                    />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Rareza</label>
                      <select
                        value={editRarity}
                        onChange={(e) => setEditRarity(e.target.value)}
                        className={styles.select}
                      >
                        {gameConfig.rarities.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Poder (Power)</label>
                      <input
                        type="number"
                        value={editPower}
                        onChange={(e) => setEditPower(e.target.value)}
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
                        value={editElement}
                        onChange={(e) => setEditElement(e.target.value)}
                        className={styles.select}
                      >
                        {gameConfig.elements.map((el) => (
                          <option key={el.id} value={el.id}>
                            {el.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Set / Expansión</label>
                      <select
                        value={editSet}
                        onChange={(e) => setEditSet(e.target.value)}
                        className={styles.select}
                      >
                        {gameConfig.sets?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Ruta de la Imagen (URL)</label>
                    <input
                      type="text"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setEditingCard(null)}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADD ELEMENT MODAL */}
          {modalType === 'addElement' && (
            <div className={styles.modalOverlay} onClick={() => setModalType('none')}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '1.3rem' }}>
                  Agregar Nuevo Elemento
                </h3>
                {modalError && <div className={`${styles.message} ${styles.error}`}>{modalError}</div>}
                <form onSubmit={submitAddElement}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre del Elemento</label>
                    <input
                      type="text"
                      value={newElementName}
                      onChange={(e) => setNewElementName(e.target.value)}
                      className={styles.input}
                      placeholder="Luz, Vacío, etc."
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Color del Elemento</label>
                    <div className={styles.modalColorPickerRow}>
                      <input
                        type="color"
                        value={newElementColor}
                        onChange={(e) => setNewElementColor(e.target.value)}
                        className={styles.colorPicker}
                        required
                      />
                      <span className={styles.colorValueText}>{newElementColor}</span>
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setModalType('none')}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Agregar Elemento
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADD RARITY MODAL */}
          {modalType === 'addRarity' && (
            <div className={styles.modalOverlay} onClick={() => setModalType('none')}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '1.3rem' }}>
                  Agregar Nueva Rareza
                </h3>
                {modalError && <div className={`${styles.message} ${styles.error}`}>{modalError}</div>}
                <form onSubmit={submitAddRarity}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre de la Rareza</label>
                    <input
                      type="text"
                      value={newRarityName}
                      onChange={(e) => setNewRarityName(e.target.value)}
                      className={styles.input}
                      placeholder="Mítico, Astral, etc."
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Color de la Rareza</label>
                    <div className={styles.modalColorPickerRow}>
                      <input
                        type="color"
                        value={newRarityColor}
                        onChange={(e) => setNewRarityColor(e.target.value)}
                        className={styles.colorPicker}
                        required
                      />
                      <span className={styles.colorValueText}>{newRarityColor}</span>
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Multiplicador de Poder (Peso)</label>
                      <input
                        type="number"
                        value={newRarityWeight}
                        onChange={(e) => setNewRarityWeight(e.target.value)}
                        className={styles.input}
                        min="1"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Prioridad (1-10)</label>
                      <input
                        type="number"
                        value={newRarityPriority}
                        onChange={(e) => setNewRarityPriority(e.target.value)}
                        className={styles.input}
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setModalType('none')}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Agregar Rareza
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CONFIRM DELETE CARD MODAL */}
          {modalType === 'deleteCard' && (
            <div className={styles.modalOverlay} onClick={() => setModalType('none')}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '1.3rem', color: '#ff453a' }}>
                  Eliminar Carta Permanentemente
                </h3>
                {modalError && <div className={`${styles.message} ${styles.error}`}>{modalError}</div>}
                {modalSuccess && <div className={`${styles.message} ${styles.success}`}>{modalSuccess}</div>}
                {!modalSuccess && (
                  <>
                    <p style={{ margin: '16px 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      ¿Estás seguro de eliminar permanentemente la carta <strong>{activeDeleteName}</strong>?
                      <br />
                      Esta acción eliminará todas las copias en posesión de los usuarios y no se puede deshacer.
                    </p>
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        onClick={() => setModalType('none')}
                        className="btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={submitDeleteCard}
                        className="btn-primary"
                        style={{ background: '#ff453a', borderColor: '#ff453a', color: '#fff' }}
                      >
                        Confirmar Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CONFIRM DELETE ELEMENT MODAL */}
          {modalType === 'deleteElement' && (
            <div className={styles.modalOverlay} onClick={() => setModalType('none')}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '1.3rem', color: '#ff453a' }}>
                  Eliminar Elemento
                </h3>
                <p style={{ margin: '16px 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  ¿Estás seguro de eliminar el elemento <strong>{activeDeleteName}</strong>?
                  <br />
                  Deberás guardar los parámetros globales para aplicar el cambio permanentemente.
                </p>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setModalType('none')}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={submitDeleteElement}
                    className="btn-primary"
                    style={{ background: '#ff453a', borderColor: '#ff453a', color: '#fff' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRM DELETE RARITY MODAL */}
          {modalType === 'deleteRarity' && (
            <div className={styles.modalOverlay} onClick={() => setModalType('none')}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '1.3rem', color: '#ff453a' }}>
                  Eliminar Rareza
                </h3>
                <p style={{ margin: '16px 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  ¿Estás seguro de eliminar la rareza <strong>{activeDeleteName}</strong>?
                  <br />
                  Deberás guardar los parámetros globales para aplicar el cambio permanentemente.
                </p>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setModalType('none')}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={submitDeleteRarity}
                    className="btn-primary"
                    style={{ background: '#ff453a', borderColor: '#ff453a', color: '#fff' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
