'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  MessageSquare,
  Plus,
  Calendar,
  FileText,
  Send
} from 'lucide-react';

interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  committee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  dueDate: string;
  createdDate: string;
  completedDate?: string;
  comments: TaskComment[];
  attachments?: string[];
}

interface TaskComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'status_change' | 'assignment';
}

interface CommitteeWorkflowProps {
  committee: string;
  userRole: string;
  userId: string;
}

export function CommitteeWorkflowManager({ committee, userRole, userId }: CommitteeWorkflowProps) {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as const,
    dueDate: ''
  });
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from API
    const mockTasks: WorkflowTask[] = [
      {
        id: '1',
        title: 'Review placement drive proposals',
        description: 'Review and approve company proposals for upcoming placement drives',
        assignedTo: 'Dr. Amit Patel',
        assignedBy: 'TPO Convener',
        committee: 'TPO',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2024-03-20',
        createdDate: '2024-03-10',
        comments: [
          {
            id: '1',
            author: 'TPO Convener',
            content: 'Please prioritize reviewing the proposals from tier-1 companies',
            timestamp: '2024-03-10T10:00:00Z',
            type: 'comment'
          }
        ]
      },
      {
        id: '2',
        title: 'Update library catalog system',
        description: 'Implement new digital catalog system for library resources',
        assignedTo: 'IT Team',
        assignedBy: 'Library Convener',
        committee: 'Library',
        priority: 'medium',
        status: 'pending',
        dueDate: '2024-03-25',
        createdDate: '2024-03-12',
        comments: []
      }
    ];

    setTasks(mockTasks);
    setLoading(false);
  }, [committee]);

  const createTask = () => {
    if (!newTask.title || !newTask.assignedTo) return;

    const task: WorkflowTask = {
      id: Date.now().toString(),
      ...newTask,
      assignedBy: userId,
      committee,
      status: 'pending',
      createdDate: new Date().toISOString(),
      comments: []
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: ''
    });
    setIsCreateDialogOpen(false);
  };

  const updateTaskStatus = (taskId: string, newStatus: WorkflowTask['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task, 
            status: newStatus,
            completedDate: newStatus === 'completed' ? new Date().toISOString() : task.completedDate
          }
        : task
    ));

    // Add status change comment
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const comment: TaskComment = {
        id: Date.now().toString(),
        author: userId,
        content: `Status changed to ${newStatus}`,
        timestamp: new Date().toISOString(),
        type: 'status_change'
      };
      
      task.comments.push(comment);
    }
  };

  const addComment = (taskId: string) => {
    if (!newComment.trim()) return;

    const comment: TaskComment = {
      id: Date.now().toString(),
      author: userId,
      content: newComment,
      timestamp: new Date().toISOString(),
      type: 'comment'
    };

    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, comments: [...task.comments, comment] }
        : task
    ));

    setNewComment('');
  };

  const getStatusBadge = (status: WorkflowTask['status']) => {
    const variants = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: WorkflowTask['priority']) => {
    const variants = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[priority]}>
        {priority}
      </Badge>
    );
  };

  const canCreateTasks = userRole === 'convener' || userRole === 'admin';
  const myTasks = tasks.filter(task => task.assignedTo === userId);
  const allTasks = userRole === 'convener' || userRole === 'admin' ? tasks : myTasks;

  if (loading) {
    return <div>Loading workflow...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{committee} Committee Workflow</h2>
          <p className="text-muted-foreground">Manage committee tasks and activities</p>
        </div>
        {canCreateTasks && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Assign a new task to a committee member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
                <Textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                />
                <Input
                  placeholder="Assign to (email or name)"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                />
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                  className="w-full p-2 border rounded"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTask}>Create Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTasks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allTasks.filter(t => t.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allTasks.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {allTasks.filter(t => 
                t.status !== 'completed' && new Date(t.dueDate) < new Date()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            {userRole === 'convener' || userRole === 'admin' 
              ? 'All committee tasks' 
              : 'Your assigned tasks'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {task.assignedTo}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-2 ${
                      new Date(task.dueDate) < new Date() && task.status !== 'completed' 
                        ? 'text-red-600' 
                        : ''
                    }`}>
                      <Calendar className="w-4 h-4" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {task.assignedTo === userId && task.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, 
                            task.status === 'pending' ? 'in_progress' : 
                            task.status === 'in_progress' ? 'review' : 'completed'
                          )}
                        >
                          {task.status === 'pending' ? 'Start' : 
                           task.status === 'in_progress' ? 'Submit' : 'Complete'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTask(task)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription>
                {selectedTask.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Assigned to:</strong> {selectedTask.assignedTo}
                </div>
                <div>
                  <strong>Priority:</strong> {getPriorityBadge(selectedTask.priority)}
                </div>
                <div>
                  <strong>Status:</strong> {getStatusBadge(selectedTask.status)}
                </div>
                <div>
                  <strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}
                </div>
              </div>

              {/* Comments */}
              <div>
                <h4 className="font-medium mb-2">Comments & Updates</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => addComment(selectedTask.id)}
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}