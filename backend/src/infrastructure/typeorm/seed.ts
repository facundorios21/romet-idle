import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CardEntity } from './entities/card.entity';
import { UserCardEntity } from './entities/user-card.entity';
import { PackEntity } from './entities/pack.entity';
import { ElementEntity } from './entities/element.entity';
import { RarityEntity } from './entities/rarity.entity';
import { SetEntity } from './entities/set.entity';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [UserEntity, CardEntity, UserCardEntity, PackEntity, ElementEntity, RarityEntity, SetEntity],
  synchronize: true,
});

// UUID Constantes para Sets
const SET_GENESIS = 'd0ea1000-d1d1-41d1-81d1-d1d1d1d1d1d1';
const SET_ABYSS = 'd0ea2000-d2d2-42d2-82d2-d2d2d2d2d2d2';
const SET_AETHER = 'd0ea3000-d3d3-43d3-83d3-d3d3d3d3d3d3';

// UUID Constantes para Elementos
const EL_FIRE = 'f0ea1000-e1e1-41e1-81e1-e1e1e1e1e1e1';
const EL_WATER = 'f0ea2000-e2e2-42e2-82e2-e2e2e2e2e2e2';
const EL_EARTH = 'f0ea3000-e3e3-43e3-83e3-e3e3e3e3e3e3';
const EL_AIR = 'f0ea4000-e4e4-42e4-82e4-e4e4e4e4e4e4';
const EL_LIGHT = 'f0ea5000-e5e5-42e5-82e5-e5e5e5e5e5e5';
const EL_SHADOW = 'f0ea6000-e6e6-42e6-82e6-e6e6e6e6e6e6';

// UUID Constantes para Rarezas
const RAR_COMMON = 'c0ea1000-c1c1-41c1-81c1-c1c1c1c1c1c1';
const RAR_RARE = 'c0ea2000-c2c2-42c2-82c2-c2c2c2c2c2c2';
const RAR_EPIC = 'c0ea3000-c3c3-43c3-83c3-c3c3c3c3c3c3';
const RAR_LEGENDARY = 'c0ea4000-c4c4-42c4-82c4-c4c4c4c4c4c4';
const RAR_MYTHIC = 'c0ea5000-c5c5-42c5-82c5-c5c5c5c5c5c5';

