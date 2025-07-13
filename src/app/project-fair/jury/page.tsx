"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for projects awaiting evaluation
const MOCK_PROJECTS = [
  {
    id: "proj_001",
    title: "Smart Attendance System",
    teamName: "Team Alpha",
    department: "Computer Engineering",
    status: "pending_evaluation",
    submissionDate: "2024-11-15"
  },
  {
    id: "proj_002", 
    title: "IoT Based Water Quality Monitor",
    teamName: "Team Beta",
    department: "Computer Engineering", 
    status: "pending_evaluation",
    submissionDate: "2024-11-16"
  }
];

export default function ProjectJuryPage() {
  const [projects] = useState(MOCK_PROJECTS);
  const { toast } = useToast();
  const router = useRouter();

  const handleStartEvaluation = () => {
    // Navigate to the faculty project evaluation page
    router.push('/faculty/projects/evaluate');
  };

  const handleViewDetails = (projectId: string) => {
    toast({
      title: "Project Details",
      description: `Viewing details for project ${projectId}`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Award className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Evaluation</h1>
          <p className="text-muted-foreground">
            Evaluate student projects as a jury member
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects Awaiting Evaluation</CardTitle>
          <CardDescription>
            Select a project to start the evaluation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Title</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.teamName}</TableCell>
                  <TableCell>{project.department}</TableCell>
                  <TableCell>{project.submissionDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(project.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStartEvaluation()}
                      >
                        Start Evaluation
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}