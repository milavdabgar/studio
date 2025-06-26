import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";

export function PublicNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Government Polytechnic Palanpur</h1>
                <p className="text-xs text-gray-600">Excellence in Technical Education</p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-primary">Home</Link>
            <Link href="/about" className="text-gray-700 hover:text-primary">About</Link>
            <Link href="/departments" className="text-gray-700 hover:text-primary">Departments</Link>
            <Link href="/admissions" className="text-gray-700 hover:text-primary">Admissions</Link>
            <Link href="/facilities" className="text-gray-700 hover:text-primary">Facilities</Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary">Contact</Link>
            <Button asChild>
              <Link href="/login">Portal</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-primary px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-primary px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/departments" 
                className="text-gray-700 hover:text-primary px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Departments
              </Link>
              <Link 
                href="/admissions" 
                className="text-gray-700 hover:text-primary px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Admissions
              </Link>
              <Link 
                href="/facilities" 
                className="text-gray-700 hover:text-primary px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Facilities
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-primary px-4 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="px-4 py-2">
                <Button asChild className="w-full">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>Portal</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}