"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_PAID, PERSON } from "@/lib/demo-data";
import { DEMO_CHAT, DEMO_PEOPLE, PALETTE, PAYMENT_WORDS, type ChatLine, type CirclePerson } from "@/lib/circle/demo";
import { circleApi, useCircleFeed, useMembership, type CircleFeed, type Membership } from "@/lib/circle/client";
import { relationLabel } from "@/lib/circle/strings";
import { LOCALE } from "@/lib/i18n";
import type { MessageKey } from "@/lib/messages/en";
import { useApp, type CircleShareKey } from "@/state/app-state";
import { Dialog } from "../roadmap/Dialog";
import { Icon, type IconName } from "../Icon";
import { FamilyMap } from "./FamilyMap";
import { PersonForm } from "./PersonForm";
import { useCT } from "./useCT";
import "./circle.css";

/** One line in the Activity list, already in the user's language. */
interface ActivityRow {
  id: string;
  icon: IconName;
  who: string;
  text: string;
  time: string;
  family: boolean;
}

/**
 * LifeSwitch Circle. Until the user starts a real Circle, a sample family (Mum in
 * Chennai, Ravi in Dubai) shows how it works, reacting live to payments made in the
 * app. Once a real Circle exists, the same screen shows the real members, feed and
 * chat from Postgres.
 */
export function CirclePage() {
  const [membership, setMembership] = useMembership();
  if (membership === undefined) return null; // known only after the first render
  return membership ? (
    <LiveCircle membership={membership} onLeave={() => setMembership(null)} />
  ) : (
    <SampleCircle onCreated={setMembership} />
  );
}

// ---------------------------------------------------------------- sample Circle

function SampleCircle({ onCreated }: { onCreated: (m: Membership) => void }) {
  const { t, state, dispatch, items, itemText, fmt, trip } = useApp();
  const share = state.circleShare;
  const [inviteOpen, setInviteOpen] = useState(false);
  const chatInput = useRef<HTMLInputElement>(null);

  const people = useMemo<CirclePerson[]>(
    () => DEMO_PEOPLE.map((p) => (p.isMe ? { ...p, name: PERSON.name, city: trip.to.city } : p)),
    [trip.to.city],
  );
  const nameOf = (id: string) => (id === "mum" ? t("mum") : people.find((p) => p.id === id)?.name ?? "");
  const display = people.map((p) => ({ ...p, name: p.id === "mum" ? t("mum") : p.name }));

  // Payments made during this demo (not the one already paid at the start).
  const freshPaid = items.filter((i) => state.paid[i.id] && !INITIAL_PAID[i.id]);
  const lower = (s: string) => s.charAt(0).toLocaleLowerCase(LOCALE[state.lang]) + s.slice(1);

  const chat: ChatLine[] = [
    ...DEMO_CHAT.map((c) => ({ id: c.id, from: c.from, text: t(c.key), time: c.time })),
    ...(share.payments ? freshPaid.map((i) => ({ id: `paid-${i.id}`, from: "sys", text: t("cc_canSee", { title: itemText(i, "title") }) })) : []),
    ...state.circleChat,
  ];

  const activity: ActivityRow[] = [];
  if (share.payments) {
    for (const i of [...freshPaid].reverse()) {
      activity.push({ id: `r-${i.id}`, icon: "heart", who: t("mum"), text: t("cc_reacted", { title: itemText(i, "title") }), time: t("justNow"), family: true });
      activity.push({ id: `p-${i.id}`, icon: "check", who: t("you"), text: t("feedPaid", { title: lower(itemText(i, "title")) }), time: t("justNow"), family: false });
    }
  }
  if (share.reminders) {
    activity.push({ id: "rem", icon: "bell", who: t("you"), text: t("feedReminder"), time: fmt.ago(2), family: false });
    activity.push({ id: "rem-r", icon: "heart", who: t("mum"), text: t("feedReacted"), time: fmt.ago(2), family: true });
  }
  if (share.arrival) {
    activity.push({ id: "trip", icon: "plane", who: t("you"), text: t("cc_travel", { from: trip.from.city, to: trip.to.city }), time: fmt.ago(26), family: false });
  }
  activity.push({ id: "ravi", icon: "users", who: "Ravi", text: t("feedJoined"), time: fmt.ago(30), family: true });
  if (share.payments && state.paid.hold) {
    const hold = items.find((i) => i.id === "hold");
    if (hold) activity.push({ id: "hold", icon: "check", who: t("you"), text: t("feedPaid", { title: lower(itemText(hold, "title")) }), time: fmt.shortDate(hold.due), family: false });
  }

  const replyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(replyTimer.current), []);

  function send(text: string) {
    const time = new Intl.DateTimeFormat(LOCALE[state.lang], { hour: "2-digit", minute: "2-digit" }).format(new Date());
    dispatch({ type: "addCircleChat", line: { id: `me-${Date.now()}`, from: "me", text, time } });
    clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      const reply = PAYMENT_WORDS.test(text) ? t("cc_replyPaid") : t("cc_replyOther");
      dispatch({ type: "addCircleChat", line: { id: `mum-${Date.now()}`, from: "mum", text: reply, time } });
    }, 1400);
  }

  return (
    <>
      <Header onInvite={() => setInviteOpen(true)} badge={<span className="pill p-fam">{t("cc_sample")}</span>} />
      <ShareSettings />
      <div className="row" style={{ alignItems: "stretch" }}>
        <ChatCard
          lines={chat}
          people={display}
          nameOf={nameOf}
          onSend={send}
          inputRef={chatInput}
          placeholder={t("cc_messageTo", { names: t("cc_and", { a: t("mum"), b: "Ravi" }) })}
        />
        <ActivityCard rows={activity} />
      </div>
      <FamilyMap people={display} sharing={share.location} onMessage={() => focusChat(chatInput)} />
      {inviteOpen && <InviteDialog onClose={() => setInviteOpen(false)} onCreated={onCreated} />}
    </>
  );
}

