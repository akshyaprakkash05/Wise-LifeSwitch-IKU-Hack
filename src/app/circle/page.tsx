"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Loader2, MapPin, Phone, Receipt, Send, Share2, Video } from "lucide-react";
import { Avatar, Button, ButtonLink, Card, Eyebrow, PageHeader, Pill } from "@/components/ui";
import { CirclePersonForm } from "@/components/circle-person-form";
import { circleApi, useCircleFeed, useMembership, type CircleFeed, type Membership } from "@/lib/circle-client";
import { useStore } from "@/lib/store";

const initials = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?";

export default function CirclePage() {
  const { profile } = useStore();
  const [membership, setMembership] = useMembership();
  const [joinCode, setJoinCode] = useState("");

  if (membership === undefined) return null;

  if (!membership) {
    return (
      <div className="grid gap-5">
        <PageHeader
          eyebrow="LifeSwitch Circle"
          title="Nobody moves abroad alone"
          lead="A private group for you and your family. Share updates like “Rent paid” or “Landed in London”, chat, and call. You control what's shared."
        />
        <Card className="grid gap-4">
          <h2 className="text-lg font-bold">Start your Circle</h2>
          <CirclePersonForm
            submitLabel="Create my Circle"
            defaultName={profile && profile.name !== "You" ? profile.name : ""}
            defaultRelation="Student"
            relations={["Student", "Mum", "Dad", "Sibling", "Partner", "Friend"]}
            onSubmit={async (p) => setMembership(await circleApi.create(p))}
          />
        </Card>
        <Card className="grid gap-3">
          <h2 className="text-lg font-bold">Got an invite code?</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (joinCode.trim().length === 6) location.href = `/circle/join/${joinCode.trim().toUpperCase()}`;
            }}
          >
            <input
              id="join-code"
              aria-label="Invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
              placeholder="ABC123"
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 font-mono uppercase tracking-widest"
            />
            <Button type="submit" variant="ghost">Join</Button>
          </form>
        </Card>
      </div>
    );
  }

  return <CircleView membership={membership} onLeave={() => setMembership(null)} />;
}