const cardsData = [
  // --- SET: Genesis ---
  {
    name: 'Fénix de Aire',
    description: 'Un majestuoso fénix celestial que cabalga las corrientes y controla las tempestades.',
    imageUrl: '/cards/air.png',
    rarity: RAR_LEGENDARY,
    power: 110,
    element: EL_AIR,
    set: SET_GENESIS,
  },
  {
    name: 'Golem de Tierra',
    description: 'Un inmenso espíritu terrestre construido de roca sólida y raíces antiguas.',
    imageUrl: '/cards/earth.png',
    rarity: RAR_RARE,
    power: 26,
    element: EL_EARTH,
    set: SET_GENESIS,
  },
  {
    name: 'Dragón de Fuego',
    description: 'Señor indiscutible de las profundidades volcánicas de Aetheria.',
    imageUrl: '/cards/fire.png',
    rarity: RAR_EPIC,
    power: 55,
    element: EL_FIRE,
    set: SET_GENESIS,
  },
  {
    name: 'Ángel de Luz',
    description: 'Guardián celestial que emana un brillo cegador e impone la justicia divina.',
    imageUrl: '/cards/light.png',
    rarity: RAR_LEGENDARY,
    power: 120,
    element: EL_LIGHT,
    set: SET_GENESIS,
  },
  {
    name: 'Espectro de Sombra',
    description: 'Una entidad misteriosa de pura penumbra y frío eterno.',
    imageUrl: '/cards/shadow.png',
    rarity: RAR_COMMON,
    power: 15,
    element: EL_SHADOW,
    set: SET_GENESIS,
  },

  // --- SET: Abyss ---
  {
    name: 'Serpiente del Abismo',
    description: 'Criatura serpentina gigantesca que acecha a sus presas desde las fosas marinas.',
    imageUrl: '/cards/water.png',
    rarity: RAR_COMMON,
    power: 12,
    element: EL_WATER,
    set: SET_ABYSS,
  },
  {
    name: 'Leviatán Colosal',
    description: 'Un coloso acuático ancestral que duerme en el lecho marino y despierta maremotos.',
    imageUrl: '/cards/water.png',
    rarity: RAR_EPIC,
    power: 65,
    element: EL_WATER,
    set: SET_ABYSS,
  },
  {
    name: 'Sombra del Vacío',
    description: 'Una mancha de oscuridad sintiente que absorbe la luz de los seres vivos.',
    imageUrl: '/cards/shadow.png',
    rarity: RAR_RARE,
    power: 24,
    element: EL_SHADOW,
    set: SET_ABYSS,
  },
  {
    name: 'Sirena del Coral',
    description: 'Su canto hipnótico atrae a marineros perdidos hacia los arrecifes sombríos.',
    imageUrl: '/cards/water.png',
    rarity: RAR_COMMON,
    power: 14,
    element: EL_WATER,
    set: SET_ABYSS,
  },
  {
    name: 'Kraken del Caos',
    description: 'Un calamar gigantesco de pesadilla que arrastra flotas enteras al abismo.',
    imageUrl: '/cards/shadow.png',
    rarity: RAR_LEGENDARY,
    power: 105,
    element: EL_SHADOW,
    set: SET_ABYSS,
  },

  // --- SET: Aether ---
  {
    name: 'Deidad Primordial',
    description: 'La deidad suprema creadora de toda la energía y el orden universal.',
    imageUrl: '/cards/mythic.png',
    rarity: RAR_MYTHIC,
    power: 350,
    element: EL_LIGHT,
    set: SET_AETHER,
  },
  {
    name: 'Pegaso Celestial',
    description: 'Un corcel alado legendario que atraviesa los cielos dejando una estela de polvo estelar.',
    imageUrl: '/cards/air.png',
    rarity: RAR_RARE,
    power: 28,
    element: EL_AIR,
    set: SET_AETHER,
  },
  {
    name: 'Elemental de Trueno',
    description: 'Una chispa de energía pura que desata relámpagos devastadores sobre sus enemigos.',
    imageUrl: '/cards/air.png',
    rarity: RAR_EPIC,
    power: 58,
    element: EL_AIR,
    set: SET_AETHER,
  },
  {
    name: 'Grifo del Alba',
    description: 'Una criatura majestuosa con cuerpo de león y alas de águila, heraldo de la mañana.',
    imageUrl: '/cards/light.png',
    rarity: RAR_COMMON,
    power: 18,
    element: EL_LIGHT,
    set: SET_AETHER,
  },
  {
    name: 'Espíritu Estelar',
    description: 'Un alma noble nacida de la luz de una constelación moribunda.',
    imageUrl: '/cards/light.png',
    rarity: RAR_COMMON,
    power: 16,
    element: EL_LIGHT,
    set: SET_AETHER,
  },
];

const packsData = [
  {
    name: 'Sobre Básico',
    cost: 100,
    cardsCount: 3,
    probCommon: 80.0,
    probRare: 18.0,
    probEpic: 2.0,
    probLegendary: 0.0,
    probMythic: 0.0,
  },
  {
    name: 'Sobre Estándar',
    cost: 250,
    cardsCount: 4,
    probCommon: 60.0,
    probRare: 25.0,
    probEpic: 12.0,
    probLegendary: 3.0,
    probMythic: 0.0,
  },
  {
    name: 'Sobre Legendario',
    cost: 600,
    cardsCount: 5,
    probCommon: 20.0,
    probRare: 40.0,
    probEpic: 25.0,
    probLegendary: 12.0,
    probMythic: 3.0,
  },
];

