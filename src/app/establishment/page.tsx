"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
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
  Target
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function EstablishmentPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Administrative Office</Badge>
              <Badge variant="outline" className="text-sm">Est. 1984</Badge>
              <Badge variant="outline" className="text-sm">Government Institution</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              Establishment Office
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              The administrative backbone of Government Polytechnic Palanpur, managing operations, 
              policies, and institutional development since 1984.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">40+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Years of Service</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">Staff Members</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Establishment */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
                Administrative Excellence
              </h2>
              <div className="prose prose-lg text-gray-600 dark:text-gray-300 space-y-4 dark:text-gray-400">
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
              <div className="bg-white dark:bg-gray-900 p-8 rounded dark:bg-gray-800-2xl shadow dark:bg-gray-800-xl dark:bg-gray-900">
                <Image
                  src="https://dummyimage.com/600x400/0066cc/ffffff&text=GPP+Establishment"
                  alt="GPP Establishment History"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Administrative Block</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Central hub for institutional management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Functions */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Key Functions & Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Comprehensive administrative services supporting institutional excellence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 dark:bg-blue-900/30">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Human Resources</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Staff recruitment, management, and professional development programs
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 dark:bg-green-900/30">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Policy Implementation</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Ensuring compliance with government policies and institutional guidelines
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 dark:bg-purple-900/30">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Infrastructure Management</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Campus maintenance, development, and resource allocation
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 dark:bg-orange-900/30">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Quality Assurance</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Maintaining academic and administrative standards across all operations
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 dark:bg-red-900/30">
                <BookOpen className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Record Management</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Maintaining comprehensive academic and administrative records
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mx-auto mb-4">
                <Target className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Strategic Planning</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Long-term institutional development and strategic initiatives
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* External Website */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-primary/5 border border dark:border-gray-700-primary/20 dark:border-gray-700">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white mb-2 dark:text-white">
                  Official Establishment Website
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300 dark:text-gray-400">
                  Access detailed administrative information, policies, staff directories, 
                  and official documentation through our dedicated establishment portal.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    <span>Official policies and procedures</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>Staff directory and contact information</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Administrative calendar and events</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300 dark:text-gray-400">
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
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Contact Establishment Office
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Get in touch for administrative queries and support
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Office Location</h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
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
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">02742-262115</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Email</h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">principal@gppalanpur.ac.in</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 dark:text-white">Office Hours</h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
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
      <section className="py-16 bg-primary/5 dark:bg-primary/10 dark:bg-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
            Administrative Services
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto dark:text-gray-400">
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