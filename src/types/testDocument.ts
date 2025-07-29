export interface TestDocument {
  _id: string;
  _type: "testDocument";
  title: string;
  createdAt: string; // ISO datetime string
  _createdAt?: string;
  _updatedAt?: string;
  _rev?: string;
}
