export const pillarIds = ["platforms", "regional", "ai", "talent"] as const;

export type PillarId = (typeof pillarIds)[number];

/**
 * Pillar for each published post, kept in the repo.
 * The preview shares the production database, so this is not a Supabase column.
 * A post with no entry stays on All and has no pillar tag.
 */
const assigned: Record<string, PillarId> = {
  "2026-10-22-vmware-to-cloud-migration-path": "platforms",
  "2026-10-22-syrian-talent-needs-a-path": "talent",
  "2026-10-21-syrias-digital-systems": "regional",
  "2026-10-20-kubernetes-isnt-cloud": "talent",
};

export function isPillarId(value: string | undefined): value is PillarId {
  return Boolean(value && (pillarIds as readonly string[]).includes(value));
}

export function pillarForSlug(slug: string): PillarId | null {
  return assigned[slug] ?? null;
}
