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

export type TrainerConnectionStatus = 'pending' | 'active' | 'declined';

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

export interface IPaymentSession {
  date: string; // YYYY-MM-DD
  markedPaidBy: PaymentMarkedBy;
  confirmedByTrainer: boolean;
}

export interface IMonthlyPayments {
  sessions: IPaymentSession[];
}
