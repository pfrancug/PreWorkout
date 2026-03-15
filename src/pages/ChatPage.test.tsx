import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatPage } from './ChatPage';

vi.mock('@components/Chat', () => ({
  Chat: ({ variant }: { variant: string }) => (
    <div data-testid={'chat-mock'}>{variant}</div>
  ),
}));

vi.mock('@contexts/useDataSet', () => ({
  useDataSet: () => ({ dataSet: [] }),
}));

describe('ChatPage', () => {
  it('renders the Chat component with page variant', () => {
    render(<ChatPage />);

    const chat = screen.getByTestId('chat-mock');

    expect(chat).toBeInTheDocument();
    expect(chat).toHaveTextContent('page');
  });
});
