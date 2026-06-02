import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const cardsData = [
  {
    id: 'air-phoenix',
    name: 'Fénix de Aire',
    description: 'Un majestuoso fénix celestial que cabalga las corrientes y controla las tempestades.',
    imageUrl: '/cards/air.png',
    rarity: 'LEGENDARY',
    power: 110,
    element: 'AIR',
    set: 'Genesis',
  },
  {
    id: 'earth-golem',
    name: 'Golem de Tierra',
    description: 'Un inmenso espíritu terrestre construido de roca sólida y raíces antiguas.',
    imageUrl: '/cards/earth.png',
    rarity: 'RARE',
    power: 26,
    element: 'EARTH',
    set: 'Genesis',
  },
  {
    id: 'fire-dragon',
    name: 'Dragón de Fuego',
    description: 'Señor indiscutible de las profundidades volcánicas de Aetheria.',
    imageUrl: '/cards/fire.png',
    rarity: 'EPIC',
    power: 55,
    element: 'FIRE',
    set: 'Genesis',
  },
  {
    id: 'light-angel',
    name: 'Ángel de Luz',
    description: 'Guardián celestial que emana un brillo cegador e impone la justicia divina.',
    imageUrl: '/cards/light.png',
    rarity: 'LEGENDARY',
    power: 120,
    element: 'LIGHT',
    set: 'Genesis',
  },
  {
    id: 'mythic-deity',
    name: 'Deidad Primordial',
    description: 'La deidad suprema creadora de toda la energía y el orden universal.',
    imageUrl: '/cards/mythic.png',
    rarity: 'MYTHIC',
    power: 350,
    element: 'LIGHT',
    set: 'Genesis',
  },
  {
    id: 'shadow-ghost',
    name: 'Espectro de Sombra',
    description: 'Una entidad misteriosa de pura penumbra y frío eterno.',
    imageUrl: '/cards/shadow.png',
    rarity: 'COMMON',
    power: 15,
    element: 'SHADOW',
    set: 'Genesis',
  },
  {
    id: 'water-serpent',
    name: 'Serpiente del Abismo',
    description: 'Criatura serpentina gigantesca que acecha a sus presas desde las fosas marinas.',
    imageUrl: '/cards/water.png',
    rarity: 'COMMON',
    power: 12,
    element: 'WATER',
    set: 'Genesis',
  },
];

async function main() {
  console.log('Iniciando el sembrado de la base de datos (seeding)...');

  // Limpiar inventarios, cartas, sobres y usuarios
  await prisma.userCard.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.pack.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Datos limpios. Creando catálogo de cartas con imágenes pixel art...');

  for (const card of cardsData) {
    await prisma.card.create({
      data: card,
    });
  }

  console.log(`¡Se han registrado ${cardsData.length} cartas!`);

  console.log('Creando configuración de sobres (packs)...');
  const packsData = [
    {
      id: 'basic',
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
      id: 'standard',
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
      id: 'legendary',
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

  for (const pack of packsData) {
    await prisma.pack.create({
      data: pack,
    });
  }
  console.log(`¡Se han registrado ${packsData.length} configuraciones de sobres!`);

  console.log('Creando usuario Administrador por defecto...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  await prisma.user.create({
    data: {
      username: 'Administrador',
      email: 'admin@aetheria.com',
      password: passwordHash,
      role: 'ADMIN',
      coins: 1000.0,
    },
  });
  console.log('¡Usuario administrador (admin@aetheria.com / admin123) creado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante el sembrado de la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

