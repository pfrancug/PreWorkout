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

  it('renders page title and description', () => {
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

    const switches = screen.getAllByRole('switch');
    // First switch is sidebar (checked=true)
    await user.click(switches[0]);

    expect(mockUpdatePreference).toHaveBeenCalledWith('sidebarOpen', false);
  });

  it('toggles chat panel preference', async () => {
    const user = userEvent.setup();
    render(<PreferencesSettingsPage />);

    const switches = screen.getAllByRole('switch');
    // Second switch is chat panel (checked=false)
    await user.click(switches[1]);

    expect(mockUpdatePreference).toHaveBeenCalledWith('chatPanelOpen', true);
  });

  it('toggles hide connection section preference', async () => {
    const user = userEvent.setup();
    render(<PreferencesSettingsPage />);

    const switches = screen.getAllByRole('switch');
    // Third switch is hideConnectionSection (checked=false)
    await user.click(switches[2]);

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

    it('only renders 2 switches for trainers (no hide connection)', () => {
      mockIsTrainer = true;
      render(<PreferencesSettingsPage />);

      expect(screen.getAllByRole('switch')).toHaveLength(2);
    });
  });
});
