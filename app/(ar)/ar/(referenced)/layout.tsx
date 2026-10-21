import { PersonReferenceScript } from "@/components/PersonReferenceScript";

export default function ReferencedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PersonReferenceScript />
      {children}
    </>
  );
}
