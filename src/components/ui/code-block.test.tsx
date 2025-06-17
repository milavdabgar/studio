// src/components/ui/code-block.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import CodeBlock from './code-block';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' })
}));

// Mock shiki
jest.mock('shiki', () => ({
  codeToHtml: jest.fn().mockResolvedValue('<pre><code>test code</code></pre>')
}));

describe('CodeBlock', () => {
  test('renders code block with javascript language', async () => {
    render(<CodeBlock code="console.log('hello')" language="javascript" />);
    
    // Should show the language
    expect(screen.getByText('javascript')).toBeInTheDocument();
    
    // Should have copy button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('renders goat ASCII diagram correctly', async () => {
    const goatCode = `
+----+
| Hi |
+----+
    `;
    render(<CodeBlock code={goatCode} language="goat" />);
    
    // Should show "ASCII Diagram" instead of "goat"
    expect(screen.getByText('ASCII Diagram')).toBeInTheDocument();
    
    // Should have copy button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('renders plain text correctly', async () => {
    render(<CodeBlock code="plain text content" language="text" />);
    
    // Should show "Plain Text" instead of "text"
    expect(screen.getByText('Plain Text')).toBeInTheDocument();
    
    // Should have copy button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
