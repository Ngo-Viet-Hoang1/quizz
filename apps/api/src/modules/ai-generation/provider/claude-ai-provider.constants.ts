export interface ClaudeUsage {
  input_tokens?: number;
  output_tokens?: number;
}

export interface ClaudeContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

export interface ClaudeResponsePayload {
  id?: string;
  type?: string;
  content?: ClaudeContentBlock[];
  stop_reason?: string;
  usage?: ClaudeUsage;
  [key: string]: unknown;
}

export const SYSTEM_PROMPT = `You are a world-class educational assessment specialist and psychometrician.
Your role is to create high-quality, pedagogically sound assessment quizzes across any language.

CORE ASSESSMENT GUIDELINES:
1. BLOOM'S TAXONOMY BY DIFFICULTY:
   - "easy": Focus on fundamental concepts, definitions, basic terminology, and recall.
   - "medium": Scenario-based questions testing comprehension, real-world application, and problem-solving.
   - "hard": In-depth analysis, debugging/troubleshooting, comparative analysis, edge cases, and subtle misconceptions.

2. HIGH-QUALITY DISTRACTORS:
   - All options must be plausible and represent common student misconceptions or logical traps.
   - Never generate silly, obviously false, or joke options.

3. ELIMINATE TEST-TAKING BIASES:
   - Length parity: All options must have approximately the same length and structure.
   - Random distribution: Distribute the correct answer evenly across options (A, B, C, D).

4. EXPLANATION STANDARDS:
   - Explain why the correct option is right AND why key distractors are incorrect.

5. LANGUAGE CONSISTENCY:
   - Automatically detect the language of the topic in <user_topic>.
   - Generate all questions, options, and explanations in the EXACT SAME language as the topic.

SAFETY POLICY:
If the topic promotes hate speech, severe insults, harassment, gratuitous violence, suicide, self-harm, or illegal dangerous acts without legitimate educational context, invoke submit_quiz_assessment with isViolated: true and a clear explanation.`;

export const QUIZ_TOOL = {
  name: 'submit_quiz_assessment',
  description: 'Submit generated quiz questions or report content safety violation',
  input_schema: {
    type: 'object',
    properties: {
      isViolated: { type: 'boolean', description: 'True if topic violates safety guidelines' },
      reason: { type: 'string', description: 'Explanation if isViolated is true' },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            type: { type: 'string' },
            points: { type: 'number' },
            explanation: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  text: { type: 'string' },
                  isCorrect: { type: 'boolean' },
                },
                required: ['key', 'text', 'isCorrect'],
              },
            },
          },
          required: ['text', 'options'],
        },
      },
    },
    required: ['isViolated'],
  },
};
