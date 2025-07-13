// src/components/analytics/AssessmentAnalyticsDashboard.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar, 
  BookOpen,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { Assessment, StudentAssessmentScore } from '@/types/entities';

interface AssessmentAnalyticsProps {
  studentId: string;
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  className?: string;
}

interface PerformanceMetrics {
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  completionRate: number;
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  highestScore: number;
  lowestScore: number;
  improvementRate: number;
}

interface AssessmentAnalyticsData {
  scoreOverTime: Array<{ date: string; score: number; assessment: string; type: string }>;
  performanceByType: Array<{ type: string; averageScore: number; count: number; color: string }>;
  monthlyTrends: Array<{ month: string; completed: number; average: number }>;
  skillAnalysis: Array<{ skill: string; performance: number; maxScore: number }>;
  gradeDistribution: Array<{ range: string; count: number; percentage: number }>;
  comparisonData: { student: number; classAverage: number; topPerformers: number };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const ASSESSMENT_TYPE_COLORS = {
  'Quiz': '#8884d8',
  'Midterm': '#82ca9d', 
  'Final': '#ffc658',
  'Assignment': '#ff7c7c',
  'Project': '#8dd1e1',
  'Lab Work': '#d084d0',
  'Presentation': '#ffb347',
  'Other': '#87ceeb'
};

const AssessmentAnalyticsDashboard: React.FC<AssessmentAnalyticsProps> = ({
  studentId,
  timeRange = '30d',
  className = ''
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [scores, setScores] = useState<StudentAssessmentScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>('all');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        const [assessmentsResponse, scoresResponse] = await Promise.all([
          fetch('/api/assessments'),
          fetch(`/api/student-scores?studentId=${studentId}`)
        ]);

        if (assessmentsResponse.ok) {
          const assessmentsData = await assessmentsResponse.json();
          setAssessments(assessmentsData);
        }

        if (scoresResponse.ok) {
          const scoresData = await scoresResponse.json();
          setScores(scoresData);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [studentId]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (selectedTimeRange) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case '1y':
        cutoffDate = subDays(now, 365);
        break;
      default:
        cutoffDate = new Date(0); // All time
    }

    const filteredScores = scores.filter(score => {
      const scoreDate = parseISO(score.submittedAt || score.evaluatedAt || '');
      const typeMatch = selectedAssessmentType === 'all' || 
        assessments.find(a => a.id === score.assessmentId)?.type === selectedAssessmentType;
      return scoreDate >= cutoffDate && typeMatch;
    });

    const filteredAssessments = assessments.filter(assessment => {
      const assessmentDate = parseISO(assessment.createdAt || '');
      const typeMatch = selectedAssessmentType === 'all' || assessment.type === selectedAssessmentType;
      return assessmentDate >= cutoffDate && typeMatch;
    });

    return { scores: filteredScores, assessments: filteredAssessments };
  }, [scores, assessments, selectedTimeRange, selectedAssessmentType]);

