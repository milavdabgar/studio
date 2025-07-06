"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import { 
  ChevronLeft, Award, Trophy, Star, Users, BookOpen, Building, Medal, Crown, Briefcase} from "lucide-react";
import { Footer } from "@/components/footer";

export default function CivilAchievementsPage() {
  const majorAchievements = [
    {
      title: "NBA Accreditation",
      year: "2020",
      description: "Department awarded NBA accreditation for maintaining high academic standards and quality education",
      category: "Academic Excellence",
      impact: "Enhanced credibility and industry recognition",
      icon: Award,
      color: "bg-green-100 text-green-800 border-green-200"
    },
    {
      title: "Best Department Award",
      year: "2022",
      description: "Recognized as the best performing department in Gujarat Technological University",
      category: "Institutional Recognition",
      impact: "State-level recognition for academic performance",
      icon: Trophy,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    {
      title: "Industry Collaboration MoU",
      year: "2021",
      description: "Signed MoU with 5 leading construction companies for student placement and training",
      category: "Industry Partnership",
      impact: "Enhanced placement opportunities for students",
      icon: Briefcase,
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      title: "Research Excellence Award",
      year: "2023",
      description: "Faculty research work recognized by Gujarat Council of Science and Technology",
      category: "Research Achievement",
      impact: "Boost to department&apos;s research profile",
      icon: Star,
      color: "bg-purple-100 text-purple-800 border-purple-200"
    }
  ];

  const studentAchievements = [
    {
      event: "State Level Technical Symposium",
      year: "2023",
      achievement: "First Prize in Structural Design Competition",
      students: ["Raj Patel", "Meera Shah", "Kiran Joshi"],
      description: "Won first prize in structural design competition among 50+ teams from Gujarat",
      prize: "₹25,000 + Trophy"
    },
    {
      event: "National Level Paper Presentation",
      year: "2023",
      achievement: "Best Paper Award",
      students: ["Amit Kumar", "Priya Desai"],
      description: "Research paper on 'Sustainable Construction Materials' won best paper award",
      prize: "₹15,000 + Certificate"
    },
    {
      event: "Inter-Collegiate Competition",
      year: "2022",
      achievement: "Second Prize in Bridge Building",
      students: ["Rohit Sharma", "Neha Patel", "Vikram Singh"],
      description: "Built strongest bridge model in inter-collegiate engineering competition",
      prize: "₹10,000 + Trophy"
    },
    {
      event: "State CAD Competition",
      year: "2022",
      achievement: "Third Prize in AutoCAD Championship",
      students: ["Kavya Joshi", "Ravi Patel"],
      description: "Demonstrated excellence in computer-aided design and drafting",
      prize: "₹8,000 + Certificate"
    },
    {
      event: "Innovation Challenge",
      year: "2021",
      achievement: "Innovation Award for Smart Construction",
      students: ["Arjun Mehta", "Pooja Shah", "Nirav Patel"],
      description: "Developed innovative solution for construction site monitoring using IoT",
      prize: "₹20,000 + Mentorship"
    }
  ];

  const facultyAchievements = [
    {
      faculty: "Mr. D N Sheth",
      achievement: "Best Teacher Award",
      year: "2022",
      description: "Awarded by Gujarat Technological University for excellence in teaching",
      category: "Teaching Excellence"
    },
    {
      faculty: "Prof. R K Patel",
      achievement: "Research Publication",
      year: "2023",
      description: "Published 3 papers in international journals on construction management",
      category: "Research"
    },
    {
      faculty: "Mr. S M Shah",
      achievement: "Consultant Recognition",
      year: "2022",
      description: "Recognized as traffic consultant by Palanpur Municipal Corporation",
      category: "Industry Contribution"
    },
    {
      faculty: "Mrs. P J Desai",
      achievement: "Environmental Project Lead",
      year: "2023",
      description: "Led environmental impact assessment for major infrastructure project",
      category: "Environmental Leadership"
    }
  ];

  const placementStats = [
    {
      year: "2023",
      placementRate: "85%",
      averagePackage: "₹3.2 LPA",
      highestPackage: "₹6.5 LPA",
      companiesVisited: 15
    },
    {
      year: "2022",
      placementRate: "82%",
      averagePackage: "₹3.0 LPA",
      highestPackage: "₹6.0 LPA",
      companiesVisited: 12
    },
    {
      year: "2021",
      placementRate: "78%",
      averagePackage: "₹2.8 LPA",
      highestPackage: "₹5.5 LPA",
      companiesVisited: 10
    }
  ];

  const topRecruiters = [
    "L&T Construction",
    "Tata Projects Limited",
    "Gammon India",
    "Shapoorji Pallonji",
    "Hindustan Construction Company",
    "KEC International",
    "Punj Lloyd",
    "Gujarat State Road Development Corporation",
    "GWSSB (Gujarat Water Supply Board)",
    "Municipal Corporations"
  ];

  const researchProjects = [
    {
      title: "Sustainable Concrete with Industrial Waste",
      duration: "2022-2024",
      fundingAgency: "Gujarat Council of Science & Technology",
      amount: "₹5,00,000",
      pi: "Mr. D N Sheth",
      status: "Ongoing"
    },
    {
      title: "Traffic Flow Optimization in Smart Cities",
      duration: "2021-2023",
      fundingAgency: "AICTE",
      amount: "₹3,50,000",
      pi: "Mr. S M Shah",
      status: "Completed"
    },
    {
      title: "Water Quality Monitoring System",
      duration: "2023-2025",
      fundingAgency: "DST Gujarat",
      amount: "₹4,20,000",
      pi: "Mrs. P J Desai",
      status: "Ongoing"
    }
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
              <Badge variant="secondary" className="text-sm">NBA Accredited</Badge>
              <Badge variant="outline" className="text-sm">85% Placement</Badge>
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:border-gray-700">
                Award Winning
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
              Achievements & Recognition
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed dark:text-gray-400">
              A showcase of our department&apos;s excellence in academics, research, student achievements, 
              and industry recognition. Our consistent performance demonstrates our commitment to 
              quality engineering education.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2020</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">NBA Accredited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">85%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Placement Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">25+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Awards Won</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">₹12L+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Research Funding</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Major Achievements */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Major Achievements</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Milestone achievements that define our excellence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {majorAchievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 dark:bg-primary/20">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-xl text-gray-900 dark:text-white">{achievement.title}</CardTitle>
                          <Badge variant="outline">{achievement.year}</Badge>
                        </div>
                        <Badge className={achievement.color} variant="outline">
                          {achievement.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 dark:text-gray-400">{achievement.description}</p>
                    <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <h4 className="font-semibold text-gray-900 mb-1 dark:text-white">Impact:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.impact}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Student Achievements */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Student Achievements</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Outstanding performance by our students in competitions and events
            </p>
          </div>
          
          <div className="space-y-6">
            {studentAchievements.map((achievement, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid lg:grid-cols-4 gap-6 items-center">
                    <div className="lg:col-span-2">
                      <div className="flex items-center space-x-3 mb-2">
                        <Medal className="h-6 w-6 text-yellow-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white">{achievement.achievement}</h3>
                        <Badge variant="outline">{achievement.year}</Badge>
                      </div>
                      <p className="text-primary font-medium mb-2">{achievement.event}</p>
                      <p className="text-gray-600 text-sm dark:text-gray-400">{achievement.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 dark:text-white">Students:</h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {achievement.students.map((student, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-primary" />
                            {student}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="text-center">
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 dark:border-gray-700">
                        <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <p className="font-semibold text-yellow-800">{achievement.prize}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty Achievements */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Faculty Achievements</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Recognition and accomplishments of our dedicated faculty members
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {facultyAchievements.map((achievement, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2 dark:text-white">{achievement.achievement}</h3>
                  <p className="text-primary font-medium mb-2">{achievement.faculty}</p>
                  <Badge variant="outline" className="mb-3">{achievement.year}</Badge>
                  <p className="text-sm text-gray-600 mb-3 dark:text-gray-400">{achievement.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {achievement.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Placement Statistics */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Placement Statistics</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Excellent placement record demonstrating industry confidence
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">Year-wise Performance</h3>
              <div className="space-y-4">
                {placementStats.map((stat, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">Academic Year {stat.year}</h4>
                        <Badge variant="secondary">{stat.placementRate} Placed</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">{stat.averagePackage}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Average Package</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{stat.highestPackage}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Highest Package</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{stat.companiesVisited}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Companies</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">Top Recruiters</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="grid gap-3">
                    {topRecruiters.map((company, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                        <Building className="h-5 w-5 text-primary" />
                        <span className="font-medium text-gray-900 dark:text-white">{company}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Research Projects */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Research Projects</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Funded research projects contributing to technological advancement
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {researchProjects.map((project, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <Badge variant={project.status === "Ongoing" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription>{project.duration}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Principal Investigator:</p>
                      <p className="text-gray-600 dark:text-gray-400">{project.pi}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Funding Agency:</p>
                      <p className="text-gray-600 dark:text-gray-400">{project.fundingAgency}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 dark:border-gray-700">
                      <p className="font-semibold text-green-800">Project Amount:</p>
                      <p className="text-xl font-bold text-green-900">{project.amount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
            Be Part of Our Success Story
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Join our Civil Engineering department and contribute to our legacy of excellence. 
            Your achievements will be the next chapter in our success story.
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