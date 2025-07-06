// src/components/blog/PostFooter.tsx

import { Card, CardContent } from '@/components/ui/card';
import { Users, Tag as TagIcon, Folder, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface PostFooterProps {
  lang: string;
}

export function PostFooter({ lang }: PostFooterProps) {
  const footerLinks = [
    {
      href: `/authors/${lang}`,
      icon: Users,
      label: lang === 'gu' ? 'બધા લેખકો' : 'All Authors',
      description: lang === 'gu' ? 'અમારા બ્લોગના બધા લેખકો શોધો' : 'Discover all authors on our blog'
    },
    {
      href: `/categories/${lang}`,
      icon: Folder,
      label: lang === 'gu' ? 'બધી શ્રેણીઓ' : 'All Categories',
      description: lang === 'gu' ? 'વિષય દ્વારા પોસ્ટ્સ બ્રાઉઝ કરો' : 'Browse posts by topic'
    },
    {
      href: `/tags/${lang}`,
      icon: TagIcon,
      label: lang === 'gu' ? 'બધા ટેગ્સ' : 'All Tags',
      description: lang === 'gu' ? 'ટેગ્સ દ્વારા કન્ટેન્ટ શોધો' : 'Find content by tags'
    }
  ];

  const footerTitle = lang === 'gu' ? 'વધુ શોધો' : 'Explore More';

  return (
    <footer className="mt-16 pt-8 border-t dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{footerTitle}</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          {footerLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                          <h3 className="font-semibold hover:text-primary dark:hover:text-primary transition-colors">
                            {link.label}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {link.description}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t dark:border-gray-700">
        <p>© {new Date().getFullYear()} Milav Dabgar</p>
      </div>
    </footer>
  );
}
