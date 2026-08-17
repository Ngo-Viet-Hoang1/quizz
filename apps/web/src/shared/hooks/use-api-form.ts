import { useForm, Path, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@repo/shared-types';

export function useApiForm<TFieldValues extends FieldValues = FieldValues>(
  schema: Parameters<typeof zodResolver<TFieldValues, unknown, TFieldValues>>[0],
  options?: Omit<UseFormProps<TFieldValues>, 'resolver'>,
): {
  form: UseFormReturn<TFieldValues>;
  handleApiError: (error: unknown) => void;
} {
  const form = useForm<TFieldValues>({
    ...options,
    resolver: zodResolver(schema),
  });

  const handleApiError = (error: unknown): void => {
    if (error instanceof ApiError && error.isValidationError) {
      Object.entries(error.toFieldErrors()).forEach(([field, message]) => {
        form.setError(field as Path<TFieldValues>, { message });
      });
    }
  };

  return { form, handleApiError };
}
