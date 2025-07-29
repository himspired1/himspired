// Define proper types for schema validation
interface SchemaField {
  name: string;
  type: string;
  title: string;
  validation?: Array<{
    required?: () => boolean;
    min?: (length: number) => boolean;
    max?: (length: number) => boolean;
    custom?: (value: unknown) => boolean;
  }>;
  initialValue?: () => string | number | boolean | Date;
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
        {
          required: () => true,
          min: (length: number) => length >= 1,
          max: (length: number) => length <= 100,
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
            {
              required: () => true,
              min: (length: number) => length >= 1,
              max: (length: number) => length <= 500,
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
                {
                  max: (length: number) => length <= 200,
                },
              ],
            },
            {
              name: "extra",
              type: "string",
              title: "Extra",
              validation: [
                {
                  max: (length: number) => length <= 200,
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

  for (const rule of field.validation) {
    if (rule.required && rule.required() && !value) {
      errors.push(`${field.title} is required`);
    }

    if (typeof value === "string") {
      if (rule.min && !rule.min(value.length)) {
        errors.push(
          `${field.title} must be at least ${rule.min.toString()} characters`
        );
      }
      if (rule.max && !rule.max(value.length)) {
        errors.push(
          `${field.title} must be no more than ${rule.max.toString()} characters`
        );
      }
    }

    if (rule.custom && !rule.custom(value)) {
      errors.push(`${field.title} is invalid`);
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
