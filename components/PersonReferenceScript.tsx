import { personReference } from "@/lib/person-schema";

export function PersonReferenceScript() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personReference()) }} />;
}
