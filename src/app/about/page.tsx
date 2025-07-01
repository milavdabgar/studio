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
  Lightbulb,
  Cog,
  Zap
} from "lucide-react";
import collegeInfo from "../../../data/content/college-info.json";
import pages from "../../../data/content/pages.json";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  const aboutContent = pages.find(page => page.slug === 'about-us');
  
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Est. {collegeInfo.basic_info.established}</Badge>
              <Badge variant="outline" className="text-sm">{collegeInfo.basic_info.approval}</Badge>
              <Badge variant="outline" className="text-sm">GTU Affiliated</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              About {collegeInfo.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              {collegeInfo.motto} - Building technical excellence in Banaskantha district for over {collegeInfo.achievements.established_years} years
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.achievements.established_years}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Years of Excellence</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.infrastructure.total_departments}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.achievements.nba_accredited_programs}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">NBA Accredited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.achievements.job_offers_2024}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Placements 2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* College Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
                Our Legacy of Excellence
              </h2>
              <div className="prose prose-lg text-gray-600 dark:text-gray-300 space-y-4 dark:text-gray-400">
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
                <p>
                  Strategically located outside Malan Gate near Dhaniyana Crossroads, our campus is easily 
                  accessible from all parts of the Banaskantha district and neighboring areas, making quality 
                  technical education available to students from diverse backgrounds.
                </p>
              </div>
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg dark:bg-gray-800">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{collegeInfo.basic_info.approval}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Quality Assured</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg dark:bg-gray-800">
                  <Building className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{collegeInfo.basic_info.campus_area}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Green Campus</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border dark:border dark:border-gray-700-gray-700 dark:bg-gray-900 dark:border-gray-700">
                <Image
                  src="https://picsum.photos/seed/gpp-about/600/400"
                  alt="Government Polytechnic Palanpur - About Us"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Principal's Office</h3>
                  <p className="text-gray-600 dark:text-gray-400">Led by {collegeInfo.administration.principal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Our Vision & Mission
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Guiding principles that drive our commitment to excellence in technical education
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-6 dark:bg-primary/20">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">Our Vision</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed dark:text-gray-400">
                To be a center of excellence in technical education, fostering innovation, 
                research, and industry collaboration while producing skilled engineers who 
                contribute to national development and technological advancement.
              </p>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-6 dark:bg-primary/20">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">Our Mission</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed dark:text-gray-400">
                To provide quality technical education through modern curriculum, experienced faculty, 
                state-of-the-art infrastructure, and industry partnerships, preparing students for 
                successful careers and lifelong learning in engineering and technology.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Key Achievements & Recognition
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Milestones that showcase our commitment to excellence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 dark:bg-green-900/30">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {collegeInfo.achievements.nba_accredited_programs}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium dark:text-gray-400">NBA Accredited Programs</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 dark:text-gray-400">
                Civil, Electrical & Mechanical Engineering
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-4 dark:bg-blue-900/30">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {collegeInfo.achievements.job_offers_2024}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium dark:text-gray-400">Job Offers in 2024</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 dark:text-gray-400">
                With {collegeInfo.achievements.placement_companies}+ recruiting companies
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-4 dark:bg-purple-900/30">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">
                {collegeInfo.administration.total_faculty}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium dark:text-gray-400">GPSC Selected Faculty</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 dark:text-gray-400">
                Including {collegeInfo.administration.faculty_with_phd} PhD holders
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mx-auto mb-4 dark:bg-orange-900/30">
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">4</h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium dark:text-gray-400">Published Patents</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 dark:text-gray-400">
                Through SSIP Innovation Cell
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Infrastructure Highlights */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Infrastructure & Facilities
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Modern amenities supporting comprehensive technical education
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Academic Excellence</h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-300 dark:text-gray-400">
                <p><strong>{collegeInfo.infrastructure.total_labs}+</strong> Modern Laboratories</p>
                <p><strong>{collegeInfo.infrastructure.library_books.toLocaleString()}</strong> Library Books</p>
                <p>Smart Classrooms with CCTV</p>
                <p>Digital Learning Resources</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Campus Life</h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-300 dark:text-gray-400">
                <p><strong>{collegeInfo.infrastructure.hostel_capacity.total}</strong> Hostel Capacity</p>
                <p>Sports Complex & Facilities</p>
                <p>Modern Auditorium</p>
                <p>Campus Canteen</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Green & Digital</h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-300 dark:text-gray-400">
                <p><strong>86,000 units</strong> Solar Power Plant</p>
                <p><strong>14</strong> NaMo WiFi Access Points</p>
                <p>National Digital Library Access</p>
                <p>Solar Water Heaters in Hostels</p>
                <p>Green Campus Initiatives</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Leadership Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Meet the professionals leading GP Palanpur
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Mr. S D Dabhi</h3>
              <p className="text-primary font-medium mb-2">Principal</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Leading the institution with vision and excellence</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Cog className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Mr. D D Prajapati</h3>
              <p className="text-primary font-medium mb-2">HOD - Mechanical Engineering</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Expert in mechanical systems and manufacturing</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Mr. D N Sheth</h3>
              <p className="text-primary font-medium mb-2">HOD - Civil Engineering</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Specialist in structural and construction engineering</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Mr. A D Shah</h3>
              <p className="text-primary font-medium mb-2">HOD - Electrical Engineering</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Expert in electrical systems and power engineering</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Mr. S J Chauhan</h3>
              <p className="text-primary font-medium mb-2">HOD - Electronics & Communication | ICT</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Leading both EC and ICT departments with expertise in communication systems</p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Ms. M M Shah</h3>
              <p className="text-primary font-medium mb-2">HOD - Information Technology</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Expert in IT systems and software development</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
                Our Commitment to Excellence
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
                What we promise to every student who joins GP Palanpur
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Academic Excellence</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed dark:text-gray-300">Through quality teaching and continuous assessment methods</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                    <Cog className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Skill Development</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed dark:text-gray-300">Through practical training and industry exposure programs</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Innovation Culture</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed dark:text-gray-300">Through project-based learning and SSIP initiatives</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Holistic Growth</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed dark:text-gray-300">Through extracurricular activities and value-based education</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Industry Connect</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed dark:text-gray-300">Through expert lectures, industrial visits, and internships</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Continuous Excellence</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed dark:text-gray-300">Maintaining high standards through NBA accreditation and quality initiatives</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* College Introduction Video */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Experience GP Palanpur
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Watch our campus tour and discover what makes Government Polytechnic Palanpur 
              a leading institution in technical education
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/Z6w-asbJO9E?start=336"
                title="Government Polytechnic Palanpur Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="text-center mt-6">
              <p className="text-gray-600 dark:text-gray-400">
                Explore our modern facilities, meet our faculty, and see student life in action
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10 dark:bg-primary/20 dark:bg-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
            Join Our Legacy of Excellence
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto dark:text-gray-400">
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

      <Footer />
    </div>
  );
}