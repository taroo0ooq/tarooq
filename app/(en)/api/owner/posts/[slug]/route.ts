import { mutateOwnerPost, removeOwnerPost } from "@/lib/owner-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return mutateOwnerPost(request, slug);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return removeOwnerPost(request, slug);
}
