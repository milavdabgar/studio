'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Crown,
  Shield,
  GraduationCap,
  BookOpen,
  Users,
  Briefcase,
  Lightbulb,
  Server,
  Building,
  ChevronDown,
  Home,
  Settings,
  Calendar,
  FileText,
  BarChart3,
  UserCheck,
  Wrench
} from 'lucide-react';
import { getUserCookie, UserRole, getUserAccessContext } from '@/lib/auth/role-access';

interface NavigationItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
  description?: string;
  roles: string[];
  children?: NavigationItem[];
}

export function RoleBasedNavigation() {
  const [user, setUser] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname() || '/';

  useEffect(() => {
    const currentUser = getUserCookie();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  if (isLoading || !user) {
    return null;
  }

  // TypeScript type assertion after null check
  const validUser = user as UserRole;
  const accessContext = getUserAccessContext(validUser);

  // Define navigation structure based on roles
  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      href: getDashboardRoute(validUser.activeRole),
      icon: Home,
      roles: ['admin', 'super_admin', 'principal', 'hod', 'faculty', 'student'],
      description: 'Main dashboard overview'
    },
    
    // Administrative Navigation
    {
      label: 'Administration',
      href: '/admin',
      icon: Crown,
      roles: ['admin', 'super_admin', 'principal', 'hod'],
      children: [
        {
          label: 'Students',
          href: '/admin/students',
          icon: Users,
          roles: ['admin', 'super_admin', 'principal', 'hod'],
          description: accessContext.canViewAllDepartments ? 'All students' : 'Department students'
        },
        {
          label: 'Faculty',
          href: '/admin/faculty',
          icon: GraduationCap,
          roles: ['admin', 'super_admin', 'principal', 'hod'],
          description: accessContext.canViewAllDepartments ? 'All faculty' : 'Department faculty'
        },
        {
          label: 'Programs',
          href: '/admin/programs',
          icon: BookOpen,
          roles: ['admin', 'super_admin', 'principal', 'hod'],
          description: 'Academic programs'
        },
        {
          label: 'Courses',
          href: '/admin/courses',
          icon: FileText,
          roles: ['admin', 'super_admin', 'principal', 'hod'],
          description: 'Course management'
        },
        {
          label: 'Timetables',
          href: '/admin/timetables',
          icon: Calendar,
          roles: ['admin', 'super_admin', 'principal', 'hod'],
          description: 'Schedule management'
        },
        {
          label: 'Reports',
          href: '/admin/reports',
          icon: BarChart3,
          roles: ['admin', 'super_admin', 'principal', 'hod'],
          description: 'Analytics and reports'
        }
      ]
    },

    // Committee Navigation  
    {
      label: 'Committees',
      href: '/admin/committees',
      icon: UserCheck,
      roles: ['admin', 'super_admin', 'principal', 'hod', 'tpo_convener', 'ssip_convener', 'library_convener', 'it_convener'],
      children: [
        {
          label: 'TPO',
          href: '/admin/committees/tpo',
          icon: Briefcase,
          roles: ['admin', 'super_admin', 'principal', 'tpo_convener'],
          description: 'Training & Placement',
          badge: validUser.activeRole === 'tpo_convener' ? 'Active' : undefined
        },
        {
          label: 'SSIP',
          href: '/admin/committees/ssip',
          icon: Lightbulb,
          roles: ['admin', 'super_admin', 'principal', 'ssip_convener'],
          description: 'Student Startup & Innovation',
          badge: validUser.activeRole === 'ssip_convener' ? 'Active' : undefined
        },
        {
          label: 'Library',
          href: '/admin/committees/library',
          icon: BookOpen,
          roles: ['admin', 'super_admin', 'principal', 'library_convener'],
          description: 'Library Management',
          badge: validUser.activeRole === 'library_convener' ? 'Active' : undefined
        },
        {
          label: 'IT/CWAN',
          href: '/admin/committees/it-cwan',
          icon: Server,
          roles: ['admin', 'super_admin', 'principal', 'it_convener'],
          description: 'IT Infrastructure',
          badge: validUser.activeRole === 'it_convener' ? 'Active' : undefined
        }
      ]
    },

    // Faculty Navigation
    {
      label: 'Faculty Tools',
      href: '/faculty',
      icon: GraduationCap,
      roles: ['faculty'],
      children: [
        {
          label: 'My Courses',
          href: '/faculty/courses',
          icon: FileText,
          roles: ['faculty'],
          description: 'Teaching assignments'
        },
        {
          label: 'Timetable',
          href: '/faculty/timetable',
          icon: Calendar,
          roles: ['faculty'],
          description: 'Teaching schedule'
        },
        {
          label: 'Students',
          href: '/faculty/students',
          icon: Users,
          roles: ['faculty'],
          description: 'My students'
        }
      ]
    },

    // Student Navigation
    {
      label: 'Student Portal',
      href: '/student',
      icon: BookOpen,
      roles: ['student'],
      children: [
        {
          label: 'Courses',
          href: '/student/courses',
          icon: FileText,
          roles: ['student'],
          description: 'My courses'
        },
        {
          label: 'Timetable',
          href: '/student/timetable',
          icon: Calendar,
          roles: ['student'],
          description: 'Class schedule'
        },
        {
          label: 'Results',
          href: '/student/results',
          icon: BarChart3,
          roles: ['student'],
          description: 'Academic results'
        }
      ]
    },

    // Settings (for all roles)
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['admin', 'super_admin', 'principal', 'hod', 'faculty', 'student'],
      description: 'Account and preferences'
    }
  ];

  // Filter navigation items based on user's role
  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(validUser.activeRole)
  ).map(item => ({
    ...item,
    children: item.children?.filter(child => 
      child.roles.includes(validUser.activeRole)
    )
  }));

  return (
    <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
      {filteredNavigation.map((item) => (
        <NavigationItem 
          key={item.href} 
          item={item} 
          pathname={pathname}
          userRole={validUser.activeRole}
        />
      ))}
    </nav>
  );
}

