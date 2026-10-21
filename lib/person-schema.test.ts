import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { personId, personReference, profilePageFor } from "./person-schema.ts";

describe("person schema", () => {
  it("matches the approved English ProfilePage", () => {
    const approved = JSON.parse(readFileSync("content/person-jsonld.json", "utf8"));
    assert.deepEqual(profilePageFor("en"), approved);
    assert.equal(profilePageFor("en").mainEntity["@id"], personId);
  });

  it("uses an Arabic ProfilePage that points at the same person", () => {
    const page = profilePageFor("ar");
    assert.equal(page["@type"], "ProfilePage");
    assert.equal(page["@id"], "https://alghazzi.org/ar#profilepage");
    assert.equal(page.url, "https://alghazzi.org/ar");
    assert.equal(page.inLanguage, "ar");
    assert.equal(page.name, "طارق الغزي | رئيس خدمات السحابة، الشرق الأوسط وشمال أفريقيا");
    assert.equal(page.mainEntity["@id"], personId);
    assert.equal(page.mainEntity.name, "طارق الغزي");
    assert.deepEqual(page.mainEntity.alternateName, ["Tareq Al-Ghazzi", "Tareq Alghazzi", "Tareq Al-Gazzi", "tarooq"]);
    assert.equal(page.mainEntity.url, "https://alghazzi.org");
    assert.equal(page.mainEntity.jobTitle, "Head of Cloud Services, MENA");
    const serialized = JSON.stringify(page);
    assert.equal(serialized.includes("github.com"), false);
    assert.equal(serialized.includes("Bank Albilad"), false);
    assert.equal(serialized.includes("\"image\""), false);
    assert.deepEqual(personReference(), {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": personId,
    });
  });

  it("keeps the short person reference off the home layouts", () => {
    for (const layout of ["app/(en)/layout.tsx", "app/(ar)/layout.tsx"]) {
      const source = readFileSync(layout, "utf8");
      assert.equal(source.includes("personReference"), false);
      assert.equal(source.includes("PersonReferenceScript"), false);
    }
    assert.match(readFileSync("app/(en)/(referenced)/layout.tsx", "utf8"), /PersonReferenceScript/);
    assert.match(readFileSync("app/(ar)/ar/(referenced)/layout.tsx", "utf8"), /PersonReferenceScript/);
    assert.match(readFileSync("components/pages/HomePage.tsx", "utf8"), /profilePageFor/);
  });
});
