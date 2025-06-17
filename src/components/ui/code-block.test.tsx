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
  test('renders code block with language', async () => {
    render(<CodeBlock code="console.log('hello')" language="javascript" />);
    
    // Should show the language
    expect(screen.getByText('javascript')).toBeInTheDocument();
    
    // Should have copy button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
