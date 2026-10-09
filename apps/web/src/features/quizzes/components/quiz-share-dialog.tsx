'use client';

import * as React from 'react';
import { Check, Copy, Loader2, QrCode, RefreshCw, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { QuizItem, ShareQuizResult } from '../types';
import { useShareQuiz } from '../hooks';

interface QuizShareDialogProps {
  quiz: QuizItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizShareDialog({ quiz, open, onOpenChange }: QuizShareDialogProps) {
  const { mutateAsync: shareQuiz, isPending: isSharing } = useShareQuiz();
  const [shareInfo, setShareInfo] = React.useState<ShareQuizResult | null>(null);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const shareQuizRef = React.useRef(shareQuiz);
  React.useEffect(() => {
    shareQuizRef.current = shareQuiz;
  });

  const quizId = quiz?._id;
  const existingShareCode = quiz?.shareCode;

  React.useEffect(() => {
    if (!open || !quizId) {
      setShareInfo(null);
      setCopiedCode(false);
      setCopiedUrl(false);
      return;
    }

    // Only call API if the quiz doesn't have a shareCode yet
    if (!existingShareCode) {
      shareQuizRef
        .current(quizId)
        .then(setShareInfo)
        .catch((error) => {
          console.error('[QuizShareDialog] Failed to generate share code:', error);
        });
    }
  }, [open, quizId, existingShareCode]);

  if (!quiz) return null;

  const shareCode = shareInfo?.shareCode || existingShareCode || '';
  const shareUrl =
    shareInfo?.shareUrl ||
    `${typeof window !== 'undefined' ? window.location.origin : ''}/take/${shareCode}`;

  const handleRegenerateCode = () => {
    if (!quizId) return;
    shareQuiz(quizId)
      .then((res) => {
        setShareInfo(res);
        toast.success('Generated new share code!');
      })
      .catch((error) => {
        console.error('[QuizShareDialog] Failed to regenerate share code:', error);
      });
  };

  const copyToClipboard = async (text: string, isUrl: boolean) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (isUrl) {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
        toast.success('Share URL copied!');
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        toast.success('Quiz code copied!');
      }
    } catch (error) {
      console.error('[QuizShareDialog] Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Share2 className="h-5 w-5" />
            <DialogTitle>Share Quiz</DialogTitle>
          </div>
          <DialogDescription>
            Share this assessment with candidates or teachers. Anyone with the link or code can
            join.
          </DialogDescription>
        </DialogHeader>

        {isSharing && !shareCode ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Generating share link...</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Share Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quiz Share Code
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSharing}
                  onClick={handleRegenerateCode}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isSharing ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border bg-muted/40 px-4 py-2.5 font-mono text-xl font-bold tracking-widest text-center text-primary">
                  {shareCode || '------'}
                </div>
                <Button
                  variant="outline"
                  size="default"
                  className="h-11 px-4 gap-1.5"
                  onClick={() => copyToClipboard(shareCode, false)}
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            {/* Direct URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Direct Candidate URL
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-xs text-muted-foreground"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(shareUrl, true)}
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <QrCode className="h-4 w-4" />
                <span>Candidates can enter code directly on the portal.</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
