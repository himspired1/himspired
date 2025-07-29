const testDocumentSchema = {
  name: "testDocument",
  type: "document",
  title: "Test Document",
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title",
    },
    {
      name: "createdAt",
      type: "datetime",
      title: "Created At",
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
            },
            {
              name: "extra",
              type: "string",
              title: "Extra",
            },
          ],
        },
      ],
    },
  ],
};

export default testDocumentSchema;
