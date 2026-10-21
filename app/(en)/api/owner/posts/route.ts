import { getOwnerPosts, mutateOwnerPost } from "@/lib/owner-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return getOwnerPosts(request);
}

export function POST(request: Request) {
  return mutateOwnerPost(request);
}
