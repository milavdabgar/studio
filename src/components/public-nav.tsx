"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BlogLanguageSwitcher } from "@/components/blog/BlogLanguageSwitcher";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { usePathname } from "next/navigation";

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
}

export function PublicNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Check if we're on a blog-related page
  const isBlogPage = pathname?.startsWith('/posts') || pathname?.startsWith('/tags') || 
                     pathname?.startsWith('/categories') || pathname?.startsWith('/search');

  // Get current language from URL for blog pages
  const getCurrentLang = () => {
    if (isBlogPage && pathname) {
      const segments = pathname.split('/');
      return segments[2] || 'en'; // Default to 'en' if not found
    }
    return 'en';
  };

  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { 
      label: "Academics", 
      dropdown: [
        { label: "Departments", href: "/departments", description: "Engineering Programs" },
        { label: "Admissions", href: "/admissions", description: "Join Our College" },
        { label: "Library", href: "/library", description: "Books & Digital Resources" },
        { label: "Facilities", href: "/facilities", description: "Campus Infrastructure" },
      ]
    },
    { 
      label: "Student Life", 
      dropdown: [
        { label: "Student Section", href: "/student-section", description: "Student Services & Support" },
        { label: "SSIP Cell", href: "/ssip", description: "Innovation & Entrepreneurship" },
        { label: "TPO Cell", href: "/tpo", description: "Training & Placements" },
      ]
    },
    { 
      label: "Resources", 
      dropdown: [
        { label: "Blog Posts", href: "/posts/en", description: "Articles & Study Materials" },
        { label: "Categories", href: "/categories/en", description: "Browse by Topic" },
        { label: "Tags", href: "/tags/en", description: "Browse by Tags" },
      ]
    },
    { 
      label: "Administration", 
      dropdown: [
        { label: "Establishment", href: "/establishment", description: "Administrative Office" },
        { label: "Contact Us", href: "/contact", description: "Get in Touch" },
      ]
    },
  ];

  const handleDropdownToggle = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50 dark:bg-gray-900 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3" onClick={closeAllMenus}>
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Government Polytechnic Palanpur</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Excellence in Technical Education</p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.href ? (
                  <Link 
                    href={item.href} 
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors dark:text-gray-300"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors dark:text-gray-300"
                    onMouseEnter={() => setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
                
                {/* Dropdown Menu */}
                {item.dropdown && (
                  <div 
                    className={`absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg transition-all duration-200 ${
                      activeDropdown === item.label ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                    onMouseEnter={() => setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <div className="py-2">
                      {item.dropdown.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary transition-colors dark:bg-gray-800 dark:text-gray-300"
                          onClick={closeAllMenus}
                        >
                          <div className="font-medium">{dropdownItem.label}</div>
                          {dropdownItem.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 dark:text-gray-400">{dropdownItem.description}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isBlogPage && <BlogSearch currentLang={getCurrentLang()} />}
            <ThemeToggle />
            {isBlogPage && <BlogLanguageSwitcher />}
            <Button asChild>
              <Link href="/login">Portal</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary dark:text-gray-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.href ? (
                    <Link 
                      href={item.href}
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary px-4 py-2 block transition-colors dark:text-gray-300"
                      onClick={closeAllMenus}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <button
                        className="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary px-4 py-2 transition-colors dark:text-gray-300"
                        onClick={() => handleDropdownToggle(item.label)}
                      >
                        <span>{item.label}</span>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            activeDropdown === item.label ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      {/* Mobile Dropdown */}
                      {item.dropdown && activeDropdown === item.label && (
                        <div className="bg-gray-50 dark:bg-gray-800 border-l-2 border-primary ml-4 dark:bg-gray-800 dark:border-gray-700">
                          {item.dropdown.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.href}
                              href={dropdownItem.href}
                              className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors dark:text-gray-400"
                              onClick={closeAllMenus}
                            >
                              <div className="font-medium">{dropdownItem.label}</div>
                              {dropdownItem.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 dark:text-gray-400">{dropdownItem.description}</div>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              
              <div className="px-4 py-2 mt-4 flex items-center space-x-2">
                {isBlogPage && <BlogSearch currentLang={getCurrentLang()} />}
                <ThemeToggle />
                {isBlogPage && <BlogLanguageSwitcher />}
                <Button asChild className="flex-1">
                  <Link href="/login" onClick={closeAllMenus}>Portal</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}