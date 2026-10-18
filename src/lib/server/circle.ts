import { db } from "./db";

/** Circle data access. Server-side only; routes in /api/circle call these. */

export interface CircleMemberRow {
  id: string;
  name: string;
  relation: string;
  sharing: boolean;
  last_place: string | null;
  last_seen: string;
}

export interface CircleFeed {
  circle: { code: string; name: string };
  members: CircleMemberRow[];
  activities: { id: number; member_id: string | null; kind: string; text: string; at: string }[];
  messages: { id: number; member_id: string | null; body: string; at: string }[];
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export async function createCircle(owner: { name: string; relation: string }) {
  const pool = await db();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const res = await pool.query(
      `with c as (insert into circles (code, name) values ($1, $2) on conflict (code) do nothing returning id, code)
       insert into circle_members (circle_id, name, relation)
       select id, $3, $4 from c returning id, (select code from c) as code`,
      [code, `${owner.name}'s Circle`, owner.name, owner.relation],
    );
    if (res.rowCount) {
      const { id, code: c } = res.rows[0];
      await addActivity(c, id, "milestone", `${owner.name} started the Circle`);
      return { code: c as string, memberId: id as string };
    }
  }
  throw new Error("Couldn't create a unique invite code.");
}

export async function joinCircle(code: string, member: { name: string; relation: string }) {
  const pool = await db();
  const res = await pool.query(
    `insert into circle_members (circle_id, name, relation)
     select id, $2, $3 from circles where code = $1 returning id`,
    [code, member.name, member.relation],
  );
  if (!res.rowCount) return null;
  const memberId = res.rows[0].id as string;
  await addActivity(code, memberId, "milestone", `${member.name} joined the Circle`);
  return { code, memberId };
}

export async function getFeed(code: string, since: { activity?: number; message?: number } = {}): Promise<CircleFeed | null> {
  const pool = await db();
  const c = await pool.query(`select id, code, name from circles where code = $1`, [code]);
  if (!c.rowCount) return null;
  const circleId = c.rows[0].id;
  const [members, activities, messages] = await Promise.all([
    pool.query(
      `select id, name, relation, sharing, case when sharing then last_place end as last_place, last_seen
       from circle_members where circle_id = $1 order by created_at`,
      [circleId],
    ),
    pool.query(
      `select id::int, member_id, kind, text, at from circle_activities
       where circle_id = $1 and id > $2 order by id desc limit 50`,
      [circleId, since.activity ?? 0],
    ),
    pool.query(
      `select id::int, member_id, body, at from circle_messages
       where circle_id = $1 and id > $2 order by id desc limit 100`,
      [circleId, since.message ?? 0],
    ),
  ]);
  return {
    circle: { code: c.rows[0].code, name: c.rows[0].name },
    members: members.rows,
    activities: activities.rows,
    messages: messages.rows.reverse(),
  };
}

/** Writes only if the member belongs to this circle. Returns false otherwise. */
async function memberInCircle(code: string, memberId: string) {
  const pool = await db();
  const r = await pool.query(
    `select m.circle_id, m.sharing from circle_members m join circles c on c.id = m.circle_id where c.code = $1 and m.id = $2`,
    [code, memberId],
  );
  return r.rowCount ? (r.rows[0].circle_id as string) : null;
}

async function isSharing(memberId: string) {
  const pool = await db();
  const r = await pool.query(`select sharing from circle_members where id = $1`, [memberId]);
  return Boolean(r.rows[0]?.sharing);
}

export async function addActivity(code: string, memberId: string, kind: string, text: string) {
  const circleId = await memberInCircle(code, memberId);
  if (!circleId) return false;
  // Sharing is opt-in: payments and location only reach the feed while the member is sharing.
  if ((kind === "payment" || kind === "location") && !(await isSharing(memberId))) return true;
  const pool = await db();
  await pool.query(`insert into circle_activities (circle_id, member_id, kind, text) values ($1, $2, $3, $4)`, [
    circleId, memberId, kind, text.slice(0, 280),
  ]);
  return true;
}

export async function postMessage(code: string, memberId: string, body: string) {
  const circleId = await memberInCircle(code, memberId);
  if (!circleId) return false;
  const pool = await db();
  await pool.query(`insert into circle_messages (circle_id, member_id, body) values ($1, $2, $3)`, [
    circleId, memberId, body.slice(0, 1000),
  ]);
  await pool.query(`update circle_members set last_seen = now() where id = $1`, [memberId]);
  return true;
}

export async function updateMember(code: string, memberId: string, patch: { sharing?: boolean; last_place?: string }) {
  const circleId = await memberInCircle(code, memberId);
  if (!circleId) return false;
  const pool = await db();
  await pool.query(
    `update circle_members set sharing = coalesce($2, sharing), last_place = coalesce($3, last_place), last_seen = now() where id = $1`,
    [memberId, patch.sharing ?? null, patch.last_place ?? null],
  );
  return true;
}
