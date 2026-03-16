import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Loader } from './Loader';

describe('Loader', () => {
  it('renders a spinner SVG', () => {
    const { container } = render(<Loader />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('renders with animate-spin class', () => {
    const { container } = render(<Loader />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveClass('animate-spin');
  });

  it('is centered in a full-screen container', () => {
    const { container } = render(<Loader />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass('flex', 'h-screen', 'w-full');
  });
});
