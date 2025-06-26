"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
  Briefcase,
  Users,
  Target,
  Award,
  TrendingUp,
  Building,
  FileText,
  Mail,
  MapPin,
  Phone,
  Clock,
  Star,
  CheckCircle,
  BarChart3,
  Zap,
  BookOpen,
  User,
  DollarSign,
  Factory,
  ArrowRight,
  Calendar,
  Globe
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function TPOPage() {
  const placementStats = [
    { year: "2023", companies: 5, maxSalary: "4.50", medianSalary: "1.80", rate: "35%" },
    { year: "2022", companies: 4, maxSalary: "3.50", medianSalary: "1.60", rate: "32%" },
    { year: "2021", companies: 4, maxSalary: "2.80", medianSalary: "1.50", rate: "28%" },
    { year: "2020", companies: 4, maxSalary: "2.50", medianSalary: "1.44", rate: "30%" },
  ];

  const departmentPlacements = [
    { name: "Electronics & Communication", rate: "20-25%", icon: Zap },
    { name: "Electrical Engineering", rate: "15-25%", icon: Factory },
    { name: "Mechanical Engineering", rate: "10-20%", icon: Award },
    { name: "Civil Engineering", rate: "5-10%", icon: Building },
  ];

  const recruiters = [
    { category: "Engineering Sector", companies: ["Torrent Power", "Adani Group", "L&T", "Maruti Suzuki"] },
    { category: "Manufacturing", companies: ["UltraTech Cement", "KRIBHCO"] },
    { category: "Power & Energy", companies: ["Gujarat Electricity Board", "Power Grid India"] },
  ];

  const services = [
    { title: "Career Counseling", description: "Professional guidance for career planning", icon: User },
    { title: "Industrial Training", description: "Hands-on experience with industry partners", icon: Factory },
    { title: "Recruitment Drives", description: "On-campus placement opportunities", icon: Users },
    { title: "Skill Enhancement", description: "Workshops and training programs", icon: BookOpen },
    { title: "Alumni Tracking", description: "Monitoring graduate progress and success", icon: TrendingUp },
    { title: "Entrepreneurship Support", description: "SSIP initiatives and startup guidance", icon: Briefcase },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">Training & Placement Cell</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              TPO Cell
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Building bridges between academic excellence and industry opportunities. 
              Our dedicated Training & Placement Cell focuses on comprehensive career development and successful industry integration.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">35%</div>
                <div className="text-sm text-gray-600">Placement Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">₹4.5L</div>
                <div className="text-sm text-gray-600">Max Package</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5+</div>
                <div className="text-sm text-gray-600">Companies/Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-gray-600">Alumni Network</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To bridge the gap between academic learning and industry requirements by providing comprehensive 
                training, career guidance, and placement opportunities that enable our students to excel in their 
                professional careers.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Industry Connections</h3>
                    <p className="text-gray-600">Establishing strong partnerships with leading companies</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Skill Development</h3>
                    <p className="text-gray-600">Comprehensive training programs and workshops</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Career Guidance</h3>
                    <p className="text-gray-600">Professional counseling and mentorship programs</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <Image
                  src="https://picsum.photos/seed/tpo-mission/600/400"
                  alt="TPO Mission"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    "Bridging Academia & Industry"
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Placement Statistics */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Placement Statistics
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Track record of successful placements across various engineering disciplines
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {placementStats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{stat.year}</CardTitle>
                  <CardDescription>Academic Year</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Companies</span>
                    <span className="font-semibold">{stat.companies}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Package</span>
                    <span className="font-semibold text-green-600">₹{stat.maxSalary}L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Median</span>
                    <span className="font-semibold">₹{stat.medianSalary}L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rate</span>
                    <Badge variant="secondary">{stat.rate}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Department-wise Placement */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Department-wise Placement Rates
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {departmentPlacements.map((dept, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3">
                    <dept.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{dept.name}</h4>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {dept.rate}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Offered */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services & Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive support system for student career development
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                  </div>
                  <p className="text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Recruiters */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Key Recruiters
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Leading companies that regularly recruit our graduates
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {recruiters.map((sector, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-center">{sector.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sector.companies.map((company, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Building className="h-5 w-5 text-primary" />
                        <span className="font-medium text-gray-900">{company}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Alumni Success Stories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Alumni Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from our successful graduates about their journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <blockquote className="text-gray-700 mb-4 italic">
                      "Practical knowledge at GPP Palanpur gave me confidence to excel in my career. 
                      The TPO cell provided excellent guidance throughout the placement process."
                    </blockquote>
                    <div>
                      <div className="font-semibold text-gray-900">Patel Jayesh</div>
                      <div className="text-sm text-gray-600">Electronics & Communication, Batch 2019</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <blockquote className="text-gray-700 mb-4 italic">
                      "Strong foundation provided by GPP helped me excel in my degree studies and 
                      land a great job. The career counseling was invaluable."
                    </blockquote>
                    <div>
                      <div className="font-semibold text-gray-900">Desai Ruchi</div>
                      <div className="text-sm text-gray-600">Civil Engineering, Batch 2020</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Higher Education Pathways */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Higher Education Pathways
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Multiple options for academic advancement and professional growth
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">BE/B.Tech Direct Entry</h3>
                  <p className="text-gray-600">Direct admission to second year of engineering degree programs</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Certification Courses</h3>
                  <p className="text-gray-600">Specialized certification programs for skill enhancement</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Management Studies</h3>
                  <p className="text-gray-600">MBA and management program opportunities</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact TPO */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Contact TPO Cell
              </h2>
              <p className="text-xl text-gray-600">
                Get in touch for placement opportunities, career guidance, or collaboration
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12">
              <Card className="border-l-4 border-l-primary shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                        <p className="text-gray-600">placement-gpp@guj.edu.in</p>
                        <p className="text-sm text-gray-500">For placement inquiries and collaborations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                        <p className="text-gray-600">02742-245219</p>
                        <p className="text-sm text-gray-500">Office hours: Monday to Friday, 9:00 AM - 5:00 PM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                        <p className="text-gray-600">Training & Placement Cell</p>
                        <p className="text-gray-600">Government Polytechnic Palanpur</p>
                        <p className="text-gray-600">Palanpur-385001, Gujarat</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h3>
                  <div className="space-y-4">
                    <Link href="/admissions" className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <GraduationCap className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900">Admissions</div>
                        <div className="text-sm text-gray-600">Join our engineering programs</div>
                      </div>
                    </Link>
                    
                    <Link href="/departments" className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <Building className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900">Departments</div>
                        <div className="text-sm text-gray-600">Explore our programs</div>
                      </div>
                    </Link>
                    
                    <Link href="/ssip" className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <Briefcase className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900">SSIP Cell</div>
                        <div className="text-sm text-gray-600">Innovation & Entrepreneurship</div>
                      </div>
                    </Link>
                    
                    <Link href="/contact" className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <Phone className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900">Contact Us</div>
                        <div className="text-sm text-gray-600">Get in touch</div>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}