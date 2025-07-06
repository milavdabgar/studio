"use client";

import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/public-nav";
import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function DepartmentNotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNav />
      
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="mb-8">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">
              Department Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sorry, we couldn&apos;t find the department you&apos;re looking for. 
              Please check the URL or browse our available departments.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/departments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                View All Departments
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                Go to Homepage
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
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
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400 dark:border-gray-700">
            <p>&copy; {new Date().getFullYear()} Government Polytechnic Palanpur. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}