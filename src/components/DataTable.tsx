// DataTable component
import React, { useState, useEffect, useMemo } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  pageSize?: number;
  showSearch?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  getRowClassName?: (item: T) => string;
}

type SortDirection = 'asc' | 'desc' | null;

export const DataTable = <T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  pageSize,
  showSearch = false,
  emptyMessage = 'No data available',
  loading = false,
  getRowClassName,
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: SortDirection;
  }>({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    if (!pageSize) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = pageSize ? Math.ceil(sortedData.length / pageSize) : 1;
  const startRecord = pageSize ? (currentPage - 1) * pageSize + 1 : 1;
  const endRecord = pageSize ? Math.min(currentPage * pageSize, sortedData.length) : sortedData.length;

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, searchTerm]);

  const handleSort = (columnKey: keyof T) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(prev => {
      if (prev.key === columnKey) {
        // Cycle through: asc -> desc -> null
        const direction = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc';
        return { key: direction ? columnKey : null, direction };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div 
          role="progressbar" 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-gray-700"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:border-gray-600"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr role="row" aria-label="header-row">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortConfig.key === column.key && (
                      <span className="text-blue-600">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => {
                const customClassName = getRowClassName ? getRowClassName(item) : '';
                return (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(item)}
                    className={`${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''} ${customClassName}`}
                  >
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageSize && sortedData.length > pageSize && (
        <nav role="navigation" aria-label="Table pagination" className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startRecord}-{endRecord} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:border-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:border-gray-600"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
