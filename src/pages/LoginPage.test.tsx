import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from './LoginPage';

const mockSignInWithGoogle = vi.fn();

vi.mock('@firebase-config/auth', () => ({
  signInWithGoogle: (opts: { onError: (msg: string) => void }) =>
    mockSignInWithGoogle(opts),
}));

describe('LoginPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

  it('renders the sign-in button', () => {
    renderPage();

    expect(
      screen.getByRole('button', { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });

  it('renders the welcome title', () => {
    renderPage();

    expect(screen.getByText('Welcome to PreWorkout')).toBeInTheDocument();
  });

  it('renders links to privacy and terms pages', () => {
    renderPage();

    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    const termsLink = screen.getByRole('link', { name: /terms of service/i });

    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('renders the language toggle button', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /polski/i })).toBeInTheDocument();
  });

  it('toggles language when language button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const langButton = screen.getByRole('button', { name: /polski/i });
    await user.click(langButton);

    expect(
      screen.getByRole('button', { name: /english/i }),
    ).toBeInTheDocument();
  });

  it('calls signInWithGoogle when sign-in button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const signInButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    await user.click(signInButton);

    expect(mockSignInWithGoogle).toHaveBeenCalledWith({
      onError: expect.any(Function),
    });
  });

  it('displays an error message when sign-in fails', async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockImplementation(
      ({ onError }: { onError: (msg: string) => void }) => {
        onError('Auth failed');
      },
    );

    renderPage();

    const signInButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    await user.click(signInButton);

    expect(screen.getByText('Auth failed')).toBeInTheDocument();
  });

  it('dismisses error message when close button is clicked', async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockImplementation(
      ({ onError }: { onError: (msg: string) => void }) => {
        onError('Auth failed');
      },
    );

    renderPage();
    await user.click(
      screen.getByRole('button', { name: /sign in with google/i }),
    );

    expect(screen.getByText('Auth failed')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: '' });
    await user.click(closeButton);

    expect(screen.queryByText('Auth failed')).not.toBeInTheDocument();
  });
});
