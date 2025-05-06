"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart } from "lucide-react"; // Using Lucide icons as placeholders for charts
import Link from "next/link";
import Image from "next/image";

// Mock user data - replace with actual authentication and user data fetching
const MOCK_USER = {
  name: "Admin User",
  role: "admin", // Possible roles: 'student', 'faculty', 'hod', 'admin', 'jury'
};

// Mock data for dashboard cards - replace with actual data fetching
const adminDashboardData = [
  { title: "Total Users", value: "1,250", icon: UsersIcon, color: "bg-primary/10 text-primary", href: "/admin/users" },
  { title: "Active Projects", value: "78", icon: BriefcaseIcon, color: "bg-accent/10 text-accent", href: "/project-fair/admin" },
  { title: "Pending Approvals", value: "12", icon: CheckCircleIcon, color: "bg-yellow-500/10 text-yellow-500", href: "/admin/approvals" },
  { title: "Feedback Reports", value: "5", icon: FileTextIcon, color: "bg-green-500/10 text-green-500", href: "/admin/feedback-analysis" },
];

const studentDashboardData = [
  { title: "My Courses", value: "6", icon: BookOpenIcon, color: "bg-primary/10 text-primary", href: "/courses" },
  { title: "Upcoming Assignments", value: "3", icon: CalendarIcon, color: "bg-accent/10 text-accent", href: "/assignments" },
  { title: "Latest Grades", value: "A-", icon: AwardIcon, color: "bg-green-500/10 text-green-500", href: "/results/history/me" },
  { title: "Project Status", value: "Submitted", icon: BriefcaseIcon, color: "bg-yellow-500/10 text-yellow-500", href: "/project-fair/student" },
];

const facultyDashboardData = [
  { title: "Assigned Courses", value: "3", icon: BookOpenIcon, color: "bg-primary/10 text-primary", href: "/faculty/courses" },
  { title: "Students Enrolled", value: "120", icon: UsersIcon, color: "bg-accent/10 text-accent", href: "/faculty/students" },
  { title: "Pending Evaluations", value: "8", icon: CheckCircleIcon, color: "bg-yellow-500/10 text-yellow-500", href: "/project-fair/jury" },
  { title: "Feedback Received", value: "View Reports", icon: FileTextIcon, color: "bg-green-500/10 text-green-500", href: "/admin/feedback-analysis" },
];

// Add HOD and Jury specific data similarly

const getDashboardData = (role: string) => {
  switch (role) {
    case "admin": return adminDashboardData;
    case "student": return studentDashboardData;
    case "faculty": return facultyDashboardData;
    // case "hod": return hodDashboardData;
    // case "jury": return juryDashboardData;
    default: return [];
  }
};


export default function DashboardPage() {
  const userRole = MOCK_USER.role;
  const dashboardCards = getDashboardData(userRole);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Welcome to your Dashboard, {MOCK_USER.name}!</h1>
        <p className="text-muted-foreground">Here&apos;s a quick overview of your activities and key metrics.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Card key={card.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color.split(' ')[1]}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.href && (
                <Link href={card.href} passHref>
                  <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                    View Details
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of recent important actions and notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity list */}
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                <Image src="https://picsum.photos/seed/activity1/40/40" alt="User avatar" data-ai-hint="user avatar" width={40} height={40} className="rounded-full"/>
                <div>
                  <p className="text-sm font-medium">New project "AI Chatbot" submitted.</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                <Image src="https://picsum.photos/seed/activity2/40/40" alt="User avatar" data-ai-hint="user avatar" width={40} height={40} className="rounded-full"/>
                <div>
                  <p className="text-sm font-medium">Feedback analysis report generated for CS Dept.</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                 <Image src="https://picsum.photos/seed/activity3/40/40" alt="User avatar" data-ai-hint="user avatar" width={40} height={40} className="rounded-full"/>
                <div>
                  <p className="text-sm font-medium">Semester 5 results published.</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </li>
            </ul>
            <div className="mt-4 text-center">
                <Button variant="outline" size="sm">View All Activities</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Visual representation of key performance indicators.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[250px] bg-muted/30 rounded-md">
            {/* Placeholder for chart */}
            <div className="text-center text-muted-foreground">
              <BarChart className="h-16 w-16 mx-auto mb-2 text-primary" />
              <p>Chart data will be displayed here.</p>
              <p className="text-xs">(Using BarChart, LineChart, or PieChart component)</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {userRole === 'admin' && (
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access common administrative tasks quickly.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link href="/admin/users/new" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <UsersIcon className="h-5 w-5" /> Add New User
                </Button>
              </Link>
              <Link href="/project-fair/events/new" passHref>
                 <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <BriefcaseIcon className="h-5 w-5" /> Create Project Event
                </Button>
              </Link>
              <Link href="/admin/results/import" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <FileTextIcon className="h-5 w-5" /> Import Results
                </Button>
              </Link>
              <Link href="/admin/feedback-analysis/new" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto text-left">
                  <FileTextIcon className="h-5 w-5" /> Analyze Feedback
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

// Placeholder Icons (replace with actual lucide-react imports if different)
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}

function AwardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 22 12 17 17 22 15.79 13.88" />
    </svg>
  )
}
