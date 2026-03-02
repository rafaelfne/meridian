import type { Config } from "@markdoc/markdoc";
import { callout } from "./tags/callout.markdoc";
import { apiEndpoint } from "./tags/api-endpoint.markdoc";
import { systemRef } from "./tags/system-ref.markdoc";
import { heading } from "./nodes/heading.markdoc";
import { fence } from "./nodes/fence.markdoc";

export const markdocConfig: Config = {
  tags: {
    callout,
    "api-endpoint": apiEndpoint,
    "system-ref": systemRef,
  },
  nodes: {
    heading,
    fence,
  },
};
