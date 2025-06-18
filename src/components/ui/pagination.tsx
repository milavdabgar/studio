// src/components/ui/pagination.tsx
"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
  showPreviousNext?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  className,
  showPreviousNext = true,
  showFirstLast = true,
  maxVisiblePages = 5
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we don't have enough pages on one side
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const buildPageUrl = (page: number) => {
    const url = new URL(baseUrl, 'http://localhost');
    if (page > 1) {
      url.searchParams.set('page', page.toString());
    }
    return url.pathname + url.search;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav 
      className={cn("flex items-center justify-center space-x-2", className)}
      aria-label="Pagination Navigation"
    >
      {/* Previous Button */}
      {showPreviousNext && (
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage > 1}
          disabled={currentPage <= 1}
          className={cn(
            "flex items-center space-x-1",
            currentPage <= 1 && "pointer-events-none opacity-50"
          )}
        >
          {currentPage > 1 ? (
            <Link href={buildPageUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Link>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </>
          )}
        </Button>
      )}

      {/* First Page */}
      {showFirstLast && currentPage > 3 && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={buildPageUrl(1)}>1</Link>
          </Button>
          {currentPage > 4 && (
            <div className="flex items-center">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          )}
        </>
      )}

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <div key={`ellipsis-${index}`} className="flex items-center px-2">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <Button
              key={pageNumber}
              variant={isActive ? "default" : "outline"}
              size="sm"
              asChild={!isActive}
              disabled={isActive}
              className={cn(
                "min-w-[40px]",
                isActive && "pointer-events-none"
              )}
            >
              {isActive ? (
                <span>{pageNumber}</span>
              ) : (
                <Link href={buildPageUrl(pageNumber)}>{pageNumber}</Link>
              )}
            </Button>
          );
        })}
      </div>

      {/* Last Page */}
      {showFirstLast && currentPage < totalPages - 2 && (
        <>
          {currentPage < totalPages - 3 && (
            <div className="flex items-center">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={buildPageUrl(totalPages)}>{totalPages}</Link>
          </Button>
        </>
      )}

      {/* Next Button */}
      {showPreviousNext && (
        <Button
          variant="outline"
          size="sm"
          asChild={currentPage < totalPages}
          disabled={currentPage >= totalPages}
          className={cn(
            "flex items-center space-x-1",
            currentPage >= totalPages && "pointer-events-none opacity-50"
          )}
        >
          {currentPage < totalPages ? (
            <Link href={buildPageUrl(currentPage + 1)}>
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </nav>
  );
}

export interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  className
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      Showing {startItem} to {endItem} of {totalItems} results
      {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
    </div>
  );
}
