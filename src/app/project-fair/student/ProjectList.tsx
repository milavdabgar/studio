// src/app/project-fair/student/ProjectList.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Eye, Edit } from 'lucide-react';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  category: string;
  technologies: string[];
  teamSize: number;
  submittedAt?: string;
  dueDate?: string;
}

interface ProjectListProps {
  projects?: Project[];
  onViewProject: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  loading?: boolean;
  event?: { id: string; name: string; status: string } | null; // Add event prop to match usage
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects = [], 
  onViewProject, 
  onEditProject,
  loading = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: _event = null 
}) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">No projects found</h3>
        <p className="text-gray-600 dark:text-gray-400">Start by creating your first project.</p>
      </div>
    );
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {project.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {project.category}
                </CardDescription>
              </div>
              <Badge 
                variant="secondary" 
                className={getStatusColor(project.status)}
              >
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 dark:text-gray-400">
              {project.description}
            </p>
            
            <div className="space-y-2 mb-4">
              {project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.technologies.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.technologies.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{project.teamSize} members</span>
                </div>
                
                {project.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Due {new Date(project.dueDate || new Date()).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewProject(project)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              {onEditProject && project.status === 'draft' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEditProject(project)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectList;
