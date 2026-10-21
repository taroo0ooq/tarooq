import { createOwnerDocumentUpload } from "@/lib/owner-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return createOwnerDocumentUpload(request);
}
