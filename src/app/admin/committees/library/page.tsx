'use client';

import { useState, useEffect } from 'react';
import { getUserCookie, getUserAccessContext } from '@/lib/auth/role-access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar,
  Search,
  Plus,
  Download,
  Upload,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DepartmentScopedPage } from '@/components/auth/PageAccessControl';

interface BookRecord {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  department: string;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  status: 'available' | 'limited' | 'out-of-stock';
  addedDate: string;
}

interface IssueRecord {
  id: string;
  bookTitle: string;
  bookId: string;
  studentName: string;
  enrollmentNumber: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fineAmount: number;
}

interface LibraryStats {
  totalBooks: number;
  totalStudents: number;
  booksIssued: number;
  overdueBooks: number;
  fineCollected: number;
  popularCategory: string;
}

export default function LibraryDashboard() {
  // Role-based access control
  const user = getUserCookie();
  const accessContext = getUserAccessContext(user);

  const [books, setBooks] = useState<BookRecord[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [stats, setStats] = useState<LibraryStats>({
    totalBooks: 0,
    totalStudents: 0,
    booksIssued: 0,
    overdueBooks: 0,
    fineCollected: 0,
    popularCategory: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from APIs
    const mockBooks: BookRecord[] = [
      {
        id: '1',
        title: 'Data Structures and Algorithms',
        author: 'Thomas H. Cormen',
        isbn: '978-0262033848',
        category: 'Computer Science',
        department: 'Computer Engineering',
        totalCopies: 10,
        availableCopies: 6,
        issuedCopies: 4,
        status: 'available',
        addedDate: '2024-01-15'
      },
      {
        id: '2',
        title: 'Fundamentals of Electric Circuits',
        author: 'Charles K. Alexander',
        isbn: '978-0073380575',
        category: 'Electrical Engineering',
        department: 'Electrical Engineering',
        totalCopies: 8,
        availableCopies: 2,
        issuedCopies: 6,
        status: 'limited',
        addedDate: '2024-02-01'
      },
      {
        id: '3',
        title: 'Fluid Mechanics',
        author: 'Frank M. White',
        isbn: '978-0073398273',
        category: 'Mechanical Engineering',
        department: 'Mechanical Engineering',
        totalCopies: 5,
        availableCopies: 0,
        issuedCopies: 5,
        status: 'out-of-stock',
        addedDate: '2024-01-20'
      }
    ];

    const mockIssues: IssueRecord[] = [
      {
        id: '1',
        bookTitle: 'Data Structures and Algorithms',
        bookId: '1',
        studentName: 'Rahul Kumar',
        enrollmentNumber: '20IT001',
        issueDate: '2024-03-01',
        dueDate: '2024-03-15',
        status: 'issued',
        fineAmount: 0
      },
      {
        id: '2',
        bookTitle: 'Fundamentals of Electric Circuits',
        bookId: '2',
        studentName: 'Priya Patel',
        enrollmentNumber: '20EE005',
        issueDate: '2024-02-15',
        dueDate: '2024-03-01',
        status: 'overdue',
        fineAmount: 50
      },
      {
        id: '3',
        bookTitle: 'Fluid Mechanics',
        bookId: '3',
        studentName: 'Arjun Shah',
        enrollmentNumber: '20ME012',
        issueDate: '2024-02-01',
        dueDate: '2024-02-15',
        returnDate: '2024-02-14',
        status: 'returned',
        fineAmount: 0
      }
    ];

    setBooks(mockBooks);
    setIssues(mockIssues);
    
    // Calculate stats
    setStats({
      totalBooks: mockBooks.reduce((sum, book) => sum + book.totalCopies, 0),
      totalStudents: 2450, // Mock count
      booksIssued: mockIssues.filter(issue => issue.status === 'issued').length,
      overdueBooks: mockIssues.filter(issue => issue.status === 'overdue').length,
      fineCollected: mockIssues.reduce((sum, issue) => sum + issue.fineAmount, 0),
      popularCategory: 'Computer Science'
    });
    
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      'available': 'bg-green-100 text-green-800',
      'limited': 'bg-yellow-100 text-yellow-800',
      'out-of-stock': 'bg-red-100 text-red-800',
      'issued': 'bg-blue-100 text-blue-800',
      'returned': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  const overdueIssues = issues.filter(issue => issue.status === 'overdue');
  const recentIssues = issues.filter(issue => issue.status === 'issued').slice(0, 5);

  return (
    <DepartmentScopedPage pageName="library dashboard">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Library Management Dashboard
            </h1>
            <p className="text-muted-foreground">Manage books, issues, and library operations</p>
          </div>
          <div className="flex gap-2">
            {accessContext.featurePermissions.canCreateRecords && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
            )}
            {accessContext.featurePermissions.canImportData && (
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Books
            </Button>
            )}
            {accessContext.featurePermissions.canExportData && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Issued</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.booksIssued}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueBooks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fine Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.fineCollected}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Popular Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">{stats.popularCategory}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Issues
              </CardTitle>
              <CardDescription>Latest book issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{issue.bookTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {issue.studentName} • {issue.enrollmentNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(issue.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(issue.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Books */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Overdue Books
              </CardTitle>
              <CardDescription>Books that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overdueIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200">
                    <div>
                      <div className="font-medium">{issue.bookTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {issue.studentName} • {issue.enrollmentNumber}
                      </div>
                      <div className="text-sm text-red-600">
                        Overdue: {Math.ceil((new Date().getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(issue.status)}
                      {issue.fineAmount > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          Fine: ₹{issue.fineAmount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {overdueIssues.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    No overdue books
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Books Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Books Inventory</CardTitle>
            <CardDescription>Complete library book collection</CardDescription>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search books by title, author, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{book.title}</div>
                        <div className="text-sm text-muted-foreground">{book.author}</div>
                        <div className="text-sm text-muted-foreground font-mono">{book.isbn}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{book.category}</Badge>
                    </TableCell>
                    <TableCell>{book.department}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {book.availableCopies}/{book.totalCopies} available
                        </div>
                        <div className="text-muted-foreground">
                          {book.issuedCopies} issued
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(book.status)}</TableCell>
                    <TableCell>{new Date(book.addedDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DepartmentScopedPage>
  );
}