async function main() {
  console.log('Iniciando el sembrado de la base de datos con TypeORM...');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(UserEntity);
  const cardRepo = AppDataSource.getRepository(CardEntity);
  const userCardRepo = AppDataSource.getRepository(UserCardEntity);
  const packRepo = AppDataSource.getRepository(PackEntity);
  const elementRepo = AppDataSource.getRepository(ElementEntity);
  const rarityRepo = AppDataSource.getRepository(RarityEntity);
  const setRepo = AppDataSource.getRepository(SetEntity);

  console.log('Limpiando base de datos (limpiando tablas)...');
  await userCardRepo.createQueryBuilder().delete().execute();
  await cardRepo.createQueryBuilder().delete().execute();
  await packRepo.createQueryBuilder().delete().execute();
  await userRepo.createQueryBuilder().delete().execute();
  await elementRepo.createQueryBuilder().delete().execute();
  await rarityRepo.createQueryBuilder().delete().execute();
  await setRepo.createQueryBuilder().delete().execute();

  console.log('Creando configuración de sets...');
  const setsData = [
    { id: SET_GENESIS, name: 'Genesis' },
    { id: SET_ABYSS, name: 'Abyss' },
    { id: SET_AETHER, name: 'Aether' }
  ];
  for (const s of setsData) {
    const sEntity = setRepo.create(s);
    await setRepo.save(sEntity);
  }
  console.log(`¡Se han registrado ${setsData.length} sets!`);

  console.log('Creando configuración de elementos...');
  const elementsData = [
    { id: EL_FIRE, name: 'Fuego', color: '#ff3b30' },
    { id: EL_WATER, name: 'Agua', color: '#5856d6' },
    { id: EL_EARTH, name: 'Tierra', color: '#34c759' },
    { id: EL_AIR, name: 'Aire', color: '#32ade6' },
    { id: EL_LIGHT, name: 'Luz', color: '#ff9500' },
    { id: EL_SHADOW, name: 'Sombra', color: '#1c1c1e' }
  ];
  for (const el of elementsData) {
    const elEntity = elementRepo.create(el);
    await elementRepo.save(elEntity);
  }
  console.log(`¡Se han registrado ${elementsData.length} elementos!`);

  console.log('Creando configuración de rarezas...');
  const raritiesData = [
    { id: RAR_COMMON, name: 'Común', color: '#8e8e93', weight: 1, priority: 1 },
    { id: RAR_RARE, name: 'Raro', color: '#007aff', weight: 3, priority: 3 },
    { id: RAR_EPIC, name: 'Épico', color: '#af52de', weight: 9, priority: 5 },
    { id: RAR_LEGENDARY, name: 'Legendario', color: '#ffcc00', weight: 27, priority: 8 },
    { id: RAR_MYTHIC, name: 'Mítico', color: '#ff2d55', weight: 81, priority: 10 }
  ];
  for (const r of raritiesData) {
    const rEntity = rarityRepo.create(r);
    await rarityRepo.save(rEntity);
  }
  console.log(`¡Se han registrado ${raritiesData.length} rarezas!`);

  console.log('Creando catálogo de cartas...');
  for (const card of cardsData) {
    const cardEntity = cardRepo.create(card);
    await cardRepo.save(cardEntity);
  }
  console.log(`¡Se han registrado ${cardsData.length} cartas!`);

  console.log('Creando configuración de sobres (packs)...');
  for (const pack of packsData) {
    const packEntity = packRepo.create(pack);
    await packRepo.save(packEntity);
  }
  console.log(`¡Se han registrado ${packsData.length} configuraciones de sobres!`);

  console.log('Creando usuario Administrador por defecto...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const adminUser = userRepo.create({
    username: 'Administrador',
    email: 'admin@aetheria.com',
    password: passwordHash,
    role: 'ADMIN',
    coins: 1000.0,
  });
  await userRepo.save(adminUser);
  console.log('¡Usuario administrador (admin@aetheria.com / admin123) creado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante el sembrado de la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
