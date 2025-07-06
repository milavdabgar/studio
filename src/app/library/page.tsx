"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, Users, Monitor, Globe, Clock, MapPin, Phone, ArrowRight, ExternalLink, Search, Download, FileText, Newspaper, Wifi, Target, Lightbulb} from "lucide-react";
import { Footer } from "@/components/footer";
import collegeInfo from "../../../data/content/college-info.json";

export default function LibraryPage() {
  const eResources = [
    {
      name: "E-Journals (Open Access)",
      description: "Access to academic journals and research papers",
      icon: FileText,
      category: "Academic"
    },
    {
      name: "E-Books",
      description: "Digital collection of technical and reference books",
      icon: BookOpen,
      category: "Books"
    },
    {
      name: "E-Magazines",
      description: "Technical and general interest magazines",
      icon: FileText,
      category: "Periodicals"
    },
    {
      name: "E-Newspapers",
      description: "Daily newspapers and current affairs",
      icon: Newspaper,
      category: "News"
    },
    {
      name: "Online Journals",
      description: "Subscription-based research journals",
      icon: Globe,
      category: "Research"
    },
    {
      name: "Useful Links",
      description: "Curated educational and technical resources",
      icon: ExternalLink,
      category: "Resources"
    }
  ];

  const services = [
    {
      title: "Book Lending Service",
      description: "Borrow books for academic and personal reading with flexible lending periods",
      icon: BookOpen
    },
    {
      title: "Digital Resources Access",
      description: "Access to online databases, e-books, and digital journals",
      icon: Monitor
    },
    {
      title: "Reading Halls",
      description: "Quiet study spaces for individual and group study sessions",
      icon: Users
    },
    {
      title: "Reference Service",
      description: "Research assistance and information guidance from library staff",
      icon: Search
    },
    {
      title: "Internet & Computer Access",
      description: "High-speed internet and computer terminals for research",
      icon: Wifi
    },
    {
      title: "Document Services",
      description: "Printing, scanning, and photocopying facilities",
      icon: Download
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Central Library</Badge>
              <Badge variant="outline" className="text-sm">Digital Resources</Badge>
              <Badge variant="outline" className="text-sm">Research Support</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
              GP Palanpur Library
            </h1>
            <p className="text-xl text-gray-600 mb-8 dark:text-gray-400">
              Your gateway to knowledge with over {collegeInfo.infrastructure.library_books.toLocaleString()} books, 
              digital resources, and comprehensive research facilities supporting academic excellence.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.infrastructure.library_books.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Books Collection</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Digital Resources</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">12</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hours Daily</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">200+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Seating Capacity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Library Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 dark:text-white">
                Supporting Academic Excellence
              </h2>
              <div className="prose prose-lg text-gray-600 space-y-4 dark:text-gray-400">
                <p>
                  The Central Library at Government Polytechnic Palanpur serves as the heart of 
                  academic and research activities. With a vast collection of over {collegeInfo.infrastructure.library_books.toLocaleString()} books, 
                  digital resources, and modern facilities, our library supports the educational 
                  mission of creating competent diploma engineers.
                </p>
                <p>
                  Our library is designed to foster an excellent teaching and learning environment, 
                  providing students and faculty with access to both traditional and digital 
                  resources essential for technical education and research.
                </p>
              </div>
              
              <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Visit Library Website
                </h3>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  Access our comprehensive online resources and stay updated with library services, 
                  e-resources, and latest additions to our collection.
                </p>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="https://gpplibrary.blogspot.com/" target="_blank" rel="noopener noreferrer">
                    GP Palanpur Library Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl shadow-xl dark:bg-gray-900">
                <Image
                  src="https://picsum.photos/seed/gpp-library/600/400"
                  alt="GP Palanpur Central Library"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                    Central Library Reading Hall
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Peaceful environment for focused study and research</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 dark:text-white">
              Library Vision & Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-400">
              Guiding principles that drive our commitment to information services and academic support
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-6 dark:bg-primary/20">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed dark:text-gray-400">
                "To produce competent diploma engineers as per need of Industries, 
                Entrepreneurs with ethical values."
              </p>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-6 dark:bg-primary/20">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Our Mission</h3>
              <div className="text-gray-600 leading-relaxed space-y-2 dark:text-gray-400">
                <p>• Providing industry-oriented technical education resources</p>
                <p>• Creating an excellent teaching and learning environment</p>
                <p>• Supporting entrepreneurship activities</p>
                <p>• Promoting continual growth and human values</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* E-Resources */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
              Digital Resources & E-Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Access to comprehensive digital collections and online resources
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eResources.map((resource, index) => {
              const IconComponent = resource.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{resource.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {resource.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {resource.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Library Services */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
              Library Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive services to support your academic and research needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full flex-shrink-0 mt-1 dark:bg-primary/20">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">{service.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Library Information */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 dark:text-white">Library Information</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                    <Clock className="h-5 w-5 text-primary" />
                    Opening Hours
                  </h3>
                  <div className="space-y-2 text-gray-600 dark:text-gray-400">
                    <p><strong>Monday to Friday:</strong> 9:00 AM - 9:00 PM</p>
                    <p><strong>Saturday:</strong> 9:00 AM - 5:00 PM</p>
                    <p><strong>Sunday:</strong> 10:00 AM - 4:00 PM</p>
                    <p className="text-sm text-primary mt-2">*Extended hours during exam periods</p>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </h3>
                  <div className="space-y-2 text-gray-600 dark:text-gray-400">
                    <p>Central Library Building</p>
                    <p>Government Polytechnic Palanpur</p>
                    <p>Outside Malan Gate, Near Dhaniyana Crossroads</p>
                    <p>Palanpur-385001, Banaskantha, Gujarat</p>
                  </div>
                </Card>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 dark:text-white">Quick Access</h2>
              <div className="space-y-4">
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <Link href="https://gpplibrary.blogspot.com/" target="_blank" rel="noopener noreferrer" 
                        className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg dark:bg-primary/20">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Library Portal</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Access online catalog and e-resources</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </Link>
                </Card>
                
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <Link href="/contact" className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg dark:bg-primary/20">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Contact Library</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get help and information</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </Card>
                
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <Link href="/facilities" className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg dark:bg-primary/20">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Campus Facilities</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Explore other campus facilities</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
            Start Your Research Journey
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Access thousands of books, digital resources, and research facilities. 
            Join GP Palanpur library community today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="https://gpplibrary.blogspot.com/" target="_blank" rel="noopener noreferrer">
                Visit Library Portal
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Librarian</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/admissions">Join GP Palanpur</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}