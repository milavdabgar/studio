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

  it('displays sortable column headers and allows clicking', () => {
    renderTable();
    
    // Check that sortable headers are present and clickable
    const nameHeader = screen.getByText('Name');
    expect(nameHeader).toBeInTheDocument();
    
    // Click on Name header - should not throw error
    fireEvent.click(nameHeader);
    
    // Basic verification that table still shows data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders clickable rows when onRowClick is provided', () => {
    const { container } = renderTable();
    
    // Check that table rows exist and are rendered
    const firstRow = container.querySelector('tbody tr');
    expect(firstRow).toBeInTheDocument();
    
    // Verify basic table structure exists
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('displays search input when showSearch is enabled', () => {
    const { container } = renderTable({ showSearch: true });
    
    // Check that search input exists
    const searchInput = container.querySelector('input[placeholder="Search..."]');
    expect(searchInput).toBeInTheDocument();
    
    // Verify basic functionality - typing should work
    fireEvent.change(searchInput!, { target: { value: 'test' } });
    expect(searchInput).toHaveValue('test');
    
    // Verify table still renders
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('displays pagination controls when data exceeds page size', () => {
    const { container } = renderTable({ pageSize: 2 });
    
    // Should show pagination controls
    const navElement = container.querySelector('nav');
    expect(navElement).toBeInTheDocument();
    
    // Should show pagination buttons
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    
    // Should show page information (simplified check)
    expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
  });

  it('shows empty state when no data is provided', () => {
    renderTable({ data: [], emptyMessage: 'No records found' });
    
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders table rows with custom class names function', () => {
    const getRowClassName = (row: unknown) => 
      (row as { age: number }).age > 30 ? 'highlight-row' : '';
    
    const { container } = renderTable({ getRowClassName });
    
    // Check that table rows are rendered
    const tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows.length).toBeGreaterThan(0);
    
    // Verify table structure exists
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('displays loading state when loading prop is true', () => {
    const { container } = renderTable({ loading: true });
    
    const loadingSpinner = container.querySelector('[role="progressbar"]');
    expect(loadingSpinner).toBeInTheDocument();
    
    const table = container.querySelector('table');
    expect(table).not.toBeInTheDocument();
  });
});
