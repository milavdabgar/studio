import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { describe, it, expect } from '@jest/globals';

describe('Alert Components', () => {
  describe('Alert', () => {
    it('should render alert with default variant', () => {
      render(<Alert data-testid="alert">Test alert</Alert>);
      const alert = screen.getByTestId('alert');
      
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveTextContent('Test alert');
    });

    it('should render alert with destructive variant', () => {
      render(<Alert variant="destructive" data-testid="alert">Error alert</Alert>);
      const alert = screen.getByTestId('alert');
      
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('should apply custom className', () => {
      render(<Alert className="custom-class" data-testid="alert">Test</Alert>);
      const alert = screen.getByTestId('alert');
      
      expect(alert).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Alert ref={ref} data-testid="alert">Test</Alert>);
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    it('should accept and spread HTML div attributes', () => {
      render(
        <Alert 
          data-testid="alert" 
          id="test-alert" 
          aria-describedby="description"
        >
          Test
        </Alert>
      );
      const alert = screen.getByTestId('alert');
      
      expect(alert).toHaveAttribute('id', 'test-alert');
      expect(alert).toHaveAttribute('aria-describedby', 'description');
    });

    it('should have correct display name', () => {
      expect(Alert.displayName).toBe('Alert');
    });
  });

  describe('AlertTitle', () => {
    it('should render alert title as h5 element', () => {
      render(<AlertTitle data-testid="alert-title">Alert Title</AlertTitle>);
      const title = screen.getByTestId('alert-title');
      
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H5');
      expect(title).toHaveTextContent('Alert Title');
    });

    it('should apply custom className', () => {
      render(<AlertTitle className="custom-title" data-testid="alert-title">Title</AlertTitle>);
      const title = screen.getByTestId('alert-title');
      
      expect(title).toHaveClass('custom-title');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<AlertTitle ref={ref} data-testid="alert-title">Title</AlertTitle>);
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('H5');
    });

    it('should accept HTML heading attributes', () => {
      render(
        <AlertTitle 
          data-testid="alert-title" 
          id="title-id"
          tabIndex={-1}
        >
          Title
        </AlertTitle>
      );
      const title = screen.getByTestId('alert-title');
      
      expect(title).toHaveAttribute('id', 'title-id');
      expect(title).toHaveAttribute('tabIndex', '-1');
    });

    it('should have correct display name', () => {
      expect(AlertTitle.displayName).toBe('AlertTitle');
    });
  });

  describe('AlertDescription', () => {
    it('should render alert description as div element', () => {
      render(<AlertDescription data-testid="alert-desc">Alert description</AlertDescription>);
      const description = screen.getByTestId('alert-desc');
      
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('DIV');
      expect(description).toHaveTextContent('Alert description');
    });

    it('should apply custom className', () => {
      render(<AlertDescription className="custom-desc" data-testid="alert-desc">Description</AlertDescription>);
      const description = screen.getByTestId('alert-desc');
      
      expect(description).toHaveClass('custom-desc');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<AlertDescription ref={ref} data-testid="alert-desc">Description</AlertDescription>);
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    it('should accept HTML div attributes', () => {
      render(
        <AlertDescription 
          data-testid="alert-desc" 
          id="desc-id"
          role="text"
        >
          Description
        </AlertDescription>
      );
      const description = screen.getByTestId('alert-desc');
      
      expect(description).toHaveAttribute('id', 'desc-id');
      expect(description).toHaveAttribute('role', 'text');
    });

    it('should have correct display name', () => {
      expect(AlertDescription.displayName).toBe('AlertDescription');
    });
  });

  describe('Alert composition', () => {
    it('should render complete alert with title and description', () => {
      render(
        <Alert data-testid="alert">
          <AlertTitle data-testid="alert-title">Important Notice</AlertTitle>
          <AlertDescription data-testid="alert-desc">
            This is an important message that you should read carefully.
          </AlertDescription>
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      const title = screen.getByTestId('alert-title');
      const description = screen.getByTestId('alert-desc');

      expect(alert).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      
      expect(title).toHaveTextContent('Important Notice');
      expect(description).toHaveTextContent('This is an important message that you should read carefully.');
    });

    it('should render destructive alert with icon space', () => {
      render(
        <Alert variant="destructive" data-testid="alert">
          <svg data-testid="alert-icon" />
          <AlertTitle data-testid="alert-title">Error</AlertTitle>
          <AlertDescription data-testid="alert-desc">
            Something went wrong.
          </AlertDescription>
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      const icon = screen.getByTestId('alert-icon');
      const title = screen.getByTestId('alert-title');
      const description = screen.getByTestId('alert-desc');

      expect(alert).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('should handle alert with only title', () => {
      render(
        <Alert data-testid="alert">
          <AlertTitle data-testid="alert-title">Title Only</AlertTitle>
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      const title = screen.getByTestId('alert-title');

      expect(alert).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(screen.queryByTestId('alert-desc')).not.toBeInTheDocument();
    });

    it('should handle alert with only description', () => {
      render(
        <Alert data-testid="alert">
          <AlertDescription data-testid="alert-desc">Description only</AlertDescription>
        </Alert>
      );

      const alert = screen.getByTestId('alert');
      const description = screen.getByTestId('alert-desc');

      expect(alert).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(screen.queryByTestId('alert-title')).not.toBeInTheDocument();
    });
  });
});