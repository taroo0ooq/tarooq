import { PersonReferenceScript } from "@/components/PersonReferenceScript";
import { NotFoundPage } from "@/components/pages/NotFoundPage";

export default function NotFound() {
  return (
    <>
      <PersonReferenceScript />
      <NotFoundPage locale="ar" />
    </>
  );
}
