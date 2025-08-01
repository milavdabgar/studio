"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Zap, 
  Brain, 
  GitMerge, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Users,
  BookOpen,
  Home,
  Calendar,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { 
  AutoGenerationRequest, 
  AutoGenerationResult,
  TimetableConstraints,
  Batch,
  Program
} from '@/types/entities';

// Advanced generation types
interface AdvancedGenerationRequest extends AutoGenerationRequest {
  includeRoomOptimization: boolean;
  includeResourceOptimization: boolean;
  priorityWeights: {
    facultyPreferences: number;
    roomUtilization: number;
    workloadBalance: number;
    timeDistribution: number;
    conflictMinimization: number;
  };
  resourceConstraints: {
    maxRoomCapacityViolation: number;
    requireSpecializedRooms: boolean;
    considerMaintenanceSchedule: boolean;
    allowRoomSharing: boolean;
  };
  optimizationStrategy: 'genetic' | 'constraint' | 'hybrid' | 'multi_objective';
  maxExecutionTime: number;
}
import { batchService } from '@/lib/api/batches';
import { programService } from '@/lib/api/programs';

export default function AutoGenerateTimetablePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [semester, setSemester] = useState(1);
  const [algorithm, setAlgorithm] = useState<'genetic' | 'constraint_satisfaction' | 'hybrid'>('hybrid');
  const [considerPreferences, setConsiderPreferences] = useState(true);
  
  // Advanced mode toggle
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  
  // Advanced features
  const [includeRoomOptimization, setIncludeRoomOptimization] = useState(true);
  const [includeResourceOptimization, setIncludeResourceOptimization] = useState(true);
  const [optimizationStrategy, setOptimizationStrategy] = useState<'genetic' | 'constraint' | 'hybrid' | 'multi_objective'>('multi_objective');
  const [maxExecutionTime, setMaxExecutionTime] = useState(300000); // 5 minutes
  
  // Priority weights
  const [priorityWeights, setPriorityWeights] = useState({
    facultyPreferences: 0.3,
    roomUtilization: 0.2,
    workloadBalance: 0.25,
    timeDistribution: 0.15,
    conflictMinimization: 0.1
  });
  
  // Resource constraints
  const [resourceConstraints, setResourceConstraints] = useState({
    maxRoomCapacityViolation: 0.1,
    requireSpecializedRooms: true,
    considerMaintenanceSchedule: true,
    allowRoomSharing: false
  });
  
  // Algorithm parameters
  const [populationSize, setPopulationSize] = useState(50);
  const [maxIterations, setMaxIterations] = useState(100);
  const [mutationRate, setMutationRate] = useState(0.1);
  const [crossoverRate, setCrossoverRate] = useState(0.8);

  // Constraints
  const [constraints, setConstraints] = useState<TimetableConstraints>({
    // Hard constraints
    noFacultyConflicts: true,
    noRoomConflicts: true,
    noStudentConflicts: true,
    respectFacultyUnavailability: true,
    respectRoomCapacity: true,
    
    // Soft constraints
    respectFacultyPreferences: true,
    balanceWorkload: true,
    minimizeGaps: true,
    preferMorningSlots: true,
    groupSimilarCourses: false,
    
    // Custom constraints
    maxConsecutiveHours: 3,
    maxDailyHours: 6,
    lunchBreakRequired: true,
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00'
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<AutoGenerationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchData, programData] = await Promise.all([
          batchService.getAllBatches(),
          programService.getAllPrograms()
        ]);
        setBatches(batchData);
        setPrograms(programData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data"
        });
      }
    };
    
    fetchData();
  }, [toast]);

  const handleGenerateTimetables = async () => {
    if (selectedBatchIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No Batches Selected",
        description: "Please select at least one batch to generate timetables for."
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGenerationResult(null);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 10, 90));
    }, 500);

    try {
      let request: AutoGenerationRequest | AdvancedGenerationRequest;
      
      if (isAdvancedMode) {
        request = {
          academicYear,
          semester,
          batchIds: selectedBatchIds,
          algorithm,
          constraints,
          maxIterations,
          populationSize,
          mutationRate,
          crossoverRate,
          considerPreferences,
          // Advanced features
          includeRoomOptimization,
          includeResourceOptimization,
          priorityWeights,
          resourceConstraints,
          optimizationStrategy,
          maxExecutionTime
        } as AdvancedGenerationRequest;
      } else {
        request = {
          academicYear,
          semester,
          batchIds: selectedBatchIds,
          algorithm,
          constraints,
          maxIterations,
          populationSize,
          mutationRate,
          crossoverRate,
          considerPreferences
        };
      }

      const response = await fetch('/api/timetables/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const result: AutoGenerationResult = await response.json();
      setGenerationResult(result);
      setProgress(100);

      if (result.success) {
        toast({
          title: "Generation Successful",
          description: `Generated ${result.timetables.length} timetable(s) with optimization score: ${result.optimizationScore.toFixed(2)}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: result.recommendations[0] || "Unknown error occurred"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Error",
        description: (error as Error).message
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setIsGenerating(false);
    }
  };

  const handleBatchSelection = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatchIds([...selectedBatchIds, batchId]);
    } else {
      setSelectedBatchIds(selectedBatchIds.filter(id => id !== batchId));
    }
  };

  const getAlgorithmIcon = (alg: string) => {
    switch (alg) {
      case 'genetic': return <Brain className="h-4 w-4" />;
      case 'constraint_satisfaction': return <Settings className="h-4 w-4" />;
      case 'hybrid': return <GitMerge className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200';
      case 'major': return 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200';
      case 'minor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Auto-Generate Timetables</h1>
          <p className="text-muted-foreground">
            Use AI-powered algorithms to automatically generate optimized timetables
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Settings
              </CardTitle>
              <CardDescription>
                Configure the basic parameters for timetable generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Academic Year</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-25">2024-25</SelectItem>
                      <SelectItem value="2025-26">2025-26</SelectItem>
                      <SelectItem value="2023-24">2023-24</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select value={semester.toString()} onValueChange={(val) => setSemester(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Select Batches</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                  {batches.map(batch => (
                    <div key={batch.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={batch.id}
                        checked={selectedBatchIds.includes(batch.id)}
                        onCheckedChange={(checked) => handleBatchSelection(batch.id, !!checked)}
                      />
                      <Label htmlFor={batch.id} className="text-sm">
                        {batch.name} ({programs.find(p => p.id === batch.programId)?.name})
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {selectedBatchIds.length} batch(es)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Algorithm Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Algorithm Settings
              </CardTitle>
              <CardDescription>
                Choose the optimization algorithm and configure its parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Generation Algorithm</Label>
                <Select value={algorithm} onValueChange={(val: any) => setAlgorithm(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="genetic">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Genetic Algorithm
                      </div>
                    </SelectItem>
                    <SelectItem value="constraint_satisfaction">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Constraint Satisfaction
                      </div>
                    </SelectItem>
                    <SelectItem value="hybrid">
                      <div className="flex items-center gap-2">
                        <GitMerge className="h-4 w-4" />
                        Hybrid Approach
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {algorithm === 'genetic' && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                  <div>
                    <Label>Population Size</Label>
                    <Input
                      type="number"
                      value={populationSize}
                      onChange={(e) => setPopulationSize(parseInt(e.target.value))}
                      min={10}
                      max={200}
                    />
                  </div>
                  <div>
                    <Label>Max Iterations</Label>
                    <Input
                      type="number"
                      value={maxIterations}
                      onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                      min={10}
                      max={1000}
                    />
                  </div>
                  <div>
                    <Label>Mutation Rate</Label>
                    <Input
                      type="number"
                      value={mutationRate}
                      onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <Label>Crossover Rate</Label>
                    <Input
                      type="number"
                      value={crossoverRate}
                      onChange={(e) => setCrossoverRate(parseFloat(e.target.value))}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="considerPreferences"
                  checked={considerPreferences}
                  onCheckedChange={(checked) => setConsiderPreferences(!!checked)}
                />
                <Label htmlFor="considerPreferences">
                  Consider Faculty Preferences
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Features
              </CardTitle>
              <CardDescription>
                Enable advanced timetable generation with room optimization and resource management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advancedMode"
                  checked={isAdvancedMode}
                  onCheckedChange={(checked) => setIsAdvancedMode(!!checked)}
                />
                <Label htmlFor="advancedMode" className="text-base font-medium">
                  Enable Advanced Generation (Phase 3)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Enables room optimization, resource management, and multi-objective optimization
              </p>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          {isAdvancedMode && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Strategy</CardTitle>
                  <CardDescription>
                    Select the advanced optimization approach
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Strategy</Label>
                    <Select value={optimizationStrategy} onValueChange={(val: any) => setOptimizationStrategy(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="genetic">Genetic Algorithm</SelectItem>
                        <SelectItem value="constraint">Constraint Satisfaction</SelectItem>
                        <SelectItem value="hybrid">Hybrid Approach</SelectItem>
                        <SelectItem value="multi_objective">Multi-Objective Optimization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Max Execution Time (minutes)</Label>
                    <Input
                      type="number"
                      value={maxExecutionTime / 60000}
                      onChange={(e) => setMaxExecutionTime(parseInt(e.target.value) * 60000)}
                      min={1}
                      max={30}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="roomOptimization"
                        checked={includeRoomOptimization}
                        onCheckedChange={(checked) => setIncludeRoomOptimization(!!checked)}
                      />
                      <Label htmlFor="roomOptimization">Room Optimization</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="resourceOptimization"
                        checked={includeResourceOptimization}
                        onCheckedChange={(checked) => setIncludeResourceOptimization(!!checked)}
                      />
                      <Label htmlFor="resourceOptimization">Resource Optimization</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Weights</CardTitle>
                  <CardDescription>
                    Configure the relative importance of different optimization objectives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(priorityWeights).map(([key, value]) => (
                    <div key={key}>
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()} ({(value * 100).toFixed(0)}%)
                      </Label>
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={value}
                        onChange={(e) => setPriorityWeights(prev => ({
                          ...prev,
                          [key]: parseFloat(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    Total: {(Object.values(priorityWeights).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Constraints</CardTitle>
                  <CardDescription>
                    Configure resource allocation and room usage constraints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Max Room Capacity Violation (%)</Label>
                    <Input
                      type="number"
                      value={resourceConstraints.maxRoomCapacityViolation * 100}
                      onChange={(e) => setResourceConstraints(prev => ({
                        ...prev,
                        maxRoomCapacityViolation: parseFloat(e.target.value) / 100
                      }))}
                      min={0}
                      max={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requireSpecializedRooms"
                        checked={resourceConstraints.requireSpecializedRooms}
                        onCheckedChange={(checked) => setResourceConstraints(prev => ({
                          ...prev,
                          requireSpecializedRooms: !!checked
                        }))}
                      />
                      <Label htmlFor="requireSpecializedRooms">Require Specialized Rooms</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="considerMaintenance"
                        checked={resourceConstraints.considerMaintenanceSchedule}
                        onCheckedChange={(checked) => setResourceConstraints(prev => ({
                          ...prev,
                          considerMaintenanceSchedule: !!checked
                        }))}
                      />
                      <Label htmlFor="considerMaintenance">Consider Maintenance Schedule</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allowRoomSharing"
                        checked={resourceConstraints.allowRoomSharing}
                        onCheckedChange={(checked) => setResourceConstraints(prev => ({
                          ...prev,
                          allowRoomSharing: !!checked
                        }))}
                      />
                      <Label htmlFor="allowRoomSharing">Allow Room Sharing</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Constraints */}
          <Card>
            <CardHeader>
              <CardTitle>Constraints Configuration</CardTitle>
              <CardDescription>
                Define hard and soft constraints for timetable generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Hard Constraints (Must be satisfied)</h4>
                <div className="space-y-2">
                  {[
                    { key: 'noFacultyConflicts', label: 'No Faculty Conflicts' },
                    { key: 'noRoomConflicts', label: 'No Room Conflicts' },
                    { key: 'noStudentConflicts', label: 'No Student Conflicts' },
                    { key: 'respectFacultyUnavailability', label: 'Respect Faculty Unavailability' },
                    { key: 'respectRoomCapacity', label: 'Respect Room Capacity' }
                  ].map(constraint => (
                    <div key={constraint.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={constraint.key}
                        checked={constraints[constraint.key as keyof TimetableConstraints] as boolean}
                        onCheckedChange={(checked) => 
                          setConstraints(prev => ({ ...prev, [constraint.key]: !!checked }))
                        }
                      />
                      <Label htmlFor={constraint.key}>{constraint.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Soft Constraints (Preferred)</h4>
                <div className="space-y-2">
                  {[
                    { key: 'respectFacultyPreferences', label: 'Respect Faculty Preferences' },
                    { key: 'balanceWorkload', label: 'Balance Faculty Workload' },
                    { key: 'minimizeGaps', label: 'Minimize Gaps in Schedule' },
                    { key: 'preferMorningSlots', label: 'Prefer Morning Time Slots' },
                    { key: 'groupSimilarCourses', label: 'Group Similar Courses' }
                  ].map(constraint => (
                    <div key={constraint.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={constraint.key}
                        checked={constraints[constraint.key as keyof TimetableConstraints] as boolean}
                        onCheckedChange={(checked) => 
                          setConstraints(prev => ({ ...prev, [constraint.key]: !!checked }))
                        }
                      />
                      <Label htmlFor={constraint.key}>{constraint.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Time Constraints</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Consecutive Hours</Label>
                    <Input
                      type="number"
                      value={constraints.maxConsecutiveHours}
                      onChange={(e) => setConstraints(prev => ({ 
                        ...prev, 
                        maxConsecutiveHours: parseInt(e.target.value) 
                      }))}
                      min={1}
                      max={8}
                    />
                  </div>
                  <div>
                    <Label>Max Daily Hours</Label>
                    <Input
                      type="number"
                      value={constraints.maxDailyHours}
                      onChange={(e) => setConstraints(prev => ({ 
                        ...prev, 
                        maxDailyHours: parseInt(e.target.value) 
                      }))}
                      min={2}
                      max={12}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    id="lunchBreak"
                    checked={constraints.lunchBreakRequired}
                    onCheckedChange={(checked) => 
                      setConstraints(prev => ({ ...prev, lunchBreakRequired: !!checked }))
                    }
                  />
                  <Label htmlFor="lunchBreak">Lunch Break Required</Label>
                </div>

                {constraints.lunchBreakRequired && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Lunch Break Start</Label>
                      <Input
                        type="time"
                        value={constraints.lunchBreakStart}
                        onChange={(e) => setConstraints(prev => ({ 
                          ...prev, 
                          lunchBreakStart: e.target.value 
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Lunch Break End</Label>
                      <Input
                        type="time"
                        value={constraints.lunchBreakEnd}
                        onChange={(e) => setConstraints(prev => ({ 
                          ...prev, 
                          lunchBreakEnd: e.target.value 
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Generate Timetables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Selected Batches:</span>
                  <Badge variant="secondary">{selectedBatchIds.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Algorithm:</span>
                  <div className="flex items-center gap-1">
                    {getAlgorithmIcon(algorithm)}
                    <span className="capitalize">{algorithm.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating timetables...</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleGenerateTimetables}
                disabled={isGenerating || selectedBatchIds.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Timetables
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {generationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {generationResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Generation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Success Rate</Label>
                    <p className="font-medium">
                      {generationResult.success ? '100%' : '0%'}
                    </p>
                  </div>
                  <div>
                    <Label>Optimization Score</Label>
                    <p className="font-medium">
                      {generationResult.optimizationScore.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label>Execution Time</Label>
                    <p className="font-medium">
                      {(generationResult.executionTime / 1000).toFixed(2)}s
                    </p>
                  </div>
                  <div>
                    <Label>Timetables Generated</Label>
                    <p className="font-medium">
                      {generationResult.timetables.length}
                    </p>
                  </div>
                </div>

                {/* Advanced metrics if available */}
                {isAdvancedMode && (generationResult as any).qualityMetrics && (
                  <div className="mt-4 p-4 border rounded-md">
                    <Label className="text-base font-medium">Advanced Quality Metrics</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <Label>Schedule Compactness</Label>
                        <p className="font-medium">
                          {((generationResult as any).qualityMetrics.scheduleCompactness * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <Label>Preferences Satisfied</Label>
                        <p className="font-medium">
                          {((generationResult as any).qualityMetrics.preferencesSatisfied * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <Label>Resource Efficiency</Label>
                        <p className="font-medium">
                          {((generationResult as any).qualityMetrics.resourceEfficiency * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <Label>Overall Quality</Label>
                        <p className="font-medium">
                          {((generationResult as any).qualityMetrics.overallQuality * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {generationResult.conflicts.length > 0 && (
                  <div>
                    <Label>Conflicts Detected</Label>
                    <div className="mt-2 space-y-1">
                      {generationResult.conflicts.slice(0, 3).map((conflict, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Badge className={getSeverityColor(conflict.severity)}>
                            {conflict.severity}
                          </Badge>
                          <span className="text-sm">{conflict.description}</span>
                        </div>
                      ))}
                      {generationResult.conflicts.length > 3 && (
                        <p className="text-sm text-muted-foreground">
                          +{generationResult.conflicts.length - 3} more conflicts
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Recommendations</Label>
                  <ul className="mt-2 text-sm space-y-1">
                    {generationResult.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {generationResult.success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      Timetables have been generated successfully. 
                      You can now view and edit them in the timetable management section.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}