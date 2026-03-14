import type { ActivityCategory, CalendarEntry } from '../firebase/database';

export interface IRow {
  id: number;
  date: Date;
  weight: number | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  completed: boolean;
}

// Trainer feature types

export type TrainerConnectionStatus =
  | 'pending'
  | 'active'
  | 'declined'
  | 'deleted';

export interface ITrainerConnection {
  id: string;
  trainerId: string;
  traineeId: string;
  status: TrainerConnectionStatus;
  inviteCode: string;
  createdAt: number;
  note?: string;
}

export type PaymentMarkedBy = 'trainer' | 'trainee';

export type TrainingSessionStatus = 'planned' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid';

export interface ITrainingSession {
  id: string;
  connectionId: string;
  trainerId: string;
  traineeId: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm
  status: TrainingSessionStatus;
  trainerConfirmed: boolean;
  paymentStatus: PaymentStatus;
  paidMarkedBy: PaymentMarkedBy | null;
  createdAt: number;
  createdBy: PaymentMarkedBy;
  cancelledBy?: PaymentMarkedBy;
  note?: string;
  packageId?: string | null;
}

// FullCalendar event types

export type FCEventType = 'entry' | 'trainingSession' | 'note';

export interface FullCalendarEventMeta {
  type: FCEventType;
  /** The calendar entry (for 'entry' type events) */
  entry?: CalendarEntry;
  /** Resolved category (for activity-type entries and virtual trainer events) */
  category?: ActivityCategory;
  session?: ITrainingSession;
  /** Used by note events to carry the YYYY-MM-DD key */
  dateKey?: string;
}
