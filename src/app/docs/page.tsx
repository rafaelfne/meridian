import { DocsPage } from "@/components/docs/DocsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Meridian",
  description:
    "Complete reference for Meridian: workspaces, graph view, inventory upload, systems, and more.",
};

export default function DocsRoute() {
  return <DocsPage />;
}
