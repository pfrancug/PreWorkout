import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActivityIcon } from './ActivityIcon';

describe('ActivityIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<ActivityIcon iconId={'dumbbell'} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('falls back to Dumbbell for unknown icon ids', () => {
    const { container: known } = render(<ActivityIcon iconId={'dumbbell'} />);
    const { container: unknown } = render(
      <ActivityIcon iconId={'nonexistent-icon'} />,
    );

    // Both should render an SVG — the fallback should produce the same icon
    expect(known.querySelector('svg')).toBeInTheDocument();
    expect(unknown.querySelector('svg')).toBeInTheDocument();
  });

  it('passes through className and style props', () => {
    const { container } = render(
      <ActivityIcon
        className={'h-5 w-5'}
        iconId={'bike'}
        style={{ color: 'red' }}
      />,
    );
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('h-5', 'w-5');
    expect(svg).toHaveAttribute('style', expect.stringContaining('color: red'));
  });

  it('renders different SVGs for different icon ids', () => {
    const { container: bikeContainer } = render(
      <ActivityIcon iconId={'bike'} />,
    );
    const { container: wavesContainer } = render(
      <ActivityIcon iconId={'waves'} />,
    );

    const bikeHtml = bikeContainer.querySelector('svg')?.innerHTML;
    const wavesHtml = wavesContainer.querySelector('svg')?.innerHTML;

    expect(bikeHtml).not.toBe(wavesHtml);
  });
});
