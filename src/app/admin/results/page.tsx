"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, UploadCloud, Download, ArrowUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ExternalLink, User, Filter, BookCheck} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import type { Result, UploadBatch, BranchAnalysis, ResultFilterParams, Pagination as PaginationType, Program, Examination } from '@/types/entities';
import { resultService } from '@/lib/api/results';
import { programService } from '@/lib/api/programs';
import { examinationService } from '@/lib/api/examinations'; // For exam name filter


type SortField = keyof Result | 'programName' | 'none'; 
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [20, 50, 100, 200];

export default function AdminResultsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'results' | 'batches' | 'analysis'>('results');
  
  const [results, setResults] = useState<Result[]>([]);
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [branchAnalysis, setBranchAnalysis] = useState<BranchAnalysis[]>([]);
  const [, setPrograms] = useState<Program[]>([]);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ResultFilterParams>({
    branchName: '',
    semester: undefined,
    academicYear: '',
    examid: undefined, // Used for GTU specific exam ID
    examId: undefined, // Used for our internal Examination ID
    uploadBatch: '',
  });
  
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: ITEMS_PER_PAGE_OPTIONS[0],
    total: 0,
    pages: 1
  });

  const [selectedBatchIdForDelete, setSelectedBatchIdForDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [sortField, setSortField] = useState<SortField>('declarationDate'); 
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');


  useEffect(() => {
    const fetchInitialDropdownData = async () => {
      try {
        const [progData, examData] = await Promise.all([
            programService.getAllPrograms(),
            examinationService.getAllExaminations()
        ]);
        setPrograms(progData);
        setExaminations(examData);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load filter options." });
      }
    };
    fetchInitialDropdownData();
  }, [toast]);

  const fetchResults = async (currentPage = pagination.page, currentLimit = pagination.limit) => {
    setIsLoading(true);
    try {
      const params: ResultFilterParams = {
        page: currentPage,
        limit: currentLimit,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== '' && value !== undefined && value !== null) {
            acc[key as keyof ResultFilterParams] = value as never;
          }
          return acc;
        }, {} as ResultFilterParams)
      };
      if (sortField !== 'none' && params.sortBy !== null && params.sortBy !== undefined) { // Check for null or undefined before assigning
        params.sortBy = sortField;
        params.sortOrder = sortDirection;
      }


      const response = await resultService.getAllResults(params);
      setResults(response.data.results);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch results." });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const response = await resultService.getUploadBatches();
      setBatches(response.data.batches);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch upload batches." });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranchAnalysisData = async () => {
    setIsLoading(true);
    try {
      const params: { academicYear?: string; examid?: number } = {};
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.examid) params.examid = Number(filters.examid);
      // if using examId (our formal exam ID) for analysis
      // if (filters.examId) params.examid = filters.examId; // Map to backend's 'examid' if that's what it expects
      
      const response = await resultService.getBranchAnalysis(params);
      setBranchAnalysis(response.data.analysis);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch branch analysis." });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'results') {
      fetchResults(pagination.page, pagination.limit);
    } else if (activeTab === 'batches') {
      fetchBatches();
    } else if (activeTab === 'analysis') {
      fetchBranchAnalysisData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page, pagination.limit, filters, sortField, sortDirection]);


  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value === 'all' || value === '' ? undefined : value }));
  };
  
  const handleNumericFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value === '' ? undefined : parseInt(value, 10) }));
  };


  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 })); 
    if (activeTab === 'results') fetchResults(1, pagination.limit);
    if (activeTab === 'analysis') fetchBranchAnalysisData();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleDeleteBatch = async () => {
    if (!selectedBatchIdForDelete) return;
    setIsSubmitting(true);
    try {
      const response = await resultService.deleteResultsByBatch(selectedBatchIdForDelete);
      toast({ title: "Batch Deleted", description: `Successfully deleted ${response.data.deletedCount} results.` });
      await fetchBatches();
      await fetchResults(1, pagination.limit); 
      setShowDeleteConfirm(false);
      setSelectedBatchIdForDelete(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleExportResults = async () => {
    try {
        setIsLoading(true);
        const currentFilters: ResultFilterParams = {
            ...Object.entries(filters).reduce((acc, [key, value]) => {
              if (value !== '' && value !== undefined && value !== null) {
                acc[key as keyof ResultFilterParams] = value as never;
              }
              return acc;
            }, {} as ResultFilterParams)
          };
        const response = await resultService.exportResults(currentFilters); 
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `results_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: "Export Successful", description: "Results exported to CSV." });
    } catch (error) {
        toast({ variant: "destructive", title: "Export Error", description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableTableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4 opacity-50 scale-y-[-1]" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />)}
        {sortField !== field && <ArrowUpDown className="h-4 w-4 opacity-20" />}
      </div>
    </TableHead>
  );



  const renderResultsTab = () => (
    <>
      <div className="mb-6 p-3 sm:p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 dark:border-gray-700">
        <div>
          <Label htmlFor="searchTermResults" className="text-sm font-medium">Search Student</Label>
          <Input id="searchTermResults" placeholder="ID, Name, Exam..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-1 min-h-[44px]"/>
        </div>
        <div>
          <Label htmlFor="filterBranchName" className="text-sm font-medium">Branch</Label>
          <Input id="filterBranchName" name="branchName" value={filters.branchName || ''} onChange={handleFilterChange} placeholder="e.g. Computer Engg" className="mt-1 min-h-[44px]"/>
        </div>
        <div>
          <Label htmlFor="filterSemester" className="text-sm font-medium">Semester</Label>
          <Input id="filterSemester" name="semester" type="number" value={filters.semester || ''} onChange={handleNumericFilterChange} placeholder="e.g. 3" className="mt-1 min-h-[44px]"/>
        </div>
        <div>
          <Label htmlFor="filterAcademicYear" className="text-sm font-medium">Academic Year</Label>
          <Input id="filterAcademicYear" name="academicYear" value={filters.academicYear || ''} onChange={handleFilterChange} placeholder="e.g. 2023-24" className="mt-1 min-h-[44px]"/>
        </div>
        <div>
            <Label htmlFor="filterExamIdResults" className="text-sm font-medium">Examination</Label>
            <Select name="examId" value={filters.examId || "all"} onValueChange={(val) => setFilters(prev => ({...prev, examId: val === "all" ? undefined : val, examid: undefined}))}>
                <SelectTrigger id="filterExamIdResults" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Examination" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Examinations</SelectItem>
                    {examinations.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name} ({exam.academicYear})</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
         <div className="lg:col-start-6 lg:col-end-7 flex items-end">
            <Button onClick={applyFilters} className="w-full mt-1 min-h-[44px]"><Filter className="mr-2 h-4 w-4"/>Apply Filters</Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden space-y-3">
        {isLoading ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-primary" />
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              No results found.
            </CardContent>
          </Card>
        ) : (
          results.map(result => (
            <Card key={result._id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm leading-tight">
                      {result.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{result.enrollmentNo}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.branchName} - Semester {result.semester}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                    result.result === 'PASS' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {result.result}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
                  <div>
                    <span className="text-muted-foreground">Exam:</span>
                    <p className="font-medium truncate">{result.exam}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SPI:</span>
                    <p className="font-medium">{result.spi?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPI:</span>
                    <p className="font-medium">{result.cpi?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Percentage:</span>
                    <p className="font-medium">
                      {result.spi ? ((result.spi - 0.5) * 10).toFixed(1) + '%' : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/admin/results/detailed/${result._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                      <ExternalLink className="h-4 w-4 mr-2" /> View Details
                    </Button>
                  </Link>
                  <Link href={`/admin/results/history/${result.enrollmentNo}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                      <User className="h-4 w-4 mr-2" /> History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader><TableRow>
            <SortableTableHeader field="enrollmentNo" label="Enrollment No" />
            <SortableTableHeader field="name" label="Name" />
            <SortableTableHeader field="branchName" label="Branch" />
            <SortableTableHeader field="semester" label="Sem" />
            <SortableTableHeader field="exam" label="Exam" />
            <SortableTableHeader field="spi" label="SPI" />
            <SortableTableHeader field="cpi" label="CPI" />
            <SortableTableHeader field="result" label="Result" />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-primary" /></TableCell></TableRow>
            ) : results.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No results found.</TableCell></TableRow>
            ) : (
              results.map(result => (
                <TableRow key={result._id}>
                  <TableCell>{result.enrollmentNo}</TableCell>
                  <TableCell className="font-medium">{result.name}</TableCell>
                  <TableCell>{result.branchName}</TableCell>
                  <TableCell>{result.semester}</TableCell>
                  <TableCell>{result.exam}</TableCell>
                  <TableCell>{result.spi?.toFixed(2)}</TableCell>
                  <TableCell>{result.cpi?.toFixed(2)}</TableCell>
                  <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${result.result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{result.result}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Link href={`/admin/results/detailed/${result._id}`} passHref>
                      <Button variant="outline" size="icon" className="h-7 w-7"><ExternalLink className="h-4 w-4" /></Button>
                    </Link>
                    <Link href={`/admin/results/history/${result.enrollmentNo}`} passHref>
                       <Button variant="outline" size="icon" className="h-7 w-7"><User className="h-4 w-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
  
  const renderBatchesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
         <Link href="/admin/results/import" passHref>
            <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4"/> Go to Import Page</Button>
         </Link>
      </div>
      {isLoading ? (
         <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-primary" /></div>
      ) : batches.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No upload batches found. Import results to create batches.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border dark:border-gray-700">
          {batches.map((batch) => (
            <li key={batch._id} className="p-4 hover:bg-muted/50 flex justify-between items-center">
              <div>
                <div className="font-medium text-primary">{batch._id}</div>
                <div className="text-sm text-muted-foreground">
                  {batch.count} results • Last upload: {new Date(batch.latestUpload).toLocaleString()}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {setSelectedBatchIdForDelete(batch._id); setShowDeleteConfirm(true);}}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Batch & Results
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderAnalysisTab = () => (
    <>
     <div className="mb-6 p-3 sm:p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 dark:border-gray-700">
        <div>
          <Label htmlFor="analysisAcademicYear" className="text-sm font-medium">Academic Year</Label>
          <Input id="analysisAcademicYear" name="academicYear" value={filters.academicYear || ''} onChange={handleFilterChange} placeholder="e.g. 2023-24" className="mt-1 min-h-[44px]"/>
        </div>
        <div>
            <Label htmlFor="analysisExamId" className="text-sm font-medium">Examination (GTU Exam ID or Formal Exam)</Label>
            <Select name="examid" value={filters.examid?.toString() || filters.examId || "all"} onValueChange={(val) => setFilters(prev => ({...prev, examid: val === "all" ? undefined : parseInt(val), examId: val === "all" ? undefined : val }))}>
                <SelectTrigger id="analysisExamId" className="mt-1 min-h-[44px]"><SelectValue placeholder="Select Examination" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Examinations</SelectItem>
                    {/* Combine GTU style exam IDs (if any known/used) and our formal exams */}
                    {examinations.map(exam => <SelectItem key={exam.id} value={exam.id.toString()}>{exam.name} ({exam.academicYear})</SelectItem>)}
                    {/* Add known GTU exam IDs if applicable and distinct, e.g., from results data */}
                </SelectContent>
            </Select>
        </div>
         <div className="sm:col-span-2 flex justify-end">
            <Button onClick={fetchBranchAnalysisData} className="mt-1 min-h-[44px] w-full sm:w-auto"><Filter className="mr-2 h-4 w-4"/>Fetch Analysis</Button>
        </div>
      </div>
    <div className="overflow-x-auto">
        <Table>
        <TableHeader><TableRow>
            <TableHead>Branch</TableHead><TableHead>Semester</TableHead>
            <TableHead className="text-center">Total Students</TableHead><TableHead className="text-center">Pass %</TableHead>
            <TableHead className="text-center">Distinction</TableHead><TableHead className="text-center">First Class</TableHead>
            <TableHead className="text-center">Second Class</TableHead><TableHead className="text-center">Avg. SPI</TableHead>
        </TableRow></TableHeader>
        <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto my-4 text-primary" /></TableCell></TableRow>
            ) : branchAnalysis.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No analysis data for current filters.</TableCell></TableRow>
            ) : (
            branchAnalysis.map((analysis) => (
                <TableRow key={`${analysis._id.branchName}-${analysis._id.semester}`}>
                <TableCell className="font-medium">{analysis._id.branchName}</TableCell>
                <TableCell>{analysis._id.semester}</TableCell>
                <TableCell className="text-center">{analysis.totalStudents}</TableCell>
                <TableCell className="text-center">{analysis.passPercentage.toFixed(1)}%</TableCell>
                <TableCell className="text-center">{analysis.distinctionCount} ({((analysis.distinctionCount / analysis.totalStudents) * 100 || 0).toFixed(1)}%)</TableCell>
                <TableCell className="text-center">{analysis.firstClassCount} ({((analysis.firstClassCount / analysis.totalStudents) * 100 || 0).toFixed(1)}%)</TableCell>
                <TableCell className="text-center">{analysis.secondClassCount} ({((analysis.secondClassCount / analysis.totalStudents) * 100 || 0).toFixed(1)}%)</TableCell>
                <TableCell className="text-center font-semibold">{analysis.avgSpi.toFixed(2)}</TableCell>
                </TableRow>
            ))
            )}
        </TableBody>
        </Table>
    </div>
    </>
  );
  
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-4 py-4 sm:py-6">
      <Card className="shadow-lg sm:shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">
            <div className="w-full sm:w-auto">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
                    <BookCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="sm:hidden">Results</span>
                    <span className="hidden sm:inline">Result Management</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">View, manage, and analyze student academic results.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <Link href="/admin/results/import" passHref>
                    <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
                      <UploadCloud className="mr-2 h-4 w-4"/>
                      <span className="sm:hidden">Import</span>
                      <span className="hidden sm:inline">Import Results Page</span>
                    </Button>
                 </Link>
                <Button onClick={handleExportResults} variant="outline" disabled={results.length === 0 || isLoading} className="w-full sm:w-auto min-h-[44px]">
                  <Download className="mr-2 h-4 w-4"/>
                  <span className="sm:hidden">Export</span>
                  <span className="hidden sm:inline">Export Filtered CSV</span>
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 border-b border-border dark:border-gray-700">
            <nav className="-mb-px flex space-x-6">
              {([
                { label: 'Results', value: 'results' }, 
                { label: 'Upload Batches', value: 'batches' }, 
                { label: 'Branch Analysis', value: 'analysis' }
               ] as const).map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {activeTab === 'results' && renderResultsTab()}
          {activeTab === 'batches' && renderBatchesTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}

        </CardContent>
        {activeTab === 'results' && (
             <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 sm:px-6 border-t dark:border-gray-700">
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    Showing {pagination.total > 0 ? Math.min((pagination.page -1) * pagination.limit + 1, pagination.total): 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results.
                </div>
                <div className="flex items-center gap-2">
                    <Select value={String(pagination.limit)} onValueChange={(value) => handleItemsPerPageChange(Number(value))}>
                        <SelectTrigger className="w-[70px] h-8 sm:h-10 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent side="top">{ITEMS_PER_PAGE_OPTIONS.map(sz => <SelectItem key={sz} value={String(sz)} className="text-xs">{sz}</SelectItem>)}</SelectContent>
                    </Select>
                    <span className="text-xs sm:text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages > 0 ? pagination.pages : 1}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => handlePageChange(1)} disabled={pagination.page === 1}><ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}><ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages || pagination.pages === 0}><ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => handlePageChange(pagination.pages)} disabled={pagination.page === pagination.pages || pagination.pages === 0}><ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                    </div>
                </div>
            </CardFooter>
        )}
      </Card>
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all results associated with batch ID: <strong>{selectedBatchIdForDelete}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBatch} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
