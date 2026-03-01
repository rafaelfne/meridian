import { type Schema } from "@markdoc/markdoc";

// Links to another system in the same workspace
export const systemRef: Schema = {
  render: "SystemRef",
  selfClosing: true,
  attributes: {
    slug: { type: String, required: true },
    label: { type: String },
  },
};
