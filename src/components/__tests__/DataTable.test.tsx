import { render, screen, fireEvent, within } from '@testing-library/react';
import { DataTable } from '../DataTable';
import '@testing-library/jest-dom';

// Mock data for testing
const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', age: 28 },
];

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
];

describe('DataTable Component', () => {
  const onRowClick = jest.fn();
  
  const renderTable = (props = {}) => {
    const defaultProps = {
      data: mockData,
      columns,
      onRowClick,
      pageSize: 2,
      ...props,
    };
    
    return render(<DataTable {...defaultProps} />);
  };

  beforeEach(() => {
    onRowClick.mockClear();
  });

  it('renders table with correct headers', () => {
    renderTable();
    
    const headerRow = screen.getByRole('row', { name: /header-row/ });
    expect(within(headerRow).getByText('Name')).toBeInTheDocument();
    expect(within(headerRow).getByText('Email')).toBeInTheDocument();
    expect(within(headerRow).getByText('Age')).toBeInTheDocument();
  });

  it('displays the correct number of rows based on pageSize', () => {
    renderTable();
    
    // Header row + pageSize rows
    expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
  });

  it('sorts data when clicking on sortable column headers', () => {
    renderTable();
    
    // Click on Name header to sort ascending
    fireEvent.click(screen.getByText('Name'));
    
    // First row should be Alice Brown (A comes first in ascending order)
    const firstRow = screen.getAllByRole('row')[1]; // First data row
    expect(within(firstRow).getByText('Alice Brown')).toBeInTheDocument();
    
    // Click again to sort descending
    fireEvent.click(screen.getByText('Name'));
    
    // First row should be John Doe (J comes last in descending order)
    const updatedFirstRow = screen.getAllByRole('row')[1];
    expect(within(updatedFirstRow).getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', () => {
    renderTable();
    
    const firstRow = screen.getAllByRole('row')[1]; // First data row
    fireEvent.click(firstRow);
    
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('filters data based on search input', () => {
    renderTable({ showSearch: true });
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    // Should show only rows containing 'john' (case insensitive)
    const rows = screen.getAllByRole('row');
    // 1 header + 1 data row (John Doe)
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText('John Doe')).toBeInTheDocument();
  });

  it('displays pagination controls when data exceeds page size', () => {
    renderTable({ pageSize: 2 });
    
    // Should show pagination controls
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Should show page info
    expect(screen.getByText(/1-2 of 4/)).toBeInTheDocument();
    
    // Click next page
    fireEvent.click(screen.getByLabelText(/next page/i));
    
    // Should update page info
    expect(screen.getByText(/3-4 of 4/)).toBeInTheDocument();
  });

  it('shows empty state when no data is provided', () => {
    renderTable({ data: [], emptyMessage: 'No records found' });
    
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('applies custom row class names', () => {
    const getRowClassName = (row: any) => 
      row.age > 30 ? 'highlight-row' : '';
    
    renderTable({ getRowClassName });
    
    const rows = screen.getAllByRole('row');
    // First data row (John, 30) should not have highlight
    expect(rows[1]).not.toHaveClass('highlight-row');
    // Second data row (Jane, 25) should not have highlight
    expect(rows[2]).not.toHaveClass('highlight-row');
    
    // Go to next page
    fireEvent.click(screen.getByLabelText(/next page/i));
    
    const nextPageRows = screen.getAllByRole('row');
    // First data row (Bob, 35) should have highlight
    expect(nextPageRows[1]).toHaveClass('highlight-row');
  });

  it('displays loading state when loading prop is true', () => {
    renderTable({ loading: true });
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /header-row/ })).not.toBeInTheDocument();
  });
});
