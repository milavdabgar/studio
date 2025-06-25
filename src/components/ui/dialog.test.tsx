import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './dialog';

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('should render dialog trigger and content', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogHeader>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      );
      
      const trigger = screen.getByText('Open Dialog');
      expect(trigger).toBeInTheDocument();
      
      // Dialog content should not be visible initially
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
      
      // Open dialog
      await user.click(trigger);
      
      // Dialog content should now be visible
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Dialog description')).toBeInTheDocument();
      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('should support controlled mode', () => {
      const onOpenChange = jest.fn();
      
      const { rerender } = render(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
      
      rerender(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });
  });

  describe('DialogContent', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="dialog-content">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass(
        'fixed',
        'left-[50%]',
        'top-[50%]',
        'z-50',
        'grid',
        'w-full',
        'max-w-lg',
        'translate-x-[-50%]',
        'translate-y-[-50%]',
        'gap-4',
        'border',
        'bg-background',
        'p-6',
        'shadow-lg'
      );
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="custom-dialog" data-testid="dialog-content">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('custom-dialog');
    });

    it('should contain close button', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should close when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      expect(screen.getByText('Title')).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      // Dialog should be closed (content not visible)
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent ref={ref}>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DialogHeader', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass(
        'flex',
        'flex-col',
        'space-y-1.5',
        'text-center',
        'sm:text-left'
      );
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="dialog-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('DialogFooter', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter data-testid="dialog-footer">
              <button>Cancel</button>
              <button>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass(
        'flex',
        'flex-col-reverse',
        'sm:flex-row',
        'sm:justify-end',
        'sm:space-x-2'
      );
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter className="custom-footer" data-testid="dialog-footer">
              <button>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('DialogTitle', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const title = screen.getByText('Dialog Title');
      expect(title).toHaveClass(
        'text-lg',
        'font-semibold',
        'leading-none',
        'tracking-tight'
      );
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle className="custom-title">Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const title = screen.getByText('Dialog Title');
      expect(title).toHaveClass('custom-title');
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLHeadingElement>();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle ref={ref}>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('DialogDescription', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const description = screen.getByText('Dialog description');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription className="custom-description">
              Dialog description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      const description = screen.getByText('Dialog description');
      expect(description).toHaveClass('custom-description');
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLParagraphElement>();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription ref={ref}>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('DialogClose', () => {
    it('should close dialog when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogClose>Close Dialog</DialogClose>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open'));
      expect(screen.getByText('Title')).toBeInTheDocument();
      
      await user.click(screen.getByText('Close Dialog'));
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogDescription>Are you sure you want to continue?</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open Dialog'));
      
      const title = screen.getByText('Confirmation');
      const description = screen.getByText('Are you sure you want to continue?');
      
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('should support escape key to close', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open Dialog'));
      expect(screen.getByText('Title')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter>
              <button>Cancel</button>
              <button>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Open Dialog'));
      
      const cancelButton = screen.getByText('Cancel');
      const okButton = screen.getByText('OK');
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      expect(cancelButton).toBeInTheDocument();
      expect(okButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Complete Dialog Example', () => {
    it('should render complete dialog structure', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      
      render(
        <Dialog>
          <DialogTrigger>Delete Item</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the item.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <button onClick={onConfirm}>Delete</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      await user.click(screen.getByText('Delete Item'));
      
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone. This will permanently delete the item.')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      
      await user.click(screen.getByText('Delete'));
      expect(onConfirm).toHaveBeenCalled();
    });
  });
});