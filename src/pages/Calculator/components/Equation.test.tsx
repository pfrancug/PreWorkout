import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Equation } from './Equation';

describe('Equation', () => {
  it('renders the toggle button', () => {
    render(<Equation />);

    expect(
      screen.getByRole('button', { name: /how is this calculated/i }),
    ).toBeInTheDocument();
  });

  it('does not show equation content by default', () => {
    render(<Equation />);

    expect(screen.queryByText(/BMR = 10 × weight/)).not.toBeInTheDocument();
  });

  it('shows the BMR formulas when toggled open', async () => {
    const user = userEvent.setup();
    render(<Equation />);

    await user.click(
      screen.getByRole('button', { name: /how is this calculated/i }),
    );

    expect(
      screen.getByText(/BMR = 10 × weight \+ 6\.25 × height - 5 × age \+ 5/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/BMR = 10 × weight \+ 6\.25 × height - 5 × age - 161/),
    ).toBeInTheDocument();
  });

  it('hides the content when toggled closed', async () => {
    const user = userEvent.setup();
    render(<Equation />);

    const toggleButton = screen.getByRole('button', {
      name: /how is this calculated/i,
    });

    await user.click(toggleButton);
    expect(screen.getAllByText(/BMR = 10 × weight/)).toHaveLength(2);

    await user.click(toggleButton);
    expect(screen.queryByText(/BMR = 10 × weight/)).not.toBeInTheDocument();
  });
});
