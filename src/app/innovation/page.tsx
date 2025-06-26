"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  Lightbulb, 
  Users, 
  Trophy,
  FileText,
  Building,
  Target,
  Rocket,
  Award,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Star,
  Zap,
  Calendar,
  CheckCircle
} from "lucide-react";

export default function InnovationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="text-sm bg-white/20 text-white border-white/30">
                SSIP Cell
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Student Startup & Innovation Policy
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Fostering Innovation and Entrepreneurship - Transforming ideas into impactful solutions 
              and nurturing the next generation of technical entrepreneurs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Submit Your Idea
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-gray-900">
                View Patents
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                To build a culture of innovation and entrepreneurship that empowers students to become 
                job creators rather than job seekers, contributing to the technological and economic 
                growth of the nation.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                  <span className="font-medium text-gray-900">8,000+ Students Sensitized</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                  <span className="font-medium text-gray-900">4 Patents Published</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                  <Rocket className="h-6 w-6 text-purple-600" />
                  <span className="font-medium text-gray-900">Multiple POC Projects</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                  <Building className="h-6 w-6 text-orange-600" />
                  <span className="font-medium text-gray-900">Growth-stage Startup</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                <Image
                  src="https://picsum.photos/seed/innovation/600/400"
                  alt="Innovation Lab"
                  width={600}
                  height={400}
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Objectives */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Key Objectives
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive approach to fostering innovation and entrepreneurship
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Promote Innovation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Encourage students to think creatively and develop innovative solutions to real-world problems
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-green-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Support Prototyping</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Provide resources and guidance for converting ideas into working prototypes
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Rocket className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Enable Startups</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Create pathways for students to establish successful startup ventures
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-orange-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">Foster Collaboration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Build networks between students, academia, industry, and investors
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-red-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">Develop IP Assets</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Guide students in protecting their intellectual property through patents
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-indigo-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Building className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl">Provide Incubation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Offer workspace, infrastructure, and business development support
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Innovations that made a difference and created real-world impact
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-green-600">Rover Making Project</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">₹50,000 Prize</Badge>
                </div>
                <CardDescription className="text-base">
                  Team Leader: Seliya Abrar (Electrical Engineering)<br/>
                  Mentor: Prof. B.M. Patel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Developed a multi-purpose rover with advanced sensing capabilities for 
                  agricultural and surveillance applications. This innovative project showcased 
                  cutting-edge engineering solutions.
                </p>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Won State Competition</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-blue-600">Smart Rotary Switchboard</CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">Patent Filed</Badge>
                </div>
                <CardDescription className="text-base">
                  Team: Electrical Engineering Students<br/>
                  Mentor: Prof. B.M. Patel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Created an energy-efficient switchboard with enhanced safety features. 
                  Patent Application Number: 202021044176
                </p>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Patent Published</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Published Patents Table */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Patents Published
            </h2>
            <p className="text-xl text-gray-600">
              Our SSIP cell has successfully supported the publication of multiple patents
            </p>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sr. No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Innovation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty Mentor & Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patent Application No.
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Switchboard</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Prof. B.M. Patel (EE Faculty) and team</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">202021026651</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Smart Rotary Switchboard</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Prof. B.M. Patel (EE Faculty) and team</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">202021044176</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">3</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Water TAP Alarm</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Prof. D.D. Panchal (ME Faculty) and team</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">202121004092</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">4</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Cup and Glass Cleaning Device</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Prof. B.M. Patel (EE Faculty) and team</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">202121049081</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SSIP Process Flow */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              SSIP Process Flow
            </h2>
            <p className="text-xl text-gray-600">
              From idea to implementation - our structured approach to innovation
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Idea Submission</h3>
              <p className="text-sm text-gray-600">Submit innovative ideas through our portal</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Concept Development</h3>
              <p className="text-sm text-gray-600">Refine ideas with mentor guidance</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Prototype Building</h3>
              <p className="text-sm text-gray-600">Technical development support</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Validation & IP</h3>
              <p className="text-sm text-gray-600">Market validation and patent filing</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <Rocket className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Incubation</h3>
              <p className="text-sm text-gray-600">Business model development</p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Student Testimonials
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our student innovators about their SSIP journey
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="bg-white border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "SSIP provided me the platform, resources, and guidance to transform my idea 
                  into a patented invention. The mentorship from faculty was invaluable."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Seliya Abrar</div>
                    <div className="text-sm text-gray-600">Electrical Engineering</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "The design thinking workshops and regular feedback sessions helped refine our 
                  concept. SSIP's support in securing funding was crucial for building our prototype."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">ME Student Team</div>
                    <div className="text-sm text-gray-600">Mechanical Engineering</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Beyond technical support, SSIP helped us understand the business side of 
                  innovation. The entrepreneurship workshops prepared us for market viability."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">ECE Student</div>
                    <div className="text-sm text-gray-600">Electronics & Communication</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact SSIP */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Contact SSIP Cell
            </h2>
            <p className="text-xl text-gray-600">
              Ready to transform your idea into reality? Get in touch with us!
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>Get in Touch</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>ssip-gpp@guj.edu.in</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span>02742-245219</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span>SSIP Cell, Ground Floor, Administrative Block</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span>Monday to Friday, 10:00 AM to 4:00 PM</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Join the Innovation Movement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Whether you're a student with an innovative idea, a faculty member wanting 
                    to mentor, or an industry partner looking to collaborate, we welcome you 
                    to join our innovation ecosystem.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full justify-between">
                      Submit Your Idea
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      Join as Mentor
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
