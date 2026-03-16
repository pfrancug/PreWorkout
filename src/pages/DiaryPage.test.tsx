import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DiaryPage } from './DiaryPage';

vi.mock('@components/dataTable/DataTable', () => ({
  DataTable: () => <div data-testid={'data-table-mock'} />,
}));

vi.mock('@contexts/useDataSet', () => ({
  useDataSet: () => ({ dataSet: [], setDataSet: vi.fn() }),
}));

vi.mock('@data/columns', () => ({
  getColumns: () => [],
}));

describe('DiaryPage', () => {
  it('renders the diary title', () => {
    render(<DiaryPage />);

    expect(screen.getByText('Food Diary')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<DiaryPage />);

    expect(
      screen.getByText('Track your daily nutrition and weight.'),
    ).toBeInTheDocument();
  });

  it('renders the DataTable', () => {
    render(<DiaryPage />);

    expect(screen.getByTestId('data-table-mock')).toBeInTheDocument();
  });
});
