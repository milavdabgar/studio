"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  Users, Building, ArrowRight, BookOpen, Briefcase, Award, Star, ChevronLeft, User, Hammer, Truck, Home, Waves, Mountain} from "lucide-react";
import { Footer } from "@/components/footer";

export default function CivilEngineeringPage() {
  const facultyMembers = [
    {
      name: "Mr. D N Sheth",
      designation: "Head of Department",
      qualification: "M.E. (Structural Engineering)",
      experience: "15+ years",
      specialization: "Structural Design & Analysis"
    },
    {
      name: "Prof. R K Patel",
      designation: "Associate Professor",
      qualification: "M.E. (Construction Management)",
      experience: "12+ years",
      specialization: "Construction Technology"
    },
    {
      name: "Mr. S M Shah",
      designation: "Assistant Professor",
      qualification: "M.E. (Transportation Engineering)",
      experience: "8+ years",
      specialization: "Highway Engineering"
    },
    {
      name: "Mrs. P J Desai",
      designation: "Assistant Professor",
      qualification: "M.E. (Environmental Engineering)",
      experience: "6+ years",
      specialization: "Water Resource Management"
    }
  ];

  const laboratories = [
    {
      name: "Concrete Technology Lab",
      description: "Testing of concrete, cement, and aggregates with modern equipment",
      equipment: ["Universal Testing Machine", "Compression Testing Machine", "Slump Test Apparatus"],
      image: "concrete-lab"
    },
    {
      name: "Soil Mechanics Lab",
      description: "Comprehensive soil testing and geotechnical analysis",
      equipment: ["Triaxial Test Apparatus", "Consolidation Test Setup", "Standard Penetration Test"],
      image: "soil-lab"
    },
    {
      name: "Surveying Lab",
      description: "Modern surveying instruments and GPS technology",
      equipment: ["Total Station", "Theodolite", "Auto Level", "GPS Equipment"],
      image: "survey-lab"
    },
    {
      name: "Highway Engineering Lab",
      description: "Bitumen testing and road material analysis",
      equipment: ["Penetration Test", "Ductility Test", "Marshall Stability Test"],
      image: "highway-lab"
    },
    {
      name: "Water Supply & Sanitary Lab",
      description: "Water quality testing and environmental analysis",
      equipment: ["Water Testing Kit", "BOD Incubator", "Turbidity Meter"],
      image: "water-lab"
    }
  ];

  const achievements = [
    {
      title: "NBA Accreditation",
      description: "Department accredited by National Board of Accreditation",
      year: "2020",
      icon: Award
    },
    {
      title: "State Level Competition Winners",
      description: "Students won multiple prizes in technical competitions",
      year: "2023",
      icon: Star
    },
    {
      title: "Industry Collaboration",
      description: "MoU signed with leading construction companies",
      year: "2022",
      icon: Briefcase
    },
    {
      title: "Research Publications",
      description: "Faculty published papers in reputed journals",
      year: "2023",
      icon: BookOpen
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _courses = [
    {
      semester: "Semester 1",
      subjects: [
        "Engineering Mathematics - I",
        "Engineering Physics",
        "Engineering Chemistry",
        "Engineering Graphics",
        "Basic Workshop Practice"
      ]
    },
    {
      semester: "Semester 2",
      subjects: [
        "Engineering Mathematics - II",
        "Engineering Mechanics",
        "Basic Electrical Engineering",
        "Programming in C",
        "Engineering Graphics - II"
      ]
    },
    {
      semester: "Semester 3",
      subjects: [
        "Building Materials & Construction",
        "Strength of Materials",
        "Surveying - I",
        "Engineering Geology",
        "Computer Applications"
      ]
    },
    {
      semester: "Semester 4",
      subjects: [
        "Concrete Technology",
        "Structural Analysis - I",
        "Surveying - II",
        "Soil Mechanics",
        "Fluid Mechanics"
      ]
    },
    {
      semester: "Semester 5",
      subjects: [
        "Design of R.C.C. Structures",
        "Highway Engineering",
        "Water Supply Engineering",
        "Quantity Surveying",
        "Construction Management"
      ]
    },
    {
      semester: "Semester 6",
      subjects: [
        "Design of Steel Structures",
        "Irrigation Engineering",
        "Environmental Engineering",
        "Estimate & Costing",
        "Project Work"
      ]
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
              <Link href="/departments" className="flex items-center space-x-2 text-gray-600 hover:text-primary dark:hover:text-primary dark:text-gray-400">
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Departments</span>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="text-sm">Est. 1984</Badge>
              <Badge variant="outline" className="text-sm">118 Seats</Badge>
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:border-gray-700">
                NBA Accredited
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
              Civil Engineering Department
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed dark:text-gray-400">
              Building the future through innovative design, sustainable construction, and infrastructure development. 
              Our program combines theoretical knowledge with practical skills to create competent civil engineers 
              ready to meet industry challenges.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1984</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Established</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">118</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Seats Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">13</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Faculty Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Laboratories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Department Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 dark:text-white">
                Department Overview
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed dark:text-gray-400">
                <p>
                  The Civil Engineering Department at Government Polytechnic Palanpur has been a pioneer 
                  in technical education since 1984. We focus on developing skilled diploma engineers 
                  who are ready to contribute to the rapidly growing infrastructure sector.
                </p>
                <p>
                  Our curriculum emphasizes practical learning through well-equipped laboratories, 
                  industry visits, and real-world projects. Students gain expertise in structural 
                  design, construction technology, transportation engineering, and environmental systems.
                </p>
                <p>
                  With NBA accreditation and experienced faculty, we ensure quality education that 
                  meets industry standards and prepares students for successful careers in civil engineering.
                </p>
              </div>
              
              <div className="mt-8 p-6 bg-gray-50 rounded-lg dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                  <User className="h-5 w-5 text-primary" />
                  Head of Department
                </h3>
                <p className="text-gray-700 font-medium dark:text-gray-300">Mr. D N Sheth</p>
                <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">M.E. (Structural Engineering)</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 p-8 rounded dark:bg-gray-800-2xl shadow dark:bg-gray-800-xl dark:bg-gray-900">
                <Image
                  src="https://dummyimage.com/600x400/0066cc/ffffff&text=Civil+Engineering+Department"
                  alt="Civil Engineering Department"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                    Civil Engineering Lab
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">State-of-the-art facilities for hands-on learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Department Video */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 dark:text-white">
              Discover Civil Engineering at GP Palanpur
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              Get an inside look at our civil engineering program, facilities, and student experiences
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/aUQAQY_VzS8"
                title="Civil Engineering Department Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="text-center mt-6">
              <p className="text-gray-600 dark:text-gray-400">
                Explore our civil engineering labs, meet our faculty, and see students in action
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
              Areas of Specialization
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive curriculum covering key areas of civil engineering
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Structural Design", icon: Building, desc: "Design of buildings, bridges, and infrastructure" },
              { name: "Construction Technology", icon: Hammer, desc: "Modern construction methods and materials" },
              { name: "Transportation Engineering", icon: Truck, desc: "Highway design and traffic management" },
              { name: "Water Resource Management", icon: Waves, desc: "Water supply and irrigation systems" },
              { name: "Soil Mechanics", icon: Mountain, desc: "Foundation design and geotechnical analysis" },
              { name: "Environmental Engineering", icon: Home, desc: "Sustainable development and waste management" }
            ].map((specialization, index) => {
              const IconComponent = specialization.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">{specialization.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{specialization.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Faculty Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Our Faculty</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Experienced educators and industry professionals guiding your journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {facultyMembers.map((faculty, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center dark:bg-primary/20">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 dark:text-white">{faculty.name}</h3>
                  <p className="text-sm text-primary font-medium mb-2">{faculty.designation}</p>
                  <p className="text-xs text-gray-600 mb-1 dark:text-gray-400">{faculty.qualification}</p>
                  <p className="text-xs text-gray-600 mb-2 dark:text-gray-400">{faculty.experience}</p>
                  <Badge variant="outline" className="text-xs">
                    {faculty.specialization}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Laboratories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
              Laboratory Facilities
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              State-of-the-art laboratories for hands-on learning and research
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {laboratories.map((lab, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={`https://dummyimage.com/400x200/0066cc/ffffff&text=${encodeURIComponent(lab.name)}`}
                      alt={lab.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardTitle className="text-lg">{lab.name}</CardTitle>
                  <CardDescription>{lab.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Key Equipment:</h4>
                    <ul className="text-sm text-gray-600 space-y-1 dark:text-gray-400">
                      {lab.equipment.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Our Achievements</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Recognition and milestones in academic excellence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center dark:bg-primary/20">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 dark:text-white">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-2 dark:text-gray-400">{achievement.description}</p>
                    <Badge variant="secondary">{achievement.year}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Explore More</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover detailed information about our programs and facilities
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Curriculum</h3>
                <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">Detailed semester-wise curriculum and subjects</p>
                <Button asChild className="w-full">
                  <Link href="/departments/civil-engineering/curriculum">View Curriculum</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Faculty</h3>
                <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">Meet our experienced faculty members</p>
                <Button asChild className="w-full">
                  <Link href="/departments/civil-engineering/faculty">View Faculty</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Facilities</h3>
                <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">Explore our laboratories and infrastructure</p>
                <Button asChild className="w-full">
                  <Link href="/departments/civil-engineering/facilities">View Facilities</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Achievements</h3>
                <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">Department achievements and student success</p>
                <Button asChild className="w-full">
                  <Link href="/departments/civil-engineering/achievements">View Achievements</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
            Ready to Join Civil Engineering?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Take the first step towards an exciting career in civil engineering. 
            Apply now for admission to Government Polytechnic Palanpur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/admissions">Apply for Admission</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/departments">View All Departments</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Department</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}