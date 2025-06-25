import { render, screen } from '@testing-library/react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../select';
import '@testing-library/jest-dom';

describe('Select Component', () => {
  const renderSelect = (props = {}) => {
    return render(
      <Select {...props}>
        <SelectTrigger>
          <SelectValue placeholder="Choose an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  it('renders select trigger with placeholder', () => {
    renderSelect();
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('shows selected value in trigger', () => {
    render(
      <Select value="option2">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('supports disabled state', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Choose an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('renders with custom styling', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem value="option1" className="custom-item">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('custom-trigger');
  });

  it('supports defaultValue', () => {
    render(
      <Select defaultValue="option2">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('supports required prop', () => {
    render(
      <Select required>
        <SelectTrigger>
          <SelectValue placeholder="Required field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-required', 'true');
  });

  it('renders trigger with correct attributes', () => {
    renderSelect();
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-autocomplete', 'none');
    expect(trigger).toHaveAttribute('type', 'button');
  });

  it('renders trigger with placeholder when no value', () => {
    renderSelect();
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-placeholder', '');
  });

  it('applies correct CSS classes to trigger', () => {
    renderSelect();
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'items-center',
      'justify-between',
      'rounded-md',
      'border'
    );
  });

  it('includes chevron icon in trigger', () => {
    renderSelect();
    
    const chevronIcon = screen.getByRole('combobox').querySelector('svg');
    expect(chevronIcon).toBeInTheDocument();
    expect(chevronIcon).toHaveClass('lucide-chevron-down');
  });
});
