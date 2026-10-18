import { JoinPage } from "@/components/circle/JoinPage";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JoinPage code={code.toUpperCase()} />;
}
