import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CalendarPage } from './CalendarPage';

vi.mock('@components/FullCalendarView', () => ({
  FullCalendarView: () => <div data-testid={'full-calendar-mock'} />,
}));

describe('CalendarPage', () => {
  it('renders the page title', () => {
    render(<CalendarPage />);

    expect(screen.getByText('Activity Calendar')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<CalendarPage />);

    expect(
      screen.getByText('Track your workouts and activities.'),
    ).toBeInTheDocument();
  });

  it('renders the FullCalendarView', () => {
    render(<CalendarPage />);

    expect(screen.getByTestId('full-calendar-mock')).toBeInTheDocument();
  });
});
