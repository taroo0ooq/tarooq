import Image from "next/image";
import { coverSize } from "@/lib/cover-image";

export function PostCover({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const size = coverSize(src);
  return (
    <Image
      className={className}
      src={src}
      alt={alt}
      width={size.width}
      height={size.height}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? "high" : "auto"}
      style={{ width: "100%", height: "auto" }}
    />
  );
}