interface NavigationItemProps {
  item: NavigationItem;
  pathname: string;
  userRole: string;
}

function NavigationItem({ item, pathname, userRole }: NavigationItemProps) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={isActive ? "default" : "ghost"} 
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-h-[44px] whitespace-nowrap"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 sm:w-80 max-w-[calc(100vw-2rem)]">
          <DropdownMenuLabel className="flex items-center gap-2">
            <item.icon className="w-4 h-4" />
            {item.label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.children!.map((child) => (
            <DropdownMenuItem key={child.href} asChild>
              <Link 
                href={child.href}
                className="flex items-center justify-between w-full p-3 sm:p-2 cursor-pointer min-h-[48px] sm:min-h-[40px]"
              >
                <div className="flex items-center gap-3">
                  <child.icon className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{child.label}</div>
                    {child.description && (
                      <div className="text-sm text-muted-foreground">
                        {child.description}
                      </div>
                    )}
                  </div>
                </div>
                {child.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {child.badge}
                  </Badge>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      asChild
      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 min-h-[44px] whitespace-nowrap"
    >
      <Link href={item.href}>
        <item.icon className="w-4 h-4" />
        {item.label}
        {item.badge && (
          <Badge variant="secondary" className="text-xs ml-2">
            {item.badge}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

function getDashboardRoute(role: string): string {
  const routes: Record<string, string> = {
    'admin': '/admin',
    'super_admin': '/admin',
    'principal': '/admin',
    'hod': '/admin',
    'faculty': '/faculty',
    'student': '/student',
    'tpo_convener': '/admin/committees/tpo',
    'ssip_convener': '/admin/committees/ssip',
    'library_convener': '/admin/committees/library',
    'it_convener': '/admin/committees/it-cwan'
  };
  
  return routes[role] ?? '/';
}

export function QuickAccessMenu() {
  const [user, setUser] = useState<UserRole | null>(null);

  useEffect(() => {
    const currentUser = getUserCookie();
    setUser(currentUser);
  }, []);

  if (!user) return null;

  const validUser = user as UserRole;
  const quickAccess = getQuickAccessItems(validUser.activeRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Wrench className="w-4 h-4 mr-2" />
          Quick Access
          <ChevronDown className="w-3 h-3 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {quickAccess.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getQuickAccessItems(role: string): NavigationItem[] {
  const commonItems = [
    { label: 'Profile', href: '/profile', icon: Users, roles: ['all'] }
  ];

  const roleSpecificItems = {
    'admin': [
      { label: 'System Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
      { label: 'User Management', href: '/admin/users', icon: Users, roles: ['admin'] },
      { label: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['admin'] }
    ],
    'hod': [
      { label: 'Department Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['hod'] },
      { label: 'Faculty Management', href: '/admin/faculty', icon: GraduationCap, roles: ['hod'] },
      { label: 'Student Management', href: '/admin/students', icon: Users, roles: ['hod'] }
    ],
    'faculty': [
      { label: 'My Courses', href: '/faculty/courses', icon: FileText, roles: ['faculty'] },
      { label: 'Attendance', href: '/faculty/attendance', icon: UserCheck, roles: ['faculty'] },
      { label: 'Gradebook', href: '/faculty/grades', icon: BarChart3, roles: ['faculty'] }
    ],
    'student': [
      { label: 'Assignments', href: '/student/assignments', icon: FileText, roles: ['student'] },
      { label: 'Results', href: '/student/results', icon: BarChart3, roles: ['student'] },
      { label: 'Library', href: '/student/library', icon: BookOpen, roles: ['student'] }
    ]
  };

  return [
    ...commonItems,
    ...(roleSpecificItems[role as keyof typeof roleSpecificItems] || [])
  ];
}