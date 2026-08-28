import { QuestionType, QuizDifficulty } from '../../quiz/enums';
import { ClaudeAiProviderService } from './claude-ai-provider.service';

describe('ClaudeAiProviderService', () => {
  let service: ClaudeAiProviderService;
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new ClaudeAiProviderService();
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-claude-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('should call Claude API with tools & XML isolation, parse questions from tool_use block', async () => {
    const mockClaudeRawQuestions = {
      isViolated: false,
      questions: [
        {
          text: 'What is TypeScript?',
          type: QuestionType.SINGLE_CHOICE,
          points: 1,
          explanation: 'TypeScript is a typed superset of JavaScript.',
          options: [
            { key: 'A', text: 'A database system', isCorrect: false },
            { key: 'B', text: 'A typed superset of JavaScript', isCorrect: true },
          ],
        },
      ],
    };

    const mockResponsePayload = {
      id: 'msg_tool_12345',
      type: 'message',
      content: [
        {
          type: 'tool_use',
          name: 'submit_quiz_assessment',
          input: mockClaudeRawQuestions,
        },
      ],
      usage: {
        input_tokens: 150,
        output_tokens: 250,
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponsePayload),
    } as unknown as Response);

    const result = await service.generateQuiz(
      'TypeScript',
      1,
      QuestionType.SINGLE_CHOICE,
      QuizDifficulty.EASY,
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body as string);

    // Verify XML isolation in user prompt
    expect(requestBody.messages[0].content).toContain('<user_topic>\nTypeScript\n</user_topic>');
    // Verify tools definition and forced tool_choice
    expect(requestBody.tools).toBeDefined();
    expect(requestBody.tool_choice).toEqual({ type: 'tool', name: 'submit_quiz_assessment' });

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].text).toBe('What is TypeScript?');
    expect(result.questions[0].options).toHaveLength(2);
    expect(result.questions[0].options[1].isCorrect).toBe(true);
    expect(result.inputTokens).toBe(150);
    expect(result.outputTokens).toBe(250);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('should throw an error when response is truncated with stop_reason max_tokens', async () => {
    const mockResponsePayload = {
      id: 'msg_trunc',
      type: 'message',
      stop_reason: 'max_tokens',
      content: [],
      usage: { input_tokens: 200, output_tokens: 4096 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponsePayload),
    } as unknown as Response);

    await expect(
      service.generateQuiz('Big Topic', 20, QuestionType.SINGLE_CHOICE, QuizDifficulty.HARD),
    ).rejects.toThrow(
      'AI response was truncated due to token limits. Please reduce the question count.',
    );
  });

  it('should throw an error when API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_API_KEY;

    await expect(
      service.generateQuiz('History', 5, QuestionType.SINGLE_CHOICE, QuizDifficulty.MEDIUM),
    ).rejects.toThrow('AI API key is missing. Please configure ANTHROPIC_API_KEY in .env');
  });

  it('should throw an error when AI returns malformed JSON', async () => {
    const mockResponsePayload = {
      id: 'msg_123',
      content: [{ type: 'text', text: 'Not a valid JSON format at all' }],
      usage: { input_tokens: 50, output_tokens: 20 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponsePayload),
    } as unknown as Response);

    await expect(
      service.generateQuiz('Math', 3, QuestionType.SINGLE_CHOICE, QuizDifficulty.EASY),
    ).rejects.toThrow('Failed to parse AI JSON response: Invalid JSON syntax');
  });

  it('should throw an error when a question has no correct option', async () => {
    const invalidQuestions = {
      questions: [
        {
          text: 'What is 2 + 2?',
          options: [
            { key: 'A', text: '3', isCorrect: false },
            { key: 'B', text: '5', isCorrect: false },
          ],
        },
      ],
    };

    const mockResponsePayload = {
      id: 'msg_123',
      content: [{ type: 'text', text: JSON.stringify(invalidQuestions) }],
      usage: { input_tokens: 50, output_tokens: 20 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponsePayload),
    } as unknown as Response);

    await expect(
      service.generateQuiz('Math', 1, QuestionType.SINGLE_CHOICE, QuizDifficulty.EASY),
    ).rejects.toThrow('Question at index 0 does not have any correct option selected');
  });

  it('should handle timeout when fetch is aborted', async () => {
    const abortError = Object.assign(new Error('The operation was aborted'), {
      name: 'AbortError',
    });

    global.fetch = jest.fn().mockRejectedValue(abortError);

    await expect(
      service.generateQuiz('Physics', 2, QuestionType.SINGLE_CHOICE, QuizDifficulty.HARD),
    ).rejects.toThrow('Claude API request timed out after 45000ms');
  });

  it('should throw Content safety violation error when tool_use returns isViolated: true', async () => {
    const mockResponsePayload = {
      id: 'msg_tool_violation',
      type: 'message',
      content: [
        {
          type: 'tool_use',
          name: 'submit_quiz_assessment',
          input: {
            isViolated: true,
            reason: 'Topic contains violent or offensive content.',
          },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 30 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponsePayload),
    } as unknown as Response);

    await expect(
      service.generateQuiz('violent acts', 5, QuestionType.SINGLE_CHOICE, QuizDifficulty.MEDIUM),
    ).rejects.toThrow('Content safety violation: Topic contains violent or offensive content.');
  });

  it('should throw Content safety violation error when AI returns isViolated: true', async () => {
    const mockRefusalResponse = {
      isViolated: true,
      reason: 'Topic promotes violence and is inappropriate for educational assessment.',
    };

    const mockResponsePayload = {
      id: 'msg_safety_1',
      content: [{ type: 'text', text: JSON.stringify(mockRefusalResponse) }],
      usage: { input_tokens: 50, output_tokens: 30 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponsePayload),
    } as unknown as Response);

    await expect(
      service.generateQuiz('violent acts', 5, QuestionType.SINGLE_CHOICE, QuizDifficulty.MEDIUM),
    ).rejects.toThrow(
      'Content safety violation: Topic promotes violence and is inappropriate for educational assessment.',
    );
  });

  it('should throw Content safety violation error when AI returns conversational refusal text', async () => {
    const mockResponsePayload = {
      id: 'msg_safety_2',
      content: [
        {
          type: 'text',
          text: 'I cannot create quiz questions on how to commit violent acts or murder.',
        },
      ],
      usage: { input_tokens: 50, output_tokens: 30 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponsePayload),
    } as unknown as Response);

    await expect(
      service.generateQuiz('violent acts', 3, QuestionType.SINGLE_CHOICE, QuizDifficulty.EASY),
    ).rejects.toThrow(
      'Content safety violation: I cannot create quiz questions on how to commit violent acts or murder.',
    );
  });

  it('should throw Content safety violation error when Claude API returns 400 with safety policy error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: jest
        .fn()
        .mockResolvedValue(
          '{"error":{"type":"invalid_request_error","message":"safety policy violation"}}',
        ),
    } as unknown as Response);

    await expect(
      service.generateQuiz(
        'dangerous content',
        5,
        QuestionType.SINGLE_CHOICE,
        QuizDifficulty.MEDIUM,
      ),
    ).rejects.toThrow('Content safety violation: Request was blocked by AI provider safety policy');
  });
});
