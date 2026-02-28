import { NextResponse } from "next/server";
import { processDependenciesAction } from "@/modules/graph/actions/process";

export async function POST() {
  const result = await processDependenciesAction();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
