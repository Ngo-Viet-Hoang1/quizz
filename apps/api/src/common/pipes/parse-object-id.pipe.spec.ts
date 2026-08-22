import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

describe('ParseObjectIdPipe', () => {
  let pipe: ParseObjectIdPipe;

  beforeEach(() => {
    pipe = new ParseObjectIdPipe();
  });

  it('should return the string if valid ObjectId', () => {
    const validId = new Types.ObjectId().toHexString();
    expect(pipe.transform(validId)).toBe(validId);
  });

  it('should throw BadRequestException if invalid ObjectId', () => {
    expect(() => pipe.transform('invalid-id')).toThrow(BadRequestException);
    expect(() => pipe.transform('123')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if empty or undefined string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
    expect(() => pipe.transform(undefined as unknown as string)).toThrow(BadRequestException);
  });
});
