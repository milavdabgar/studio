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
  Award, 
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  Shield
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 md:py-24 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary" className="text-sm">Est. 1984</Badge>
                <Badge variant="outline" className="text-sm">AICTE Approved</Badge>
                <Badge variant="outline" className="text-sm">GTU Affiliated</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
                Premier Government Polytechnic in 
                <span className="text-primary"> Banaskantha District</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed dark:text-gray-400">
                Building technical excellence for over 40 years with modern infrastructure, 
                experienced faculty, and industry-focused education on our 18.8-acre green campus.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/admissions">Apply Now</Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link href="/departments">Explore Programs</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700 dark:bg-gray-900 dark:border-gray-700">
                <Image
                  src="/newsletters/2024-25/IMG_20241014_072640_109.jpg"
                  alt="Government Polytechnic Palanpur Campus"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">6</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Departments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">66</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Faculty</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">3</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">NBA Accredited</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* College Introduction Video */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Discover GP Palanpur
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Take a virtual tour of our campus and learn about our commitment to excellence in technical education
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
                Experience our state-of-the-art facilities, dedicated faculty, and vibrant campus life
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">40+</div>
              <div className="text-gray-600 dark:text-gray-400">Years of Excellence</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">171</div>
              <div className="text-gray-600 dark:text-gray-400">Job Offers (2024)</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">25+</div>
              <div className="text-gray-600 dark:text-gray-400">Modern Labs</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">18K+</div>
              <div className="text-gray-600 dark:text-gray-400">Library Books</div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Programs */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Academic Programs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Choose from 6 engineering departments with modern curriculum and industry exposure
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Civil Engineering</CardTitle>
                  <Badge variant="secondary">NBA</Badge>
                </div>
                <CardDescription>Est. 1984 • 118 Seats</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Structural design, construction techniques, and infrastructure development
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  13 Faculty Members
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Electrical Engineering</CardTitle>
                  <Badge variant="secondary">NBA</Badge>
                </div>
                <CardDescription>Est. 1984 • 78 Seats</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Power systems, electrical motors, and renewable energy technologies
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  10 Faculty Members
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Mechanical Engineering</CardTitle>
                  <Badge variant="secondary">NBA</Badge>
                </div>
                <CardDescription>Est. 1988 • 78 Seats</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Manufacturing processes, thermal engineering, and industrial production
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  23 Faculty Members
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Electronics & Communication</CardTitle>
                <CardDescription>Est. 1994 • 38 Seats</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  IoT, embedded systems, VLSI design, and communication systems
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  8 Faculty Members
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">Information Technology</CardTitle>
                <CardDescription>Est. 2023 • 38 Seats</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Software development, cybersecurity, and database administration
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Newest Department
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">ICT</CardTitle>
                <CardDescription>Est. 2022 • 78 Seats</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Computer networks, data communication, and cybersecurity
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Growing Program
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button asChild>
              <Link href="/departments">View All Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Why Choose GP Palanpur?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">AICTE Approved</h3>
                <p className="text-gray-600 dark:text-gray-400">Government-recognized institution with quality assurance</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                  <Star className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">NBA Accredited Programs</h3>
                <p className="text-gray-600 dark:text-gray-400">Three programs with National Board of Accreditation</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Strong Placements</h3>
                <p className="text-gray-600 dark:text-gray-400">171 job offers in 2024 with industry partnerships</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Modern Infrastructure</h3>
                <p className="text-gray-600 dark:text-gray-400">18.8-acre campus with state-of-the-art facilities</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Green Energy</h3>
                <p className="text-gray-600 dark:text-gray-400">Solar power plant generating 86,000 units annually</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Experienced Faculty</h3>
                <p className="text-gray-600 dark:text-gray-400">66 GPSC selected faculty including 6 PhDs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">Visit Our Campus</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium dark:text-white">Address</p>
                    <p className="text-gray-600 dark:text-gray-400">Outside Malan Gate, Near Dhaniyana Crossroads</p>
                    <p className="text-gray-600 dark:text-gray-400">Palanpur-385001, Banaskantha, Gujarat</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium dark:text-white">Phone</p>
                    <p className="text-gray-600 dark:text-gray-400">02742-262115</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium dark:text-white">Email</p>
                    <p className="text-gray-600 dark:text-gray-400">info@gppalanpur.ac.in</p>
                  </div>
                </div>
              </div>
              <Button asChild>
                <Link href="/contact">Get Directions</Link>
              </Button>
            </div>
            <div>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg border dark:border-gray-600 dark:bg-gray-900 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 dark:text-white">Quick Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/admissions" className="p-3 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:bg-gray-800 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">Admissions</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Apply for 2025-26</div>
                  </Link>
                  <Link href="/facilities" className="p-3 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:bg-gray-800 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">Facilities</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Campus Tour</div>
                  </Link>
                  <Link href="/login" className="p-3 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:bg-gray-800 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">Portal</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Access Dashboard</div>
                  </Link>
                  <Link href="/departments" className="p-3 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:bg-gray-800 dark:border-gray-700">
                    <div className="font-medium text-gray-900 dark:text-white">Departments</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Programs Offered</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
