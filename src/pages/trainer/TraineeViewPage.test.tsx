import type { ISharingPreferences } from '@firebase-config/database';

import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@contexts/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'trainer-1' },
    loading: false,
    isAdmin: false,
    isTrainer: true,
  }),
}));

const mockGetUserDisplayName = vi.fn().mockResolvedValue('Trainee Name');
const mockGetUserAvatarUrl = vi.fn().mockResolvedValue(null);
const mockSubscribeToTrainerConnections = vi.fn().mockReturnValue(vi.fn());
const mockSubscribeToSharingPreferences = vi.fn().mockReturnValue(vi.fn());

vi.mock('@firebase-config/database', () => ({
  getUserDisplayName: (...args: unknown[]) => mockGetUserDisplayName(...args),
  getUserAvatarUrl: (...args: unknown[]) => mockGetUserAvatarUrl(...args),
  subscribeToTrainerConnections: (...args: unknown[]) =>
    mockSubscribeToTrainerConnections(...args),
  subscribeToSharingPreferences: (...args: unknown[]) =>
    mockSubscribeToSharingPreferences(...args),
}));

vi.mock('@hooks/useTraineeDataSet', () => ({
  useTraineeDataSet: () => ({
    dataSet: [],
    isLoading: false,
  }),
}));

vi.mock('@data/readOnlyColumns', () => ({
  getReadOnlyColumns: () => [],
}));

vi.mock('@components/FullCalendarView', () => ({
  FullCalendarView: (props: Record<string, unknown>) => (
    <div data-testid={'full-calendar-view'}>
      <span data-testid={'filter-activities'}>
        {String(props.filterActivities)}
      </span>
    </div>
  ),
}));

vi.mock('@components/dataTable/ReadOnlyDataTable', () => ({
  ReadOnlyDataTable: () => <div data-testid={'read-only-data-table'} />,
}));

vi.mock('@components/TrainingSessions', () => ({
  TrainingSessions: () => <div data-testid={'training-sessions'} />,
}));

import { TraineeViewPage } from './TraineeViewPage';

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/trainer/view/trainee-1']}>
      <Routes>
        <Route
          element={<TraineeViewPage />}
          path={'/trainer/view/:traineeId'}
        />
      </Routes>
    </MemoryRouter>,
  );

const setupSharingPrefs = (prefs: ISharingPreferences | null) => {
  mockSubscribeToSharingPreferences.mockImplementation(
    (_uid: string, cb: (data: ISharingPreferences | null) => void) => {
      cb(prefs);

      return vi.fn();
    },
  );
};

const setupConnection = () => {
  mockSubscribeToTrainerConnections.mockImplementation(
    (_uid: string, cb: (connections: unknown[]) => void) => {
      cb([{ id: 'conn-1', traineeId: 'trainee-1', status: 'active' }]);

      return vi.fn();
    },
  );
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TraineeViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserDisplayName.mockResolvedValue('Trainee Name');
    mockGetUserAvatarUrl.mockResolvedValue(null);
    mockSubscribeToTrainerConnections.mockReturnValue(vi.fn());
    mockSubscribeToSharingPreferences.mockReturnValue(vi.fn());
  });

  describe('sharing preferences — tab visibility', () => {
    it('hides diary tab when shareDiary is false', async () => {
      setupSharingPrefs({
        shareCalendarActivities: false,
        shareDiary: false,
      });
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      expect(screen.queryByText(/diary/i)).not.toBeInTheDocument();
    });

    it('shows diary tab when shareDiary is true', async () => {
      setupSharingPrefs({
        shareCalendarActivities: false,
        shareDiary: true,
      });
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      expect(screen.getByText(/diary/i)).toBeInTheDocument();
    });

    it('always shows calendar tab regardless of sharing', async () => {
      setupSharingPrefs({
        shareCalendarActivities: false,
        shareDiary: false,
      });
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      expect(screen.getByText(/calendar/i)).toBeInTheDocument();
    });

    it('always shows sessions tab regardless of sharing', async () => {
      setupSharingPrefs({
        shareCalendarActivities: false,
        shareDiary: false,
      });
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      expect(screen.getByText(/sessions/i)).toBeInTheDocument();
    });
  });

  describe('sharing preferences — filterActivities', () => {
    it('passes filterActivities=true to FullCalendarView when activities not shared', async () => {
      setupSharingPrefs({
        shareCalendarActivities: false,
        shareDiary: false,
      });
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      expect(screen.getByTestId('filter-activities')).toHaveTextContent('true');
    });

    it('passes filterActivities=false to FullCalendarView when activities shared', async () => {
      setupSharingPrefs({
        shareCalendarActivities: true,
        shareDiary: false,
      });
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      expect(screen.getByTestId('filter-activities')).toHaveTextContent(
        'false',
      );
    });
  });

  describe('sharing preferences — null (not set)', () => {
    it('defaults to hiding diary and filtering activities when prefs are null', async () => {
      setupSharingPrefs(null);
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      // Diary tab should not be visible (shareDiary defaults to not true)
      expect(screen.queryByText(/diary/i)).not.toBeInTheDocument();
      // Activities should be filtered (shareCalendarActivities defaults to not true)
      expect(screen.getByTestId('filter-activities')).toHaveTextContent('true');
    });
  });

  describe('effective tab fallback', () => {
    it('falls back to calendar when diary tab selected but not shared', async () => {
      setupSharingPrefs({
        shareCalendarActivities: true,
        shareDiary: true,
      });
      setupConnection();
      renderPage();

      await screen.findByText('Trainee Name');

      // Click diary tab
      const user = userEvent.setup();
      await user.click(screen.getByText(/diary/i));

      // Diary content should show
      expect(screen.getByTestId('read-only-data-table')).toBeInTheDocument();
    });
  });

  describe('subscriptions', () => {
    it('subscribes to sharing preferences for the trainee', async () => {
      setupSharingPrefs({
        shareCalendarActivities: false,
        shareDiary: false,
      });
      renderPage();

      await screen.findByText('Trainee Name');

      expect(mockSubscribeToSharingPreferences).toHaveBeenCalledWith(
        'trainee-1',
        expect.any(Function),
      );
    });
  });
});
