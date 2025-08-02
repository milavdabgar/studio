'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Target, 
  Settings, 
  Calendar, 
  BookOpen, 
  Clock,
  Building,
  UserCheck,
  PlusCircle,
  FileText,
  BarChart3
} from 'lucide-react';

const navigationItems = [
  {
    section: 'Timetable Management',
    items: [
      { href: '/admin/preference-campaigns', label: 'Preference Campaigns', icon: Target },
      { href: '/admin/faculty-preferences', label: 'Faculty Preferences', icon: Users },
      { href: '/admin/course-allocation', label: 'Course Allocation', icon: BarChart3 },
      { href: '/admin/timetables/auto-generate', label: 'Auto Generate', icon: Settings },
      { href: '/admin/timetables', label: 'View Timetables', icon: Clock },
      { href: '/admin/course-offerings', label: 'Course Offerings', icon: BookOpen },
    ]
  },
  {
    section: 'Academic Management',
    items: [
      { href: '/admin/academic-terms', label: 'Academic Terms', icon: Calendar },
      { href: '/admin/courses', label: 'Courses', icon: BookOpen },
      { href: '/admin/programs', label: 'Programs', icon: FileText },
      { href: '/admin/curriculum', label: 'Curriculum', icon: FileText },
      { href: '/admin/batches', label: 'Batches', icon: Users },
    ]
  },
  {
    section: 'User Management',
    items: [
      { href: '/admin/faculty', label: 'Faculty', icon: UserCheck },
      { href: '/admin/students', label: 'Students', icon: Users },
      { href: '/admin/users', label: 'Users', icon: Users },
    ]
  },
  {
    section: 'Infrastructure',
    items: [
      { href: '/admin/buildings', label: 'Buildings', icon: Building },
      { href: '/admin/rooms', label: 'Rooms', icon: Building },
      { href: '/admin/rooms/utilization', label: 'Room Utilization', icon: BarChart3 },
    ]
  }
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <Card className="sticky top-4">
      <CardContent className="p-4">
        <div className="space-y-6">
          {navigationItems.map((section) => (
            <div key={section.section}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start h-9"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}