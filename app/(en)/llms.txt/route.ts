import { llmsResponse } from "@/lib/llms-text";

export const dynamic = "force-static";

export function GET() {
  return llmsResponse();
}
