"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PERSON } from "@/lib/demo-data";
import { circleApi, useCircleFeed, useMembership, type CircleFeed, type Membership } from "@/lib/circle/client";
import { relationLabel } from "@/lib/circle/strings";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import { PersonForm } from "./PersonForm";
import { useCT } from "./useCT";
import "./circle.css";

const initial = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";
/** Saffron for the student, pink for family: the mock-up's family colours. */
const tone = (mine: boolean) => (mine ? "av-me" : "av-fam");

export function CirclePage() {
  const t = useCT();
  const [membership, setMembership] = useMembership();
  const [code, setCode] = useState("");

  if (membership === undefined) return null;

  if (!membership) {
    return (
      <>
        <div className="phead">
          <div>
            <h1 className="disp">{t("title")}</h1>
            <p>{t("sub")}</p>
          </div>
        </div>
        <div className="circle-cols">
          <section className="card" style={{ display: "grid", gap: 14 }}>
            <h2 className="disp" style={{ fontSize: 24 }}>{t("startTitle")}</h2>
            <p>{t("startBody")}</p>
            <PersonForm
              submitLabel={t("create")}
              defaultName={PERSON.name}
              defaultRelation="Student"
              onSubmit={async (p) => setMembership(await circleApi.create(p))}
            />
          </section>
          <section className="card" style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <h2 className="disp" style={{ fontSize: 20 }}>{t("haveCode")}</h2>
            <form
              className="circle-row"
              onSubmit={(e) => {
                e.preventDefault();
                const c = code.trim().toUpperCase();
                if (c.length === 6) location.href = `/circle/join/${c}`;
              }}
            >
              <input id="join-code" aria-label={t("codeLabel")} className="input mono" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="ABC123" style={{ textTransform: "uppercase", letterSpacing: "0.15em" }} />
              <button type="submit" className="btn ghost">{t("join")}</button>
            </form>
          </section>
        </div>
      </>
    );
  }

  return <CircleView membership={membership} onLeave={() => setMembership(null)} />;
}

