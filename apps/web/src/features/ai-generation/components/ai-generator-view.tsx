'use client';

import * as React from 'react';
import { BrainCircuit } from 'lucide-react';
import { AiGeneratorForm } from './ai-generator-form';
import { AiJobProgressModal } from './ai-job-progress-modal';
import { AiJobHistoryTable } from './ai-job-history-table';
import { AiGenerationJobItem } from '../types';

export function AiGeneratorView() {
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const [activeTopic, setActiveTopic] = React.useState<string>('');
  const [progressModalOpen, setProgressModalOpen] = React.useState(false);

  const handleJobStarted = (jobId: string, topic: string) => {
    setActiveJobId(jobId);
    setActiveTopic(topic);
    setProgressModalOpen(true);
  };

  const handleSelectHistoryJob = (job: AiGenerationJobItem) => {
    setActiveJobId(job._id);
    setActiveTopic(job.prompt);
    setProgressModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BrainCircuit className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              AI Quiz Generator
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Instantly create high-quality, comprehensive assessment questions powered by Claude AI.
          </p>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AiGeneratorForm onJobStarted={handleJobStarted} />
        </div>

        {/* Right column: Recent History */}
        <div className="lg:col-span-4 space-y-6">
          <AiJobHistoryTable onSelectJob={handleSelectHistoryJob} />
        </div>
      </div>

      {/* Progress & Result Modal */}
      <AiJobProgressModal
        jobId={activeJobId}
        topic={activeTopic}
        open={progressModalOpen}
        onOpenChange={setProgressModalOpen}
      />
    </div>
  );
}
