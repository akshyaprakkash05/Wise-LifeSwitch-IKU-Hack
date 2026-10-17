"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Eyebrow, PageHeader } from "@/components/ui";
import { CirclePersonForm } from "@/components/circle-person-form";
import { circleApi, useMembership } from "@/lib/circle-client";

export default function JoinCirclePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = use(params);
  const code = raw.toUpperCase();
  const router = useRouter();
  const [membership, setMembership] = useMembership();

  const already = membership?.code === code;
  useEffect(() => {
    if (already) router.replace("/circle");
  }, [already, router]);

  if (membership === undefined || already) return null;

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="LifeSwitch Circle"
        title="You've been invited"
        lead="Join to see their moving-abroad updates and chat. They choose what they share, and so do you."
      />
      <Card className="grid gap-4">
        <Eyebrow>Invite code {code}</Eyebrow>
        <CirclePersonForm
          submitLabel="Join the Circle"
          defaultRelation="Mum"
          relations={["Mum", "Dad", "Sibling", "Grandparent", "Partner", "Friend", "Other family"]}
          onSubmit={async (p) => {
            setMembership(await circleApi.join(code, p));
            router.push("/circle");
          }}
        />
      </Card>
    </div>
  );
}
