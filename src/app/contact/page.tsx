"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import { 
  GraduationCap, 
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Globe,
  Building,
  Users
} from "lucide-react";
import collegeInfo from "../../../data/content/college-info.json";
import { Footer } from "@/components/footer";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              Get in touch with Government Polytechnic Palanpur for admissions, inquiries, or campus visits. 
              We&apos;re here to help you begin your engineering journey.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
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
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 dark:text-white">
                Get in Touch
              </h2>
              <div className="space-y-6">
                <Card className="border-l-4 border dark:border-gray-700-l-primary dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Campus Address</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed dark:text-gray-400">
                          {collegeInfo.address}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 font-medium mt-1 dark:text-gray-400">
                          {collegeInfo.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border dark:border-gray-700-l-primary dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Phone Numbers</h3>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                          {collegeInfo.contact.phone}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 dark:text-gray-400">
                          Office hours: Monday to Friday, 9:00 AM - 5:00 PM
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border dark:border-gray-700-l-primary dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Email Address</h3>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                          {collegeInfo.contact.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 dark:text-gray-400">
                          We typically respond within 24-48 hours
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border dark:border-gray-700-l-primary dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg dark:bg-primary/20">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Websites</h3>
                        <div className="space-y-1">
                          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                            <strong>Main Website:</strong> {collegeInfo.contact.website}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
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
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
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
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center dark:text-gray-400">
                    By submitting this form, you agree to our privacy policy and consent to be contacted by GP Palanpur.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Quick Contact Options
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Choose the best way to reach us based on your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Admissions Office</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 dark:text-gray-400">
                For admission inquiries, application status, and enrollment procedures
              </p>
              <Button variant="outline" asChild>
                <Link href="/admissions">Learn More</Link>
              </Button>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Administration</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 dark:text-gray-400">
                For general inquiries, official documents, and administrative matters
              </p>
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Office
              </Button>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Academic Departments</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 dark:text-gray-400">
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
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 dark:text-white">
              Leadership
            </h2>
            <Card className="p-8 shadow-lg">
              <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center dark:bg-primary/20">
                    <GraduationCap className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 dark:text-white">
                    {collegeInfo.administration.principal}
                  </h3>
                  <p className="text-lg text-primary font-semibold mb-4">
                    Principal
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed dark:text-gray-400">
                    Leading Government Polytechnic Palanpur with {collegeInfo.achievements.established_years} years of 
                    institutional excellence, overseeing {collegeInfo.administration.total_faculty} faculty members and 
                    {collegeInfo.infrastructure.total_departments} engineering departments committed to providing 
                    quality technical education.
                  </p>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-primary">{collegeInfo.administration.total_faculty}</div>
                      <div className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Total Faculty</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">{collegeInfo.administration.faculty_with_phd}</div>
                      <div className="text-gray-600 dark:text-gray-300 dark:text-gray-400">PhD Faculty</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary">{collegeInfo.administration.faculty_with_masters}</div>
                      <div className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Masters Faculty</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Directions */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 dark:text-white">
              Directions to Campus
            </h2>
            <Card className="p-8 shadow-lg">
              <div className="text-left space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 dark:text-white">By Road</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                    GP Palanpur is easily accessible by road from major cities in Gujarat. 
                    The campus is located outside Malan Gate, near Dhaniyana Crossroads in Palanpur.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 dark:text-white">Public Transportation</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                    Regular bus services connect Palanpur to major cities. The campus is a short 
                    auto-rickshaw or taxi ride from the main bus station.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 dark:text-white">Railway</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
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

      <Footer />
    </div>
  );
}