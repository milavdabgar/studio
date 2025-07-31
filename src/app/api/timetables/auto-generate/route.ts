import { NextRequest, NextResponse } from 'next/server';
import type { 
  AutoGenerationRequest, 
  AutoGenerationResult,
  TimetableConstraints 
} from '@/types/entities';
import { TimetableOptimizer } from '@/lib/algorithms/timetableOptimizer';
import { ConstraintSolver } from '@/lib/algorithms/constraintSolver';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { facultyService } from '@/lib/api/faculty';
import { roomService } from '@/lib/services/roomService';
import { batchService } from '@/lib/api/batches';
import { facultyPreferenceService } from '@/lib/api/facultyPreferences';

export async function POST(request: NextRequest) {
  try {
    const body: AutoGenerationRequest = await request.json();
    
    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error }, 
        { status: 400 }
      );
    }

    // Fetch required data
    const [courseOfferings, faculties, rooms, batches, facultyPreferences] = await Promise.all([
      courseOfferingService.getAllCourseOfferings(),
      facultyService.getAllFaculty(),
      roomService.getAllRooms(),
      batchService.getAllBatches(),
      body.considerPreferences ? 
        facultyPreferenceService.getPreferencesByTerm(body.academicYear, body.semester) : 
        Promise.resolve([])
    ]);

    // Filter data for the specific request
    const relevantCourseOfferings = courseOfferings.filter(co => 
      co.batchId && body.batchIds.includes(co.batchId) &&
      co.academicYear === body.academicYear &&
      co.semester === body.semester
    );

    const relevantBatches = batches.filter(b => body.batchIds.includes(b.id));

    if (relevantCourseOfferings.length === 0) {
      return NextResponse.json({
        success: false,
        timetables: [],
        optimizationScore: 0,
        executionTime: 0,
        iterations: 0,
        conflicts: [],
        recommendations: [
          'No course offerings found for the specified batches and term.',
          'Please create course offerings first before generating timetables.'
        ]
      } as AutoGenerationResult);
    }

    // Generate timetables based on selected algorithm
    let result: AutoGenerationResult;

    switch (body.algorithm) {
      case 'genetic':
        const geneticOptimizer = new TimetableOptimizer(
          relevantCourseOfferings,
          faculties,
          rooms,
          relevantBatches,
          facultyPreferences,
          body.constraints
        );
        result = await geneticOptimizer.generateTimetablesGenetic(body);
        break;

      case 'constraint_satisfaction':
        const constraintSolver = new ConstraintSolver(
          relevantCourseOfferings,
          faculties,
          rooms,
          relevantBatches,
          facultyPreferences,
          body.constraints
        );
        result = await constraintSolver.generateTimetablesCSP(body);
        break;

      case 'hybrid':
        // Try CSP first, then genetic if CSP fails
        const cspSolver = new ConstraintSolver(
          relevantCourseOfferings,
          faculties,
          rooms,
          relevantBatches,
          facultyPreferences,
          body.constraints
        );
        result = await cspSolver.generateTimetablesCSP(body);
        
        if (!result.success || result.optimizationScore < 60) {
          const hybridOptimizer = new TimetableOptimizer(
            relevantCourseOfferings,
            faculties,
            rooms,
            relevantBatches,
            facultyPreferences,
            body.constraints
          );
          const geneticResult = await hybridOptimizer.generateTimetablesGenetic({
            ...body,
            maxIterations: Math.floor((body.maxIterations || 100) / 2)
          });
          
          // Use better result
          result = geneticResult.optimizationScore > result.optimizationScore ? 
            geneticResult : result;
          
          if (result === geneticResult) {
            result.recommendations.unshift('CSP failed, genetic algorithm used as fallback');
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid algorithm specified' }, 
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Auto-generation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during timetable generation',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      }, 
      { status: 500 }
    );
  }
}

function validateRequest(body: AutoGenerationRequest): { isValid: boolean; error?: string } {
  if (!body.academicYear || !body.semester) {
    return { isValid: false, error: 'Academic year and semester are required' };
  }

  if (!body.batchIds || body.batchIds.length === 0) {
    return { isValid: false, error: 'At least one batch ID is required' };
  }

  if (!body.algorithm || !['genetic', 'constraint_satisfaction', 'hybrid'].includes(body.algorithm)) {
    return { isValid: false, error: 'Valid algorithm must be specified' };
  }

  if (!body.constraints) {
    return { isValid: false, error: 'Constraints configuration is required' };
  }

  // Validate constraints
  const constraints = body.constraints;
  if (typeof constraints.noFacultyConflicts !== 'boolean' ||
      typeof constraints.noRoomConflicts !== 'boolean' ||
      typeof constraints.noStudentConflicts !== 'boolean') {
    return { isValid: false, error: 'Hard constraints must be boolean values' };
  }

  if (body.maxIterations && (body.maxIterations < 1 || body.maxIterations > 1000)) {
    return { isValid: false, error: 'Max iterations must be between 1 and 1000' };
  }

  if (body.populationSize && (body.populationSize < 10 || body.populationSize > 200)) {
    return { isValid: false, error: 'Population size must be between 10 and 200' };
  }

  if (body.mutationRate && (body.mutationRate < 0 || body.mutationRate > 1)) {
    return { isValid: false, error: 'Mutation rate must be between 0 and 1' };
  }

  if (body.crossoverRate && (body.crossoverRate < 0 || body.crossoverRate > 1)) {
    return { isValid: false, error: 'Crossover rate must be between 0 and 1' };
  }

  return { isValid: true };
}

// GET endpoint to fetch default constraints
export async function GET() {
  const defaultConstraints: TimetableConstraints = {
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
  };

  return NextResponse.json({
    defaultConstraints,
    availableAlgorithms: ['genetic', 'constraint_satisfaction', 'hybrid'],
    recommendedSettings: {
      genetic: {
        populationSize: 50,
        maxIterations: 100,
        mutationRate: 0.1,
        crossoverRate: 0.8
      },
      constraint_satisfaction: {
        maxIterations: 1
      },
      hybrid: {
        populationSize: 30,
        maxIterations: 50,
        mutationRate: 0.15,
        crossoverRate: 0.7
      }
    }
  });
}