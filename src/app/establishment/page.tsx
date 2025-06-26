"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
  ExternalLink,
  Building,
  Users,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Shield,
  BookOpen,
  Award,
  Target,
  Briefcase
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function EstablishmentPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Administrative Office</Badge>
              <Badge variant="outline" className="text-sm">Est. 1984</Badge>
              <Badge variant="outline" className="text-sm">Government Institution</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Establishment Office
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              The administrative backbone of Government Polytechnic Palanpur, managing operations, 
              policies, and institutional development since 1984.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">40+</div>
                <div className="text-sm text-gray-600">Years of Service</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2000+</div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-gray-600">Staff Members</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Establishment */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Administrative Excellence
              </h2>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  The Establishment Office at Government Polytechnic Palanpur serves as the 
                  central administrative hub, ensuring smooth operations across all departments 
                  and maintaining the highest standards of institutional governance.
                </p>
                <p>
                  Our office manages human resources, policy implementation, institutional 
                  development, and maintains comprehensive records of all academic and 
                  administrative activities. We ensure compliance with government regulations 
                  and facilitate seamless coordination between various departments.
                </p>
                <p>
                  For detailed information about administrative procedures, staff details, 
                  policies, and official documentation, visit our dedicated establishment website.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <Image
                  src="https://picsum.photos/seed/establishment/600/400"
                  alt="Establishment Office"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrative Block</h3>
                  <p className="text-gray-600">Central hub for institutional management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Functions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Key Functions & Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive administrative services supporting institutional excellence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Human Resources</h3>
              <p className="text-gray-600 text-sm">
                Staff recruitment, management, and professional development programs
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Policy Implementation</h3>
              <p className="text-gray-600 text-sm">
                Ensuring compliance with government policies and institutional guidelines
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Infrastructure Management</h3>
              <p className="text-gray-600 text-sm">
                Campus maintenance, development, and resource allocation
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Assurance</h3>
              <p className="text-gray-600 text-sm">
                Maintaining academic and administrative standards across all operations
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Record Management</h3>
              <p className="text-gray-600 text-sm">
                Maintaining comprehensive academic and administrative records
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mx-auto mb-4">
                <Target className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategic Planning</h3>
              <p className="text-gray-600 text-sm">
                Long-term institutional development and strategic initiatives
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* External Website */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-primary/5 border border-primary/20">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-gray-900 mb-2">
                  Official Establishment Website
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Access detailed administrative information, policies, staff directories, 
                  and official documentation through our dedicated establishment portal.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>Official policies and procedures</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Staff directory and contact information</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Administrative calendar and events</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Award className="h-4 w-4" />
                    <span>Institutional achievements and recognitions</span>
                  </div>
                </div>
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="https://gppest626.wixsite.com/gppest" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Establishment Website
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Contact Establishment Office
            </h2>
            <p className="text-xl text-gray-600">
              Get in touch for administrative queries and support
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Office Location</h3>
                    <p className="text-gray-600">
                      Administrative Block<br />
                      Government Polytechnic Palanpur<br />
                      Outside Malan Gate, Near Dhaniyana Crossroads<br />
                      Palanpur - 385001, Gujarat
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <p className="text-gray-600">02742-245219</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600">principal-gpp@guj.edu.in</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Office Hours</h3>
                    <p className="text-gray-600">
                      Monday to Friday: 10:00 AM - 5:00 PM<br />
                      Saturday: 10:00 AM - 1:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Administrative Services
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Access various administrative services and information portals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="https://gppest626.wixsite.com/gppest" target="_blank" rel="noopener noreferrer">
                <Building className="h-4 w-4 mr-2" />
                Establishment Portal
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">About GP Palanpur</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}