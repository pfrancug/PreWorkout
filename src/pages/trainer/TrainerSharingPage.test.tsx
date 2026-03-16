import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TrainerSharingPage } from './TrainerSharingPage';

describe('TrainerSharingPage', () => {
  it('renders the page title', () => {
    render(<TrainerSharingPage />);

    expect(
      screen.getByRole('heading', { name: 'Data Sharing' }),
    ).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<TrainerSharingPage />);

    const descriptions = screen.getAllByText(
      'Configure what data is shared with your trainer or trainees.',
    );

    expect(descriptions.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the coming soon message', () => {
    render(<TrainerSharingPage />);

    expect(
      screen.getByText('Data sharing settings coming soon.'),
    ).toBeInTheDocument();
  });
});
