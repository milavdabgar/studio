import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
import { describe, it, expect } from '@jest/globals';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render a div element', () => {
      render(<Card data-testid="card">Card content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card.tagName).toBe('DIV');
    });

    it('should render card content', () => {
      render(<Card>Test card content</Card>);
      expect(screen.getByText('Test card content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<Card data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('border');
      expect(card.className).toContain('bg-card');
      expect(card.className).toContain('text-card-foreground');
      expect(card.className).toContain('shadow-sm');
    });

    it('should accept custom className', () => {
      render(<Card className="custom-card-class" data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-card-class');
      expect(card.className).toContain('rounded-lg');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Card</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(Card.displayName).toBe('Card');
    });

    it('should accept HTML attributes', () => {
      render(<Card id="test-card" data-testid="card">Card</Card>);
      const card = screen.getByTestId('card');
      expect(card.id).toBe('test-card');
    });
  });

  describe('CardHeader', () => {
    it('should render a div element', () => {
      render(<CardHeader data-testid="card-header">Header content</CardHeader>);
      const header = screen.getByTestId('card-header');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('DIV');
    });

    it('should render header content', () => {
      render(<CardHeader>Header text</CardHeader>);
      expect(screen.getByText('Header text')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardHeader data-testid="card-header">Header</CardHeader>);
      const header = screen.getByTestId('card-header');
      expect(header.className).toContain('flex');
      expect(header.className).toContain('flex-col');
      expect(header.className).toContain('space-y-1.5');
      expect(header.className).toContain('p-6');
    });

    it('should accept custom className', () => {
      render(<CardHeader className="custom-header" data-testid="card-header">Header</CardHeader>);
      const header = screen.getByTestId('card-header');
      expect(header.className).toContain('custom-header');
      expect(header.className).toContain('flex');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });
  });

  describe('CardTitle', () => {
    it('should render a div element', () => {
      render(<CardTitle data-testid="card-title">Title content</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('DIV');
    });

    it('should render title content', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardTitle data-testid="card-title">Title</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title.className).toContain('text-2xl');
      expect(title.className).toContain('font-semibold');
      expect(title.className).toContain('leading-none');
      expect(title.className).toContain('tracking-tight');
    });

    it('should accept custom className', () => {
      render(<CardTitle className="custom-title" data-testid="card-title">Title</CardTitle>);
      const title = screen.getByTestId('card-title');
      expect(title.className).toContain('custom-title');
      expect(title.className).toContain('text-2xl');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });
  });

  describe('CardDescription', () => {
    it('should render a div element', () => {
      render(<CardDescription data-testid="card-description">Description content</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('DIV');
    });

    it('should render description content', () => {
      render(<CardDescription>Card description text</CardDescription>);
      expect(screen.getByText('Card description text')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardDescription data-testid="card-description">Description</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description.className).toContain('text-sm');
      expect(description.className).toContain('text-muted-foreground');
    });

    it('should accept custom className', () => {
      render(<CardDescription className="custom-description" data-testid="card-description">Description</CardDescription>);
      const description = screen.getByTestId('card-description');
      expect(description.className).toContain('custom-description');
      expect(description.className).toContain('text-sm');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardDescription.displayName).toBe('CardDescription');
    });
  });

  describe('CardContent', () => {
    it('should render a div element', () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      expect(content).toBeInTheDocument();
      expect(content.tagName).toBe('DIV');
    });

    it('should render content', () => {
      render(<CardContent>Main card content</CardContent>);
      expect(screen.getByText('Main card content')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      expect(content.className).toContain('p-6');
      expect(content.className).toContain('pt-0');
    });

    it('should accept custom className', () => {
      render(<CardContent className="custom-content" data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      expect(content.className).toContain('custom-content');
      expect(content.className).toContain('p-6');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });
  });

  describe('CardFooter', () => {
    it('should render a div element', () => {
      render(<CardFooter data-testid="card-footer">Footer content</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe('DIV');
    });

    it('should render footer content', () => {
      render(<CardFooter>Footer text</CardFooter>);
      expect(screen.getByText('Footer text')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      expect(footer.className).toContain('flex');
      expect(footer.className).toContain('items-center');
      expect(footer.className).toContain('p-6');
      expect(footer.className).toContain('pt-0');
    });

    it('should accept custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="card-footer">Footer</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      expect(footer.className).toContain('custom-footer');
      expect(footer.className).toContain('flex');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct display name', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });
  });

  describe('Card composition', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content of the card goes here.</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test card description')).toBeInTheDocument();
      expect(screen.getByText('Main content of the card goes here.')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('should maintain proper structure hierarchy', () => {
      render(
        <Card data-testid="structured-card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
            <CardDescription data-testid="description">Description</CardDescription>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const card = screen.getByTestId('structured-card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const description = screen.getByTestId('description');
      const content = screen.getByTestId('content');
      const footer = screen.getByTestId('footer');

      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      expect(card).toContainElement(footer);
      expect(header).toContainElement(title);
      expect(header).toContainElement(description);
    });

    it('should work with partial card components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Minimal Card</CardTitle>
          </CardHeader>
          <CardContent>Just content, no footer</CardContent>
        </Card>
      );

      expect(screen.getByText('Minimal Card')).toBeInTheDocument();
      expect(screen.getByText('Just content, no footer')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty content gracefully', () => {
      render(<Card data-testid="empty-card"></Card>);
      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
      expect(card.textContent).toBe('');
    });

    it('should handle null className', () => {
      render(<Card className={null as any} data-testid="null-class-card">Content</Card>);
      const card = screen.getByTestId('null-class-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<Card data-testid="undefined-children-card">{undefined}</Card>);
      const card = screen.getByTestId('undefined-children-card');
      expect(card).toBeInTheDocument();
    });
  });
});