import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PreferencesSettingsPage } from './PreferencesSettingsPage';

const mockChangeLanguage = vi.fn();
const mockUpdatePreference = vi.fn();

vi.mock('@contexts/useSettings', () => ({
  useSettings: () => ({
    preferences: {
      sidebarOpen: true,
      chatPanelOpen: false,
      language: 'en',
      defaultCalendarView: 'month',
      hideConnectionSection: false,
    },
    updatePreference: (...args: unknown[]) => mockUpdatePreference(...args),
    changeLanguage: (...args: unknown[]) => mockChangeLanguage(...args),
  }),
}));

let mockIsTrainer = false;

vi.mock('@contexts/useAuth', () => ({
  useAuth: () => ({ isTrainer: mockIsTrainer }),
}));

describe('PreferencesSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTrainer = false;
  });

  it('renders page title', () => {
    render(<PreferencesSettingsPage />);

    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('renders language, layout, calendar view, and menu sections', () => {
    render(<PreferencesSettingsPage />);

    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Desktop Layout')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('toggles sidebar preference', async () => {
    const user = userEvent.setup();
    render(<PreferencesSettingsPage />);

    await user.click(screen.getByRole('switch', { name: /sidebar/i }));

    expect(mockUpdatePreference).toHaveBeenCalledWith('sidebarOpen', false);
  });

  it('toggles chat panel preference', async () => {
    const user = userEvent.setup();
    render(<PreferencesSettingsPage />);

    await user.click(screen.getByRole('switch', { name: /chat panel/i }));

    expect(mockUpdatePreference).toHaveBeenCalledWith('chatPanelOpen', true);
  });

  it('toggles hide connection section preference', async () => {
    const user = userEvent.setup();
    render(<PreferencesSettingsPage />);

    await user.click(screen.getByRole('switch', { name: /hide connection/i }));

    expect(mockUpdatePreference).toHaveBeenCalledWith(
      'hideConnectionSection',
      true,
    );
  });

  describe('trainer role', () => {
    it('hides menu section for trainers', () => {
      mockIsTrainer = true;
      render(<PreferencesSettingsPage />);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Hide Connection section'),
      ).not.toBeInTheDocument();
    });

    it('still renders other sections for trainers', () => {
      mockIsTrainer = true;
      render(<PreferencesSettingsPage />);

      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Desktop Layout')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('does not render hide connection switch for trainers', () => {
      mockIsTrainer = true;
      render(<PreferencesSettingsPage />);

      expect(
        screen.queryByRole('switch', { name: /hide connection/i }),
      ).not.toBeInTheDocument();
    });
  });
});
