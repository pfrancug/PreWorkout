import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Results } from './Results';

const mockResult = {
  bmr: 1700,
  maintain: 2933,
  mid: 2683,
  midDeficit: 250,
  loss: 2433,
  lossDeficit: 500,
  extreme: 1933,
  extremeDeficit: 1000,
};

describe('Results', () => {
  it('renders the TDEE value', () => {
    render(<Results result={mockResult} />);

    const elements = screen.getAllByText('2933');

    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the BMR value', () => {
    render(<Results result={mockResult} />);

    expect(screen.getByText('1700')).toBeInTheDocument();
  });

  it('renders all four calorie plan titles', () => {
    render(<Results result={mockResult} />);

    expect(screen.getByText('Maintain Weight')).toBeInTheDocument();
    expect(screen.getByText('Mild Weight Loss')).toBeInTheDocument();
    expect(screen.getByText('Weight Loss')).toBeInTheDocument();
    expect(screen.getByText('Extreme Weight Loss')).toBeInTheDocument();
  });

  it('renders the section heading', () => {
    render(<Results result={mockResult} />);

    expect(screen.getByText('Calorie Plans')).toBeInTheDocument();
  });

  it('renders deficit information for non-maintain plans', () => {
    const { container } = render(<Results result={mockResult} />);
    const content = container.textContent ?? '';

    expect(content).toContain('250');
    expect(content).toContain('500');
    expect(content).toContain('1000');
  });
});
