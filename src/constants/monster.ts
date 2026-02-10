export type MonsterCategory = 'energy' | 'ultra' | 'juiced';

export type MonsterDrink = {
  id: string;
  name: string;
  color: string;
  sugar: boolean;
  category: MonsterCategory;
  filename: string;
};

export const MONSTER_DRINKS: readonly MonsterDrink[] = [
  // Monster Energy
  {
    id: 'energy-05',
    name: 'Oryginalny zielony',
    color: '#6BD41A',
    sugar: true,
    category: 'energy',
    filename: '05',
  },
  {
    id: 'energy-00',
    name: 'Nitro Super Dry',
    color: '#D3EC27',
    sugar: true,
    category: 'energy',
    filename: '00',
  },
  {
    id: 'energy-02',
    name: 'VR46, czyli The Doctor',
    color: '#FEE32E',
    sugar: true,
    category: 'energy',
    filename: '02',
  },
  {
    id: 'energy-04',
    name: 'Nitro Cosmic Peach',
    color: '#FFA023',
    sugar: true,
    category: 'energy',
    filename: '04',
  },
  {
    id: 'energy-03',
    name: 'Monster Green Zero Cukru',
    color: '#6BD41A',
    sugar: false,
    category: 'energy',
    filename: '03',
  },
  {
    id: 'energy-06',
    name: 'Full Throttle Zero Sugar',
    color: '#F0CE00',
    sugar: false,
    category: 'energy',
    filename: '06',
  },
  {
    id: 'energy-07',
    name: 'Lando Norris Zero Sugar',
    color: '#D9E600',
    sugar: false,
    category: 'energy',
    filename: '07',
  },
  {
    id: 'energy-01',
    name: 'VR46 Zero Sugar',
    color: '#F2E55D',
    sugar: false,
    category: 'energy',
    filename: '01',
  },
  // Monster Ultra
  {
    id: 'ultra-01',
    name: 'Ultra Gold',
    color: '#EBC969',
    sugar: false,
    category: 'ultra',
    filename: '01',
  },
  {
    id: 'ultra-09',
    name: 'Ultra Paradise Bez Cukru',
    color: '#7CC53F',
    sugar: false,
    category: 'ultra',
    filename: '09',
  },
  {
    id: 'ultra-06',
    name: 'Ultra Fiesta Mango Bez Cukru',
    color: '#F5A23C',
    sugar: false,
    category: 'ultra',
    filename: '06',
  },
  {
    id: 'ultra-10',
    name: 'Ultra, czyli Biały Monster',
    color: '#5CF0ED',
    sugar: false,
    category: 'ultra',
    filename: '10',
  },
  {
    id: 'ultra-04',
    name: 'Ultra Violet Bez Cukru, czyli Fioletowy Monster',
    color: '#AE6AEE',
    sugar: false,
    category: 'ultra',
    filename: '04',
  },
  {
    id: 'ultra-02',
    name: 'Ultra Rosá Bez Cukru',
    color: '#FF81AD',
    sugar: false,
    category: 'ultra',
    filename: '02',
  },
  {
    id: 'ultra-05',
    name: 'Ultra Peachy Keen Bez Cukru',
    color: '#F5A192',
    sugar: false,
    category: 'ultra',
    filename: '05',
  },
  {
    id: 'ultra-03',
    name: 'Ultra Watermelon',
    color: '#FF4954',
    sugar: false,
    category: 'ultra',
    filename: '03',
  },
  {
    id: 'ultra-00',
    name: 'Ultra Strawberry Dreams Bez Cukru',
    color: '#EDAAD4',
    sugar: false,
    category: 'ultra',
    filename: '00',
  },
  {
    id: 'ultra-07',
    name: 'Ultra Black Bez Cukru',
    color: '#B1B1B1',
    sugar: false,
    category: 'ultra',
    filename: '07',
  },
  {
    id: 'ultra-08',
    name: 'Ultra Fantasy Ruby Red',
    color: '#F260B9',
    sugar: false,
    category: 'ultra',
    filename: '08',
  },
  // Juiced Monster
  {
    id: 'juiced-00',
    name: 'Mango Loco',
    color: '#00BAFE',
    sugar: true,
    category: 'juiced',
    filename: '00',
  },
  {
    id: 'juiced-05',
    name: 'Aussie Style Lemonade',
    color: '#40DBD5',
    sugar: true,
    category: 'juiced',
    filename: '05',
  },
  {
    id: 'juiced-04',
    name: 'Monarch',
    color: '#FF9A75',
    sugar: true,
    category: 'juiced',
    filename: '04',
  },
  {
    id: 'juiced-01',
    name: 'Khaotic',
    color: '#F0BC37',
    sugar: true,
    category: 'juiced',
    filename: '01',
  },
  {
    id: 'juiced-06',
    name: 'Pipeline Punch',
    color: '#EF536C',
    sugar: true,
    category: 'juiced',
    filename: '06',
  },
  {
    id: 'juiced-07',
    name: 'Pacific Punch',
    color: '#E4CEAA',
    sugar: true,
    category: 'juiced',
    filename: '07',
  },
  {
    id: 'juiced-02',
    name: 'Bad Apple',
    color: '#F63513',
    sugar: true,
    category: 'juiced',
    filename: '02',
  },
  {
    id: 'juiced-03',
    name: 'Rio Punch',
    color: '#F0D335',
    sugar: true,
    category: 'juiced',
    filename: '03',
  },
] as const;

// Helper functions to filter by category
export const MONSTER_ENERGY = MONSTER_DRINKS.filter(
  (d) => d.category === 'energy',
);
export const MONSTER_ULTRA = MONSTER_DRINKS.filter(
  (d) => d.category === 'ultra',
);
export const MONSTER_JUICED = MONSTER_DRINKS.filter(
  (d) => d.category === 'juiced',
);

// Helper to get drink by ID
export const getMonsterById = (id: string): MonsterDrink | undefined =>
  MONSTER_DRINKS.find((d) => d.id === id);
