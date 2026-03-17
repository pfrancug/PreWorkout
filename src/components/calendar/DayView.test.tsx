import type { ICalendarEntry } from '@firebase-config/database';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DayView } from './DayView';

vi.mock('@components/ui/dialog', () => ({
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

const baseProps = {
  date: '2025-03-15',
  categories,
  entries: [] as ICalendarEntry[],
  sessions: [],
  note: '',
  onNavigateToEvent: vi.fn(),
  onNavigateToAdd: vi.fn(),
  onNavigateToAddTraining: vi.fn(),
  onNavigateToNote: vi.fn(),
  onNavigateToSession: vi.fn(),
};

describe('DayView', () => {
  it('renders the formatted date', () => {
    render(<DayView {...baseProps} />);

    // The date should appear formatted (the exact format depends on locale)
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<DayView {...baseProps} />);

    expect(screen.getByText('Nothing logged yet')).toBeInTheDocument();
  });

  it('displays entries with activity names', () => {
    const entries = [
      makeEntry({ id: 'e1', activityId: 'yoga' }),
      makeEntry({ id: 'e2', activityId: 'run' }),
    ];
    render(<DayView {...baseProps} entries={entries} />);

    expect(screen.getByText('Yoga')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('displays entry time when present', () => {
    const entries = [makeEntry({ time: '09:00' })];
    render(<DayView {...baseProps} entries={entries} />);

    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('displays entry note when present', () => {
    const entries = [makeEntry({ note: 'Great session' })];
    render(<DayView {...baseProps} entries={entries} />);

    expect(screen.getByText('Great session')).toBeInTheDocument();
  });

  it('displays day note when present', () => {
    render(<DayView {...baseProps} note={'Rest day because tired'} />);

    expect(screen.getByText('Rest day because tired')).toBeInTheDocument();
  });

  it('calls onNavigateToEvent when clicking an entry', async () => {
    const user = userEvent.setup();
    const onNavigateToEvent = vi.fn();
    const entries = [makeEntry({ id: 'e1' })];
    render(
      <DayView
        {...baseProps}
        entries={entries}
        onNavigateToEvent={onNavigateToEvent}
      />,
    );

    await user.click(screen.getByText('Yoga'));

    expect(onNavigateToEvent).toHaveBeenCalledWith('e1');
  });

  it('calls onNavigateToAdd when clicking add event button', async () => {
    const user = userEvent.setup();
    const onNavigateToAdd = vi.fn();
    render(<DayView {...baseProps} onNavigateToAdd={onNavigateToAdd} />);

    await user.click(screen.getByRole('button', { name: /add event/i }));

    expect(onNavigateToAdd).toHaveBeenCalled();
  });

  it('does not show add/note buttons in read-only mode', () => {
    render(<DayView {...baseProps} readOnly />);

    expect(
      screen.queryByRole('button', { name: /add event/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add day note/i }),
    ).not.toBeInTheDocument();
  });

  it('shows add personal training button when canAddTraining is true', () => {
    render(<DayView {...baseProps} canAddTraining />);

    expect(
      screen.getByRole('button', { name: /add personal training/i }),
    ).toBeInTheDocument();
  });

  it('shows add day note button when no note exists', () => {
    render(<DayView {...baseProps} note={''} />);

    expect(
      screen.getByRole('button', { name: /add day note/i }),
    ).toBeInTheDocument();
  });

  it('shows day note button label when note exists', () => {
    render(<DayView {...baseProps} note={'Some note'} />);

    // When note exists, the button text changes to "Day note"
    const buttons = screen.getAllByRole('button', { name: /day note/i });

    expect(buttons.length).toBeGreaterThan(0);
  });
});
