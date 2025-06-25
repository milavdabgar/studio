import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

describe('Accordion Components', () => {
  const AccordionTestComponent = () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content for section 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>Content for section 2</AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  it('should render accordion with multiple items', () => {
    render(<AccordionTestComponent />);
    
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });

  it('should show/hide content when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<AccordionTestComponent />);
    
    const trigger1 = screen.getByText('Section 1');
    
    // Content should not be in document initially (accordion is closed)
    expect(screen.queryByText('Content for section 1')).toBeNull();
    
    // Click to expand
    await user.click(trigger1);
    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    
    // Click to collapse
    await user.click(trigger1);
    expect(screen.queryByText('Content for section 1')).toBeNull();
  });

  it('should only allow one item open at a time with type="single"', async () => {
    const user = userEvent.setup();
    render(<AccordionTestComponent />);
    
    const trigger1 = screen.getByText('Section 1');
    const trigger2 = screen.getByText('Section 2');
    
    // Open section 1
    await user.click(trigger1);
    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    
    // Open section 2 - should close section 1
    await user.click(trigger2);
    expect(screen.queryByText('Content for section 1')).toBeNull();
    expect(screen.getByText('Content for section 2')).toBeInTheDocument();
  });

  it('should allow multiple items open with type="multiple"', async () => {
    const user = userEvent.setup();
    const MultipleAccordion = () => (
      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content for section 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    render(<MultipleAccordion />);
    
    const trigger1 = screen.getByText('Section 1');
    const trigger2 = screen.getByText('Section 2');
    
    // Open both sections
    await user.click(trigger1);
    await user.click(trigger2);
    
    // Both should be visible
    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    expect(screen.getByText('Content for section 2')).toBeInTheDocument();
  });

  it('should apply custom className to AccordionItem', () => {
    render(
      <Accordion type="single">
        <AccordionItem value="item-1" className="custom-class">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    // The AccordionItem is the container element with the value and data-state
    const item = screen.getByRole('button', { name: 'Section 1' }).parentElement?.parentElement;
    expect(item).toHaveClass('custom-class');
    expect(item).toHaveClass('border-b'); // Default class from accordion.tsx
  });

  it('should apply custom className to AccordionTrigger', () => {
    render(
      <Accordion type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger className="custom-trigger">Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const trigger = screen.getByText('Section 1');
    expect(trigger).toHaveClass('custom-trigger');
  });

  it('should apply custom className to AccordionContent', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent className="custom-content">Content for section 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const trigger = screen.getByText('Section 1');
    await user.click(trigger);
    
    const content = screen.getByText('Content for section 1');
    expect(content).toHaveClass('custom-content');
  });

  it('should forward ref to AccordionItem', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Accordion type="single">
        <AccordionItem value="item-1" ref={ref}>
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should forward ref to AccordionTrigger', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Accordion type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger ref={ref}>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should forward ref to AccordionContent', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Accordion type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent ref={ref}>Content for section 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should be accessible via keyboard', async () => {
    const user = userEvent.setup();
    render(<AccordionTestComponent />);
    
    const trigger1 = screen.getByText('Section 1');
    
    // Focus and activate with keyboard
    trigger1.focus();
    expect(trigger1).toHaveFocus();
    
    // Press Enter to toggle
    await user.keyboard('{Enter}');
    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    
    // Press Enter again to close
    await user.keyboard('{Enter}');
    expect(screen.queryByText('Content for section 1')).toBeNull();
  });
});