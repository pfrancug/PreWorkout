import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CalculatorForm } from './CalculatorForm';

describe('CalculatorForm', () => {
  const defaultValues = {
    gender: 'male' as const,
    age: 30,
    height: 175,
    weight: 75,
    activity: 1.725,
  };

  const mockOnChange = vi.fn();

  it('renders gender buttons', () => {
    render(<CalculatorForm onChange={mockOnChange} values={defaultValues} />);

    expect(screen.getByRole('button', { name: 'Male' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Female' })).toBeInTheDocument();
  });

  it('renders age, height, and weight inputs', () => {
    render(<CalculatorForm onChange={mockOnChange} values={defaultValues} />);

    expect(screen.getByLabelText(/age/i)).toHaveValue(30);
    expect(screen.getByLabelText(/height/i)).toHaveValue(175);
    expect(screen.getByLabelText(/weight/i)).toHaveValue(75);
  });

  it('renders the activity level select', () => {
    render(<CalculatorForm onChange={mockOnChange} values={defaultValues} />);

    expect(screen.getByText('Activity Level')).toBeInTheDocument();
  });

  it('calls onChange with gender when female button is clicked', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm onChange={mockOnChange} values={defaultValues} />);

    await user.click(screen.getByRole('button', { name: 'Female' }));

    expect(mockOnChange).toHaveBeenCalledWith('gender', 'female');
  });

  it('calls onChange when age input changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CalculatorForm onChange={onChange} values={defaultValues} />);

    const ageInput = screen.getByLabelText(/age/i);
    await user.type(ageInput, '5');

    expect(onChange).toHaveBeenLastCalledWith('age', expect.any(Number));
  });
});
