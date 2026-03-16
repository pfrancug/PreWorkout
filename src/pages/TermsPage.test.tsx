import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { TermsPage } from './TermsPage';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await import('react-router');

  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@contexts/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

describe('TermsPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );

  it('renders the terms title', () => {
    renderPage();

    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('renders all six section headings', () => {
    renderPage();

    expect(screen.getByText('Acceptance of Terms')).toBeInTheDocument();
    expect(screen.getByText('Health Disclaimer')).toBeInTheDocument();
    expect(screen.getByText('User Responsibilities')).toBeInTheDocument();
    expect(screen.getByText('Intellectual Property')).toBeInTheDocument();
    expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();
    expect(screen.getByText('Changes to Terms')).toBeInTheDocument();
  });

  it('renders a link to login when user is not authenticated', () => {
    renderPage();

    const loginLink = screen.getByRole('link', { name: /back to login/i });

    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
