import { type Schema } from "@markdoc/markdoc";

export const callout: Schema = {
  render: "Callout",
  children: ["paragraph", "tag", "list"],
  attributes: {
    type: {
      type: String,
      default: "note",
      matches: ["note", "warning", "error", "check"],
      errorLevel: "critical",
      description: "Controls the color and icon of the callout",
    },
    title: {
      type: String,
      description: "Optional title for the callout",
    },
  },
};
