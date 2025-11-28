"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  ExternalLink,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Award,
  Target,
  Heart,
  Megaphone,
  MessageCircle,
  Newspaper,
  Activity
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function StudentSectionPage() {
  const services = [
    {
      icon: FileText,
      title: "Student Records",
      description: "Maintenance of comprehensive student academic and personal records"
    },
    {
      icon: Award,
      title: "Scholarships",
      description: "Information and assistance for various scholarship programs"
    },
    {
      icon: Heart,
      title: "Student Welfare",
      description: "Support services for student health, counseling, and well-being"
    },
    {
      icon: Calendar,
      title: "Events & Activities",
      description: "Organization of cultural, sports, and extracurricular activities"
    },
    {
      icon: Megaphone,
      title: "Announcements",
      description: "Important notices, circulars, and institutional communications"
    },
    {
      icon: Users,
      title: "Student Committees",
      description: "Support for student councils and representative committees"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Student Services</Badge>
              <Badge variant="outline" className="text-sm">Support & Welfare</Badge>
              <Badge variant="outline" className="text-sm">Official Updates</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Student Section
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Your one-stop destination for all student-related services, information, and support at 
              Government Polytechnic Palanpur. Stay connected and informed about campus life.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Annual Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Student Clubs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Student Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Dedicated to Student Success
              </h2>
              <div className="prose prose-lg text-gray-600 dark:text-gray-300 space-y-4 dark:text-gray-400">
                <p>
                  The Student Section at Government Polytechnic Palanpur is committed to providing 
                  comprehensive support services that enhance the overall student experience. From 
                  academic assistance to personal welfare, we ensure every student feels supported 
                  throughout their educational journey.
                </p>
                <p>
                  Our team manages student records, facilitates scholarship programs, organizes 
                  cultural and sports events, and maintains regular communication with students 
                  through various channels including our dedicated blog platform.
                </p>
                <p>
                  Stay updated with the latest announcements, events, achievements, and important 
                  information through our official student section blog, which serves as the 
                  primary communication channel for all student-related matters.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 p-6 rounded rounded-2xl shadow-xl">
                <Image
                  src="https://dummyimage.com/600x400/0066cc/ffffff&text=Student+Section+Office"
                  alt="Student Section Office"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Student Services Center</h3>
                  <p className="text-gray-600 dark:text-gray-300">Central hub for all student support services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Provided */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Student Support Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Comprehensive services designed to support your academic and personal growth
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{service.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Official Blog */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-primary/5 border border-primary/20 dark:border-gray-700">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                  <Newspaper className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white mb-2">
                  Official Student Section Blog
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                  Stay connected with the latest news, announcements, events, and important updates 
                  from the student section through our dedicated blog platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                      <Megaphone className="h-4 w-4" />
                      <span>Latest announcements and notices</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Calendar className="h-4 w-4" />
                      <span>Upcoming events and activities</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Award className="h-4 w-4" />
                      <span>Student achievements and recognitions</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
                      <FileText className="h-4 w-4" />
                      <span>Important forms and documents</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Activity className="h-4 w-4" />
                      <span>Campus life updates and stories</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
                      <MessageCircle className="h-4 w-4" />
                      <span>Student feedback and testimonials</span>
                    </div>
                  </div>
                </div>
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="https://gppstudentsection.blogspot.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Student Section Blog
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              What We Offer
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Comprehensive support for your academic journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 dark:bg-blue-900/30">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Academic Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Guidance for academic procedures, course registrations, and academic planning
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 dark:bg-green-900/30">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welfare Services</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Health support, counseling services, and personal development programs
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 dark:bg-purple-900/30">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Community Building</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Student clubs, cultural activities, and community engagement programs
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 dark:bg-orange-900/30">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Career Guidance</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Placement support, career counseling, and professional development
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Student Section
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              We&apos;re here to help with all your academic and personal needs
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Office Location</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Student Section Office<br />
                      Administrative Block<br />
                      Government Polytechnic Palanpur<br />
                      Palanpur - 385001, Gujarat
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-300">02742-262115</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                    <p className="text-gray-600 dark:text-gray-300">student-section@gppalanpur.ac.in</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Calendar className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Office Hours</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Monday to Friday: 9:00 AM - 5:00 PM<br />
                      Saturday: 9:00 AM - 1:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Stay Connected
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Follow our blog for the latest updates and engage with the vibrant student 
            community at Government Polytechnic Palanpur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="https://gppstudentsection.blogspot.com/" target="_blank" rel="noopener noreferrer">
                <Newspaper className="h-4 w-4 mr-2" />
                Read Our Blog
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/student">Student Portal</Link>
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