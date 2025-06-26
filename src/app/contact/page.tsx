import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { 
  GraduationCap, 
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
  Send,
  Globe,
  Building,
  Users
} from "lucide-react";
import collegeInfo from "@/../../data/content/college-info.json";

export default function ContactPage() {
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
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Get in touch with Government Polytechnic Palanpur for admissions, inquiries, or campus visits. 
              We're here to help you begin your engineering journey.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Mon-Fri: 9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Quick Response</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Get in Touch
              </h2>
              <div className="space-y-6">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Campus Address</h3>
                        <p className="text-gray-600 leading-relaxed">
                          {collegeInfo.address}
                        </p>
                        <p className="text-gray-600 font-medium mt-1">
                          {collegeInfo.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Phone Numbers</h3>
                        <p className="text-gray-600">
                          {collegeInfo.contact.phone}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Office hours: Monday to Friday, 9:00 AM - 5:00 PM
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Email Address</h3>
                        <p className="text-gray-600">
                          {collegeInfo.contact.email}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          We typically respond within 24-48 hours
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Websites</h3>
                        <div className="space-y-1">
                          <p className="text-gray-600">
                            <strong>Main Website:</strong> {collegeInfo.contact.website}
                          </p>
                          <p className="text-gray-600">
                            <strong>Institutional:</strong> {collegeInfo.contact.institutional_website}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" placeholder="Enter your first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Enter your last name" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" placeholder="Enter your email address" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="Enter your phone number" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" placeholder="What is this regarding?" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Please provide details about your inquiry..." 
                      rows={5}
                    />
                  </div>
                  
                  <Button className="w-full" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, you agree to our privacy policy and consent to be contacted by GP Palanpur.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Quick Contact Options
            </h2>
            <p className="text-xl text-gray-600">
              Choose the best way to reach us based on your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admissions Office</h3>
              <p className="text-gray-600 mb-4">
                For admission inquiries, application status, and enrollment procedures
              </p>
              <Button variant="outline" asChild>
                <Link href="/admissions">Learn More</Link>
              </Button>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Administration</h3>
              <p className="text-gray-600 mb-4">
                For general inquiries, official documents, and administrative matters
              </p>
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Office
              </Button>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Academic Departments</h3>
              <p className="text-gray-600 mb-4">
                For program-specific questions and departmental information
              </p>
              <Button variant="outline" asChild>
                <Link href="/departments">View Departments</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Principal & Leadership */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Leadership
            </h2>
            <Card className="p-8 shadow-lg">
              <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {collegeInfo.administration.principal}
                  </h3>
                  <p className="text-lg text-primary font-semibold mb-4">
                    Principal
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Leading Government Polytechnic Palanpur with {collegeInfo.achievements.established_years} years of 
                    institutional excellence, overseeing {collegeInfo.administration.total_faculty} faculty members and 
                    {collegeInfo.infrastructure.total_departments} engineering departments committed to providing 
                    quality technical education.
                  </p>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-primary">{collegeInfo.administration.total_faculty}</div>
                      <div className="text-gray-600">Total Faculty</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">{collegeInfo.administration.faculty_with_phd}</div>
                      <div className="text-gray-600">PhD Faculty</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">{collegeInfo.administration.faculty_with_masters}</div>
                      <div className="text-gray-600">Masters Faculty</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Directions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Directions to Campus
            </h2>
            <Card className="p-8 shadow-lg">
              <div className="text-left space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">By Road</h3>
                  <p className="text-gray-600">
                    GP Palanpur is easily accessible by road from major cities in Gujarat. 
                    The campus is located outside Malan Gate, near Dhaniyana Crossroads in Palanpur.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Public Transportation</h3>
                  <p className="text-gray-600">
                    Regular bus services connect Palanpur to major cities. The campus is a short 
                    auto-rickshaw or taxi ride from the main bus station.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Railway</h3>
                  <p className="text-gray-600">
                    Palanpur Junction is the nearest railway station, well-connected to major cities 
                    across Gujarat and India. The campus is approximately 10 minutes from the station.
                  </p>
                </div>
                <div className="text-center pt-4">
                  <Button size="lg">
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions on Map
                  </Button>
                </div>
              </div>
            </Card>
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
              <Link href="/departments" className="text-gray-400 hover:text-white">Departments</Link>
              <Link href="/facilities" className="text-gray-400 hover:text-white">Facilities</Link>
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