"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, BookUser, CalendarDays as CalendarIcon, ExternalLink} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import type { Student, StudentStatus, SemesterStatus, Program } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
const DEPARTMENT_OPTIONS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication Engineering",
  "General",
];

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "dropped", label: "Dropped Out" },
];

const SEMESTER_STATUS_OPTIONS: { value: SemesterStatus; label: string }[] = [
    { value: "N/A", label: "N/A" },
    { value: "Passed", label: "Passed" },
    { value: "Pending", label: "Pending" }
];

export default function AdminStudentsPage() {
  const { toast } = useToast();

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Management
          </CardTitle>
          <CardDescription>
            Manage student records and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Student management functionality will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}