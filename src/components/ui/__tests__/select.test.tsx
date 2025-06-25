import { render, screen, fireEvent, within } from '@testing-library/react';
import { Select } from '../select';
import '@testing-library/jest-dom';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select Component', () => {
  const onChange = jest.fn();
  const label = 'Test Select';
  
  const renderSelect = (props = {}) => {
    const defaultProps = {
      label,
      options,
      onChange,
      value: '',
      ...props,
    };
    return render(<Select {...defaultProps} />);
  };

  beforeEach(() => {
    onChange.mockClear();
  });

  it('renders with label', () => {
    renderSelect();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows placeholder when no value is selected', () => {
    renderSelect({ placeholder: 'Select an option' });
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    renderSelect();
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('calls onChange when an option is selected', () => {
    renderSelect();
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    const option = screen.getByText('Option 1');
    fireEvent.click(option);
    
    expect(onChange).toHaveBeenCalledWith('option1');
  });

  it('filters options when searching', () => {
    renderSelect({ searchable: true });
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Option 1' } });
    
    const listbox = screen.getByRole('listbox');
    const visibleOptions = within(listbox).getAllByRole('option');
    
    expect(visibleOptions).toHaveLength(1);
    expect(visibleOptions[0]).toHaveTextContent('Option 1');
  });

  it('displays selected value', () => {
    renderSelect({ value: 'option2' });
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'This field is required';
    renderSelect({ error: errorMessage });
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveClass('border-red-500');
  });

  it('disables the select when disabled prop is true', () => {
    renderSelect({ disabled: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('closes dropdown when clicking outside', () => {
    renderSelect();
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    fireEvent.mouseDown(document.body);
    
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    renderSelect();
    const select = screen.getByRole('combobox');
    
    // Focus the select
    select.focus();
    
    // Press down arrow to open and move to first option
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    
    // First option should be highlighted
    const listbox = screen.getByRole('listbox');
    const firstOption = within(listbox).getAllByRole('option')[0];
    expect(firstOption).toHaveClass('bg-gray-100');
    
    // Press down arrow to move to second option
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    const secondOption = within(listbox).getAllByRole('option')[1];
    expect(secondOption).toHaveClass('bg-gray-100');
    
    // Press enter to select
    fireEvent.keyDown(select, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('option2');
    
    // Dropdown should close after selection
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
