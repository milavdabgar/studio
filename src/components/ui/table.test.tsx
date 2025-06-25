import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

describe('Table Components', () => {
  describe('Table', () => {
    it('should render table with wrapper', () => {
      const { container } = render(<Table />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('relative', 'w-full', 'overflow-auto');
      
      const table = wrapper.querySelector('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
    });

    it('should apply custom className', () => {
      const { container } = render(<Table className="custom-table" />);
      
      const table = container.querySelector('table');
      expect(table).toHaveClass('custom-table');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableElement>();
      render(<Table ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLTableElement);
    });
  });

  describe('TableHeader', () => {
    it('should render thead element', () => {
      render(
        <Table>
          <TableHeader />
        </Table>
      );
      
      const thead = screen.getByRole('rowgroup');
      expect(thead.tagName).toBe('THEAD');
      expect(thead).toHaveClass('[&_tr]:border-b');
    });

    it('should apply custom className', () => {
      render(
        <Table>
          <TableHeader className="custom-header" />
        </Table>
      );
      
      const thead = screen.getByRole('rowgroup');
      expect(thead).toHaveClass('custom-header');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <Table>
          <TableHeader ref={ref} />
        </Table>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    });
  });

  describe('TableBody', () => {
    it('should render tbody element', () => {
      render(
        <Table>
          <TableBody />
        </Table>
      );
      
      const tbody = screen.getByRole('rowgroup');
      expect(tbody.tagName).toBe('TBODY');
      expect(tbody).toHaveClass('[&_tr:last-child]:border-0');
    });

    it('should apply custom className', () => {
      render(
        <Table>
          <TableBody className="custom-body" />
        </Table>
      );
      
      const tbody = screen.getByRole('rowgroup');
      expect(tbody).toHaveClass('custom-body');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <Table>
          <TableBody ref={ref} />
        </Table>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    });
  });

  describe('TableFooter', () => {
    it('should render tfoot element', () => {
      render(
        <Table>
          <TableFooter />
        </Table>
      );
      
      const tfoot = screen.getByRole('rowgroup');
      expect(tfoot.tagName).toBe('TFOOT');
      expect(tfoot).toHaveClass('border-t', 'bg-muted/50', 'font-medium');
    });

    it('should apply custom className', () => {
      render(
        <Table>
          <TableFooter className="custom-footer" />
        </Table>
      );
      
      const tfoot = screen.getByRole('rowgroup');
      expect(tfoot).toHaveClass('custom-footer');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <Table>
          <TableFooter ref={ref} />
        </Table>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    });
  });

  describe('TableRow', () => {
    it('should render tr element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow />
          </TableBody>
        </Table>
      );
      
      const row = screen.getByRole('row');
      expect(row.tagName).toBe('TR');
      expect(row).toHaveClass('border-b', 'transition-colors', 'hover:bg-muted/50');
    });

    it('should apply custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow className="custom-row" />
          </TableBody>
        </Table>
      );
      
      const row = screen.getByRole('row');
      expect(row).toHaveClass('custom-row');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableRowElement>();
      render(
        <Table>
          <TableBody>
            <TableRow ref={ref} />
          </TableBody>
        </Table>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
    });

    it('should support selected state', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-state="selected" />
          </TableBody>
        </Table>
      );
      
      const row = screen.getByRole('row');
      expect(row).toHaveClass('data-[state=selected]:bg-muted');
    });
  });

  describe('TableHead', () => {
    it('should render th element', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      
      const header = screen.getByRole('columnheader');
      expect(header.tagName).toBe('TH');
      expect(header).toHaveClass('h-12', 'px-4', 'text-left', 'align-middle', 'font-medium');
    });

    it('should apply custom className', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-head">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      
      const header = screen.getByRole('columnheader');
      expect(header).toHaveClass('custom-head');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead ref={ref}>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    });
  });

  describe('TableCell', () => {
    it('should render td element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      
      const cell = screen.getByRole('cell');
      expect(cell.tagName).toBe('TD');
      expect(cell).toHaveClass('p-4', 'align-middle');
    });

    it('should apply custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell">Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      
      const cell = screen.getByRole('cell');
      expect(cell).toHaveClass('custom-cell');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableCellElement>();
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell ref={ref}>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    });
  });

  describe('TableCaption', () => {
    it('should render caption element', () => {
      render(
        <Table>
          <TableCaption>Table caption</TableCaption>
        </Table>
      );
      
      const caption = screen.getByText('Table caption');
      expect(caption.tagName).toBe('CAPTION');
      expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground');
    });

    it('should apply custom className', () => {
      render(
        <Table>
          <TableCaption className="custom-caption">Caption</TableCaption>
        </Table>
      );
      
      const caption = screen.getByText('Caption');
      expect(caption).toHaveClass('custom-caption');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLTableCaptionElement>();
      render(
        <Table>
          <TableCaption ref={ref}>Caption</TableCaption>
        </Table>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLTableCaptionElement);
    });
  });

  describe('Complete Table Structure', () => {
    it('should render complete table with all components', () => {
      render(
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      
      expect(screen.getByText('A list of your recent invoices.')).toBeInTheDocument();
      expect(screen.getByText('Invoice')).toBeInTheDocument();
      expect(screen.getByText('INV001')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should support accessibility attributes', () => {
      render(
        <Table role="table" aria-label="Invoice data">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>INV001</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Invoice data');
      
      const header = screen.getByRole('columnheader');
      expect(header).toHaveAttribute('scope', 'col');
    });
  });
});