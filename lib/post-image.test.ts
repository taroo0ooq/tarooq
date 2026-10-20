import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanAlt, readImage, sniffImage } from "./post-image.ts";
import { PostInputError } from "./post-draft.ts";

function png() {
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  return bytes;
}

function jpeg() {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
}

function webp() {
  const bytes = Buffer.alloc(12);
  bytes.write("RIFF", 0);
  bytes.write("WEBP", 8);
  return bytes;
}

describe("images", () => {
  it("sniffs png, jpeg, and webp and rejects other bytes", () => {
    assert.equal(sniffImage(png()), "png");
    assert.equal(sniffImage(jpeg()), "jpg");
    assert.equal(sniffImage(webp()), "webp");
    assert.equal(sniffImage(Buffer.from("GIF89a")), null);
  });

  it("requires the name and content type to match the bytes", () => {
    assert.equal(readImage({ bytes: jpeg(), filename: "photo.jpeg", contentType: "image/jpeg" }, false)?.ext, "jpg");
    assert.throws(() => readImage({ bytes: jpeg(), filename: "photo.png" }, false), /do not match/);
    assert.throws(() => readImage({ bytes: png(), contentType: "image/webp" }, false), /do not match/);
    assert.throws(() => readImage({ bytes: Buffer.from("GIF89a"), filename: "anim.gif" }, false), /PNG, JPEG, or WebP/);
  });

  it("allows webp on the site and refuses it for LinkedIn", () => {
    assert.equal(readImage({ bytes: webp(), filename: "diagram.webp" }, false)?.ext, "webp");
    assert.throws(() => readImage({ bytes: webp(), filename: "diagram.webp" }, true), /LinkedIn accepts PNG or JPEG/);
  });

  it("requires one line of alt text when an image is present", () => {
    assert.equal(cleanAlt("  منصة   سحابية  ", true), "منصة سحابية");
    assert.throws(() => cleanAlt("   ", true), PostInputError);
    assert.equal(cleanAlt("", false), "");
  });
});
