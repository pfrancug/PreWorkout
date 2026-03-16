import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { PrivacyPage } from './PrivacyPage';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await import('react-router');

  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@contexts/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

describe('PrivacyPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );

  it('renders the privacy policy title', () => {
    renderPage();

    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders all six section headings', () => {
    renderPage();

    expect(screen.getByText('Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('How We Use Your Information')).toBeInTheDocument();
    expect(screen.getByText('Data Storage & Security')).toBeInTheDocument();
    expect(screen.getByText('Third-Party Services')).toBeInTheDocument();
    expect(screen.getByText('Your Rights')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders a link to login when user is not authenticated', () => {
    renderPage();

    const loginLink = screen.getByRole('link', { name: /back to login/i });

    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
