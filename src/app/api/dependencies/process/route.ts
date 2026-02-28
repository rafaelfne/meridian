import { NextResponse } from "next/server";
import { processDependenciesAction } from "@/modules/graph/actions/process";

export async function POST() {
  try {
    const result = await processDependenciesAction();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process dependencies", details: message },
      { status: 500 },
    );
  }
}
