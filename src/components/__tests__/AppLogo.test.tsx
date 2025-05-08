
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppLogo } from '../app-logo'; // Adjust the import path as necessary

describe('AppLogo', () => {
  it('renders an SVG element', () => {
    // Basic test to ensure the component renders without crashing
    render(<AppLogo />);
    expect(screen.getByTestId('app-logo')).toBeInTheDocument();

    // Original tests
    render(<AppLogo />);
    const svgElement = screen.getByRole('img', { hidden: true }); // SVGs might not have an explicit role by default
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe('svg');
  });

  it('applies className prop', () => {
    const testClassName = 'test-class';
    render(<AppLogo className={testClassName} />);
    const svgElement = screen.getByRole('img', { hidden: true });
    expect(svgElement).toHaveClass(testClassName);
  });

  it('applies other SVG props', () => {
    render(<AppLogo data-testid="app-logo-svg" fill="red" />);
    const svgElement = screen.getByTestId('app-logo-svg');
    expect(svgElement).toHaveAttribute('fill', 'red');
  });
});
