import type { ActivityNoteModalProps } from './types';
import type { ITrainingSession } from '@app-types/types';
import type { ICalendarEntry } from '@firebase-config/database';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActivityNoteModal } from './ActivityNoteModal';

vi.mock('./ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid={'dialog'}>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

const categories = [
  { id: 'yoga', icon: 'stretching', name: 'Yoga', color: 'green' },
  { id: 'run', icon: 'footprints', name: 'Running', color: 'red' },
];

const makeEntry = (
  overrides: Partial<ICalendarEntry> = {},
): ICalendarEntry => ({
  id: 'e1',
  type: 'activity',
  activityId: 'yoga',
  time: null,
  ...overrides,
});

const makeSession = (
  overrides: Partial<ITrainingSession> = {},
): ITrainingSession => ({
  id: 's1',
  connectionId: 'conn1',
  trainerId: 'trainer1',
  traineeId: 'trainee1',
  date: '2025-03-15',
  time: '10:00',
  status: 'planned',
  trainerConfirmed: true,
  paymentStatus: 'unpaid',
  paidMarkedBy: null,
  createdAt: Date.now(),
  createdBy: 'trainer',
  ...overrides,
});

const noop = vi.fn();
const asyncNoop = vi.fn().mockResolvedValue(undefined);

const baseProps: ActivityNoteModalProps = {
  modalView: { view: 'day', date: '2025-03-15' },
  categories,
  entries: [],
  sessions: [],
  recentActivityIds: [],
  note: '',
  onNavigate: noop,
  onClose: noop,
  onNoteChange: noop,
  onAddEntry: asyncNoop,
  onDeleteEntry: asyncNoop,
  onUpdateEntryNote: noop,
  onUpdateEntryTime: noop,
  onSaveNewCategory: asyncNoop,
  onAddTrainingSession: asyncNoop,
  onDeleteSession: asyncNoop,
  onUpdateSessionNote: noop,
  onUpdateSessionTime: noop,
};

describe('ActivityNoteModal', () => {
  describe('view routing', () => {
    it('renders DayView for day view', () => {
      render(<ActivityNoteModal {...baseProps} />);

      expect(screen.getByText('Nothing logged yet')).toBeInTheDocument();
    });

    it('renders DayView with entries', () => {
      const entries = [makeEntry({ id: 'e1', activityId: 'yoga' })];
      render(<ActivityNoteModal {...baseProps} entries={entries} />);

      expect(screen.getByText('Yoga')).toBeInTheDocument();
    });

    it('renders EventView when navigated to an existing entry', () => {
      const entries = [makeEntry({ id: 'e1', activityId: 'yoga' })];
      render(
        <ActivityNoteModal
          {...baseProps}
          entries={entries}
          modalView={{ view: 'event', date: '2025-03-15', entryId: 'e1' }}
        />,
      );

      // EventView shows the entry name as a heading
      expect(screen.getByRole('heading', { name: 'Yoga' })).toBeInTheDocument();
      // DayView should NOT be rendered
      expect(screen.queryByText('Nothing logged yet')).not.toBeInTheDocument();
    });

    it('falls back to DayView when entry ID does not match', () => {
      render(
        <ActivityNoteModal
          {...baseProps}
          entries={[]}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'nonexistent',
          }}
        />,
      );

      expect(screen.getByText('Nothing logged yet')).toBeInTheDocument();
    });

    it('renders NoteView for note view', () => {
      render(
        <ActivityNoteModal
          {...baseProps}
          modalView={{ view: 'note', date: '2025-03-15' }}
          note={'Some day note'}
        />,
      );

      expect(screen.queryByText('Nothing logged yet')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Some day note')).toBeInTheDocument();
    });
  });

  describe('session event routing', () => {
    it('renders EventView for a session (not DayView)', () => {
      const sessions = [makeSession({ id: 's1' })];
      render(
        <ActivityNoteModal
          {...baseProps}
          canAddTraining
          sessions={sessions}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'session-s1',
          }}
        />,
      );

      // EventView renders for the session — shows "Trainer session" heading
      expect(
        screen.getByRole('heading', { name: 'Trainer session' }),
      ).toBeInTheDocument();
      // DayView should NOT be rendered alongside
      expect(screen.queryByText('Nothing logged yet')).not.toBeInTheDocument();
    });

    it('renders session with correct color for completed status', () => {
      const sessions = [makeSession({ id: 's1', status: 'completed' })];
      render(
        <ActivityNoteModal
          {...baseProps}
          canAddTraining
          sessions={sessions}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'session-s1',
          }}
        />,
      );

      expect(
        screen.getByRole('heading', { name: 'Trainer session' }),
      ).toBeInTheDocument();
    });

    it('renders session note in EventView', () => {
      const sessions = [makeSession({ id: 's1', note: 'Leg day' })];
      render(
        <ActivityNoteModal
          {...baseProps}
          canAddTraining
          sessions={sessions}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'session-s1',
          }}
        />,
      );

      expect(screen.getByDisplayValue('Leg day')).toBeInTheDocument();
    });

    it('does not render session EventView when canAddTraining is false', () => {
      const sessions = [makeSession({ id: 's1' })];
      render(
        <ActivityNoteModal
          {...baseProps}
          canAddTraining={false}
          sessions={sessions}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'session-s1',
          }}
        />,
      );

      // No session EventView, no DayView fallback either (session- prefix prevents it)
      expect(
        screen.queryByRole('heading', { name: 'Trainer session' }),
      ).not.toBeInTheDocument();
    });

    it('does not render session EventView when session not found', () => {
      render(
        <ActivityNoteModal
          {...baseProps}
          canAddTraining
          sessions={[]}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'session-missing',
          }}
        />,
      );

      expect(
        screen.queryByRole('heading', { name: 'Trainer session' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('session event callbacks', () => {
    it('calls onDeleteSession and navigates back on delete', async () => {
      const user = userEvent.setup();
      const onDeleteSession = vi.fn().mockResolvedValue(undefined);
      const onNavigate = vi.fn();
      const sessions = [makeSession({ id: 's1' })];

      render(
        <ActivityNoteModal
          {...baseProps}
          canAddTraining
          onDeleteSession={onDeleteSession}
          onNavigate={onNavigate}
          sessions={sessions}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'session-s1',
          }}
        />,
      );

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(onDeleteSession).toHaveBeenCalledWith('s1');
      expect(onNavigate).toHaveBeenCalledWith({
        view: 'day',
        date: '2025-03-15',
      });
    });

    it('calls onNavigate back when clicking back arrow', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      const sessions = [makeSession({ id: 's1' })];

      render(
        <ActivityNoteModal
          {...baseProps}
          canAddTraining
          onNavigate={onNavigate}
          sessions={sessions}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'session-s1',
          }}
        />,
      );

      await user.click(screen.getByLabelText('Back'));

      expect(onNavigate).toHaveBeenCalledWith({
        view: 'day',
        date: '2025-03-15',
      });
    });
  });

  describe('entry event callbacks', () => {
    it('calls onDeleteEntry and navigates back on delete', async () => {
      const user = userEvent.setup();
      const onDeleteEntry = vi.fn().mockResolvedValue(undefined);
      const onNavigate = vi.fn();
      const entries = [makeEntry({ id: 'e1' })];

      render(
        <ActivityNoteModal
          {...baseProps}
          entries={entries}
          onDeleteEntry={onDeleteEntry}
          onNavigate={onNavigate}
          modalView={{
            view: 'event',
            date: '2025-03-15',
            entryId: 'e1',
          }}
        />,
      );

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(onDeleteEntry).toHaveBeenCalledWith('e1', '2025-03-15');
      expect(onNavigate).toHaveBeenCalledWith({
        view: 'day',
        date: '2025-03-15',
      });
    });
  });
});
