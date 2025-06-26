"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
  Users, 
  Building, 
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  Award,
  Star,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  User
} from "lucide-react";
import { notFound } from "next/navigation";
import { use } from "react";
import departments from "../../../../data/content/departments.json";
import { Footer } from "@/components/footer";

interface DepartmentPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function DepartmentPage({ params }: DepartmentPageProps) {
  const { slug } = use(params);
  const department = departments.find(dept => dept.slug === slug);

  if (!department) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <Link href="/departments" className="flex items-center space-x-2 text-gray-600 hover:text-primary">
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Departments</span>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="text-sm">Est. {department.established}</Badge>
              <Badge variant="outline" className="text-sm">{department.intake_capacity} Seats</Badge>
              {department.nba_status && (
                <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                  {department.nba_status}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {department.name}
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {department.overview}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{department.established}</div>
                <div className="text-sm text-gray-600">Established</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{department.intake_capacity}</div>
                <div className="text-sm text-gray-600">Seats Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{department.faculty_count}</div>
                <div className="text-sm text-gray-600">Faculty Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{department.laboratories.length}</div>
                <div className="text-sm text-gray-600">Laboratories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Department Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Department Overview
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>{department.overview}</p>
                <p>
                  The {department.name} department at Government Polytechnic Palanpur has been 
                  shaping technical professionals since {department.established}. With {department.faculty_count} 
                  experienced faculty members and modern infrastructure, we provide comprehensive 
                  education in various specializations.
                </p>
              </div>
              
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Head of Department
                </h3>
                <p className="text-gray-700 font-medium">{department.head_of_department}</p>
              </div>

              {department.website && (
                <div className="mt-6 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Department Website
                  </h3>
                  <p className="text-gray-600 mb-4">
                    For detailed information about faculty, research projects, facilities, and latest updates, 
                    visit our dedicated department website.
                  </p>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={department.website} target="_blank" rel="noopener noreferrer">
                      Visit Department Website
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <Image
                  src={`https://picsum.photos/seed/${department.slug}/600/400`}
                  alt={`${department.name} Department`}
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {department.name} Lab
                  </h3>
                  <p className="text-gray-600">State-of-the-art facilities for hands-on learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Department Introduction Video */}
      {(department.slug === 'civil-engineering' || department.slug === 'mechanical-engineering' || department.slug === 'electrical-engineering') && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Discover {department.name}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get an inside look at our {department.name.toLowerCase()} program, facilities, and student experiences
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={
                    department.slug === 'civil-engineering' 
                      ? "https://www.youtube.com/embed/aUQAQY_VzS8"
                      : department.slug === 'mechanical-engineering'
                      ? "https://www.youtube.com/embed/d_41cIqDYDs"
                      : department.slug === 'electrical-engineering'
                      ? "https://www.youtube.com/embed/GRxHueCONus"
                      : ""
                  }
                  title={`${department.name} Department Introduction`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Explore our {department.name.toLowerCase()} labs, meet our faculty, and see students in action
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Specializations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Areas of Specialization
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive curriculum covering key areas of {department.name.toLowerCase()}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {department.specializations.map((specialization, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full flex-shrink-0 mt-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{specialization}</h3>
                      <p className="text-sm text-gray-600">
                        Comprehensive training and practical experience in {specialization.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Career Opportunities */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Career Opportunities
            </h2>
            <p className="text-xl text-gray-600">
              Diverse career paths awaiting {department.name.toLowerCase()} graduates
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Industry Sectors</h3>
              <div className="space-y-4">
                {department.career_opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose This Department?</h3>
              <div className="space-y-4">
                {department.nba_status && (
                  <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <Award className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-green-800">NBA Accredited</span>
                      <p className="text-sm text-green-700 mt-1">
                        Quality assured education meeting national standards
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-blue-800">Experienced Faculty</span>
                    <p className="text-sm text-blue-700 mt-1">
                      {department.faculty_count} qualified faculty members with industry experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Building className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-purple-800">Modern Labs</span>
                    <p className="text-sm text-purple-700 mt-1">
                      {department.laboratories.length} well-equipped laboratories for practical training
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Laboratories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Laboratory Facilities
            </h2>
            <p className="text-xl text-gray-600">
              State-of-the-art laboratories for hands-on learning and research
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {department.laboratories.map((lab, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full flex-shrink-0 mt-1">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{lab}</h3>
                      <p className="text-sm text-gray-600">
                        Modern equipment and facilities for practical training
                      </p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Join {department.name}?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take the first step towards an exciting career in {department.name.toLowerCase()}. 
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