// ---------------------------------------------------------------- live Circle

function LiveCircle({ membership, onLeave }: { membership: Membership; onLeave: () => void }) {
  const { t, state } = useApp();
  const ct = useCT();
  const { feed, error, refresh } = useCircleFeed(membership.code);
  const chatInput = useRef<HTMLInputElement>(null);
  const share = state.circleShare;

  // The server keeps one "sharing" flag per member: on when payments or location are shared.
  const wantSharing = share.payments || share.location;
  const me = feed?.members.find((m) => m.id === membership.memberId);
  useEffect(() => {
    if (me && me.sharing !== wantSharing) circleApi.update(membership, { sharing: wantSharing }).then(refresh).catch(() => {});
  }, [me, wantSharing, membership, refresh]);

  if (error?.code === "not_found") {
    return (
      <div className="card" style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <p>{ct("gone")}</p>
        <button type="button" className="btn ghost" onClick={onLeave}>{ct("startNew")}</button>
      </div>
    );
  }
  if (error) {
    return (
      <>
        <div className="banner warn" role="alert">
          <Icon name="alert" size={20} />
          <span className="grow">{error.code === "no_db" ? ct("noDb") : ct("errGeneric")}</span>
          <button type="button" className="btn ink sm" onClick={onLeave}>{ct("startNew")}</button>
        </div>
      </>
    );
  }
  if (!feed) return <p className="muted">{ct("loading")}</p>;

  const people = toPeople(feed, membership, state.lang);
  const nameOf = (id: string) => feed.members.find((m) => m.id === id)?.name ?? "?";
  const others = people.filter((p) => !p.isMe).map((p) => p.name);
  const lines: ChatLine[] = feed.messages.map((m) => ({
    id: String(m.id),
    from: m.member_id ?? "sys",
    text: m.body,
    time: new Intl.DateTimeFormat(LOCALE[state.lang], { hour: "2-digit", minute: "2-digit" }).format(new Date(m.at)),
  }));
  const rows: ActivityRow[] = feed.activities.map((a) => ({
    id: String(a.id),
    icon: a.kind === "payment" ? "check" : a.kind === "location" ? "pin" : a.kind === "milestone" ? "users" : "heart",
    who: a.member_id === membership.memberId ? t("you") : nameOf(a.member_id ?? ""),
    text: a.text,
    time: ago(a.at, state.lang, t("justNow")),
    family: a.member_id !== membership.memberId,
  }));

  return (
    <>
      <Header code={feed.circle.code} badge={<span className="pill p-ok">{t("cc_live")}</span>} />
      <ShareSettings />
      <div className="row" style={{ alignItems: "stretch" }}>
        <ChatCard
          lines={lines}
          people={people}
          nameOf={nameOf}
          meId={membership.memberId}
          inputRef={chatInput}
          placeholder={others.length ? t("cc_messageTo", { names: joinNames(others, t) }) : ct("messagePlaceholder")}
          onSend={async (text) => {
            await circleApi.say(membership, text);
            refresh();
          }}
        />
        <ActivityCard rows={rows} />
      </div>
      <FamilyMap
        people={people}
        sharing={share.location}
        onMessage={() => focusChat(chatInput)}
        footer={share.location && <UpdateCity membership={membership} onDone={refresh} />}
      />
    </>
  );
}

