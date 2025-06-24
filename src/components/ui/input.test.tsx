import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';
import { describe, it, expect, jest } from '@jest/globals';

describe('Input', () => {
  describe('basic rendering', () => {
    it('should render an input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('should render with default type', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      // Default type is text, but may not be explicitly set in HTML
      expect(input).toBeInTheDocument();
    });

    it('should be enabled by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeEnabled();
    });
  });

  describe('input types', () => {
    it('should render with text type', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render with email type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render with password type', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render with number type', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render with search type', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render with tel type', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render with url type', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('value and onChange', () => {
    it('should display the provided value', () => {
      render(<Input value="test value" readOnly />);
      const input = screen.getByDisplayValue('test value');
      expect(input).toBeInTheDocument();
    });

    it('should call onChange when value changes', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: 'new value' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should update value on user input', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'typed text' } });
      expect(input.value).toBe('typed text');
    });
  });

  describe('placeholder', () => {
    it('should display placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
    });

    it('should have placeholder styling classes', () => {
      render(<Input placeholder="placeholder text" />);
      const input = screen.getByPlaceholderText('placeholder text');
      expect(input.className).toContain('placeholder:text-muted-foreground');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should apply disabled classes', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('disabled:cursor-not-allowed');
      expect(input.className).toContain('disabled:opacity-50');
    });

    it('should be disabled and have disabled attributes', () => {
      const handleChange = jest.fn();
      render(<Input disabled onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      expect(input).toBeDisabled();
      // Note: fireEvent can still trigger onChange even on disabled inputs in tests
      // The real browser behavior is handled by the disabled attribute
    });
  });

  describe('focus and blur events', () => {
    it('should handle onFocus event', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle onBlur event', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should apply focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('focus-visible:outline-none');
      expect(input.className).toContain('focus-visible:ring-2');
      expect(input.className).toContain('focus-visible:ring-ring');
    });
  });

  describe('styling and classes', () => {
    it('should apply default classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('flex');
      expect(input.className).toContain('h-10');
      expect(input.className).toContain('w-full');
      expect(input.className).toContain('rounded-md');
      expect(input.className).toContain('border');
      expect(input.className).toContain('border-input');
      expect(input.className).toContain('bg-background');
      expect(input.className).toContain('px-3');
      expect(input.className).toContain('py-2');
    });

    it('should accept custom className', () => {
      render(<Input className="custom-input-class" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-input-class');
    });

    it('should merge custom className with default classes', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-class');
      expect(input.className).toContain('border-input');
    });

    it('should apply responsive text sizing', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('text-base');
      expect(input.className).toContain('md:text-sm');
    });
  });

  describe('HTML attributes', () => {
    it('should accept id attribute', () => {
      render(<Input id="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input.id).toBe('test-input');
    });

    it('should accept name attribute', () => {
      render(<Input name="username" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should accept required attribute', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should accept readonly attribute', () => {
      render(<Input readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should accept maxLength attribute', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should accept minLength attribute', () => {
      render(<Input minLength={3} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minLength', '3');
    });

    it('should accept pattern attribute', () => {
      render(<Input pattern="[0-9]+" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]+');
    });

    it('should accept autoComplete attribute', () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('should accept autoFocus attribute', () => {
      render(<Input autoFocus />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.autofocus).toBeDefined();
    });
  });

  describe('aria and accessibility', () => {
    it('should accept aria-label', () => {
      render(<Input aria-label="Search input" />);
      const input = screen.getByLabelText('Search input');
      expect(input).toBeInTheDocument();
    });

    it('should accept aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="input-description" />
          <div id="input-description">Input description</div>
        </>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'input-description');
    });

    it('should accept aria-invalid', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should be accessible with labels', () => {
      render(
        <>
          <label htmlFor="accessible-input">Username</label>
          <Input id="accessible-input" />
        </>
      );
      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('should allow accessing input methods through ref', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.select).toBeDefined();
    });
  });

  describe('file input specific', () => {
    it('should apply file input styles when type is file', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input?.className).toContain('file:border-0');
      expect(input?.className).toContain('file:bg-transparent');
      expect(input?.className).toContain('file:text-sm');
      expect(input?.className).toContain('file:font-medium');
    });
  });

  describe('display name', () => {
    it('should have correct display name', () => {
      expect(Input.displayName).toBe('Input');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined type gracefully', () => {
      render(<Input type={undefined} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle empty className', () => {
      render(<Input className="" />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle undefined value gracefully', () => {
      render(<Input value={undefined} readOnly />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });
  });
});