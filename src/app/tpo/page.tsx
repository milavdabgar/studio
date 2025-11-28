"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, Briefcase, Users, Award, TrendingUp, Building, FileText, Mail, MapPin, Phone, CheckCircle, Zap, BookOpen, User, Factory} from "lucide-react";
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
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">Training & Placement Cell</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              TPO Cell
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              Building bridges between academic excellence and industry opportunities. 
              Our dedicated Training & Placement Cell focuses on comprehensive career development and successful industry integration.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">35%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Placement Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">₹4.5L</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Max Package</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Companies/Year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Alumni Network</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed dark:text-gray-400">
                To bridge the gap between academic learning and industry requirements by providing comprehensive 
                training, career guidance, and placement opportunities that enable our students to excel in their 
                professional careers.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Industry Connections</h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Establishing strong partnerships with leading companies</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Skill Development</h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Comprehensive training programs and workshops</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Career Guidance</h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Professional counseling and mentorship programs</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 p-8 rounded dark:bg-gray-800-2xl shadow dark:bg-gray-800-xl dark:bg-gray-900">
                <Image
                  src="https://dummyimage.com/600x400/0066cc/ffffff&text=TPO+Mission"
                  alt="TPO Mission"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary dark:bg-primary/20">
                    &quot;Bridging Academia & Industry&quot;
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Placement Statistics */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Placement Statistics
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
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
                    <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Companies</span>
                    <span className="font-semibold">{stat.companies}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Max Package</span>
                    <span className="font-semibold text-green-600">₹{stat.maxSalary}L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Median</span>
                    <span className="font-semibold">₹{stat.medianSalary}L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Rate</span>
                    <Badge variant="secondary">{stat.rate}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Department-wise Placement */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded dark:bg-gray-800-xl shadow dark:bg-gray-800-lg dark:bg-gray-900">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center dark:text-white">
              Department-wise Placement Rates
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {departmentPlacements.map((dept, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-3 dark:bg-primary/20">
                    <dept.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">{dept.name}</h4>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30">
                    {dept.rate}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Offered */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Services & Programs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Comprehensive support system for student career development
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border dark:border-gray-700-0 shadow-md dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{service.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Recruiters */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Our Key Recruiters
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
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
                      <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg dark:bg-gray-800">
                        <Building className="h-5 w-5 text-primary" />
                        <span className="font-medium text-gray-900 dark:text-white">{company}</span>
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
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Alumni Success Stories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Hear from our successful graduates about their journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border dark:border-gray-700-l-primary dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center dark:bg-primary/20">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <blockquote className="text-gray-700 dark:text-gray-300 mb-4 italic dark:text-gray-300">
                      &quot;Practical knowledge at GPP Palanpur gave me confidence to excel in my career. 
                      The TPO cell provided excellent guidance throughout the placement process.&quot;
                    </blockquote>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Patel Jayesh</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Electronics & Communication, Batch 2019</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border dark:border-gray-700-l-primary dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center dark:bg-primary/20">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <blockquote className="text-gray-700 dark:text-gray-300 mb-4 italic dark:text-gray-300">
                      &quot;Strong foundation provided by GPP helped me excel in my degree studies and 
                      land a great job. The career counseling was invaluable.&quot;
                    </blockquote>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Desai Ruchi</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Civil Engineering, Batch 2020</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Higher Education Pathways */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              Higher Education Pathways
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              Multiple options for academic advancement and professional growth
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">BE/B.Tech Direct Entry</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Direct admission to second year of engineering degree programs</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Certification Courses</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Specialized certification programs for skill enhancement</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Management Studies</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">MBA and management program opportunities</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact TPO */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
                Contact TPO Cell
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
                Get in touch for placement opportunities, career guidance, or collaboration
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12">
              <Card className="border-l-4 border dark:border-gray-700-l-primary shadow-lg dark:border-gray-700">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Email</h4>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">tpo@gppalanpur.ac.in</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">For placement inquiries and collaborations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Phone</h4>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">02742-262115</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Office hours: Monday to Friday, 9:00 AM - 5:00 PM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Address</h4>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Training & Placement Cell</p>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Government Polytechnic Palanpur</p>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Palanpur-385001, Gujarat</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">Quick Links</h3>
                  <div className="space-y-4">
                    <Link href="/admissions" className="flex items-center space-x-3 p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:bg-gray-800 dark:border-gray-700">
                      <GraduationCap className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Admissions</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Join our engineering programs</div>
                      </div>
                    </Link>
                    
                    <Link href="/departments" className="flex items-center space-x-3 p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:bg-gray-800 dark:border-gray-700">
                      <Building className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Departments</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Explore our programs</div>
                      </div>
                    </Link>
                    
                    <Link href="/ssip" className="flex items-center space-x-3 p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:bg-gray-800 dark:border-gray-700">
                      <Briefcase className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">SSIP Cell</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Innovation & Entrepreneurship</div>
                      </div>
                    </Link>
                    
                    <Link href="/contact" className="flex items-center space-x-3 p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800 transition-colors dark:bg-gray-800 dark:border-gray-700">
                      <Phone className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Contact Us</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Get in touch</div>
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