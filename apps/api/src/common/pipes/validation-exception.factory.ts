import { BadRequestException } from '@nestjs/common';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { ErrorCode } from '@repo/shared-types';
import { FieldValidationError } from '../response/field-validation-error';

export function validationExceptionFactory(errors: ClassValidatorError[]): BadRequestException {
  const fieldErrors = flattenValidationErrors(errors);
  return new BadRequestException({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    errors: fieldErrors,
  });
}

function flattenValidationErrors(
  errors: ClassValidatorError[],
  parentPath = '',
): FieldValidationError[] {
  return errors.flatMap((error) => {
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.children && error.children.length > 0) {
      return flattenValidationErrors(error.children, fieldPath);
    }

    return Object.entries(error.constraints ?? {}).map(
      ([constraintCode, message]): FieldValidationError => ({
        field: fieldPath,
        message,
        code: constraintCode.toUpperCase(),
      }),
    );
  });
}
