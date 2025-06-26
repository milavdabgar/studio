import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
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

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Government Polytechnic Palanpur</h1>
                  <p className="text-xs text-gray-600">Excellence in Technical Education</p>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/about" className="text-gray-700 hover:text-primary">About</Link>
              <Link href="/departments" className="text-gray-700 hover:text-primary">Departments</Link>
              <Link href="/admissions" className="text-gray-700 hover:text-primary">Admissions</Link>
              <Link href="/facilities" className="text-gray-700 hover:text-primary">Facilities</Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary">Contact</Link>
              <Button asChild>
                <Link href="/login">Student Portal</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="secondary" className="text-sm">Est. 1984</Badge>
                <Badge variant="outline" className="text-sm">AICTE Approved</Badge>
                <Badge variant="outline" className="text-sm">GTU Affiliated</Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Premier Government Polytechnic in 
                <span className="text-primary"> Banaskantha District</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
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
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <Image
                  src="https://picsum.photos/seed/gpp-campus/600/400"
                  alt="Government Polytechnic Palanpur Campus"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">6</div>
                    <div className="text-sm text-gray-600">Departments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">66</div>
                    <div className="text-sm text-gray-600">Faculty</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">3</div>
                    <div className="text-sm text-gray-600">NBA Accredited</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900">40+</div>
              <div className="text-gray-600">Years of Excellence</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900">171</div>
              <div className="text-gray-600">Job Offers (2024)</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900">25+</div>
              <div className="text-gray-600">Modern Labs</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gray-900">18K+</div>
              <div className="text-gray-600">Library Books</div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Programs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Academic Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                <p className="text-gray-600 mb-4">
                  Structural design, construction techniques, and infrastructure development
                </p>
                <div className="flex items-center text-sm text-gray-500">
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
                <p className="text-gray-600 mb-4">
                  Power systems, electrical motors, and renewable energy technologies
                </p>
                <div className="flex items-center text-sm text-gray-500">
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
                <p className="text-gray-600 mb-4">
                  Manufacturing processes, thermal engineering, and industrial production
                </p>
                <div className="flex items-center text-sm text-gray-500">
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
                <p className="text-gray-600 mb-4">
                  IoT, embedded systems, VLSI design, and communication systems
                </p>
                <div className="flex items-center text-sm text-gray-500">
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
                <p className="text-gray-600 mb-4">
                  Software development, cybersecurity, and database administration
                </p>
                <div className="text-sm text-gray-500">
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
                <p className="text-gray-600 mb-4">
                  Computer networks, data communication, and cybersecurity
                </p>
                <div className="text-sm text-gray-500">
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GP Palanpur?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AICTE Approved</h3>
                <p className="text-gray-600">Government-recognized institution with quality assurance</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Star className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">NBA Accredited Programs</h3>
                <p className="text-gray-600">Three programs with National Board of Accreditation</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Strong Placements</h3>
                <p className="text-gray-600">171 job offers in 2024 with industry partnerships</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Modern Infrastructure</h3>
                <p className="text-gray-600">18.8-acre campus with state-of-the-art facilities</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Green Energy</h3>
                <p className="text-gray-600">Solar power plant generating 86,000 units annually</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Experienced Faculty</h3>
                <p className="text-gray-600">66 GPSC selected faculty including 6 PhDs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Visit Our Campus</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-gray-600">Outside Malan Gate, Near Dhaniyana Crossroads</p>
                    <p className="text-gray-600">Palanpur-385001, Banaskantha, Gujarat</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-600">02742-245219 / 262115</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">gppalanpur@gmail.com</p>
                  </div>
                </div>
              </div>
              <Button asChild>
                <Link href="/contact">Get Directions</Link>
              </Button>
            </div>
            <div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/admissions" className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-900">Admissions</div>
                    <div className="text-sm text-gray-600">Apply for 2025-26</div>
                  </Link>
                  <Link href="/facilities" className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-900">Facilities</div>
                    <div className="text-sm text-gray-600">Campus Tour</div>
                  </Link>
                  <Link href="/login" className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-900">Student Portal</div>
                    <div className="text-sm text-gray-600">Access Dashboard</div>
                  </Link>
                  <Link href="/departments" className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-900">Departments</div>
                    <div className="text-sm text-gray-600">Programs Offered</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-bold">Government Polytechnic Palanpur</h3>
                  <p className="text-sm text-gray-400">Excellence in Technical Education</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Premier government diploma engineering institution in Banaskantha district, 
                operating since 1984 with a proven track record.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/departments" className="text-gray-400 hover:text-white">Departments</Link></li>
                <li><Link href="/admissions" className="text-gray-400 hover:text-white">Admissions</Link></li>
                <li><Link href="/facilities" className="text-gray-400 hover:text-white">Facilities</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <p className="text-gray-400 text-sm">
                Stay updated with the latest news and announcements from GP Palanpur.
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Student Portal</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Government Polytechnic Palanpur. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
