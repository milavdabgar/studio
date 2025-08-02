import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
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
  { key: 'name' as const, header: 'Name', sortable: true },
  { key: 'email' as const, header: 'Email', sortable: true },
  { key: 'age' as const, header: 'Age', sortable: true },
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
  
  afterEach(() => {
    cleanup();
  });

  it('renders table with correct headers', () => {
    renderTable();
    
    // Check if headers are present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('displays the correct number of rows based on pageSize', () => {
    const { container } = renderTable();
    
    // Check data rows in tbody
    const dataRows = container.querySelectorAll('tbody tr');
    expect(dataRows).toHaveLength(2); // Should show only 2 rows due to pageSize
  });

  it('sorts data when clicking on sortable column headers', () => {
    const { container } = renderTable();
    
    // Click on Name header to sort ascending
    fireEvent.click(screen.getByText('Name'));
    
    // First row should be Alice Brown (A comes first in ascending order)
    const dataRows = container.querySelectorAll('tbody tr');
    expect(dataRows[0]).toHaveTextContent('Alice Brown');
    
    // Click again to sort descending
    fireEvent.click(screen.getByText('Name'));
    
    // First row should be John Doe (J comes last in descending order)
    const updatedDataRows = container.querySelectorAll('tbody tr');
    expect(updatedDataRows[0]).toHaveTextContent('John Doe');
  });

  it('calls onRowClick when a row is clicked', () => {
    const { container } = renderTable();
    
    const firstRow = container.querySelector('tbody tr');
    fireEvent.click(firstRow!);
    
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('filters data based on search input', () => {
    const { container } = renderTable({ showSearch: true });
    
    const searchInput = container.querySelector('input[placeholder="Search..."]');
    fireEvent.change(searchInput!, { target: { value: 'john' } });
    
    // Should show rows containing 'john' (case insensitive)
    // This matches both "John Doe" and "Bob Johnson" 
    const dataRows = container.querySelectorAll('tbody tr');
    expect(dataRows).toHaveLength(2); // 2 data rows (John Doe and Bob Johnson)
    expect(dataRows[0]).toHaveTextContent('John Doe');
    expect(dataRows[1]).toHaveTextContent('Bob Johnson');
  });

  it('displays pagination controls when data exceeds page size', () => {
    const { container } = renderTable({ pageSize: 2 });
    
    // Should show pagination controls
    const navElement = container.querySelector('nav');
    expect(navElement).toBeInTheDocument();
    
    // Should show page info
    expect(screen.getByText(/1-2 of 4/)).toBeInTheDocument();
    
    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should update page info
    expect(screen.getByText(/3-4 of 4/)).toBeInTheDocument();
  });

  it('shows empty state when no data is provided', () => {
    renderTable({ data: [], emptyMessage: 'No records found' });
    
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('applies custom row class names', () => {
    const getRowClassName = (row: unknown) => 
      (row as { age: number }).age > 30 ? 'highlight-row' : '';
    
    const { container } = renderTable({ getRowClassName });
    
    const tableRows = container.querySelectorAll('tbody tr');
    // First data row (John, 30) should not have highlight
    expect(tableRows[0]).not.toHaveClass('highlight-row');
    // Second data row (Jane, 25) should not have highlight
    expect(tableRows[1]).not.toHaveClass('highlight-row');
    
    // Go to next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    const nextPageTableRows = container.querySelectorAll('tbody tr');
    // First data row (Bob, 35) should have highlight
    expect(nextPageTableRows[0]).toHaveClass('highlight-row');
  });

  it('displays loading state when loading prop is true', () => {
    const { container } = renderTable({ loading: true });
    
    const loadingSpinner = container.querySelector('[role="progressbar"]');
    expect(loadingSpinner).toBeInTheDocument();
    
    const table = container.querySelector('table');
    expect(table).not.toBeInTheDocument();
  });
});
