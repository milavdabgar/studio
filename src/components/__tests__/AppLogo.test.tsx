
/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppLogo } from '../app-logo'; // Adjust the import path as necessary

describe('AppLogo', () => {
  it('renders an SVG element', () => {
    // Basic test to ensure the component renders without crashing
    render(<AppLogo />);
    
    // Find the SVG element by tag name
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement?.tagName.toLowerCase()).toBe('svg');
  });

  it('applies className prop', () => {
    const testClassName = 'test-class';
    render(<AppLogo className={testClassName} />);
    const svgElement = document.querySelector('svg');
    expect(svgElement).toHaveClass(testClassName);
  });

  it('applies other SVG props', () => {
    render(<AppLogo data-testid="app-logo-svg" fill="red" />);
    const svgElements = screen.getAllByTestId('app-logo-svg');
    expect(svgElements[0]).toHaveAttribute('fill', 'red');
  });
});
