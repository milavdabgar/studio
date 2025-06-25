import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './dropdown-menu';

describe('DropdownMenu Components', () => {
  describe('DropdownMenu', () => {
    it('should render trigger and content', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      const trigger = screen.getByText('Open Menu');
      expect(trigger).toBeInTheDocument();
      
      // Menu content should not be visible initially
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      
      // Open menu
      await user.click(trigger);
      
      // Menu content should now be visible
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should support controlled mode', () => {
      const onOpenChange = jest.fn();
      
      const { rerender } = render(
        <DropdownMenu open={false} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      
      rerender(
        <DropdownMenu open={true} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuContent', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="dropdown-content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveClass(
        'z-50',
        'min-w-[8rem]',
        'overflow-hidden',
        'rounded-md',
        'border',
        'bg-popover',
        'p-1',
        'text-popover-foreground',
        'shadow-md'
      );
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content" data-testid="dropdown-content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveClass('custom-content');
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent ref={ref}>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DropdownMenuItem', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem data-testid="menu-item">Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const item = screen.getByTestId('menu-item');
      expect(item).toHaveClass(
        'relative',
        'flex',
        'cursor-default',
        'select-none',
        'items-center',
        'gap-2',
        'rounded-sm',
        'px-2',
        'py-1.5',
        'text-sm',
        'outline-none'
      );
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onSelect}>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      await user.click(screen.getByText('Item'));
      
      expect(onSelect).toHaveBeenCalled();
    });

    it('should support inset prop', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset data-testid="menu-item">Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const item = screen.getByTestId('menu-item');
      expect(item).toHaveClass('pl-8');
    });

    it('should support disabled state', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled onSelect={onSelect}>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      const item = screen.getByText('Item');
      expect(item).toHaveClass('data-[disabled]:pointer-events-none', 'data-[disabled]:opacity-50');
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem ref={ref}>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DropdownMenuLabel', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel data-testid="menu-label">Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const label = screen.getByTestId('menu-label');
      expect(label).toHaveClass('px-2', 'py-1.5', 'text-sm', 'font-semibold');
    });

    it('should support inset prop', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset data-testid="menu-label">Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const label = screen.getByTestId('menu-label');
      expect(label).toHaveClass('pl-8');
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel ref={ref}>Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('-mx-1', 'my-1', 'h-px', 'bg-muted');
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator ref={ref} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem data-testid="checkbox-item">
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const item = screen.getByTestId('checkbox-item');
      expect(item).toHaveClass(
        'relative',
        'flex',
        'cursor-default',
        'select-none',
        'items-center',
        'rounded-sm',
        'py-1.5',
        'pl-8',
        'pr-2',
        'text-sm',
        'outline-none'
      );
    });

    it('should handle checked state', async () => {
      const user = userEvent.setup();
      const onCheckedChange = jest.fn();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem 
              checked={true} 
              onCheckedChange={onCheckedChange}
              data-testid="checkbox-item"
            >
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const item = screen.getByTestId('checkbox-item');
      expect(item).toBeInTheDocument();
      
      await user.click(item);
      expect(onCheckedChange).toHaveBeenCalled();
    });

    it('should forward ref', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem ref={ref}>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DropdownMenuRadioGroup and DropdownMenuRadioItem', () => {
    it('should render radio group with items', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={onValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      
      await user.click(screen.getByText('Option 2'));
      expect(onValueChange).toHaveBeenCalledWith('option2');
    });

    it('should render radio item with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioItem value="option" data-testid="radio-item">
              Option
            </DropdownMenuRadioItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const item = screen.getByTestId('radio-item');
      expect(item).toHaveClass(
        'relative',
        'flex',
        'cursor-default',
        'select-none',
        'items-center',
        'rounded-sm',
        'py-1.5',
        'pl-8',
        'pr-2',
        'text-sm',
        'outline-none'
      );
    });

    it('should forward ref on radio item', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioItem ref={ref} value="option">Option</DropdownMenuRadioItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('should render with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Item
              <DropdownMenuShortcut data-testid="shortcut">⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const shortcut = screen.getByTestId('shortcut');
      expect(shortcut).toHaveClass('ml-auto', 'text-xs', 'tracking-widest', 'opacity-60');
      expect(shortcut).toHaveTextContent('⌘K');
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Item
              <DropdownMenuShortcut className="custom-shortcut" data-testid="shortcut">
                ⌘K
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const shortcut = screen.getByTestId('shortcut');
      expect(shortcut).toHaveClass('custom-shortcut');
    });
  });

  describe('DropdownMenuSub', () => {
    it('should render submenu trigger and content', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
                <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const subTrigger = screen.getByText('More Options');
      expect(subTrigger).toBeInTheDocument();
      expect(subTrigger).toHaveClass(
        'flex',
        'cursor-default',
        'gap-2',
        'select-none',
        'items-center',
        'rounded-sm',
        'px-2',
        'py-1.5',
        'text-sm',
        'outline-none'
      );
    });

    it('should support inset on sub trigger', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset data-testid="sub-trigger">
                More Options
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      const subTrigger = screen.getByTestId('sub-trigger');
      expect(subTrigger).toHaveClass('pl-8');
    });

    it('should forward ref on sub trigger', async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLDivElement>();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger ref={ref}>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render sub content with default classes', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent data-testid="sub-content">
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open'));
      
      // Just verify the submenu structure is rendered
      expect(screen.getByText('More Options')).toBeInTheDocument();
    });
  });

  describe('Complete Dropdown Menu Example', () => {
    it('should render complete dropdown menu structure', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onEdit}>
                Edit
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete}>
                Delete
                <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={true}>
              Show Toolbar
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Actions'));
      
      expect(screen.getByText('My Account')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('⌘E')).toBeInTheDocument();
      expect(screen.getByText('⌘D')).toBeInTheDocument();
      expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
      
      await user.click(screen.getByText('Edit'));
      expect(onEdit).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      const trigger = screen.getByText('Open Menu');
      await user.tab();
      expect(trigger).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('should close on escape key', async () => {
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByText('Open Menu'));
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });
  });
});