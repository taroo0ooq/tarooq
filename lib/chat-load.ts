import { buildSiteCorpus } from "./chat-corpus";
import { getPublishedPosts } from "./published-posts";

export async function loadChatCorpus() {
  const posts = await getPublishedPosts();
  return buildSiteCorpus(posts);
}
