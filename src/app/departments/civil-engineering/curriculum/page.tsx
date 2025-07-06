"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import { 
  ChevronLeft,
  BookOpen,
  Clock,
  Users,
  Target,
  Award,
  Calendar,
  FileText
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function CivilCurriculumPage() {
  const semesters = [
    {
      semester: "Semester 1",
      credits: 24,
      subjects: [
        { code: "3110002", name: "English", credits: 4, type: "Theory + Practical" },
        { code: "3110005", name: "Professional Communication", credits: 4, type: "Theory + Practical" },
        { code: "3110006", name: "Applied Mathematics", credits: 6, type: "Theory + Practical" },
        { code: "3110007", name: "Applied Physics", credits: 5, type: "Theory + Practical" },
        { code: "3110008", name: "Applied Chemistry", credits: 5, type: "Theory + Practical" }
      ]
    },
    {
      semester: "Semester 2", 
      credits: 26,
      subjects: [
        { code: "3110013", name: "Gujarati", credits: 2, type: "Theory" },
        { code: "3110014", name: "Community Service", credits: 2, type: "Practical" },
        { code: "3110015", name: "Applied Mathematics", credits: 6, type: "Theory + Practical" },
        { code: "3110016", name: "Basic Civil Engineering", credits: 5, type: "Theory + Practical" },
        { code: "3110017", name: "Basic Mechanical Engineering", credits: 5, type: "Theory + Practical" },
        { code: "3110018", name: "Basic Electrical Engineering", credits: 6, type: "Theory + Practical" }
      ]
    },
    {
      semester: "Semester 3",
      credits: 28,
      subjects: [
        { code: "3131001", name: "Engineering Mechanics", credits: 6, type: "Theory + Practical" },
        { code: "3131002", name: "Strength of Materials", credits: 6, type: "Theory + Practical" },
        { code: "3131003", name: "Building Materials and Construction", credits: 6, type: "Theory + Practical" },
        { code: "3131004", name: "Surveying - I", credits: 5, type: "Theory + Practical" },
        { code: "3131005", name: "Engineering Geology", credits: 5, type: "Theory + Practical" }
      ]
    },
    {
      semester: "Semester 4",
      credits: 28,
      subjects: [
        { code: "3141001", name: "Applied Mathematics", credits: 4, type: "Theory + Practical" },
        { code: "3141002", name: "Structural Analysis - I", credits: 6, type: "Theory + Practical" },
        { code: "3141003", name: "Concrete Technology", credits: 6, type: "Theory + Practical" },
        { code: "3141004", name: "Fluid Mechanics", credits: 6, type: "Theory + Practical" },
        { code: "3141005", name: "Soil Mechanics", credits: 6, type: "Theory + Practical" }
      ]
    },
    {
      semester: "Semester 5",
      credits: 28,
      subjects: [
        { code: "3151001", name: "Design of RCC Structures", credits: 7, type: "Theory + Practical" },
        { code: "3151002", name: "Water Supply Engineering", credits: 6, type: "Theory + Practical" },
        { code: "3151003", name: "Transportation Engineering - I", credits: 6, type: "Theory + Practical" },
        { code: "3151004", name: "Surveying - II", credits: 5, type: "Theory + Practical" },
        { code: "3151005", name: "Computer Applications", credits: 4, type: "Theory + Practical" }
      ]
    },
    {
      semester: "Semester 6",
      credits: 28,
      subjects: [
        { code: "3161001", name: "Design of Steel Structures", credits: 6, type: "Theory + Practical" },
        { code: "3161002", name: "Irrigation Engineering", credits: 6, type: "Theory + Practical" },
        { code: "3161003", name: "Transportation Engineering - II", credits: 6, type: "Theory + Practical" },
        { code: "3161004", name: "Environmental Engineering", credits: 5, type: "Theory + Practical" },
        { code: "3161005", name: "Quantity Surveying and Contracts", credits: 5, type: "Theory + Practical" }
      ]
    }
  ];

  const programDetails = {
    duration: "3 Years (6 Semesters)",
    totalCredits: 162,
    eligibilitySSC: "SSC with 35% marks",
    eligibilityHSC: "HSC (Science) with 35% marks",
    admissionProcess: "Merit based on ACPC counselling",
    affiliatedTo: "Gujarat Technological University (GTU)"
  };

  const learningOutcomes = [
    "Design and analyze civil engineering structures",
    "Apply principles of structural mechanics and materials",
    "Plan and execute construction projects",
    "Conduct surveying and site investigation",
    "Design water supply and sewage systems",
    "Implement quality control in construction",
    "Use modern engineering tools and software",
    "Understand professional ethics and safety practices"
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <Link href="/departments/civil-engineering" className="flex items-center space-x-2 text-gray-600 hover:text-primary dark:hover:text-primary dark:text-gray-400">
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Civil Engineering</span>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="text-sm">3 Years Program</Badge>
              <Badge variant="outline" className="text-sm">162 Credits</Badge>
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:border-gray-700">
                GTU Affiliated
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
              Civil Engineering Curriculum
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed dark:text-gray-400">
              Comprehensive 3-year diploma program designed to develop skilled civil engineers with 
              strong foundation in structural design, construction technology, and infrastructure development.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Years Program</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Semesters</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">162</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Credits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">35+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Subjects</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Program Details</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Essential information about the Civil Engineering diploma program
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Duration</h3>
                    <p className="text-gray-600 dark:text-gray-400">{programDetails.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Target className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Total Credits</h3>
                    <p className="text-gray-600 dark:text-gray-400">{programDetails.totalCredits} Credits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Affiliated To</h3>
                    <p className="text-gray-600 dark:text-gray-400">{programDetails.affiliatedTo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Eligibility Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 dark:text-white">For SSC Students:</h4>
                  <p className="text-gray-600 dark:text-gray-400">{programDetails.eligibilitySSC}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 dark:text-white">For HSC Students:</h4>
                  <p className="text-gray-600 dark:text-gray-400">{programDetails.eligibilityHSC}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 dark:text-white">Admission Process:</h4>
                  <p className="text-gray-600 dark:text-gray-400">{programDetails.admissionProcess}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Learning Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Semester-wise Curriculum */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
              Semester-wise Curriculum
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Detailed subject-wise breakdown for each semester
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {semesters.map((semester, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {semester.semester}
                    </CardTitle>
                    <Badge variant="outline">{semester.credits} Credits</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {semester.subjects.map((subject, subIndex) => (
                      <div key={subIndex} className="flex items-center justify-between p-3 bg-white rounded-lg border dark:bg-gray-900 dark:border-gray-700">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1 dark:text-white">{subject.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Code: {subject.code}</span>
                            <span>{subject.type}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {subject.credits} Credits
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment Methods */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Assessment Methods</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive evaluation system ensuring quality learning
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Theory Examination</h3>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Mid-semester and end-semester examinations for theoretical subjects
                </p>
                <Badge variant="outline">50% Weightage</Badge>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Practical Assessment</h3>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Laboratory work, site visits, and practical examinations
                </p>
                <Badge variant="outline">30% Weightage</Badge>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Continuous Assessment</h3>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Assignments, projects, and internal assessments
                </p>
                <Badge variant="outline">20% Weightage</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
            Ready to Start Your Civil Engineering Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Join our comprehensive Civil Engineering program and build a strong foundation for your career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/admissions">Apply for Admission</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/departments/civil-engineering">Back to Department</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact for More Info</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}