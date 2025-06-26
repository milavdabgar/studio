"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
  MapPin,
  BookOpen,
  Bed,
  Utensils,
  Zap,
  Wifi,
  Trophy,
  Microscope,
  Users,
  Building
} from "lucide-react";
import facilities from "../../../data/content/facilities.json";
import collegeInfo from "../../../data/content/college-info.json";

const facilityIcons = {
  Academic: BookOpen,
  Residential: Bed,
  Service: Utensils,
  'Green Energy': Zap,
  Technology: Wifi,
  Recreation: Trophy,
  Infrastructure: Building
};

export default function FacilitiesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Campus Facilities
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Our {collegeInfo.basic_info.campus_area} campus provides modern infrastructure and 
              comprehensive facilities to support academic excellence and student life.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.infrastructure.total_labs}+</div>
                <div className="text-sm text-gray-600">Modern Labs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.infrastructure.library_books.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Library Books</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{collegeInfo.infrastructure.hostel_capacity.total}</div>
                <div className="text-sm text-gray-600">Hostel Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">200</div>
                <div className="text-sm text-gray-600">Mbps Internet</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Modern Infrastructure for Excellence
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our sprawling {collegeInfo.basic_info.campus_area} campus in Palanpur provides 
                a conducive environment for learning with state-of-the-art facilities, 
                modern laboratories, and comfortable living spaces.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-gray-700">
                    <strong>Location:</strong> {collegeInfo.basic_info.location_type} campus in Palanpur
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-gray-700">
                    <strong>Established:</strong> {collegeInfo.basic_info.established} - {collegeInfo.achievements.established_years} years of excellence
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-gray-700">
                    <strong>Green Energy:</strong> {collegeInfo.infrastructure.green_energy}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <Image
                  src="https://picsum.photos/seed/gpp-overview/600/400"
                  alt="GP Palanpur Campus Overview"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Campus Facilities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for a complete educational experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((facility) => {
              const IconComponent = facilityIcons[facility.type as keyof typeof facilityIcons] || Building;
              
              return (
                <Card key={facility.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">{facility.name}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {facility.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <Image
                        src={`https://picsum.photos/seed/${facility.id}-facility/400/200`}
                        alt={facility.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700 mb-4 text-base">
                      {facility.description}
                    </CardDescription>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                      <ul className="space-y-2">
                        {facility.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Special Highlights */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Special Highlights
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Solar Power Plant</h3>
              <p className="text-gray-600 mb-4">
                Environmentally conscious campus with renewable energy generating 86,000 units annually
              </p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Eco-Friendly
              </Badge>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Wifi className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">High-Speed Connectivity</h3>
              <p className="text-gray-600 mb-4">
                200 Mbps internet with NAMO WiFi covering the entire campus for seamless learning
              </p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Digital Ready
              </Badge>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
                <Microscope className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Laboratories</h3>
              <p className="text-gray-600 mb-4">
                25+ modern laboratories equipped with latest instruments for hands-on learning
              </p>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                State-of-art
              </Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* Hostel Information */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Comfortable Accommodation
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our hostel facilities provide a safe and comfortable living environment for students 
                from different parts of Gujarat and beyond.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Boys Hostel</h3>
                  </div>
                  <p className="text-2xl font-bold text-primary mb-1">
                    {collegeInfo.infrastructure.hostel_capacity.boys}
                  </p>
                  <p className="text-sm text-gray-600">Capacity</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Girls Hostel</h3>
                  </div>
                  <p className="text-2xl font-bold text-primary mb-1">
                    {collegeInfo.infrastructure.hostel_capacity.girls}
                  </p>
                  <p className="text-sm text-gray-600">Capacity</p>
                </Card>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Hostel Features</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Comfortable rooms with modern amenities</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Mess facilities with nutritious meals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>24/7 security and warden supervision</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Wi-Fi connectivity and study areas</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <Image
                  src="https://picsum.photos/seed/gpp-hostel/600/400"
                  alt="GP Palanpur Hostel Facilities"
                  width={600}
                  height={400}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Experience Our Campus
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Visit our campus to see our world-class facilities firsthand and discover why GP Palanpur 
            is the right choice for your engineering education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Schedule Campus Visit</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/admissions">Apply for Admission</Link>
            </Button>
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
              <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
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