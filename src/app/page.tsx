import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/app-logo";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <header className="py-6 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AppLogo className="h-10 w-auto text-primary" />
            <h1 className="text-2xl font-bold text-foreground">PolyManager</h1>
          </div>
          <nav className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <section className="text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-6">
            Streamline Your College Management
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            PolyManager is a comprehensive platform for Government Polytechnic Palanpur, designed to enhance academic and administrative efficiency.
          </p>
          <div className="flex justify-center gap-4 mb-16">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button variant="secondary" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/login">Access Your Portal</Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-primary">
                <CheckCircle className="h-6 w-6 text-accent" />
                Comprehensive Dashboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-specific views for students, faculty, and administrators, providing quick access to relevant information and tools.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-primary">
                <CheckCircle className="h-6 w-6 text-accent" />
                Project Fair Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamlessly manage project registrations, team formations, jury evaluations, and result publications for college project fairs.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-primary">
                <CheckCircle className="h-6 w-6 text-accent" />
                AI-Powered Feedback Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Utilize advanced AI to analyze student feedback, generate insightful reports, and identify areas for improvement.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-card p-8 rounded-xl shadow-xl">
          <div className="md:w-1/2">
            <Image
              src="https://picsum.photos/seed/college/600/400"
              alt="College campus"
              data-ai-hint="college campus"
              width={600}
              height={400}
              className="rounded-lg shadow-md"
            />
          </div>
          <div className="md:w-1/2">
            <h3 className="text-3xl font-bold text-primary mb-4">Empowering Education</h3>
            <p className="text-muted-foreground mb-4">
              PolyManager is built with modern technology to provide a robust, scalable, and user-friendly experience for everyone in the college community.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /> Secure Authentication</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /> Role-Based Access Control</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /> Responsive Design</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /> Detailed Reporting</li>
            </ul>
          </div>
        </section>
      </main>
      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PolyManager. Government Polytechnic Palanpur. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
