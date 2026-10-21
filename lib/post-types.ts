export type PostLang = "en" | "ar";
export type PostStatus = "draft" | "scheduled" | "published";
export type LinkedInMode = "site" | "both";
export type LinkedInState = "hold" | "posted" | "failed";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  lang: PostLang;
  status: PostStatus;
  published_on: string;
  published_at: string | null;
  scheduled_for: string | null;
  cover_path: string;
  cover_alt: string;
  seo_title: string;
  seo_description: string;
  linkedin_text: string;
  linkedin_mode: LinkedInMode;
  linkedin_status: LinkedInState;
  linkedin_urn: string;
  linkedin_url: string;
  linkedin_error: string;
  created_at: string;
  updated_at: string;
};

export type PostInsert = Omit<PostRow, "id" | "created_at" | "updated_at">;

export type ClaimResult = {
  claimed: boolean;
  state: string;
  urn: string;
  url: string;
};

export type LinkedInConnectionRow = {
  access_token: string;
  expires_at: string;
  person_id: string;
  person_urn: string;
  name: string;
  email: string;
  updated_at: string;
};

export type PostsDb = {
  list(): Promise<PostRow[]>;
  hasAny(): Promise<boolean>;
  getBySlug(slug: string): Promise<PostRow | null>;
  insert(row: PostInsert): Promise<PostRow>;
  update(slug: string, patch: Partial<PostInsert>): Promise<PostRow | null>;
  remove(slug: string): Promise<void>;
  claimLinkedIn(postId: string): Promise<ClaimResult>;
  finishLinkedIn(postId: string, urn: string, url: string): Promise<void>;
  failLinkedIn(postId: string, error: string, release: boolean): Promise<void>;
  releaseLinkedIn(postId: string): Promise<void>;
  uploadImage(objectPath: string, bytes: Buffer, contentType: string): Promise<void>;
  deleteImage(objectPath: string): Promise<void>;
  readImage(objectPath: string): Promise<{ bytes: Buffer; contentType: string } | null>;
  saveConnection(row: Omit<LinkedInConnectionRow, "updated_at">): Promise<void>;
  getConnection(): Promise<LinkedInConnectionRow | null>;
};
