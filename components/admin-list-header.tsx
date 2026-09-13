import Link from "next/link";
import { PageTitle } from "@/components/ui";

export function AdminListHeader({
  title,
  subtitle,
  createHref,
  createLabel = "Crear",
}: {
  title: string;
  subtitle?: string;
  createHref: string;
  createLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <PageTitle title={title} subtitle={subtitle} />
      <Link href={createHref} className="btn btn-primary shrink-0 self-start sm:self-auto">
        {createLabel}
      </Link>
    </div>
  );
}
