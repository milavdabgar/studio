
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoorOpen, Users, HardHat, Settings2 } from "lucide-react";
import Link from "next/link";

export default function ResourceAllocationPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            Resource Allocation Management
          </CardTitle>
          <CardDescription>
            Manage and allocate various institutional resources efficiently.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/resource-allocation/rooms" passHref>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Room Allocation</CardTitle>
                <DoorOpen className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Schedule and manage bookings for lecture halls, labs, and other rooms.
                </p>
              </CardContent>
            </Card>
          </Link>
          {/* Placeholder for Faculty Allocation - can be a link to relevant sections or a future dedicated page */}
          <Card className="opacity-50 cursor-not-allowed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty Allocation</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Assign faculty to courses and other academic duties (Coming Soon).
              </p>
            </CardContent>
          </Card>
          {/* Placeholder for Equipment Allocation */}
          <Card className="opacity-50 cursor-not-allowed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Allocation</CardTitle>
              <HardHat className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage and track the allocation of lab equipment and other resources (Coming Soon).
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
