import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft
} from "lucide-react";
import departments from "../../../data/content/departments.json";

export default function DepartmentsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-primary">
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold text-gray-900">GP Palanpur</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Engineering Departments
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose from 6 specialized engineering programs designed to meet industry demands 
              with modern curriculum, experienced faculty, and state-of-the-art laboratories.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">428</div>
                <div className="text-sm text-gray-600">Total Seats</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-gray-600">NBA Accredited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">54+</div>
                <div className="text-sm text-gray-600">Faculty</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {departments.map((dept) => (
              <Card key={dept.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl text-gray-900">{dept.name}</CardTitle>
                        {dept.nba_status && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            NBA Accredited
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">
                        <div className="flex items-center gap-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Est. {dept.established}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {dept.intake_capacity} Seats
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="relative h-48 mt-4 rounded-lg overflow-hidden">
                    <Image
                      src={`https://picsum.photos/seed/${dept.id}-dept/400/200`}
                      alt={`${dept.name} Department`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 leading-relaxed">
                    {dept.overview}
                  </p>

                  {/* Faculty Info */}
                  {dept.faculty_count && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-medium">Faculty: {dept.faculty_count}</span>
                      </div>
                      {dept.head_of_department && (
                        <div className="text-sm text-gray-600">
                          HOD: {dept.head_of_department}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Specializations */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Key Specializations
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {dept.specializations.slice(0, 4).map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {dept.specializations.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{dept.specializations.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Career Opportunities */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Career Opportunities
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {dept.career_opportunities.slice(0, 3).map((career, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                          {career}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Laboratories */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Laboratories ({dept.laboratories.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {dept.laboratories.slice(0, 3).map((lab, idx) => (
                        <div key={idx} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                          {lab}
                        </div>
                      ))}
                      {dept.laboratories.length > 3 && (
                        <div className="text-sm text-gray-500 px-3 py-2">
                          +{dept.laboratories.length - 3} more labs
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button asChild className="w-full">
                      <Link href={`/departments/${dept.slug}`}>
                        Learn More About {dept.name}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Your Engineering Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join one of our acclaimed engineering programs and build your future with industry-relevant skills and knowledge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/admissions">Apply for Admission</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/facilities">Explore Campus Facilities</Link>
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
              <Link href="/about" className="text-gray-400 hover:text-white">About</Link>
              <Link href="/admissions" className="text-gray-400 hover:text-white">Admissions</Link>
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