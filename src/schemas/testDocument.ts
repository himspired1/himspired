// Define proper types for schema validation
interface SchemaField {
  name: string;
  type: string;
  title: string;
  validation?: Array<(value: unknown) => ValidationResult>;
  initialValue?: () => string | number | boolean | Date;
}

// Define validation result types that align with standard schema validation patterns
interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  info?: string;
}

// Define the selection interface for type safety
interface TestDocumentSelection {
  title?: string;
  createdAt?: string;
  dataValue?: string;
  dataInfo?: string;
}

const testDocumentSchema = {
  name: "testDocument",
  type: "document",
  title: "Test Document",
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title",
      validation: [
        (value: unknown) => {
          if (!value) {
            return { isValid: false, error: "Title is required" };
          }
          if (typeof value !== "string") {
            return { isValid: false, error: "Title must be a string" };
          }
          if (value.length < 1) {
            return {
              isValid: false,
              error: "Title must be at least 1 character",
            };
          }
          if (value.length > 100) {
            return {
              isValid: false,
              error: "Title must be no more than 100 characters",
            };
          }
          return { isValid: true };
        },
      ],
    },
    {
      name: "createdAt",
      type: "datetime",
      title: "Created At",
      initialValue: () => new Date().toISOString(),
    },
    {
      name: "data",
      type: "object",
      title: "Data",
      fields: [
        {
          name: "value",
          type: "string",
          title: "Value",
          validation: [
            (value: unknown) => {
              if (!value) {
                return { isValid: false, error: "Value is required" };
              }
              if (typeof value !== "string") {
                return { isValid: false, error: "Value must be a string" };
              }
              if (value.length < 1) {
                return {
                  isValid: false,
                  error: "Value must be at least 1 character",
                };
              }
              if (value.length > 500) {
                return {
                  isValid: false,
                  error: "Value must be no more than 500 characters",
                };
              }
              return { isValid: true };
            },
          ],
        },
        {
          name: "meta",
          type: "object",
          title: "Meta",
          fields: [
            {
              name: "info",
              type: "string",
              title: "Info",
              validation: [
                (value: unknown) => {
                  if (
                    value &&
                    typeof value === "string" &&
                    value.length > 200
                  ) {
                    return {
                      isValid: false,
                      error: "Info must be no more than 200 characters",
                    };
                  }
                  return { isValid: true };
                },
              ],
            },
            {
              name: "extra",
              type: "string",
              title: "Extra",
              validation: [
                (value: unknown) => {
                  if (
                    value &&
                    typeof value === "string" &&
                    value.length > 200
                  ) {
                    return {
                      isValid: false,
                      error: "Extra must be no more than 200 characters",
                    };
                  }
                  return { isValid: true };
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      createdAt: "createdAt",
      dataValue: "data.value",
      dataInfo: "data.meta.info",
    },
    prepare: (selection: TestDocumentSelection) => {
      const { title, createdAt, dataValue, dataInfo } = selection;

      return {
        title: title || "Untitled Document",
        subtitle: createdAt
          ? `Created: ${new Date(createdAt).toLocaleDateString()}`
          : "No creation date",
        description: dataValue
          ? `Data: ${dataValue}${dataInfo ? ` | Info: ${dataInfo}` : ""}`
          : "No data available",
      };
    },
  },
} as const;

// Validation utility functions
export const validateSchemaField = (
  field: SchemaField,
  value: unknown
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!field.validation) {
    return { isValid: true, errors: [] };
  }

  for (const validationFn of field.validation) {
    const result = validationFn(value);

    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }

  return { isValid: errors.length === 0, errors };
};

// Auto-generation utility
export const getInitialValue = (field: SchemaField): unknown => {
  if (field.initialValue) {
    return field.initialValue();
  }
  return undefined;
};

export default testDocumentSchema;