function CircleView({ membership, onLeave }: { membership: Membership; onLeave: () => void }) {
  const t = useCT();
  const { feed, error, refresh } = useCircleFeed(membership.code);
  const [tab, setTab] = useState<"feed" | "chat">("feed");

  if (error?.code === "no_db") return <div className="banner warn">{t("noDb")}</div>;
  if (error?.code === "not_found") {
    return (
      <div className="card" style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <p>{t("gone")}</p>
        <button type="button" className="btn ghost" onClick={onLeave}>{t("startNew")}</button>
      </div>
    );
  }
  if (!feed) return <p className="muted">{t("loading")}</p>;

  const me = feed.members.find((m) => m.id === membership.memberId);
  const name = (id: string | null) => feed.members.find((m) => m.id === id)?.name ?? "?";

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{feed.circle.name}</h1>
          <p>{t("sub")}</p>
        </div>
        <InviteButton code={feed.circle.code} />
      </div>

      <div className="circle-cols">
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Members feed={feed} meId={membership.memberId} />
          <Link href="/split" className="btn ghost sm" style={{ justifySelf: "start" }}>
            <Icon name="receipt" size={16} /> {t("splitBill")}
          </Link>
          {me && <MySharing membership={membership} sharing={me.sharing} onChange={refresh} />}
        </div>

        <section className="card" style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <div className="segs" role="tablist" aria-label={t("title")} style={{ justifySelf: "start" }}>
            {(["feed", "chat"] as const).map((k) => (
              <button key={k} id={`circle-tab-${k}`} type="button" role="tab" className="seg" aria-selected={tab === k} onClick={() => setTab(k)}>
                {k === "feed" ? t("tabFeed") : `${t("tabChat")}${feed.messages.length ? ` · ${feed.messages.length}` : ""}`}
              </button>
            ))}
          </div>
          {tab === "feed" ? (
            <ul className="circle-feed" aria-live="polite">
              {feed.activities.map((a) => (
                <li key={a.id}>
                  <span className={`av ${tone(a.member_id === membership.memberId)}`} aria-hidden="true">{initial(name(a.member_id))}</span>
                  <p>
                    <b>{name(a.member_id)}</b> {a.text}
                    <span className="mono muted" style={{ fontSize: 11 }}> · <Ago iso={a.at} /></span>
                  </p>
                  {a.kind === "payment" && <span className="pill p-ok">{t("paidPill")}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Chat feed={feed} membership={membership} name={name} onSent={refresh} />
          )}
        </section>
      </div>
    </>
  );
}

function InviteButton({ code }: { code: string }) {
  const t = useCT();
  const { notify } = useApp();
  async function share() {
    const url = `${location.origin}/circle/join/${code}`;
    try {
      if (navigator.share) await navigator.share({ title: "LifeSwitch Circle", text: t("inviteText"), url });
      else {
        await navigator.clipboard.writeText(url);
        notify(t("linkCopied"));
      }
    } catch {
      /* share sheet closed */
    }
  }
  return (
    <button type="button" className="btn saffron" onClick={share}>
      <Icon name="users" size={18} /> {t("invite")} <span className="mono" style={{ opacity: 0.75 }}>{code}</span>
    </button>
  );
}

function Members({ feed, meId }: { feed: CircleFeed; meId: string }) {
  const t = useCT();
  const { state } = useApp();
  return (
    <ul className="card circle-members">
      {feed.members.map((m) => {
        const online = Date.now() - new Date(m.last_seen).getTime() < 5 * 60_000;
        return (
          <li key={m.id}>
            <span className={`av ${tone(m.id === meId)}`} aria-hidden="true">{initial(m.name)}</span>
            <div style={{ minWidth: 0 }}>
              <b>{m.name}</b>
              {m.id === meId && <span className="muted"> ({t("you")})</span>}
              <p className="muted" style={{ fontSize: 13 }}>
                {relationLabel(state.lang, m.relation)}
                {m.last_place && <> · {m.last_place}</>}
                {online && <> · {t("activeNow")}</>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MySharing({ membership, sharing, onChange }: { membership: Membership; sharing: boolean; onChange: () => void }) {
  const t = useCT();
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function toggle() {
    try {
      await circleApi.update(membership, { sharing: !sharing });
      onChange();
    } catch {
      setNote(t("errGeneric"));
    }
  }

  function shareLocation() {
    if (!("geolocation" in navigator)) return setNote(t("locNoSupport"));
    setLocating(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`/api/geo?lat=${coords.latitude.toFixed(3)}&lng=${coords.longitude.toFixed(3)}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json.message);
          await circleApi.update(membership, { last_place: json.place });
          // Stored in English so every viewer's feed reads the same; the place name is the point.
          await circleApi.activity(membership, "location", `is in ${json.place}`);
          onChange();
        } catch {
          setNote(t("locFail"));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setNote(err.code === err.PERMISSION_DENIED ? t("locDenied") : t("locFail"));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <section className="card" style={{ display: "grid", gap: 12 }}>
      <div className="circle-row" style={{ justifyContent: "space-between" }}>
        <div>
          <b>{t("shareTitle")}</b>
          <p className="muted" style={{ fontSize: 13 }}>{sharing ? t("shareOn") : t("shareOff")}</p>
        </div>
        <button type="button" role="switch" id="circle-sharing" aria-checked={sharing} aria-label={t("shareTitle")} className="circle-switch" onClick={toggle} />
      </div>
      {sharing && (
        <button type="button" className="btn ghost sm" onClick={shareLocation} disabled={locating} style={{ justifySelf: "start" }}>
          <Icon name="globe" size={16} /> {locating ? t("locating") : t("shareWhere")}
        </button>
      )}
      {note && <p style={{ color: "var(--warn)", fontSize: 13 }}>{note}</p>}
      <span className="eyebrow">{t("cityOnly")}</span>
    </section>
  );
}

function Chat({ feed, membership, name, onSent }: { feed: CircleFeed; membership: Membership; name: (id: string | null) => string; onSent: () => void }) {
  const t = useCT();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [feed.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      await circleApi.say(membership, body);
      setText("");
      onSent();
    } catch {
      setError(t("errGeneric"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div ref={box} className="circle-chat" aria-live="polite">
        {feed.messages.length === 0 && <p className="muted" style={{ textAlign: "center", fontSize: 14 }}>{t("noMessages")}</p>}
        {feed.messages.map((m) => {
          const mine = m.member_id === membership.memberId;
          return (
            <div key={m.id} className={mine ? "bubble mine" : "bubble"}>
              {!mine && <b style={{ fontSize: 12 }}>{name(m.member_id)}</b>}
              <p>{m.body}</p>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="circle-row">
        <input id="circle-message" className="input" aria-label={t("messagePlaceholder")} placeholder={t("messagePlaceholder")} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
        <button type="submit" className="btn dark" disabled={sending || !text.trim()}>{t("send")}</button>
      </form>
      {error && <p style={{ color: "var(--warn)", fontSize: 13 }}>{error}</p>}
    </div>
  );
}

function Ago({ iso }: { iso: string }) {
  const t = useCT();
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return <>{t("justNow")}</>;
  if (s < 3600) return <>{t("minAgo", { n: Math.floor(s / 60) })}</>;
  if (s < 86400) return <>{t("hAgo", { n: Math.floor(s / 3600) })}</>;
  return <>{t("dAgo", { n: Math.floor(s / 86400) })}</>;
}
