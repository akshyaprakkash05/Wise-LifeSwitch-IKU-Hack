"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { circleApi, useMembership } from "@/lib/circle/client";
import { PersonForm } from "./PersonForm";
import { useCT } from "./useCT";
import "./circle.css";

export function JoinPage({ code }: { code: string }) {
  const t = useCT();
  const router = useRouter();
  const [membership, setMembership] = useMembership();
  const already = membership?.code === code;

  useEffect(() => {
    if (already) router.replace("/circle");
  }, [already, router]);

  if (membership === undefined || already) return null;

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{t("joinTitle")}</h1>
          <p>{t("joinBody")}</p>
        </div>
      </div>
      <section className="card" style={{ display: "grid", gap: 14, maxWidth: 520 }}>
        <span className="eyebrow">{t("codeLabel")} · {code}</span>
        <PersonForm
          submitLabel={t("joinCta")}
          defaultRelation="Mum"
          onSubmit={async (p) => {
            setMembership(await circleApi.join(code, p));
            router.push("/circle");
          }}
        />
      </section>
    </>
  );
}