function toPeople(feed: CircleFeed, membership: Membership, lang: Parameters<typeof relationLabel>[0]): CirclePerson[] {
  const mine = feed.members.find((m) => m.id === membership.memberId);
  const ordered = mine ? [mine, ...feed.members.filter((m) => m !== mine)] : feed.members;
  return ordered.map((m, i) => ({
    id: m.id,
    name: m.name,
    relation: relationLabel(lang, m.relation),
    city: m.last_place,
    bg: PALETTE[i % PALETTE.length].bg,
    fg: PALETTE[i % PALETTE.length].fg,
    isMe: m.id === membership.memberId,
    updatedMinsAgo: Math.max(0, Math.round((Date.now() - new Date(m.last_seen).getTime()) / 60_000)),
  }));
}

// ---------------------------------------------------------------- shared pieces

function Header({ onInvite, code, badge }: { onInvite?: () => void; code?: string; badge: React.ReactNode }) {
  const { t, notify } = useApp();
  const ct = useCT();

  async function shareLink() {
    if (!code) return onInvite?.();
    const url = `${location.origin}/circle/join/${code}`;
    try {
      if (navigator.share) await navigator.share({ title: t("cc_title"), text: ct("inviteText"), url });
      else {
        await navigator.clipboard.writeText(url);
        notify(ct("linkCopied"));
      }
    } catch {
      /* share sheet closed */
    }
  }

  return (
    <div className="phead">
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 className="disp">{t("cc_title")}</h1>
          {badge}
        </div>
        <p>{t("sub_circle")}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href="/split" className="btn ghost">
          <Icon name="receipt" size={18} />
          {t("cc_split")}
        </Link>
        <button type="button" className="btn saffron" onClick={shareLink}>
          <Icon name="users" size={18} />
          {t("cc_invite")}
          {code && <span className="mono" style={{ opacity: 0.75 }}>{code}</span>}
        </button>
      </div>
    </div>
  );
}

const SHARE_ROWS: { key: CircleShareKey; title: MessageKey; hint: MessageKey }[] = [
  { key: "payments", title: "cc_s_payments", hint: "cc_s_paymentsHint" },
  { key: "arrival", title: "cc_s_arrival", hint: "cc_s_arrivalHint" },
  { key: "reminders", title: "cc_s_reminders", hint: "cc_s_remindersHint" },
  { key: "location", title: "cc_s_location", hint: "cc_s_locationHint" },
];

