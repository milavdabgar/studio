"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2 as CommitteeIcon, CalendarCheck, ListChecks, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState, useCallback } from 'react';
import type { UserRole as UserRoleCode } from '@/types/entities'; // UserRole is now UserRoleCode
import { roleService } from '@/lib/api/roles'; // To fetch all roles

interface User {
  name: string;
  activeRole: UserRoleCode; // Role code
  availableRoles: UserRoleCode[]; // Role codes
  email?: string;
}

const DEFAULT_USER: User = {
  name: 'Guest User',
  activeRole: 'unknown',
  availableRoles: ['unknown'],
};

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
        return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

interface ParsedUserCookie {
  email: string;
  name: string;
  availableRoles: UserRoleCode[];
  activeRole: UserRoleCode;
}


export default function CommitteeDashboardPage() {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [committeeName, setCommitteeName] = useState("Your Committee");
  const [activeRoleName, setActiveRoleName] = useState("Member");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const fetchRoleDetails = useCallback(async (activeRoleCode: UserRoleCode) => {
    if (activeRoleCode && activeRoleCode !== 'unknown') {
      try {
        const allRoles = await roleService.getAllRoles();
        const roleDetails = allRoles.find(r => r.code === activeRoleCode);
        if (roleDetails) {
          setActiveRoleName(roleDetails.name);
          if (roleDetails.isCommitteeRole && roleDetails.committeeId) {
            const committeeNameFromRole = roleDetails.name.replace(/ (Convener|Co-Convener|Member)$/i, '').trim();
            setCommitteeName(committeeNameFromRole || "Committee Details");
          }
        }
      } catch (error) {
        console.error("Failed to fetch role details:", error);
        setCommitteeName("Committee Details"); // Fallback
      }
    }
    setIsLoadingDetails(false);
  }, []);


  useEffect(() => {
    setIsMounted(true);
    const authUserCookie = getCookie('auth_user');
    let userFromCookie: User = DEFAULT_USER;

    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as ParsedUserCookie;
        
        userFromCookie = {
          name: parsedUser.name || parsedUser.email,
          activeRole: parsedUser.activeRole || 'unknown',
          availableRoles: parsedUser.availableRoles && parsedUser.availableRoles.length > 0 ? parsedUser.availableRoles : ['unknown'],
          email: parsedUser.email,
        };
        setCurrentUser(userFromCookie);
        fetchRoleDetails(userFromCookie.activeRole);
      } catch (error) {
        console.error("Failed to parse auth_user cookie on committee dashboard:", error);
        setIsLoadingDetails(false);
      }
    } else {
      setIsLoadingDetails(false);
    }

  }, [fetchRoleDetails]);


  if (!isMounted || isLoadingDetails) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          {committeeName} Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome, {currentUser.name}. Role: {activeRoleName}. Manage your committee activities here.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <CalendarCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div> {/* Placeholder */}
            <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground" asChild>
              <Link href="/committee/meetings">
                View Schedule
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ListChecks className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div> {/* Placeholder */}
             <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground" asChild>
                <Link href="#">
                    View Tasks
                </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <CommitteeIcon className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div> {/* Placeholder */}
             <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground" asChild>
                <Link href="#">
                    View Members
                </Link>
            </Button>
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
              {/* Placeholder activities */}
              <li className="text-sm text-muted-foreground">Meeting scheduled for next week.</li>
              <li className="text-sm text-muted-foreground">New document uploaded: &quot;Annual Report Draft&quot;.</li>
              <li className="text-sm text-muted-foreground">Task &quot;Review Budget Proposal&quot; assigned to John Doe.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}