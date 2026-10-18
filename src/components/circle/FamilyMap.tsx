"use client";

import { useEffect, useState } from "react";
import { LOCALE, countryName } from "@/lib/i18n";
import { LAND_POINTS, MAP_H, MAP_W, WATER_POINTS, distanceKm, findCity, onMap, px, py, type City } from "@/lib/circle/geo";
import type { CirclePerson } from "@/lib/circle/demo";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

interface Placed extends CirclePerson {
  place: City | null;
  hidden: boolean;
}

/**
 * "Where everyone is": a city-level map of the Circle with each person's local time
 * and distance. Only cities are drawn. If the user pauses location sharing, their
 * own pin disappears from what the Circle sees.
 */
export function FamilyMap({
  people,
  sharing,
  onMessage,
  footer,
}: {
  people: CirclePerson[];
  /** The user's own "My location" switch. */
  sharing: boolean;
  /** Called when the user taps "Message {name}". */
  onMessage: (name: string) => void;
  footer?: React.ReactNode;
}) {
  const { t, state } = useApp();
  const locale = LOCALE[state.lang];
  const now = useClock();
  const placed: Placed[] = people.map((p) => {
    const place = findCity(p.city);
    return { ...p, place, hidden: p.isMe && !sharing };
  });
  const me = placed.find((p) => p.isMe);
  const others = placed.filter((p) => !p.isMe);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = placed.find((p) => p.id === selectedId) ?? others[0] ?? me;

  const visible = placed.filter((p) => p.place && onMap(p.place) && !p.hidden);
  const meVisible = me && visible.includes(me);

  const time = (tz: string) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now);
  const label = (p: Placed) => (p.relationKey ? t(p.relationKey) : p.relation);
  const where = (p: Placed) =>
    p.hidden ? t("cc_hiddenFromCircle") : p.place ? `${p.place.name}, ${countryName(state.lang, p.place.iso, "")}` : p.city || t("cc_noCity");

  const dist = selected && me?.place && selected.place && !selected.isMe && !me.hidden ? distanceKm(me.place, selected.place) : null;
  const number = (n: number) => new Intl.NumberFormat(locale).format(Math.round(n));
  const updated = (mins: number | undefined) =>
    mins === undefined ? null : mins <= 0 ? t("justNow") : new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-mins, "minute");

  return (
    <section className="card" aria-labelledby="map-heading" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h2 id="map-heading" className="disp" style={{ fontSize: 30 }}>{t("cc_mapTitle")}</h2>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t("cc_mapHint")}</p>
        </div>
        <span className={`pill ${sharing ? "p-ok" : "p-idle"}`}>
          <Icon name={sharing ? "check" : "lock"} size={12} stroke={3} />
          {sharing ? t("cc_youShare") : t("cc_youHidden")}
        </span>
      </div>

      <div className="row" style={{ alignItems: "stretch" }}>
        <figure className="fmap" style={{ flex: "999 1 460px", minWidth: 0, margin: 0 }}>
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            role="img"
            aria-label={t("cc_mapLabel", { list: visible.map((p) => `${p.name}, ${p.place!.name}`).join("; ") })}
          >
            <rect width={MAP_W} height={MAP_H} fill="#163300" />
            <g stroke="rgba(159,232,112,.08)" strokeWidth="1">
              {[0, 15, 30, 45, 60, 75, 90].map((lon) => <line key={`lon${lon}`} x1={px(lon)} y1="0" x2={px(lon)} y2={MAP_H} />)}
              {[15, 30, 45, 60].map((lat) => <line key={`lat${lat}`} x1="0" y1={py(lat)} x2={MAP_W} y2={py(lat)} />)}
            </g>
            <g fill="#24500A" stroke="rgba(159,232,112,.35)" strokeWidth="1.5" strokeLinejoin="round">
              {LAND_POINTS.map((pts, i) => <polygon key={i} points={pts} />)}
            </g>
            <g fill="#163300">
              {WATER_POINTS.map((pts, i) => <polygon key={i} points={pts} />)}
            </g>

            {meVisible &&
              visible
                .filter((p) => !p.isMe)
                .map((p) => {
                  const x1 = px(me!.place!.lon), y1 = py(me!.place!.lat), x2 = px(p.place!.lon), y2 = py(p.place!.lat);
                  const on = p.id === selected?.id;
                  return (
                    <path
                      key={`arc-${p.id}`}
                      className="fmap-arc"
                      d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 130} ${x2} ${y2}`}
                      fill="none"
                      stroke={on ? "#FF9A1F" : "rgba(159,232,112,.45)"}
                      strokeWidth={on ? 3 : 2}
                      strokeDasharray="6 8"
                      strokeLinecap="round"
                    />
                  );
                })}

            {visible.map((p) => {
              const on = p.id === selected?.id;
              const x = px(p.place!.lon), y = py(p.place!.lat);
              const above = y > MAP_H * 0.6;
              const text = `${p.name} · ${p.place!.name}`;
              const w = Math.max(110, text.length * 8.6 + 28);
              return (
                <g
                  key={p.id}
                  className="pin"
                  transform={`translate(${x} ${y})`}
                  onClick={() => setSelectedId(p.id)}
                  style={{ cursor: "pointer" }}
                >
                  {on && <circle className="pulse" r="30" fill={p.bg} opacity=".35" />}
                  <circle r="21" fill={p.bg} stroke={on ? "#FF9A1F" : "#163300"} strokeWidth="3" />
                  <text y="7" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="900" fontSize="20" fill={p.fg}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </text>
                  <g transform={`translate(0 ${above ? -62 : 32})`}>
                    <rect x={-w / 2} y="0" width={w} height="32" rx="16" fill="#0E0F0C" opacity=".85" />
                    <text x="0" y="21" textAnchor="middle" fontFamily="Figtree, sans-serif" fontWeight="700" fontSize="15" fill="#fff">{text}</text>
                  </g>
                </g>
              );
            })}
          </svg>
        </figure>

        <div style={{ flex: "1 1 280px", display: "grid", gap: 10, alignContent: "start", minWidth: 0 }}>
          <ul style={{ display: "grid", gap: 6 }} aria-label={t("cc_people")}>
            {placed.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="tl-item cc-person"
                  aria-pressed={p.id === selected?.id}
                  onClick={() => setSelectedId(p.id)}
                >
                  <span className="av" style={{ background: p.bg, color: p.fg }} aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>
                  <span className="what">
                    <b>
                      {p.name}
                      {label(p) !== p.name && <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}> · {label(p)}</span>}
                    </b>
                    <small>{where(p)}</small>
                  </span>
                  <span className="mono num" style={{ fontSize: 13, fontWeight: 600 }}>{p.place && !p.hidden ? time(p.place.tz) : "—"}</span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="cc-selected" aria-live="polite">
              <span className="eyebrow" style={{ color: "var(--saffron-ink)" }}>
                {selected.name}
                {updated(selected.updatedMinsAgo) && <> · {updated(selected.updatedMinsAgo)}</>}
              </span>
              <b style={{ fontSize: 17 }}>
                {selected.hidden
                  ? t("cc_hiddenFromCircle")
                  : selected.statusKey && selected.place
                    ? t("cc_statusIn", { status: t(selected.statusKey), city: selected.place.name })
                    : where(selected)}
              </b>
              {selected.place && !selected.hidden && (
                <span className="num" style={{ fontSize: 14 }}>
                  {t("cc_localTime", { time: time(selected.place.tz) })}
                  {dist !== null && <> · {t("cc_distance", { km: number(dist), mi: number(dist * 0.621371) })}</>}
                </span>
              )}
              {!selected.isMe && (
                <button type="button" className="btn saffron sm" style={{ justifySelf: "start", marginTop: 4 }} onClick={() => onMessage(selected.name)}>
                  <Icon name="send" size={16} />
                  {t("cc_messageOne", { name: selected.name })}
                </button>
              )}
            </div>
          )}
          {footer}
        </div>
      </div>
    </section>
  );
}

/** Current time, refreshed every 30 seconds so local times stay right during a demo. */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