/** "What your Circle sees": four opt-in switches, saved on this device. */
function ShareSettings() {
  const { t, state, dispatch, notify, trip } = useApp();
  return (
    <section className="card" aria-labelledby="sees-heading" style={{ display: "grid", gap: 12, padding: "18px 22px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 12px" }}>
        <h2 id="sees-heading" className="disp" style={{ fontSize: 22 }}>{t("cc_seesTitle")}</h2>
        <span className="muted" style={{ fontSize: 13 }}>{t("cc_seesHint")}</span>
      </div>
      <ul className="cc-share">
        {SHARE_ROWS.map((row) => {
          const on = state.circleShare[row.key];
          const id = `share-${row.key}`;
          return (
            <li key={row.key}>
              <label htmlFor={id} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                <b>{t(row.title)}</b>
                <span className="muted">{t(row.hint, { city: trip.to.city })}</span>
              </label>
              <span className="switch">
                <input
                  id={id}
                  type="checkbox"
                  role="switch"
                  checked={on}
                  aria-label={t("cc_shareLabel", { what: t(row.title) })}
                  onChange={(e) => {
                    dispatch({ type: "setCircleShare", key: row.key, on: e.target.checked });
                    notify(e.target.checked ? t("cc_sharingOn") : t("cc_sharingOff"));
                  }}
                />
                <span aria-hidden="true" />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ChatCard({
  lines,
  people,
  nameOf,
  meId = "me",
  onSend,
  inputRef,
  placeholder,
}: {
  lines: ChatLine[];
  people: CirclePerson[];
  nameOf: (id: string) => string;
  meId?: string;
  onSend: (text: string) => void | Promise<void>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
}) {
  const { t } = useApp();
  const ct = useCT();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const colours = Object.fromEntries(people.map((p) => [p.id, p]));

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(false);
    try {
      await onSend(body);
      setText("");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section className="card" style={{ flex: "999 1 420px", display: "grid", gap: 14, alignContent: "start" }} aria-labelledby="chat-heading">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 id="chat-heading" className="disp" style={{ fontSize: 26, flex: 1 }}>{t("cc_chatTitle")}</h2>
        <span style={{ display: "flex" }} aria-hidden="true">
          {people.slice(0, 5).map((p, n) => (
            <span key={p.id} className="av cc-mini" style={{ background: p.bg, color: p.fg, marginLeft: n ? -8 : 0 }}>
              {p.name.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </span>
      </div>
      <div ref={box} className="cc-chat" aria-live="polite">
        {lines.length === 0 && <p className="muted" style={{ textAlign: "center", fontSize: 14 }}>{ct("noMessages")}</p>}
        {lines.map((m) =>
          m.from === "sys" ? (
            <div key={m.id} className="msg sys">{m.text}</div>
          ) : (
            <div key={m.id} className={`msg ${m.from === meId ? "me" : "them"}`}>
              {m.from !== meId && (
                <b style={{ fontSize: 12, color: colours[m.from]?.fg }}>{nameOf(m.from)}</b>
              )}
              <span>{m.text}</span>
              {m.time && <small>{m.time}</small>}
            </div>
          ),
        )}
      </div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          id="cc-message"
          className="input"
          aria-label={placeholder}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          autoComplete="off"
        />
        <button type="submit" className="btn dark" disabled={busy || !text.trim()} aria-label={t("cc_send")}>
          <Icon name="send" size={18} />
        </button>
      </form>
      {error && <p style={{ color: "var(--warn)", fontSize: 13 }}>{ct("errGeneric")}</p>}
    </section>
  );
}

function ActivityCard({ rows }: { rows: ActivityRow[] }) {
  const { t } = useApp();
  return (
    <section className="card" style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column" }} aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="disp" style={{ fontSize: 24, marginBottom: 6 }}>{t("cc_activity")}</h2>
      <ul className="cc-feed" aria-live="polite">
        {rows.map((r) => (
          <li key={r.id}>
            <span className={`cc-feed-ic${r.family ? " fam" : ""}`} aria-hidden="true"><Icon name={r.icon} size={18} /></span>
            <span>
              <b>{r.who}</b> {r.text}
              <br />
              <span className="mono muted" style={{ fontSize: 11 }}>{r.time}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Start a real Circle (needs the shared database) or join one with a code. */
function InviteDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (m: Membership) => void }) {
  const { t } = useApp();
  const ct = useCT();
  const [code, setCode] = useState("");
  return (
    <Dialog labelledBy="invite-title" onClose={onClose} style={{ maxWidth: 460 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h2 id="invite-title" className="disp" style={{ fontSize: 28 }}>{t("cc_inviteTitle")}</h2>
        <button type="button" className="x-btn" onClick={onClose} aria-label={t("cc_close")}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <p className="muted">{t("cc_inviteBody")}</p>
      <PersonForm
        submitLabel={ct("create")}
        defaultName={PERSON.name}
        defaultRelation="Student"
        onSubmit={async (p) => onCreated(await circleApi.create(p))}
      />
      <hr style={{ border: "none", borderTop: "1px solid var(--line)" }} />
      <form
        style={{ display: "grid", gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim().toUpperCase();
          if (c.length === 6) location.href = `/circle/join/${c}`;
        }}
      >
        <label className="flabel" htmlFor="cc-join-code">{ct("haveCode")}</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="cc-join-code" className="input mono" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="ABC123" style={{ textTransform: "uppercase", letterSpacing: "0.15em" }} />
          <button type="submit" className="btn ghost" disabled={code.trim().length !== 6}>{ct("join")}</button>
        </div>
      </form>
    </Dialog>
  );
}

/** Share the user's current city (never the exact position) with a real Circle. */
function UpdateCity({ membership, onDone }: { membership: Membership; onDone: () => void }) {
  const { t } = useApp();
  const ct = useCT();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) return setNote(ct("locNoSupport"));
    setBusy(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`/api/geo?lat=${coords.latitude.toFixed(3)}&lng=${coords.longitude.toFixed(3)}`);
          const json = await res.json();
          if (!res.ok) throw new Error(json.message);
          await circleApi.update(membership, { last_place: json.place });
          await circleApi.activity(membership, "location", `is in ${json.place}`);
          onDone();
        } catch {
          setNote(ct("locFail"));
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        setNote(err.code === err.PERMISSION_DENIED ? ct("locDenied") : ct("locFail"));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [ct, membership, onDone]);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <button type="button" className="btn ghost sm" onClick={locate} disabled={busy} style={{ justifySelf: "start" }}>
        <Icon name="pin" size={16} />
        {busy ? t("cc_locating") : t("cc_updateCity")}
      </button>
      {note && <p style={{ color: "var(--warn)", fontSize: 13 }}>{note}</p>}
    </div>
  );
}

function focusChat(ref: React.RefObject<HTMLInputElement | null>) {
  ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  ref.current?.focus({ preventScroll: true });
}

function joinNames(names: string[], t: ReturnType<typeof useApp>["t"]): string {
  if (names.length <= 1) return names.join("");
  return t("cc_and", { a: names.slice(0, -1).join(", "), b: names[names.length - 1] });
}

function ago(iso: string, lang: keyof typeof LOCALE, justNow: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return justNow;
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: "auto" });
  if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour");
  return rtf.format(-Math.floor(s / 86400), "day");
}
