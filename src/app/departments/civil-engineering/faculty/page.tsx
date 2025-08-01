"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import { 
  ChevronLeft,
  User,
  Mail,
  Phone,
  Award,
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  Building,
  Star,
  Loader2
} from "lucide-react";
import { Footer } from "@/components/footer";
import { useEffect, useState } from "react";
import type { Faculty } from "@/types/entities";

// Helper function to create display name
const createDisplayName = (faculty: Faculty): string => {
  if (faculty.gtuName) {
    return faculty.gtuName;
  }
  const parts = [faculty.title, faculty.firstName, faculty.middleName, faculty.lastName].filter(Boolean);
  return parts.join(' ');
};

// Helper function to format qualification
const formatQualification = (faculty: Faculty): string => {
  if (faculty.qualification) {
    return faculty.qualification;
  }
  if (faculty.qualifications && faculty.qualifications.length > 0) {
    return faculty.qualifications.map(q => 
      q.degree ? `${q.degree}${q.field ? ` (${q.field})` : ''}` : ''
    ).filter(Boolean).join(', ');
  }
  return 'N/A';
};

// Helper function to get experience
const getExperience = (faculty: Faculty): string => {
  if (faculty.experienceYears) {
    return faculty.experienceYears;
  }
  if (faculty.joiningDate) {
    const joiningYear = new Date(faculty.joiningDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const years = currentYear - joiningYear;
    return `${years}+ years`;
  }
  return 'N/A';
};

export default function CivilFacultyPage() {
  const [facultyMembers, setFacultyMembers] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/faculty');
        if (!response.ok) {
          throw new Error('Failed to fetch faculty data');
        }
        const allFaculty: Faculty[] = await response.json();
        
        // Filter for Civil Engineering department
        const civilFaculty = allFaculty.filter(faculty => 
          faculty.department === 'Civil Engineering' && faculty.status === 'active'
        );
        
        setFacultyMembers(civilFaculty);
      } catch (err) {
        console.error('Error fetching faculty:', err);
        setError('Failed to load faculty data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  // Dummy data as fallback (keeping some for demo purposes)
  const dummyFacultyMembers = [
    {
      name: "Mr. D N Sheth",
      designation: "Head of Department & Associate Professor",
      qualification: "M.E. (Structural Engineering), B.E. (Civil)",
      experience: "15+ years",
      specialization: ["Structural Design", "Concrete Technology", "Earthquake Engineering"],
      subjects: ["Design of RCC Structures", "Structural Analysis", "Concrete Technology"],
      email: "dn.sheth@gppalanpur.ac.in",
      phone: "+91 98765 43210",
      achievements: [
        "NBA Accreditation Coordinator",
        "Published 8 research papers",
        "Industry consultant for 5+ projects"
      ],
      researchAreas: ["Seismic Design", "High Performance Concrete", "Structural Optimization"]
    },
    {
      name: "Prof. R K Patel",
      designation: "Associate Professor",
      qualification: "M.E. (Construction Management), B.E. (Civil)",
      experience: "12+ years",
      specialization: ["Construction Management", "Project Planning", "Building Technology"],
      subjects: ["Building Materials & Construction", "Quantity Surveying", "Construction Management"],
      email: "rk.patel@gppalanpur.ac.in",
      phone: "+91 98765 43211",
      achievements: [
        "Construction industry expert",
        "Guided 50+ student projects",
        "AICTE certified trainer"
      ],
      researchAreas: ["Sustainable Construction", "Project Management", "Green Building Technology"]
    },
    {
      name: "Mr. S M Shah",
      designation: "Assistant Professor",
      qualification: "M.E. (Transportation Engineering), B.E. (Civil)",
      experience: "8+ years",
      specialization: ["Highway Engineering", "Traffic Management", "Pavement Design"],
      subjects: ["Transportation Engineering", "Highway Engineering", "Traffic Engineering"],
      email: "sm.shah@gppalanpur.ac.in",
      phone: "+91 98765 43212",
      achievements: [
        "Traffic consultant for municipal corporation",
        "Highway design specialist",
        "Published papers on traffic optimization"
      ],
      researchAreas: ["Intelligent Transportation Systems", "Pavement Materials", "Traffic Flow Analysis"]
    }
  ];

  // Use real data if available, otherwise fall back to dummy data for missing slots
  const displayFaculty = isLoading ? [] : [...facultyMembers];
  
  // Add dummy faculty if we have less than 4 faculty members to show variety
  if (displayFaculty.length < 4 && !isLoading) {
    const remainingSlots = 4 - displayFaculty.length;
    for (let i = 0; i < remainingSlots && i < dummyFacultyMembers.length; i++) {
      displayFaculty.push(dummyFacultyMembers[i] as any);
    }
  }

  const departmentStats = {
    totalFaculty: isLoading ? "..." : facultyMembers.length.toString(),
    avgExperience: "8+ years",
    researchPapers: "25+",
    industryProjects: "15+"
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Error Loading Faculty</h1>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
              <Badge variant="secondary" className="text-sm">{departmentStats.totalFaculty} Faculty Members</Badge>
              <Badge variant="outline" className="text-sm">{departmentStats.avgExperience} Avg Experience</Badge>
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:border-gray-700">
                Highly Qualified
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
              Faculty Members
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed dark:text-gray-400">
              Meet our experienced and dedicated faculty members who bring together academic excellence 
              and industry expertise to guide students in their civil engineering journey.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{departmentStats.totalFaculty}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Faculty Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{departmentStats.avgExperience}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{departmentStats.researchPapers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Research Papers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{departmentStats.industryProjects}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Industry Projects</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Our Faculty Team</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Dedicated educators committed to excellence in civil engineering education
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading faculty members...</span>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {displayFaculty.map((faculty, index) => {
                // Check if this is a dummy faculty (has 'name' property) or real faculty
                const isDummy = 'name' in faculty;
                const displayName = isDummy ? (faculty as any).name : createDisplayName(faculty);
                const designation = isDummy ? (faculty as any).designation : faculty.designation || 'Faculty Member';
                const qualification = isDummy ? (faculty as any).qualification : formatQualification(faculty);
                const experience = isDummy ? (faculty as any).experience : getExperience(faculty);
                const email = isDummy ? (faculty as any).email : (faculty.instituteEmail || faculty.personalEmail || faculty.email);
                const phone = isDummy ? (faculty as any).phone : faculty.contactNumber;
                const specializations = isDummy ? (faculty as any).specialization : (faculty.specializations || []);
                const subjects = isDummy ? (faculty as any).subjects : (faculty.subjects || []); // Now uses real data from database
                const researchAreas = isDummy ? (faculty as any).researchAreas : (faculty.researchInterests || []);
                const achievements = isDummy ? (faculty as any).achievements : (faculty.achievements?.map((a: any) => a.title || a.description || a) || []);

                return (
                  <Card key={index} className="hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-primary/20">
                          <User className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl text-gray-900 mb-2 dark:text-white">{displayName}</CardTitle>
                          <CardDescription className="text-primary font-medium mb-2">
                            {designation}
                          </CardDescription>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 dark:text-gray-400">
                            <GraduationCap className="h-4 w-4" />
                            {qualification}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {experience} Experience
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Specializations */}
                      {specializations && specializations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 dark:text-white">
                            <Star className="h-4 w-4 text-primary" />
                            Specializations
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {specializations.map((spec: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subjects Taught */}
                      {subjects && subjects.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 dark:text-white">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Subjects Taught
                          </h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {subjects.map((subject: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                {subject}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Research Areas */}
                      {researchAreas && researchAreas.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 dark:text-white">
                            <Building className="h-4 w-4 text-primary" />
                            Research Areas
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {researchAreas.map((area: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Achievements */}
                      {achievements && achievements.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 dark:text-white">
                            <Award className="h-4 w-4 text-primary" />
                            Key Achievements
                          </h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {achievements.map((achievement: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Contact */}
                      {(email || phone) && (
                        <div className="pt-4 border-t dark:border-gray-700">
                          <div className="flex flex-col sm:flex-row gap-3">
                            {email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="h-4 w-4 text-primary" />
                                <span className="break-all">{email}</span>
                              </div>
                            )}
                            {phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4 text-primary" />
                                <span>{phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Faculty Statistics */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Faculty Excellence</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Our faculty&apos;s commitment to academic and research excellence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">100%</h3>
                <p className="text-gray-600 font-medium dark:text-gray-400">Post Graduate</p>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">All faculty hold M.E./M.Tech degrees</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">25+</h3>
                <p className="text-gray-600 font-medium dark:text-gray-400">Research Papers</p>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Published in reputed journals</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Building className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">15+</h3>
                <p className="text-gray-600 font-medium dark:text-gray-400">Industry Projects</p>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Consultancy and collaboration</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">8+</h3>
                <p className="text-gray-600 font-medium dark:text-gray-400">Years Avg</p>
                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Average teaching experience</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Research Activities */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Research & Development</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Active research areas and ongoing projects
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Building className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Structural Engineering</h3>
                <p className="text-gray-600 text-sm mb-4 dark:text-gray-400">
                  Advanced concrete technology, seismic design, and structural optimization
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Earthquake Engineering</Badge>
                  <Badge variant="outline" className="text-xs">High Performance Concrete</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Environmental Engineering</h3>
                <p className="text-gray-600 text-sm mb-4 dark:text-gray-400">
                  Water treatment, waste management, and environmental sustainability
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Water Treatment</Badge>
                  <Badge variant="outline" className="text-xs">Green Technology</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Star className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Transportation Engineering</h3>
                <p className="text-gray-600 text-sm mb-4 dark:text-gray-400">
                  Traffic optimization, pavement design, and intelligent transportation systems
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Smart Traffic</Badge>
                  <Badge variant="outline" className="text-xs">Pavement Materials</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
            Learn from the Best
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Join our Civil Engineering program and learn from experienced faculty members 
            who are committed to your success and professional growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/admissions">Apply for Admission</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/departments/civil-engineering">Back to Department</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Faculty</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}