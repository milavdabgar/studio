"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import { 
  Calendar,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Star
} from "lucide-react";
import departments from "../../../data/content/departments.json";
import { Footer } from "@/components/footer";

export default function AdmissionsPage() {
  const totalSeats = departments.reduce((sum, dept) => sum + dept.intake_capacity, 0);
  
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 dark:from-primary/10 dark:to-secondary/20 py-16 dark:from-primary/10 dark:to-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center space-x-2 mb-6">
              <Badge variant="secondary" className="text-sm">Academic Year 2025-26</Badge>
              <Badge variant="outline" className="text-sm">Applications Open</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
              Admissions 2025-26
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 dark:text-gray-400">
              Join Government Polytechnic Palanpur and embark on your journey towards a successful 
              engineering career. Apply now for our diploma engineering programs.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{totalSeats}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Seats</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">6</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Programs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">NBA Accredited</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">171</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Placements 2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border dark:border-gray-700-yellow-800 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Alert className="border-yellow-200 dark:border dark:border-gray-700-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:border-gray-700">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Admissions for 2025-26 are conducted through ACPDC (Admission Committee for Professional Diploma Courses). 
              Visit the official ACPDC portal for application process and important dates.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Available Programs */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Available Programs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Choose from 6 engineering disciplines with industry-focused curriculum
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{dept.name}</CardTitle>
                    {dept.nba_status && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs dark:bg-green-900/30">
                        NBA
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Est. {dept.established}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {dept.intake_capacity} Seats
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 dark:text-gray-400">
                    {dept.overview.substring(0, 120)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      {dept.intake_capacity}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/departments/${dept.slug}`}>
                        Learn More
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/departments">View All Programs in Detail</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Admission Process */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Admission Process
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Step-by-step guide to join GP Palanpur
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Step 1</h3>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 dark:text-white">Check Eligibility</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Ensure you meet the eligibility criteria for diploma engineering programs
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Step 2</h3>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 dark:text-white">Apply Online</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Submit application through ACPDC official portal
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Step 3</h3>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 dark:text-white">Merit List</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Check merit list published by ACPDC and attend counseling as per schedule
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mx-auto mb-4 dark:bg-primary/20">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Step 4</h3>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 dark:text-white">Admission</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                Complete documentation and confirm your admission
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Eligibility & Requirements */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
                Eligibility Criteria
              </h2>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Academic Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">10th Standard (SSC)</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Passed 10th standard from recognized board</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Science & Mathematics</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">Must have studied Science and Mathematics in 10th</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Minimum Percentage</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">As per DTE Gujarat norms (varies by category)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Reservation Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                    Reservations are as per ACPDC norms and Gujarat State Government guidelines:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>General Category</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>SC/ST/OBC/EWS reservations as applicable</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Home university quota for Gujarat domicile</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 dark:text-white">
                Important Documents
              </h2>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Required Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    {[
                      "10th Standard Mark Sheet & Passing Certificate",
                      "School Leaving Certificate (LC)",
                      "Domicile Certificate (if applicable)",
                      "Caste Certificate (if applicable)",
                      "Income Certificate (if applicable)",
                      "Aadhar Card",
                      "Passport Size Photographs",
                      "Gap Certificate (if any gap after 10th)"
                    ].map((doc, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm dark:text-gray-300">{doc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  All documents should be in original along with photocopies. 
                  Ensure all certificates are attested by appropriate authorities.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Important Dates
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Stay updated with admission timeline
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900/30">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Application Period</h3>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Applications open as per ACPDC schedule</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900/30">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Merit List Publication</h3>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Merit lists published on ACPDC website</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full dark:bg-purple-900/30">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Counseling & Admission</h3>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Document verification and seat allocation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full dark:bg-orange-900/30">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Classes Commence</h3>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">Academic session begins in July/August</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <Alert className="border dark:border-gray-700-blue-200 bg-blue-50 dark:border-gray-700">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      For exact dates and detailed schedule, please visit the official ACPDC website 
                      (gujdiploma.admissions.nic.in) or contact our admission office.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose GP Palanpur */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
              Why Choose GP Palanpur?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-400">
              Advantages that set us apart
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 dark:bg-green-900/30">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">NBA Accreditation</h3>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                3 programs accredited by National Board of Accreditation ensuring quality education
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 dark:bg-blue-900/30">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Excellent Placements</h3>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                171 job offers in 2024 with strong industry partnerships and placement support
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 dark:bg-purple-900/30">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 dark:text-white">Experienced Faculty</h3>
              <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                66 GPSC selected faculty members including 6 PhD holders providing quality education
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact for Admissions */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10 dark:bg-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 dark:text-white">
            Need Help with Admissions?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto dark:text-gray-400">
            Our admission office is here to help you with any questions about the application process, 
            eligibility, or program details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="https://gujdiploma.admissions.nic.in/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply on ACPDC Portal
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Admission Office</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/departments">View All Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}