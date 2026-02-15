export type MonsterCategory = 'energy' | 'ultra' | 'juiced';

export type MonsterDrink = {
  id: string;
  name: string;
  color: string;
  sugar: boolean;
  category: MonsterCategory;
};

export const MONSTER_DRINKS: readonly MonsterDrink[] = [
  // Monster Energy
  {
    id: 'energy-05',
    name: 'Green',
    color: '#6BD41A',
    sugar: true,
    category: 'energy',
  },
  {
    id: 'energy-03',
    name: 'Green',
    color: '#6BD41A',
    sugar: false,
    category: 'energy',
  },
  {
    id: 'energy-06',
    name: 'Full Throttle',
    color: '#F0CE00',
    sugar: false,
    category: 'energy',
  },
  {
    id: 'energy-07',
    name: 'Lando Norris',
    color: '#D9E600',
    sugar: false,
    category: 'energy',
  },
  {
    id: 'energy-04',
    name: 'Nitro Cosmic Peach',
    color: '#FFA023',
    sugar: true,
    category: 'energy',
  },
  {
    id: 'energy-00',
    name: 'Nitro Super Dry',
    color: '#D3EC27',
    sugar: true,
    category: 'energy',
  },
  {
    id: 'energy-02',
    name: 'VR46',
    color: '#FEE32E',
    sugar: true,
    category: 'energy',
  },
  {
    id: 'energy-01',
    name: 'VR46',
    color: '#F2E55D',
    sugar: false,
    category: 'energy',
  },
  // Monster Ultra
  {
    id: 'ultra-10',
    name: 'Ultra',
    color: '#5CF0ED',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-07',
    name: 'Ultra Black',
    color: '#B1B1B1',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-08',
    name: 'Ultra Fantasy Ruby Red',
    color: '#F260B9',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-06',
    name: 'Ultra Fiesta Mango',
    color: '#F5A23C',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-01',
    name: 'Ultra Gold',
    color: '#EBC969',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-09',
    name: 'Ultra Paradise',
    color: '#7CC53F',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-05',
    name: 'Ultra Peachy Keen',
    color: '#F5A192',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-02',
    name: 'Ultra Rosá',
    color: '#FF81AD',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-00',
    name: 'Ultra Strawberry Dreams',
    color: '#EDAAD4',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-04',
    name: 'Ultra Violet',
    color: '#AE6AEE',
    sugar: false,
    category: 'ultra',
  },
  {
    id: 'ultra-03',
    name: 'Ultra Watermelon',
    color: '#FF4954',
    sugar: false,
    category: 'ultra',
  },
  // Juiced Monster
  {
    id: 'juiced-05',
    name: 'Aussie Style Lemonade',
    color: '#40DBD5',
    sugar: true,
    category: 'juiced',
  },
  {
    id: 'juiced-02',
    name: 'Bad Apple',
    color: '#F63513',
    sugar: true,
    category: 'juiced',
  },
  {
    id: 'juiced-01',
    name: 'Khaotic',
    color: '#F0BC37',
    sugar: true,
    category: 'juiced',
  },
  {
    id: 'juiced-00',
    name: 'Mango Loco',
    color: '#00BAFE',
    sugar: true,
    category: 'juiced',
  },
  {
    id: 'juiced-04',
    name: 'Monarch',
    color: '#FF9A75',
    sugar: true,
    category: 'juiced',
  },
  {
    id: 'juiced-07',
    name: 'Pacific Punch',
    color: '#E4CEAA',
    sugar: true,
    category: 'juiced',
  },
  {
    id: 'juiced-06',
    name: 'Pipeline Punch',
    color: '#EF536C',
    sugar: true,
    category: 'juiced',
  },
  {
    id: 'juiced-03',
    name: 'Rio Punch',
    color: '#F0D335',
    sugar: true,
    category: 'juiced',
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
