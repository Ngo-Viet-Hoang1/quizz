'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { AiGeneratorForm } from './ai-generator-form';
import { AiJobProgressModal } from './ai-job-progress-modal';

interface AiGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiGenerationDialog({ open, onOpenChange }: AiGenerationDialogProps) {
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const [activeTopic, setActiveTopic] = React.useState<string>('');
  const [progressModalOpen, setProgressModalOpen] = React.useState(false);

  const handleJobStarted = (jobId: string, topic: string) => {
    setActiveJobId(jobId);
    setActiveTopic(topic);
    onOpenChange(false);
    setProgressModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl p-0 overflow-hidden border-border/80 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick AI Quiz Generator</DialogTitle>
            <DialogDescription>Generate questions quickly with AI</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <AiGeneratorForm onJobStarted={handleJobStarted} className="border-0 shadow-none p-0" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <AiJobProgressModal
        jobId={activeJobId}
        topic={activeTopic}
        open={progressModalOpen}
        onOpenChange={setProgressModalOpen}
        onReset={() => {
          setActiveJobId(null);
          onOpenChange(true);
        }}
      />
    </>
  );
}
