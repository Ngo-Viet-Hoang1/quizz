'use client';

import * as React from 'react';
import { Sparkles, AlertCircle, Zap, Sliders, HelpCircle } from 'lucide-react';
import { useCurrentSubscription } from '@/features/subscriptions';
import { QuestionType, QuizDifficulty } from '@/features/quizzes/types';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { DEFAULT_AI_GEN_PARAMS } from '../constants';
import { useEnqueueAiJob } from '../hooks';

interface AiGeneratorFormProps {
  onJobStarted: (jobId: string, topic: string) => void;
  className?: string;
}

const QUESTION_COUNT_OPTIONS = [5, 10, 20, 30, 50];

export function AiGeneratorForm({ onJobStarted, className }: AiGeneratorFormProps) {
  const [topic, setTopic] = React.useState('');
  const [questionCount, setQuestionCount] = React.useState<number>(
    DEFAULT_AI_GEN_PARAMS.questionCount,
  );
  const [countInput, setCountInput] = React.useState<string>(
    String(DEFAULT_AI_GEN_PARAMS.questionCount),
  );
  const [questionType, setQuestionType] = React.useState<QuestionType>(
    DEFAULT_AI_GEN_PARAMS.questionType,
  );
  const [difficulty, setDifficulty] = React.useState<QuizDifficulty>(
    DEFAULT_AI_GEN_PARAMS.difficulty,
  );

  const updateQuestionCount = (val: number) => {
    const clamped = Math.min(50, Math.max(1, val));
    setQuestionCount(clamped);
    setCountInput(String(clamped));
  };

  const { data: subscription } = useCurrentSubscription();
  const enqueueMutation = useEnqueueAiJob();

  const isQuotaExhausted =
    subscription !== undefined &&
    subscription.aiQuotaMonthly > 0 &&
    subscription.aiQuotaUsed >= subscription.aiQuotaMonthly;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const finalCount = Math.min(50, Math.max(1, questionCount));

    try {
      const res = await enqueueMutation.mutateAsync({
        topic: topic.trim(),
        questionCount: finalCount,
        questionType,
        difficulty,
      });

      if (res.jobId) {
        onJobStarted(res.jobId, topic.trim());
      }
    } catch {
      // Error handled by mutation hook via toast
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4 animate-pulse" />
              </span>
              <span>Generate Quiz with AI</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Provide a topic, syllabus, or learning objectives. Claude AI will generate a
              structured quiz draft.
            </CardDescription>
          </div>

          {/* Quota Indicator */}
          {subscription && (
            <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-muted/60 border text-xs shrink-0 shadow-2xs">
              <Zap className="size-3.5 text-amber-500 fill-amber-500" />
              <span className="text-muted-foreground">Quota:</span>
              <span className="font-semibold text-foreground font-mono">
                {Math.max(0, subscription.aiQuotaMonthly - subscription.aiQuotaUsed)} /{' '}
                {subscription.aiQuotaMonthly} left
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic / Prompt Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-topic" className="text-sm font-semibold flex items-center gap-1">
                <span>Topic or Content Description</span>
                <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs font-mono text-muted-foreground">{topic.length}/200</span>
            </div>
            <Textarea
              id="ai-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value.slice(0, 200))}
              placeholder="e.g. Microservices Architecture with NestJS, Event-Driven patterns, and Kafka messaging..."
              rows={4}
              required
              className="resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Configuration Settings */}
          <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
            {/* Question Count Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="ai-question-count"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Sliders className="size-3.5 text-muted-foreground" />
                  <span>Number of Questions</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">(Min 1 - Max 50)</span>
                  <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5 shadow-2xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-xs h-6 w-6 rounded-md hover:bg-muted"
                      disabled={questionCount <= 1}
                      onClick={() => updateQuestionCount(questionCount - 1)}
                    >
                      -
                    </Button>
                    <Input
                      id="ai-question-count"
                      type="number"
                      min={1}
                      max={50}
                      value={countInput}
                      onChange={(e) => {
                        setCountInput(e.target.value);
                        const val = parseInt(e.target.value, 10);
                        if (!Number.isNaN(val) && val >= 1 && val <= 50) {
                          setQuestionCount(val);
                        }
                      }}
                      onBlur={() => {
                        const val = parseInt(countInput, 10);
                        if (Number.isNaN(val) || val < 1) {
                          updateQuestionCount(1);
                        } else if (val > 50) {
                          updateQuestionCount(50);
                        } else {
                          updateQuestionCount(val);
                        }
                      }}
                      className="w-14 h-6 px-1 text-center font-mono text-xs font-bold border-none shadow-none focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-xs h-6 w-6 rounded-md hover:bg-muted"
                      disabled={questionCount >= 50}
                      onClick={() => updateQuestionCount(questionCount + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-5 gap-2">
                {QUESTION_COUNT_OPTIONS.map((count) => (
                  <Button
                    key={count}
                    type="button"
                    variant={questionCount === count ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 font-mono text-xs font-semibold transition-all ${
                      questionCount === count
                        ? 'shadow-xs'
                        : 'border-border/80 bg-background hover:bg-muted'
                    }`}
                    onClick={() => updateQuestionCount(count)}
                  >
                    {count} Qs
                  </Button>
                ))}
              </div>
            </div>

            {/* Grid 2 Columns: Type & Difficulty */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-border/60">
              {/* Question Type */}
              <div className="space-y-2">
                <Label
                  htmlFor="ai-qtype"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <HelpCircle className="size-3.5 text-muted-foreground" />
                  <span>Question Type</span>
                </Label>
                <Select
                  value={questionType}
                  onValueChange={(val) => setQuestionType(val as QuestionType)}
                >
                  <SelectTrigger id="ai-qtype" className="w-full h-9 text-xs font-medium">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    side="bottom"
                    sideOffset={4}
                    align="start"
                    className="w-56"
                  >
                    <SelectItem value={QuestionType.SINGLE_CHOICE}>
                      Single Choice (1 Correct)
                    </SelectItem>
                    <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                      Multiple Choice (Multi-select)
                    </SelectItem>
                    <SelectItem value={QuestionType.TRUE_FALSE}>True / False</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label
                  htmlFor="ai-difficulty"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <span>Difficulty Level</span>
                </Label>
                <Select
                  value={difficulty}
                  onValueChange={(val) => setDifficulty(val as QuizDifficulty)}
                >
                  <SelectTrigger id="ai-difficulty" className="w-full h-9 text-xs font-medium">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    side="bottom"
                    sideOffset={4}
                    align="start"
                    className="w-56"
                  >
                    <SelectItem value={QuizDifficulty.EASY}>
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                        >
                          Easy
                        </Badge>
                        <span>Beginner</span>
                      </span>
                    </SelectItem>
                    <SelectItem value={QuizDifficulty.MEDIUM}>
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30"
                        >
                          Medium
                        </Badge>
                        <span>Intermediate</span>
                      </span>
                    </SelectItem>
                    <SelectItem value={QuizDifficulty.HARD}>
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-rose-500/15 text-rose-500 border-rose-500/30"
                        >
                          Hard
                        </Badge>
                        <span>Advanced</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quota Exhausted Warning */}
          {isQuotaExhausted && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                Monthly AI quota exhausted. Please upgrade your subscription plan to continue
                generating quizzes.
              </span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="submit"
              disabled={!topic.trim() || enqueueMutation.isPending || isQuotaExhausted}
              className="gap-2 min-w-40 font-semibold shadow-xs"
            >
              {enqueueMutation.isPending ? (
                <>
                  <span className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Generate Quiz</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