  const analytics: AssessmentAnalyticsData = useMemo(() => {
    const { scores: filteredScores, assessments: filteredAssessments } = filteredData;

    // Score over time
    const scoreOverTime = filteredScores
      .filter(score => score.marks !== null && score.submittedAt)
      .map(score => {
        const assessment = assessments.find(a => a.id === score.assessmentId);
        return {
          date: format(parseISO(score.submittedAt!), 'MMM dd'),
          score: (score.marks! / assessment!.maxMarks) * 100,
          assessment: assessment?.name || 'Unknown',
          type: assessment?.type || 'Other'
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Performance by type
    const typePerformance = new Map<string, { total: number; count: number }>();
    filteredScores.forEach(score => {
      const assessment = assessments.find(a => a.id === score.assessmentId);
      if (assessment && score.marks !== null) {
        const type = assessment.type;
        const percentage = ((score.marks || 0) / assessment.maxMarks) * 100;
        
        if (!typePerformance.has(type)) {
          typePerformance.set(type, { total: 0, count: 0 });
        }
        
        const current = typePerformance.get(type)!;
        current.total += percentage;
        current.count += 1;
      }
    });

    const performanceByType = Array.from(typePerformance.entries()).map(([type, data]) => ({
      type,
      averageScore: Math.round(data.total / data.count),
      count: data.count,
      color: ASSESSMENT_TYPE_COLORS[type as keyof typeof ASSESSMENT_TYPE_COLORS] || '#87ceeb'
    }));

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(new Date(), i * 30));
      const monthEnd = endOfMonth(monthStart);
      
      const monthScores = filteredScores.filter(score => {
        if (!score.submittedAt) return false;
        const scoreDate = parseISO(score.submittedAt);
        return scoreDate >= monthStart && scoreDate <= monthEnd;
      });

      const monthAssessments = monthScores.filter(score => score.marks !== null);
      const average = monthAssessments.length > 0
        ? monthAssessments.reduce((sum, score) => {
            const assessment = assessments.find(a => a.id === score.assessmentId);
            return sum + (assessment ? (score.marks! / assessment.maxMarks) * 100 : 0);
          }, 0) / monthAssessments.length
        : 0;

      monthlyTrends.push({
        month: format(monthStart, 'MMM yyyy'),
        completed: monthScores.length,
        average: Math.round(average)
      });
    }

    // Grade distribution
    const gradeRanges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '80-89%', min: 80, max: 89 },
      { range: '70-79%', min: 70, max: 79 },
      { range: '60-69%', min: 60, max: 69 },
      { range: 'Below 60%', min: 0, max: 59 }
    ];

    const gradedScores = filteredScores.filter(score => score.marks !== null);
    const gradeDistribution = gradeRanges.map(range => {
      const count = gradedScores.filter(score => {
        const assessment = assessments.find(a => a.id === score.assessmentId);
        if (!assessment) return false;
        const percentage = (score.marks! / assessment.maxMarks) * 100;
        return percentage >= range.min && percentage <= range.max;
      }).length;

      return {
        range: range.range,
        count,
        percentage: gradedScores.length > 0 ? Math.round((count / gradedScores.length) * 100) : 0
      };
    });

    // Skill analysis (mock data based on assessment types)
    const skillAnalysis = [
      { skill: 'Problem Solving', performance: 85, maxScore: 100 },
      { skill: 'Critical Thinking', performance: 78, maxScore: 100 },
      { skill: 'Technical Skills', performance: 92, maxScore: 100 },
      { skill: 'Communication', performance: 76, maxScore: 100 },
      { skill: 'Collaboration', performance: 88, maxScore: 100 },
      { skill: 'Time Management', performance: 82, maxScore: 100 }
    ];

    // Comparison data (mock)
    const studentAverage = gradedScores.length > 0 
      ? gradedScores.reduce((sum, score) => {
          const assessment = assessments.find(a => a.id === score.assessmentId);
          return sum + (assessment ? (score.marks! / assessment.maxMarks) * 100 : 0);
        }, 0) / gradedScores.length
      : 0;

    const comparisonData = {
      student: Math.round(studentAverage),
      classAverage: 75, // Mock class average
      topPerformers: 90 // Mock top 10% average
    };

    return {
      scoreOverTime,
      performanceByType,
      monthlyTrends,
      skillAnalysis,
      gradeDistribution,
      comparisonData
    };
  }, [filteredData, assessments]);

  const metrics: PerformanceMetrics = useMemo(() => {
    const { scores: filteredScores } = filteredData;
    const gradedScores = filteredScores.filter(score => score.marks !== null);
    
    const averageScore = gradedScores.length > 0
      ? gradedScores.reduce((sum, score) => {
          const assessment = assessments.find(a => a.id === score.assessmentId);
          return sum + (assessment ? (score.marks! / assessment.maxMarks) * 100 : 0);
        }, 0) / gradedScores.length
      : 0;

    const scores = gradedScores.map(score => {
      const assessment = assessments.find(a => a.id === score.assessmentId);
      return assessment ? (score.marks! / assessment.maxMarks) * 100 : 0;
    });

    const trend = scores.length >= 2 ? 
      (scores[scores.length - 1] > scores[scores.length - 2] ? 'up' : 
       scores[scores.length - 1] < scores[scores.length - 2] ? 'down' : 'stable') : 'stable';

    return {
      averageScore: Math.round(averageScore),
      trend,
      completionRate: filteredData.assessments.length > 0 ? Math.round((gradedScores.length / filteredData.assessments.length) * 100) : 0,
      totalAssessments: filteredData.assessments.length,
      completedAssessments: gradedScores.length,
      pendingAssessments: filteredData.assessments.length - gradedScores.length,
      highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
      lowestScore: scores.length > 0 ? Math.round(Math.min(...scores)) : 0,
      improvementRate: 15 // Mock improvement rate
    };
  }, [filteredData, assessments]);

  const assessmentTypes = useMemo(() => {
    const types = new Set(assessments.map(a => a.type));
    return Array.from(types).sort();
  }, [assessments]);

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Assessment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Assessment Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive insights into your academic performance and trends
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as typeof selectedTimeRange)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedAssessmentType} onValueChange={setSelectedAssessmentType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">All Types</SelectItem>
                  {assessmentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {metrics.averageScore}%
                  {metrics.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {metrics.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{metrics.completionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assessments</p>
                <p className="text-2xl font-bold">{metrics.completedAssessments}/{metrics.totalAssessments}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Score</p>
                <p className="text-2xl font-bold">{metrics.highestScore}%</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.scoreOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)}%`,
                        'Score'
                      ]}
                      labelFormatter={(date: string) => `Date: ${date}`}
                    />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance by Assessment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.performanceByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Average Score']} />
                    <Bar dataKey="averageScore" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.range}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Your Average</span>
                    <span className="font-semibold">{analytics.comparisonData.student}%</span>
                  </div>
                  <Progress value={analytics.comparisonData.student} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Class Average</span>
                    <span className="font-semibold">{analytics.comparisonData.classAverage}%</span>
                  </div>
                  <Progress value={analytics.comparisonData.classAverage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Top Performers</span>
                    <span className="font-semibold">{analytics.comparisonData.topPerformers}%</span>
                  </div>
                  <Progress value={analytics.comparisonData.topPerformers} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Performance Trends</CardTitle>
              <CardDescription>
                Track your assessment completion and average scores over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="completed" fill="#8884d8" name="Assessments Completed" />
                  <Line yAxisId="right" type="monotone" dataKey="average" stroke="#82ca9d" strokeWidth={2} name="Average Score %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skill Performance Analysis</CardTitle>
              <CardDescription>
                Breakdown of your performance across different skill areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analytics.skillAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="performance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Strong Performance</p>
                    <p className="text-sm text-muted-foreground">
                      Your average score is {analytics.comparisonData.student > analytics.comparisonData.classAverage ? 'above' : 'below'} class average
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Consistency</p>
                    <p className="text-sm text-muted-foreground">
                      {metrics.completionRate > 80 ? 'Excellent' : 'Good'} completion rate at {metrics.completionRate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Best Performance</p>
                    <p className="text-sm text-muted-foreground">
                      {analytics.performanceByType.length > 0 ? 
                        `Strongest in ${analytics.performanceByType.reduce((a, b) => a.averageScore > b.averageScore ? a : b).type}` :
                        'No performance data available'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.pendingAssessments > 0 && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Pending Assessments</p>
                      <p className="text-sm text-muted-foreground">
                        {metrics.pendingAssessments} assessment{metrics.pendingAssessments > 1 ? 's' : ''} awaiting completion
                      </p>
                    </div>
                  </div>
                )}
                {analytics.performanceByType.length > 0 && (
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Focus Area</p>
                      <p className="text-sm text-muted-foreground">
                        Consider improving {analytics.performanceByType.reduce((a, b) => a.averageScore < b.averageScore ? a : b).type} performance
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Goal Setting</p>
                    <p className="text-sm text-muted-foreground">
                      Aim for {Math.min(100, metrics.averageScore + 10)}% average to improve ranking
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssessmentAnalyticsDashboard;