// src/app/project-fair/student/ProjectView.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Users, ExternalLink } from 'lucide-react';

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
  repositoryUrl?: string;
  liveUrl?: string;
  screenshots?: string[];
}

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
  onEdit?: () => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project, onBack, onEdit }) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{project.category}</p>
        </div>
        <Badge 
          variant="secondary" 
          className={getStatusColor(project.status)}
        >
          {project.status}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap dark:text-gray-300">
                {project.description}
              </p>
            </CardContent>
          </Card>

          {/* Technologies */}
          {project.technologies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Technologies Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Screenshots */}
          {project.screenshots && project.screenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Screenshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {project.screenshots.map((screenshot, index) => (
                    <Image
                      key={index}
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      width={400}
                      height={300}
                      className="rounded-lg border shadow-sm dark:border-gray-700"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm">{project.teamSize} team members</span>
              </div>

              {project.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">
                    Due: {new Date(project.dueDate || new Date()).toLocaleDateString()}
                  </span>
                </div>
              )}

              {project.submittedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">
                    Submitted: {new Date(project.submittedAt || new Date()).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          {(project.repositoryUrl || project.liveUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">Repository</span>
                  </a>
                )}
                
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">Live Demo</span>
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {onEdit && project.status === 'draft' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={onEdit} className="w-full">
                  Edit Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectView;
