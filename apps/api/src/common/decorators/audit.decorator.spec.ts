import { Reflector } from '@nestjs/core';
import { Audit, AUDIT_ACTION_KEY } from './audit.decorator';

describe('Audit Decorator', () => {
  class TestController {
    @Audit('quiz.delete')
    deleteQuiz(): void {}
  }

  it('should attach the correct audit action metadata to the method', () => {
    const reflector = new Reflector();
    const action = reflector.get<string>(AUDIT_ACTION_KEY, TestController.prototype.deleteQuiz);
    expect(action).toBe('quiz.delete');
  });
});
