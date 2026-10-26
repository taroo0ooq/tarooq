import { personReference } from "@/lib/person-schema";
import { jsonLdScript } from "@/lib/structured-data";

export function PersonReferenceScript() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(personReference()) }} />;
}
