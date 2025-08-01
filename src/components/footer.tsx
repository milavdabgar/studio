import Link from "next/link";
import { GraduationCap, Facebook, Instagram, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";

interface FooterProps {
  variant?: 'default' | 'ssip';
}

export function Footer({ variant = 'default' }: FooterProps) {
  const socialLinks = variant === 'ssip' ? [
    {
      icon: Youtube,
      href: "https://www.youtube.com/channel/UClx0aoow1_WK_-DkjF9XDxw",
      label: "SSIP YouTube Channel"
    },
    {
      icon: Facebook,
      href: "https://www.facebook.com/SSIPGPP/",
      label: "SSIP Facebook Page"
    }
  ] : [
    {
      icon: Youtube,
      href: "https://www.youtube.com/channel/UCB7e0EQLdEneupoY2D7aWXg",
      label: "GPP YouTube Channel"
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/gp_palanpur_626/",
      label: "GPP Instagram"
    },
    {
      icon: Facebook,
      href: "https://www.facebook.com/gppalanpur",
      label: "GPP Facebook Page"
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/school/government-polytechnic-palanpur-626/",
      label: "GPP LinkedIn"
    }
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Institution Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-bold text-lg">Government Polytechnic Palanpur</h3>
                {variant === 'ssip' && (
                  <p className="text-sm text-gray-400">SSIP Cell</p>
                )}
              </div>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              {variant === 'ssip' 
                ? "Fostering innovation and entrepreneurship, empowering students to become job creators through our Student Startup and Innovation Policy initiatives."
                : "Building technical excellence for over 40 years. Premier government diploma engineering institution in Banaskantha district providing quality technical education."
              }
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Outside Malan Gate, Near Dhaniyana Crossroads, Palanpur - 385001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>02742-262115</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{variant === 'ssip' ? 'ssip@gppalanpur.ac.in' : 'principal@gppalanpur.ac.in'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/departments" className="text-gray-400 hover:text-white transition-colors">Departments</Link></li>
              <li><Link href="/admissions" className="text-gray-400 hover:text-white transition-colors">Admissions</Link></li>
              <li><Link href="/facilities" className="text-gray-400 hover:text-white transition-colors">Facilities</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/posts/en" className="text-gray-400 hover:text-white transition-colors">Blog Posts</Link></li>
              <li><Link href="/categories/en" className="text-gray-400 hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/tags/en" className="text-gray-400 hover:text-white transition-colors">Tags</Link></li>
              <li><Link href="/ssip" className="text-gray-400 hover:text-white transition-colors">SSIP</Link></li>
              <li><Link href="/tpo" className="text-gray-400 hover:text-white transition-colors">TPO</Link></li>
              <li><Link href="/library" className="text-gray-400 hover:text-white transition-colors">Library</Link></li>
            </ul>
          </div>

          {/* Social Media & Connect */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Connect With Us</h4>
            <div className="space-y-4">
              {/* Social Media Links */}
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social, index) => (
                  <Link 
                    key={index}
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-lg hover:bg-primary transition-colors group"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5 group-hover:text-white" />
                  </Link>
                ))}
              </div>
              
              {/* Additional Links */}
              <div className="text-sm space-y-1">
                <Link href="/establishment" className="block text-gray-400 hover:text-white transition-colors">
                  Establishment Office
                </Link>
                <Link href="/student-section" className="block text-gray-400 hover:text-white transition-colors">
                  Student Section
                </Link>
                {variant !== 'ssip' && (
                  <Link href="/innovation" className="block text-gray-400 hover:text-white transition-colors">
                    Innovation Hub
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Government Polytechnic Palanpur{variant === 'ssip' ? ' SSIP Cell' : ''}. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}