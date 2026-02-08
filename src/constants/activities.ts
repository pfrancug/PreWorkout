import type { ActivityCategory } from '../firebase/database';

import {
  Bike,
  CircleEllipsis,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Mountain,
  PersonStanding,
  Rocket,
  SkipForward,
  Snowflake,
  Sword,
  Target,
  Timer,
  Trophy,
  Volleyball,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { id: 'dumbbell', icon: Dumbbell, label: 'Dumbbell' },
  { id: 'footprints', icon: Footprints, label: 'Running' },
  { id: 'bike', icon: Bike, label: 'Cycling' },
  { id: 'waves', icon: Waves, label: 'Swimming' },
  { id: 'heart-pulse', icon: HeartPulse, label: 'Cardio' },
  { id: 'flame', icon: Flame, label: 'HIIT' },
  { id: 'mountain', icon: Mountain, label: 'Climbing' },
  { id: 'stretching', icon: PersonStanding, label: 'Yoga' },
  { id: 'sword', icon: Sword, label: 'Martial Arts' },
  { id: 'trophy', icon: Trophy, label: 'Competition' },
  { id: 'volleyball', icon: Volleyball, label: 'Ball Sports' },
  { id: 'timer', icon: Timer, label: 'Timed Workout' },
  { id: 'zap', icon: Zap, label: 'Power Training' },
  { id: 'target', icon: Target, label: 'Precision' },
  { id: 'wind', icon: Wind, label: 'Breathing' },
  { id: 'snowflake', icon: Snowflake, label: 'Cold Exposure' },
  { id: 'rocket', icon: Rocket, label: 'Sprint' },
  { id: 'skip', icon: SkipForward, label: 'Rest Day' },
  { id: 'stretch', icon: Wind, label: 'Stretching' },
  { id: 'other', icon: CircleEllipsis, label: 'Other' },
] as const;

const ICON_MAP: Record<string, typeof Dumbbell> = Object.fromEntries(
  AVAILABLE_ICONS.map(({ id, icon }) => [id, icon]),
);

export type ActivityIconId = (typeof AVAILABLE_ICONS)[number]['id'];

export const ACTIVITY_COLORS: { id: string; hex: string; label: string }[] = [
  { id: 'slate', hex: '#94a3b8', label: 'Slate' },
  { id: 'red', hex: '#f87171', label: 'Red' },
  { id: 'orange', hex: '#fb923c', label: 'Orange' },
  { id: 'amber', hex: '#fbbf24', label: 'Amber' },
  { id: 'lime', hex: '#a3e635', label: 'Lime' },
  { id: 'green', hex: '#4ade80', label: 'Green' },
  { id: 'teal', hex: '#2dd4bf', label: 'Teal' },
  { id: 'sky', hex: '#38bdf8', label: 'Sky' },
  { id: 'violet', hex: '#a78bfa', label: 'Violet' },
  { id: 'fuchsia', hex: '#e879f9', label: 'Fuchsia' },
];

// Includes legacy color IDs for backward compatibility
export const ACTIVITY_COLOR_MAP: Record<string, string> = {
  ...Object.fromEntries(ACTIVITY_COLORS.map(({ id, hex }) => [id, hex])),
  indigo: '#818cf8',
  emerald: '#34d399',
  rose: '#fb7185',
  pink: '#f472b6',
  cyan: '#22d3ee',
  yellow: '#facc15',
  blue: '#60a5fa',
};

export const getIconComponent = (iconId: string) => {
  return ICON_MAP[iconId] ?? Dumbbell;
};

export const DEFAULT_CATEGORIES: ActivityCategory[] = [
  {
    id: 'run',
    icon: 'footprints',
    name: 'Run',
    color: 'green',
  },
  {
    id: 'workout',
    icon: 'dumbbell',
    name: 'Workout',
    color: 'orange',
  },
  {
    id: 'personal-training',
    icon: 'heart-pulse',
    name: 'Personal Training',
    color: 'sky',
  },
];
