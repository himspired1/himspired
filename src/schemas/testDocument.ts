export default {
  name: "testDocument",
  title: "Test Document",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    select: {
      title: "title",
      createdAt: "createdAt",
    },
    prepare(selection: any) {
      const { title, createdAt } = selection;
      return {
        title: title || "Untitled Test Document",
        subtitle: createdAt
          ? new Date(createdAt).toLocaleDateString()
          : "No date",
      };
    },
  },
};
