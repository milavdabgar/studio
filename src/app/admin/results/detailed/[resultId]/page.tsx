"use client";
import React from 'react';
import DetailedResultView from '@/components/results/DetailedResultView';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DetailedResultPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.resultId as string;

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <DetailedResultView resultId={resultId} />
    </div>
  );
}
