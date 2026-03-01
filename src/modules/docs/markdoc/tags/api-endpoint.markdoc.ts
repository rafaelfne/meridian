import { type Schema } from "@markdoc/markdoc";

export const apiEndpoint: Schema = {
  render: "ApiEndpoint",
  selfClosing: true,
  attributes: {
    method: { type: String, required: true },
    path: { type: String, required: true },
    description: { type: String },
  },
};
