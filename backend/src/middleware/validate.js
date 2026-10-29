import { HttpError } from '../utils/httpError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      const primaryMessage = details[0]?.message || 'Validation failed';
      return next(HttpError.badRequest(primaryMessage, details));
    }

    req[source] = result.data;
    next();
  };
};

export default validate;
