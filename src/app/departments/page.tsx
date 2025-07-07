"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  Users, 
  Building, 
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar
} from "lucide-react";
import departments from "../../../data/content/departments.json";
import { Footer } from "@/components/footer";

export default function DepartmentsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              Engineering Departments
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              Choose from 6 specialized engineering programs designed to meet industry demands 
              with modern curriculum, experienced faculty, and state-of-the-art laboratories.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">428</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Seats</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">NBA Accredited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">54+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Faculty</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {departments.map((dept) => (
              <Card key={dept.id} className="hover:shadow-xl transition-all duration-300 border dark:border-gray-700-0 shadow-lg dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl text-gray-900 dark:text-white">{dept.name}</CardTitle>
                        {dept.nba_status && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 dark:bg-green-900/30">
                            NBA Accredited
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">
                        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
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
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed dark:text-gray-300">
                    {dept.overview}
                  </p>

                  {/* Faculty Info */}
                  {dept.faculty_count && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg dark:bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-medium text-gray-900 dark:text-white">Faculty: {dept.faculty_count}</span>
                      </div>
                      {dept.head_of_department && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          HOD: {dept.head_of_department}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Specializations */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 dark:text-white">
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
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 dark:text-white">
                      <Briefcase className="h-4 w-4" />
                      Career Opportunities
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
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
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 dark:text-white">
                      <Building className="h-4 w-4" />
                      Laboratories ({dept.laboratories.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {dept.laboratories.slice(0, 3).map((lab, idx) => (
                        <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded dark:bg-gray-800 dark:text-gray-400">
                          {lab}
                        </div>
                      ))}
                      {dept.laboratories.length > 3 && (
                        <div className="text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400 px-3 py-2 dark:text-gray-400">
                          +{dept.laboratories.length - 3} more labs
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border dark:border-gray-700-t dark:border-gray-700">
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
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
            Ready to Start Your Engineering Journey?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto dark:text-gray-400">
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

      <Footer />
    </div>
  );
}