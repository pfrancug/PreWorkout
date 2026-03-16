import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NoteView } from './NoteView';

vi.mock('@components/ui/dialog', () => ({
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

describe('NoteView', () => {
  const defaultProps = {
    note: 'Test note content',
    onBack: vi.fn(),
    onNoteChange: vi.fn(),
  };

  it('renders the note text in the textarea', () => {
    render(<NoteView {...defaultProps} />);

    expect(screen.getByRole('textbox')).toHaveValue('Test note content');
  });

  it('renders the title', () => {
    render(<NoteView {...defaultProps} />);

    expect(screen.getByText('Day note')).toBeInTheDocument();
  });

  it('renders save and delete buttons', () => {
    render(<NoteView {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onNoteChange and onBack on save', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onNoteChange = vi.fn();
    render(
      <NoteView
        note={'original'}
        onBack={onBack}
        onNoteChange={onNoteChange}
      />,
    );

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'updated note');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onNoteChange).toHaveBeenCalledWith('updated note');
    expect(onBack).toHaveBeenCalled();
  });

  it('calls onNoteChange with empty string and onBack on delete', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onNoteChange = vi.fn();
    render(
      <NoteView
        note={'some note'}
        onBack={onBack}
        onNoteChange={onNoteChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onNoteChange).toHaveBeenCalledWith('');
    expect(onBack).toHaveBeenCalled();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<NoteView {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
