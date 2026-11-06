import { AppError } from '../errors/AppError.mjs';

export function validate(schema, source) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Request validation failed',
        result.error.issues.map((i) => ({ field: i.path.join('.') || source, message: i.message }))
      );
    }
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}