import { llmsResponse } from "@/lib/llms-text";
import { getPublishedPosts } from "@/lib/published-posts";

export const revalidate = 60;

export async function GET() {
  const posts = await getPublishedPosts();
  return llmsResponse(posts);
}
