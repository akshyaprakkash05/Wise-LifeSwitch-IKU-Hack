import { SplitDetailPage } from "@/components/split/SplitDetailPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams]);
  return <SplitDetailPage id={id} isNew={isNew === "1"} />;
}
