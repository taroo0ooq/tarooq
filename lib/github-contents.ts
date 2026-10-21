import { PostInputError } from "./post-draft";
import { WORKFLOW_URL } from "./publish-plan";
import { createVerifiedGit, type GitFile } from "./verified-git";

export type { GitFile };
export { WORKFLOW_URL };

export type GitHubClient = {
  listPostFiles(): Promise<{ mdx: string[]; images: string[] }>;
  commit(message: string, files: GitFile[]): Promise<{ sha: string; queued?: boolean }>;
};

type FetchImpl = typeof fetch;

export function createGitHubClient(token: string, fetchImpl: FetchImpl = fetch): GitHubClient {
  const git = createVerifiedGit(token, fetchImpl);
  return {
    listPostFiles: () => git.listPostFiles(),
    async commit(message, files) {
      await git.queuePublish(message, files);
      return { sha: "", queued: true };
    },
  };
}

export function githubClientFromEnv() {
  const token = process.env.GITHUB_CONTENTS_TOKEN || "";
  if (!token) throw new PostInputError("GITHUB_CONTENTS_TOKEN is not set.", 500);
  return createGitHubClient(token);
}
