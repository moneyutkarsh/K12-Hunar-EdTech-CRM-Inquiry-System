export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        error: {
          message: details[0]?.message || 'Validation failed',
          details,
        },
      });
    }

    // Replace with parsed/sanitized data
    req[source] = result.data;
    next();
  };
};
