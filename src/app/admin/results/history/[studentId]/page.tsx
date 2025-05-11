"use client";
import React from 'react';
import GradeHistoryView from '@/components/results/GradeHistoryView';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function StudentGradeHistoryPage() {
  const params = useParams();
  const router = useRouter();
  // The parameter name is studentId, but it contains the enrollment number
  const enrollmentNo = params.studentId as string; 

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <GradeHistoryView studentEnrollmentNo={enrollmentNo} />
    </div>
  );
}
