export const QUEUE_NAMES = {
  AI_GENERATION: 'ai-generation',
  EXAM_EXPIRE: 'exam-expire',
  NOTIFICATION: 'notification',
} as const;

export const JOB_NAMES = {
  GENERATE_QUIZ: 'generate-quiz',
  REGENERATE_QUIZ: 'regenerate-quiz',
  FORCE_SUBMIT: 'force-submit',
  SEND_EMAIL: 'send-email',
  SEND_INAPP: 'send-inapp',
} as const;

export const TOPIC_TO_QUEUE: Record<string, string> = {
  [JOB_NAMES.GENERATE_QUIZ]: QUEUE_NAMES.AI_GENERATION,
  [JOB_NAMES.REGENERATE_QUIZ]: QUEUE_NAMES.AI_GENERATION,
  [JOB_NAMES.FORCE_SUBMIT]: QUEUE_NAMES.EXAM_EXPIRE,
  [JOB_NAMES.SEND_EMAIL]: QUEUE_NAMES.NOTIFICATION,
  [JOB_NAMES.SEND_INAPP]: QUEUE_NAMES.NOTIFICATION,
};

export const QUEUE_CONCURRENCY: Record<string, number> = {
  [QUEUE_NAMES.AI_GENERATION]: 5,
  [QUEUE_NAMES.EXAM_EXPIRE]: 20,
  [QUEUE_NAMES.NOTIFICATION]: 20,
};

export const QUEUE_TIMEOUT_MS: Record<string, number> = {
  [QUEUE_NAMES.AI_GENERATION]: 150_000,
  [QUEUE_NAMES.EXAM_EXPIRE]: 30_000,
  [QUEUE_NAMES.NOTIFICATION]: 30_000,
};
