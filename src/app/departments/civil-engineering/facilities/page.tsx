"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft,
  Building,
  Ruler,
  Mountain,
  Waves,
  Truck,
  HardHat,
  Monitor,
  BookOpen,
  Users,
  Target,
  Wrench,
  Microscope,
  Calculator,
  Hammer
} from "lucide-react";
import { Footer } from "@/components/footer";

export default function CivilFacilitiesPage() {
  const laboratories = [
    {
      name: "Concrete Technology Laboratory",
      description: "State-of-the-art facility for testing concrete, cement, and aggregates",
      area: "200 sq.m",
      capacity: "30 students",
      equipment: [
        "Universal Testing Machine (500 KN)",
        "Compression Testing Machine (3000 KN)",
        "Flexural Testing Machine",
        "Cube Molds (150mm x 150mm x 150mm)",
        "Slump Test Apparatus",
        "Compaction Factor Test Setup",
        "Permeability Test Apparatus",
        "Rebound Hammer",
        "Ultrasonic Pulse Velocity Test",
        "Schmidt Hammer"
      ],
      practicals: [
        "Concrete Mix Design",
        "Compressive Strength Test",
        "Workability Tests",
        "Durability Studies",
        "Non-Destructive Testing"
      ],
      image: "concrete-lab",
      icon: Hammer
    },
    {
      name: "Soil Mechanics & Foundation Laboratory",
      description: "Comprehensive geotechnical testing and soil analysis facility",
      area: "180 sq.m",
      capacity: "25 students",
      equipment: [
        "Triaxial Test Apparatus",
        "Direct Shear Test Setup",
        "Consolidation Test Machine",
        "Standard Penetration Test Kit",
        "Core Cutter",
        "Liquid Limit Device",
        "Plastic Limit Test Setup",
        "Proctor Compaction Test",
        "California Bearing Ratio Test",
        "Permeability Test Apparatus"
      ],
      practicals: [
        "Soil Classification",
        "Compaction Tests",
        "Shear Strength Determination",
        "Consolidation Analysis",
        "Bearing Capacity Studies"
      ],
      image: "soil-lab",
      icon: Mountain
    },
    {
      name: "Surveying Laboratory",
      description: "Modern surveying instruments and GPS technology for field work",
      area: "150 sq.m",
      capacity: "35 students",
      equipment: [
        "Total Station (5 Sets)",
        "Theodolite (10 Sets)",
        "Auto Level (8 Sets)",
        "GPS Equipment (2 Sets)",
        "Electronic Distance Meter",
        "Prismatic Compass",
        "Chain and Tape",
        "Plane Table with Accessories",
        "Dumpy Level",
        "Staff and Tripod"
      ],
      practicals: [
        "Leveling and Contouring",
        "Traversing",
        "Triangulation",
        "GPS Surveying",
        "Setting Out Works"
      ],
      image: "survey-lab",
      icon: Ruler
    },
    {
      name: "Highway Engineering Laboratory",
      description: "Bitumen and road material testing facility",
      area: "120 sq.m",
      capacity: "20 students",
      equipment: [
        "Marshall Stability Test Apparatus",
        "Penetration Test Setup",
        "Ductility Test Machine",
        "Softening Point Test",
        "Flash and Fire Point Test",
        "Specific Gravity Test Setup",
        "Los Angeles Abrasion Test",
        "Impact Value Test",
        "Crushing Value Test",
        "Aggregate Impact Test"
      ],
      practicals: [
        "Bitumen Testing",
        "Aggregate Properties",
        "Marshall Mix Design",
        "Pavement Material Analysis",
        "Quality Control Tests"
      ],
      image: "highway-lab",
      icon: Truck
    },
    {
      name: "Water Supply & Sanitary Engineering Lab",
      description: "Water quality testing and environmental analysis facility",
      area: "160 sq.m",
      capacity: "25 students",
      equipment: [
        "Water Testing Kit",
        "BOD Incubator",
        "Turbidity Meter",
        "pH Meter",
        "Conductivity Meter",
        "Dissolved Oxygen Meter",
        "Chlorine Test Kit",
        "Hardness Test Kit",
        "Iron Test Kit",
        "Bacterial Count Setup"
      ],
      practicals: [
        "Water Quality Analysis",
        "BOD and COD Testing",
        "Sewage Treatment Studies",
        "Pipe Network Design",
        "Pumping System Analysis"
      ],
      image: "water-lab",
      icon: Waves
    }
  ];

  const infrastructure = [
    {
      name: "Drawing Hall",
      description: "Spacious hall for engineering drawing and design work",
      features: ["60 Drawing Boards", "Proper Lighting", "Storage Facilities", "Reference Books"],
      capacity: "60 students",
      icon: Ruler
    },
    {
      name: "Computer Laboratory",
      description: "Modern computers with CAD software for design work",
      features: ["30 High-End PCs", "AutoCAD Software", "STAAD Pro", "Internet Connectivity"],
      capacity: "30 students",
      icon: Monitor
    },
    {
      name: "Library & Reading Room",
      description: "Specialized collection of civil engineering books and journals",
      features: ["500+ Books", "Technical Journals", "Reference Materials", "Digital Resources"],
      capacity: "40 students",
      icon: BookOpen
    },
    {
      name: "Seminar Hall",
      description: "Modern seminar hall for presentations and guest lectures",
      features: ["100 Seating Capacity", "Audio-Visual System", "Air Conditioning", "Modern Furniture"],
      capacity: "100 students",
      icon: Users
    }
  ];

  const equipment = [
    { name: "Universal Testing Machine", qty: "2", specification: "500 KN Capacity" },
    { name: "Compression Testing Machine", qty: "1", specification: "3000 KN Capacity" },
    { name: "Total Station", qty: "5", specification: "Electronic with Data Storage" },
    { name: "Theodolite", qty: "10", specification: "1' Least Count" },
    { name: "Auto Level", qty: "8", specification: "Automatic Leveling" },
    { name: "GPS Equipment", qty: "2", specification: "Sub-meter Accuracy" },
    { name: "Triaxial Test Apparatus", qty: "1", specification: "Motorized with Data Logger" },
    { name: "Marshall Stability Apparatus", qty: "1", specification: "Digital Display" },
    { name: "BOD Incubator", qty: "1", specification: "Temperature Controlled" },
    { name: "pH Meter", qty: "3", specification: "Digital with Calibration" }
  ];

  const safetyFeatures = [
    "First Aid Kits in all laboratories",
    "Safety equipment for field work",
    "Fire extinguishers and safety exits",
    "Emergency contact numbers displayed",
    "Safety training for students",
    "Protective gear for handling chemicals"
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <Link href="/departments/civil-engineering" className="flex items-center space-x-2 text-gray-600 hover:text-primary dark:hover:text-primary dark:text-gray-400">
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Civil Engineering</span>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="text-sm">5 Major Labs</Badge>
              <Badge variant="outline" className="text-sm">Modern Equipment</Badge>
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:border-gray-700">
                Industry Standard
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
              Laboratory Facilities
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed dark:text-gray-400">
              State-of-the-art laboratories equipped with modern instruments and equipment to provide 
              hands-on training in all areas of civil engineering. Our facilities ensure practical 
              learning aligned with industry standards.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Major Labs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Equipment</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">150</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Students Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">900</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sq.m Total Area</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Laboratories Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Major Laboratories</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Specialized laboratories for comprehensive practical training
            </p>
          </div>
          
          <div className="space-y-12">
            {laboratories.map((lab, index) => {
              const IconComponent = lab.icon;
              return (
                <Card key={index} className="hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 dark:bg-primary/20">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-gray-900 mb-2 dark:text-white">{lab.name}</CardTitle>
                        <CardDescription className="text-gray-600 mb-4 dark:text-gray-400">{lab.description}</CardDescription>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>Area: {lab.area}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Capacity: {lab.capacity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="grid lg:grid-cols-3 gap-8">
                    {/* Equipment List */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                        <Wrench className="h-4 w-4 text-primary" />
                        Major Equipment
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {lab.equipment.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Practicals */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                        <Target className="h-4 w-4 text-primary" />
                        Key Practicals
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {lab.practicals.map((practical, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            {practical}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Lab Image */}
                    <div>
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <Image
                          src={`https://dummyimage.com/400x200/0066cc/ffffff&text=${encodeURIComponent(lab.name)}`}
                          alt={lab.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2 text-center dark:text-gray-400">
                        Modern equipment and spacious layout
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Infrastructure */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Supporting Infrastructure</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Additional facilities to enhance the learning experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {infrastructure.map((facility, index) => {
              const IconComponent = facility.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 dark:bg-primary/20">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 dark:text-white">{facility.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">{facility.description}</p>
                      <Badge variant="outline" className="mb-3">{facility.capacity}</Badge>
                      <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        {facility.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full"></span>
                            {feature}
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

      {/* Equipment Inventory */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Major Equipment Inventory</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive list of testing and measuring equipment
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                    <Badge variant="secondary">Qty: {item.qty}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.specification}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Safety & Security</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive safety measures for student and staff protection
            </p>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 dark:text-white">
                    <HardHat className="h-5 w-5 text-primary" />
                    Safety Measures
                  </h3>
                  <ul className="space-y-3">
                    {safetyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative">
                  <Image
                    src="https://picsum.photos/seed/safety/400/300"
                    alt="Safety Equipment"
                    width={400}
                    height={300}
                    className="rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <HardHat className="h-16 w-16 mx-auto mb-4" />
                      <p className="font-semibold">Safety First</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Maintenance & Upgrades */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">Continuous Improvement</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Regular maintenance and technology upgrades ensure optimal performance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Wrench className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Regular Maintenance</h3>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Scheduled maintenance of all equipment to ensure accuracy and reliability
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Technology Upgrades</h3>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Regular updates to software and technology to match industry standards
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Microscope className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2 dark:text-white">Calibration Services</h3>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Professional calibration services to maintain testing accuracy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
            Experience World-Class Facilities
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Visit our laboratories and see the modern equipment and facilities that will 
            shape your engineering education and career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/admissions">Apply for Admission</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/departments/civil-engineering">Back to Department</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Schedule Lab Visit</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}