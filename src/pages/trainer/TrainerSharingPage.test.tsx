import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrainerSharingPage } from './TrainerSharingPage';

const { mockSharingPreferences, mockUpdateSharingPreference } = vi.hoisted(
  () => ({
    mockSharingPreferences: {
      shareCalendarActivities: false,
      shareDiary: false,
    },
    mockUpdateSharingPreference: vi.fn(),
  }),
);

vi.mock('@contexts/useSettings', () => ({
  useSettings: () => ({
    sharingPreferences: mockSharingPreferences,
    updateSharingPreference: mockUpdateSharingPreference,
  }),
}));

describe('TrainerSharingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSharingPreferences.shareCalendarActivities = false;
    mockSharingPreferences.shareDiary = false;
  });

  it('renders the page title', () => {
    render(<TrainerSharingPage />);

    expect(
      screen.getByRole('heading', { name: 'Data Sharing' }),
    ).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<TrainerSharingPage />);

    expect(
      screen.getByText('Control what data your trainer can see.'),
    ).toBeInTheDocument();
  });

  it('renders sharing toggles', () => {
    render(<TrainerSharingPage />);

    expect(screen.getByText('Always shared')).toBeInTheDocument();
    expect(screen.getByLabelText('Calendar Activities')).toBeInTheDocument();
    expect(screen.getByLabelText('Diary')).toBeInTheDocument();
  });

  it('shows calendar activities toggle as unchecked by default', () => {
    render(<TrainerSharingPage />);

    const calendarSwitch = screen.getByLabelText('Calendar Activities');

    expect(calendarSwitch).toHaveAttribute('data-state', 'unchecked');
  });

  it('shows diary toggle as unchecked by default', () => {
    render(<TrainerSharingPage />);

    const diarySwitch = screen.getByLabelText('Diary');

    expect(diarySwitch).toHaveAttribute('data-state', 'unchecked');
  });

  it('reflects enabled state for calendar activities', () => {
    mockSharingPreferences.shareCalendarActivities = true;
    mockSharingPreferences.shareDiary = false;

    render(<TrainerSharingPage />);

    const calendarSwitch = screen.getByLabelText('Calendar Activities');

    expect(calendarSwitch).toHaveAttribute('data-state', 'checked');
  });

  it('reflects enabled state for diary', () => {
    mockSharingPreferences.shareCalendarActivities = false;
    mockSharingPreferences.shareDiary = true;

    render(<TrainerSharingPage />);

    const diarySwitch = screen.getByLabelText('Diary');

    expect(diarySwitch).toHaveAttribute('data-state', 'checked');
  });

  it('calls updateSharingPreference when calendar toggle is clicked', () => {
    render(<TrainerSharingPage />);

    const calendarSwitch = screen.getByLabelText('Calendar Activities');
    fireEvent.click(calendarSwitch);

    expect(mockUpdateSharingPreference).toHaveBeenCalledWith(
      'shareCalendarActivities',
      true,
    );
  });

  it('calls updateSharingPreference when diary toggle is clicked', () => {
    render(<TrainerSharingPage />);

    const diarySwitch = screen.getByLabelText('Diary');
    fireEvent.click(diarySwitch);

    expect(mockUpdateSharingPreference).toHaveBeenCalledWith(
      'shareDiary',
      true,
    );
  });

  it('calls updateSharingPreference with false when disabling calendar', () => {
    mockSharingPreferences.shareCalendarActivities = true;
    mockSharingPreferences.shareDiary = false;

    render(<TrainerSharingPage />);

    const calendarSwitch = screen.getByLabelText('Calendar Activities');
    fireEvent.click(calendarSwitch);

    expect(mockUpdateSharingPreference).toHaveBeenCalledWith(
      'shareCalendarActivities',
      false,
    );
  });

  it('renders three cards for name/photo, calendar, and diary', () => {
    render(<TrainerSharingPage />);

    // Name & Photo card shows "Always shared" badge, no toggle
    expect(screen.getByText('Always shared')).toBeInTheDocument();

    // Calendar and Diary cards have switches
    const switches = screen.getAllByRole('switch');

    expect(switches).toHaveLength(2);
  });
});
