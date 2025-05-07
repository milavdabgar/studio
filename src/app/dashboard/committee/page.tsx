
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2 as CommitteeIcon, CalendarCheck, ListChecks } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CommitteeDashboardPage() {
  // In a real app, you'd fetch specific committee data based on the user's role/committeeId
  const committeeName = "Your Committee"; // Placeholder
  const activeRole = "Member"; // Placeholder, derive from user context

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          {committeeName} Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {activeRole}. Manage your committee activities here.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <CalendarCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <Link href="/committee/meetings" passHref>
              <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                View Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ListChecks className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
             <Link href="#" passHref>
                <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                    View Tasks
                </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <CommitteeIcon className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
             <Link href="#" passHref>
                <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
                    View Members
                </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Committee Activity</CardTitle>
            <CardDescription>Latest updates and actions within {committeeName}.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">Meeting scheduled for next week.</li>
              <li className="text-sm text-muted-foreground">New document uploaded: "Annual Report Draft".</li>
              <li className="text-sm text-muted-foreground">Task "Review Budget Proposal" assigned to John Doe.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
