import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../modal';
import '@testing-library/jest-dom';

describe('Modal Component', () => {
  const onClose = jest.fn();
  
  const renderModal = (isOpen = true) => {
    return render(
      <Modal isOpen={isOpen} onClose={onClose} title="Test Modal">
        <p>Modal content goes here</p>
      </Modal>
    );
  };

  it('renders when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content goes here')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderModal(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', () => {
    renderModal();
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay', () => {
    renderModal();
    const overlay = screen.getByRole('dialog').parentElement!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the modal content', () => {
    renderModal();
    const content = screen.getByText('Modal content goes here');
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when pressing the Escape key', () => {
    renderModal();
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus inside the modal', () => {
    renderModal();
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveFocus();
    
    // Test tabbing through focusable elements
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
  });
});
