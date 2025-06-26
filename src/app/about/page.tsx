"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
  Award,
  Calendar,
  Users,
  Building,
  Target,
  Star,
  TrendingUp,
  Shield,
  BookOpen,
  Trophy,
  Lightbulb
} from "lucide-react";
import collegeInfo from "../../../data/content/college-info.json";
import pages from "../../../data/content/pages.json";

export default function AboutPage() {
  const aboutContent = pages.find(page => page.slug === 'about-us');
  
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Est. {collegeInfo.basic_info.established}</Badge>
              <Badge variant="outline" className="text-sm">{collegeInfo.basic_info.approval}</Badge>
              <Badge variant="outline" className="text-sm">GTU Affiliated</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About {collegeInfo.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {collegeInfo.motto} - Building technical excellence in Banaskantha district for over {collegeInfo.achievements.established_years} years
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.achievements.established_years}</div>
                <div className="text-sm text-gray-600">Years of Excellence</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.infrastructure.total_departments}</div>
                <div className="text-sm text-gray-600">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.achievements.nba_accredited_programs}</div>
                <div className="text-sm text-gray-600">NBA Accredited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.achievements.job_offers_2024}</div>
                <div className="text-sm text-gray-600">Placements 2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* College Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Legacy of Excellence
              </h2>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  Government Polytechnic Palanpur stands as a premier technical institution in Gujarat, 
                  established in {collegeInfo.basic_info.established} with a commitment to providing world-class 
                  diploma engineering education. Located on an expansive {collegeInfo.basic_info.campus_area} campus, 
                  we have been at the forefront of technical education in the Banaskantha district.
                </p>
                <p>
                  Our institution is {collegeInfo.basic_info.approval} and affiliated with 
                  {collegeInfo.basic_info.affiliation}, ensuring that our academic programs meet the highest 
                  standards of technical education. With {collegeInfo.administration.total_faculty} dedicated 
                  faculty members, including {collegeInfo.administration.faculty_with_phd} PhD holders, 
                  we provide comprehensive education across {collegeInfo.infrastructure.total_departments} engineering disciplines.
                </p>
              </div>
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-semibold text-gray-900">{collegeInfo.basic_info.approval}</div>
                    <div className="text-sm text-gray-600">Quality Assured</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Building className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-semibold text-gray-900">{collegeInfo.basic_info.campus_area}</div>
                    <div className="text-sm text-gray-600">Green Campus</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <Image
                  src="https://picsum.photos/seed/gpp-about/600/400"
                  alt="Government Polytechnic Palanpur - About Us"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Principal's Office</h3>
                  <p className="text-gray-600">Led by {collegeInfo.administration.principal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Vision & Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Guiding principles that drive our commitment to excellence in technical education
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To be a center of excellence in technical education, fostering innovation, 
                research, and industry collaboration while producing skilled engineers who 
                contribute to national development and technological advancement.
              </p>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-6">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide quality technical education through modern curriculum, experienced faculty, 
                state-of-the-art infrastructure, and industry partnerships, preparing students for 
                successful careers and lifelong learning in engineering and technology.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Key Achievements & Recognition
            </h2>
            <p className="text-xl text-gray-600">
              Milestones that showcase our commitment to excellence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {collegeInfo.achievements.nba_accredited_programs}
              </h3>
              <p className="text-gray-600 font-medium">NBA Accredited Programs</p>
              <p className="text-sm text-gray-500 mt-2">
                Civil, Electrical & Mechanical Engineering
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {collegeInfo.achievements.job_offers_2024}
              </h3>
              <p className="text-gray-600 font-medium">Job Offers in 2024</p>
              <p className="text-sm text-gray-500 mt-2">
                With {collegeInfo.achievements.placement_companies}+ recruiting companies
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {collegeInfo.administration.total_faculty}
              </h3>
              <p className="text-gray-600 font-medium">GPSC Selected Faculty</p>
              <p className="text-sm text-gray-500 mt-2">
                Including {collegeInfo.administration.faculty_with_phd} PhD holders
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">4</h3>
              <p className="text-gray-600 font-medium">Published Patents</p>
              <p className="text-sm text-gray-500 mt-2">
                Through SSIP Innovation Cell
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Infrastructure Highlights */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Infrastructure & Facilities
            </h2>
            <p className="text-xl text-gray-600">
              Modern amenities supporting comprehensive technical education
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Academic Excellence</h3>
              <div className="space-y-2 text-gray-600">
                <p><strong>{collegeInfo.infrastructure.total_labs}+</strong> Modern Laboratories</p>
                <p><strong>{collegeInfo.infrastructure.library_books.toLocaleString()}</strong> Library Books</p>
                <p>Smart Classrooms with CCTV</p>
                <p>Digital Learning Resources</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Campus Life</h3>
              <div className="space-y-2 text-gray-600">
                <p><strong>{collegeInfo.infrastructure.hostel_capacity.total}</strong> Hostel Capacity</p>
                <p>Sports Complex & Facilities</p>
                <p>Modern Auditorium</p>
                <p>Campus Canteen</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Green & Digital</h3>
              <div className="space-y-2 text-gray-600">
                <p>Solar Power Plant (86,000 units)</p>
                <p>{collegeInfo.infrastructure.internet}</p>
                <p>Eco-friendly Campus</p>
                <p>Digital Infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* College Highlights */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What Makes Us Special
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {collegeInfo.highlights.map((highlight, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full flex-shrink-0 mt-1">
                      <Star className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-gray-700 leading-relaxed">{highlight}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Join Our Legacy of Excellence
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Become part of GP Palanpur's proud tradition of producing skilled engineers 
            who make meaningful contributions to society and industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/admissions">Apply for Admission</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/departments">Explore Programs</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Visit Campus</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold">Government Polytechnic Palanpur</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
              <Link href="/departments" className="text-gray-400 hover:text-white">Departments</Link>
              <Link href="/facilities" className="text-gray-400 hover:text-white">Facilities</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Government Polytechnic Palanpur. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}