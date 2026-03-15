import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CalculatorPage } from './CalculatorPage';

vi.mock('@contexts/useSettings', () => ({
  useSettings: () => ({
    settings: { sex: 'male', age: '30', height: '175' },
  }),
}));

vi.mock('@contexts/useDataSet', () => ({
  useDataSet: () => ({ dataSet: [] }),
}));

describe('CalculatorPage', () => {
  it('renders the page title', () => {
    render(<CalculatorPage />);

    expect(screen.getByText('Calorie Calculator')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<CalculatorPage />);

    expect(
      screen.getByText(
        'Calculate your daily caloric needs using the Mifflin-St Jeor equation.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the calculator form with default values', () => {
    render(<CalculatorPage />);

    expect(screen.getByLabelText(/age/i)).toHaveValue(30);
    expect(screen.getByLabelText(/height/i)).toHaveValue(175);
  });

  it('renders results section with TDEE', () => {
    render(<CalculatorPage />);

    expect(
      screen.getByText('Your Daily Energy Expenditure'),
    ).toBeInTheDocument();
    expect(screen.getByText('Calorie Plans')).toBeInTheDocument();
  });

  it('renders the equation section', () => {
    render(<CalculatorPage />);

    expect(
      screen.getByRole('button', { name: /how is this calculated/i }),
    ).toBeInTheDocument();
  });
});