function CircleView({ membership, onLeave }: { membership: Membership; onLeave: () => void }) {
  const { feed, error, refresh } = useCircleFeed(membership.code);
  const [tab, setTab] = useState<"feed" | "chat">("feed");

  if (error?.code === "no_db") {
    return <Card className="border-warn bg-warn-bg text-warn">The shared database isn&apos;t connected on this server yet. Add DATABASE_URL to .env.local and restart.</Card>;
  }
  if (error?.code === "not_found") {
    return (
      <Card className="grid gap-3">
        <p>This Circle no longer exists.</p>
        <Button variant="ghost" onClick={onLeave}>Start a new one</Button>
      </Card>
    );
  }
  if (!feed) {
    return <p className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={18} aria-hidden /> Loading your Circle…</p>;
  }

  const me = feed.members.find((m) => m.id === membership.memberId);
  const name = (id: string | null) => feed.members.find((m) => m.id === id)?.name ?? "Someone";

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="LifeSwitch Circle" title={feed.circle.name} action={<InviteButton code={feed.circle.code} />} />

      <ButtonLink href="/split" variant="ghost" className="justify-self-start"><Receipt size={18} aria-hidden /> Split a bill with the Circle</ButtonLink>

      <Members feed={feed} meId={membership.memberId} />

      {me && <MySharing membership={membership} sharing={me.sharing} onChange={refresh} />}

      <div role="tablist" aria-label="Circle" className="grid grid-cols-2 rounded-full bg-sunk p-1">
        {(["feed", "chat"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx("rounded-full py-2 text-sm font-semibold", tab === t ? "bg-surface shadow-sm" : "text-muted")}
          >
            {t === "feed" ? "Activity" : `Chat${feed.messages.length ? ` (${feed.messages.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "feed" ? (
        <ol className="grid gap-2" aria-live="polite">
          {feed.activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-2xl bg-surface p-3">
              <Avatar initials={initials(name(a.member_id))} tone={a.member_id === membership.memberId ? "accent" : "forest"} />
              <div className="min-w-0 flex-1">
                <p><strong>{name(a.member_id)}</strong> · {a.text}</p>
                <p className="text-xs text-muted">{timeAgo(a.at)}</p>
              </div>
              {a.kind === "payment" && <Pill tone="good">Paid</Pill>}
              {a.kind === "location" && <MapPin size={16} className="text-muted" aria-label="Location" />}
            </li>
          ))}
        </ol>
      ) : (
        <Chat feed={feed} membership={membership} name={name} onSent={refresh} />
      )}
    </div>
  );
}

function InviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${location.origin}/circle/join/${code}`;
    const text = "Join my LifeSwitch Circle so we can stay close while I move abroad.";
    try {
      if (navigator.share) await navigator.share({ title: "LifeSwitch Circle", text, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      /* share sheet closed */
    }
  }
  return (
    <Button variant="ghost" onClick={share} aria-label={`Invite family, code ${code}`}>
      <Share2 size={18} aria-hidden /> {copied ? "Link copied" : `Invite · ${code}`}
    </Button>
  );
}

function Members({ feed, meId }: { feed: CircleFeed; meId: string }) {
  return (
    <ul className="grid gap-2">
      {feed.members.map((m) => {
        const online = Date.now() - new Date(m.last_seen).getTime() < 5 * 60_000;
        return (
          <li key={m.id}>
            <Card className="flex items-center gap-3 p-3">
              <Avatar initials={initials(m.name)} tone={m.id === meId ? "accent" : "forest"} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{m.name}{m.id === meId && <span className="font-normal text-muted"> (you)</span>}</p>
                <p className="truncate text-sm text-muted">
                  {m.relation}
                  {m.last_place && <> · <MapPin size={12} className="inline" aria-hidden /> {m.last_place}</>}
                  {online && " · active now"}
                </p>
              </div>
              {m.phone && m.id !== meId && (
                <div className="flex gap-1">
                  <a href={`facetime-audio:${m.phone}`} aria-label={`Call ${m.name}`} className="rounded-full bg-sunk p-2.5"><Phone size={18} /></a>
                  <a href={`facetime:${m.phone}`} aria-label={`FaceTime ${m.name}`} className="rounded-full bg-accent p-2.5 text-accent-ink"><Video size={18} /></a>
                </div>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

function MySharing({ membership, sharing, onChange }: { membership: Membership; sharing: boolean; onChange: () => void }) {
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function toggle() {
    await circleApi.update(membership, { sharing: !sharing });
    onChange();
  }

  function shareLocation() {
    if (!("geolocation" in navigator)) {
      setNote("This browser can't share location.");
      return;
    }
    setLocating(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`/api/geo?lat=${coords.latitude.toFixed(3)}&lng=${coords.longitude.toFixed(3)}`);
          const { place, message } = await res.json();
          if (!res.ok) throw new Error(message);
          await circleApi.update(membership, { last_place: place });
          await circleApi.activity(membership, "location", `is in ${place}`);
          onChange();
        } catch (err) {
          setNote((err as Error).message || "Couldn't share your location.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setNote(err.code === err.PERMISSION_DENIED ? "Location is off for this site. Allow it in Settings → Safari → Location." : "Couldn't get your location. Try again.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <Card className="grid gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Share my updates</p>
          <p className="text-sm text-muted">{sharing ? "Payments and location appear in the feed." : "Paused. Nothing new is shared."}</p>
        </div>
        <button
          type="button"
          role="switch"
          id="sharing-switch"
          aria-checked={sharing}
          aria-label="Share my updates"
          onClick={toggle}
          className={clsx("relative h-8 w-14 shrink-0 rounded-full transition", sharing ? "bg-forest" : "bg-line")}
        >
          <span className={clsx("absolute top-1 size-6 rounded-full bg-white transition", sharing ? "left-7" : "left-1")} />
        </button>
      </div>
      {sharing && (
        <Button variant="ghost" onClick={shareLocation} disabled={locating}>
          {locating ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <MapPin size={18} aria-hidden />} Share where I am
        </Button>
      )}
      {note && <p className="text-sm text-warn">{note}</p>}
      <Eyebrow>Your exact location is never stored, only the city.</Eyebrow>
    </Card>
  );
}

function Chat({ feed, membership, name, onSent }: { feed: CircleFeed; membership: Membership; name: (id: string | null) => string; onSent: () => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [feed.messages.length]);

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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid max-h-[50dvh] gap-2 overflow-y-auto rounded-2xl bg-sunk p-3" aria-live="polite">
        {feed.messages.length === 0 && <p className="text-center text-sm text-muted">No messages yet. Say hi!</p>}
        {feed.messages.map((m) => {
          const mine = m.member_id === membership.memberId;
          return (
            <div key={m.id} className={clsx("max-w-[80%] rounded-2xl px-3 py-2", mine ? "justify-self-end bg-forest text-white" : "justify-self-start bg-surface")}>
              {!mine && <p className="text-xs font-bold text-muted">{name(m.member_id)}</p>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          id="chat-input"
          aria-label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder="Message your Circle"
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-3"
        />
        <Button type="submit" disabled={sending || !text.trim()} aria-label="Send"><Send size={18} /></Button>
      </form>
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
