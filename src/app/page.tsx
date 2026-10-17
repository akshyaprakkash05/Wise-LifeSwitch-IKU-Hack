"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonLink, Eyebrow } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { ready, profile, loadDemo } = useStore();

  return (
    <div className="grid min-h-[80dvh] content-center gap-8">
      <div className="grid gap-3">
        <Eyebrow>Wise LifeSwitch</Eyebrow>
        <h1 className="text-5xl font-extrabold leading-[1.02]">One move. One plan. Zero financial chaos.</h1>
        <p className="max-w-[46ch] text-lg text-muted">
          Upload your offer letter, tenancy agreement and fee invoices. We turn them into one money plan, in both
          currencies, and get each payment ready to send with Wise.
        </p>
      </div>
      <div className="grid gap-3 sm:flex">
        {ready && profile ? (
          <ButtonLink href="/roadmap">Open my roadmap</ButtonLink>
        ) : (
          <ButtonLink href="/upload">Start with my documents</ButtonLink>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            loadDemo();
            router.push("/roadmap");
          }}
        >
          Try Priya&apos;s demo
        </Button>
      </div>
    </div>
  );
}
