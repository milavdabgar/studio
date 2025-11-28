"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Image from "next/image";
import { 
  Lightbulb, Users, Target, Award, TrendingUp, Rocket, FileText, Mail, MapPin, Phone, Clock, Star, Cog, Shield, Building, BookOpen, CheckCircle} from "lucide-react";
import { Footer } from "@/components/footer";

export default function SSIPPage() {
  const innovations = [
    {
      title: "Rover Making Project",
      description: "Advanced robotics project developing autonomous rover systems for various applications",
      category: "Robotics"
    },
    {
      title: "Smart Rotary Switchboard",
      description: "Intelligent electrical switching system with automated control and monitoring features",
      category: "Electronics"
    },
    {
      title: "Water TAP Alarm",
      description: "Smart water conservation system with automatic tap monitoring and alert mechanisms",
      category: "IoT"
    },
    {
      title: "Cup and Glass Cleaning Device",
      description: "Automated cleaning system designed for efficient and hygienic utensil maintenance",
      category: "Mechanical"
    }
  ];

  const services = [
    {
      icon: Lightbulb,
      title: "Ideation Support",
      description: "Guidance in idea generation, validation, and development process"
    },
    {
      icon: Cog,
      title: "Technical Assistance", 
      description: "Expert technical support for prototype development and testing"
    },
    {
      icon: TrendingUp,
      title: "Financial Support",
      description: "Funding assistance and grant application support for viable projects"
    },
    {
      icon: Shield,
      title: "IP Guidance",
      description: "Intellectual property consultation and patent filing assistance"
    },
    {
      icon: Building,
      title: "Incubation Facilities",
      description: "Access to modern labs, equipment, and workspace for project development"
    },
    {
      icon: Users,
      title: "Mentorship",
      description: "One-on-one mentoring from experienced faculty and industry experts"
    }
  ];

  const achievements = [
    { number: "4", label: "Patents Published", icon: FileText },
    { number: "1", label: "Growth-stage Startup", icon: Rocket },
    { number: "8,000+", label: "Students Engaged", icon: Users },
    { number: "50+", label: "Industry Collaborations", icon: Award }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Innovation Hub</Badge>
              <Badge variant="outline" className="text-sm">Patent Support</Badge>
              <Badge variant="outline" className="text-sm">Startup Incubation</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              SSIP Cell
            </h1>
            <h2 className="text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-300 mb-6 dark:text-gray-300">
              Student Startup and Innovation Policy
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              &quot;Build a culture of innovation and entrepreneurship that empowers students to become job creators&quot;
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary">{achievement.number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{achievement.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About SSIP */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
                Fostering Innovation & Entrepreneurship
              </h2>
              <div className="prose prose-lg text-gray-600 dark:text-gray-300 space-y-4 dark:text-gray-400">
                <p>
                  The SSIP (Student Startup and Innovation Policy) Cell at Government Polytechnic Palanpur 
                  serves as the epicenter of innovation and entrepreneurship for our students. Located in the 
                  Administrative Block on the Ground Floor, our cell is dedicated to transforming creative 
                  ideas into viable solutions.
                </p>
                <p>
                  Our comprehensive approach supports students throughout their innovation journey - from 
                  initial ideation to potential commercialization. We provide technical assistance, financial 
                  support, and mentorship to help students develop their innovative projects and entrepreneurial ventures.
                </p>
                <p>
                  With a strong focus on intellectual property development, we have successfully guided 
                  students through the patent process, resulting in 4 published patents and fostering 
                  a growth-stage startup.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 p-8 rounded dark:bg-gray-800-2xl shadow dark:bg-gray-800-xl dark:bg-gray-900">
                <Image
                  src="https://dummyimage.com/600x400/0066cc/ffffff&text=SSIP+Innovation"
                  alt="SSIP Innovation Hub"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Innovation Lab</h3>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">State-of-the-art facilities for student projects</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Objectives */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Our Vision & Key Objectives
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto dark:text-gray-400">
              Empowering the next generation of innovators and entrepreneurs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 dark:bg-blue-900/30">
                <Lightbulb className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Promote Innovation</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Encourage creative thinking and innovative problem-solving approaches
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 dark:bg-green-900/30">
                <Cog className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Support Prototyping</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Provide technical resources and guidance for prototype development
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 dark:bg-purple-900/30">
                <Rocket className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Enable Startup Development</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Support the transition from ideas to viable business ventures
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 dark:bg-orange-900/30">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Foster Collaboration</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Build partnerships between students, faculty, and industry
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 dark:bg-red-900/30">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Develop IP</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Guide students through intellectual property creation and protection
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mx-auto mb-4">
                <Target className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Create Job Creators</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Transform students from job seekers to job creators and entrepreneurs
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Provided */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Services We Provide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Comprehensive support for your innovation journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full dark:bg-primary/20">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{service.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Notable Success Stories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Innovative projects developed by our students
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {innovations.map((innovation, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{innovation.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {innovation.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">{innovation.description}</p>
                  <div className="mt-4 flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Student Innovation Project</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10 dark:bg-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Measurable outcomes of our innovation initiatives
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                  <achievement.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold text-primary mb-2">{achievement.number}</h3>
                <p className="text-gray-600 dark:text-gray-300 font-medium dark:text-gray-400">{achievement.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Ready to start your innovation journey? Contact our SSIP Cell
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="h-5 w-5 text-primary" />
                    Visit Our Office
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">SSIP Cell</p>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Administrative Block, Ground Floor</p>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Government Polytechnic Palanpur</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">02742-262115</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">ssip@gppalanpur.ac.in</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Office Hours</p>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Monday - Friday</p>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">10:00 AM - 4:00 PM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Start Your Journey
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                      Whether you have an innovative idea, need technical support, or want to 
                      explore entrepreneurship opportunities, our SSIP Cell is here to guide you.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Idea validation and development</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Technical and financial support</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Patent and IP guidance</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Startup incubation facilities</span>
                      </div>
                    </div>
                    
                    <div className="pt-6">
                      <Button className="w-full" size="lg">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact SSIP Cell
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Transform Your Ideas Into Reality
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join the innovation ecosystem at GP Palanpur. Be part of the next generation 
            of entrepreneurs and innovators who are shaping the future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Rocket className="h-4 w-4 mr-2" />
              Start Your Project
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white dark:bg-gray-900 hover:text-primary dark:hover:text-primary dark:border dark:border-gray-700-gray-300 dark:text-gray-300 dark:hover:bg-gray-300 dark:hover:text-gray-900 dark:text-white dark:bg-gray-900 dark:text-white dark:border-gray-700">
              <BookOpen className="h-4 w-4 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <Footer variant="ssip" />
    </div>
  );
}