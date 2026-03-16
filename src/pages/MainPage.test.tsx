import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MainPage } from './MainPage';

vi.mock('@components/charts/SparkChart', () => ({
  SparkChart: ({ value }: { value: string }) => (
    <div data-testid={`spark-${value}`} />
  ),
}));

vi.mock('@components/TodayPanel', () => ({
  TodayPanel: () => <div data-testid={'today-panel-mock'} />,
}));

vi.mock('@contexts/useDataSet', () => ({
  useDataSet: () => ({ dataSet: [] }),
}));

describe('MainPage', () => {
  it('renders the dashboard title', () => {
    render(<MainPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<MainPage />);

    expect(
      screen.getByText('Overview of your progress and activity.'),
    ).toBeInTheDocument();
  });

  it('renders two SparkCharts for weight and kcal', () => {
    render(<MainPage />);

    expect(screen.getByTestId('spark-weight')).toBeInTheDocument();
    expect(screen.getByTestId('spark-kcal')).toBeInTheDocument();
  });

  it('renders the TodayPanel', () => {
    render(<MainPage />);

    expect(screen.getByTestId('today-panel-mock')).toBeInTheDocument();
  });
});
