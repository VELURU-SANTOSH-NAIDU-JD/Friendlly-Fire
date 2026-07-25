# Build Prompt: "Friendlly Fire" — A Truth-or-Dare Party Game Web App

Copy everything below into your coding agent (Claude Code, Cursor, etc.) as the project brief.

---

## 1. Project Overview

Build a full-stack web app called **Friendlly Fire**, a modern Truth-or-Dare party game with three modes:

1. **Local Mode** — one device, pass-around, classic bottle spin.
2. **Party Mode** — multiplayer via join link, one device per player, same room (same physical location or not). Core innovation: an anonymous/labeled **Question & Dare Bank** that players contribute to, instead of live-generated questions.
3. **Online Mode** — same as Party Mode, plus a text/voice answer box for Truth and a photo-upload proof step for Dare, since players aren't in the same room and can't visually/audibly confirm.

**No accounts. No persistent user data.** Everything is scoped to a game session (a "Room") and is deleted automatically after the game ends or after a timeout (e.g., 6 hours of inactivity), via MongoDB TTL indexes. There is no login — anyone with the join link/code can join.

**Target stack:** Next.js 14+ (App Router), deployed on Vercel, single repo for frontend + backend (API routes / Server Actions). MongoDB Atlas for state. Pusher (or Ably) for real-time push, since Vercel serverless functions cannot hold persistent WebSocket connections themselves. Tailwind CSS for styling. Mobile-first responsive design — this will mostly be played on phones.

---

## 2. Tech Stack (specific choices, don't substitute without reason)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ App Router | Single deploy, frontend+backend together |
| Hosting | Vercel | Stated deployment target |
| Database | MongoDB Atlas | Stated requirement; use TTL indexes for auto-expiry |
| Real-time | Pusher Channels (or Ably — pick one, Pusher has a simpler free tier) | Vercel functions are stateless/short-lived; can't hold Socket.io connections. Pusher/Ably handle the persistent WebSocket layer for you, app just publishes/subscribes via HTTP calls from API routes |
| File uploads (dare proof photos) | Vercel Blob (or Cloudinary free tier) with short expiry / manual delete on game end | Don't store binary blobs in MongoDB |
| Voice truth answers | Browser MediaRecorder API → upload as short audio blob to same temp storage, OR just live playback via WebRTC if you want to avoid storage entirely (recommend: recorded blob, simpler, played back on-demand, deleted with room) |
| Styling | Tailwind CSS | Fast, consistent, mobile-first utilities |
| State (client) | Zustand or React Context | Lightweight, no need for Redux |
| Animations (bottle spin) | Framer Motion or CSS transforms | Bottle spin needs to feel satisfying — invest real effort here |

---

## 3. Core Data Model (MongoDB collections)

```
Room {
  _id, code (6-char human-friendly, e.g. "FX9K2Q"),
  mode: "local" | "party" | "online",
  hostPlayerId,
  status: "lobby" | "in_progress" | "ended",
  settings: {
    allowAnonymous: bool,
    requireHostApproval: bool,   // moderation toggle, default true for party/online
    turnTimerSeconds: int,       // e.g. 60
    dareProofRequired: bool      // online mode only
  },
  createdAt (TTL index — auto-delete after e.g. 6h inactivity)
}

Player {
  _id, roomId, name, avatarSeed/emoji,
  isHost: bool,
  connectionStatus: "connected" | "disconnected",
  joinedAt
}

BankEntry {
  _id, roomId, type: "truth" | "dare",
  text,
  authorPlayerId (nullable if anonymous),
  isAnonymous: bool,
  visibility: "everyone" | "targeted",
  targetPlayerIds: [ids] (if targeted),
  approved: bool (for host-approval moderation),
  used: bool
}

Turn {
  _id, roomId, currentPlayerId, bankEntryId,
  phase: "spinning" | "revealed" | "answering" | "proof_pending" | "complete",
  answerText / answerAudioUrl / proofPhotoUrl,
  vetoUsed: bool,
  startedAt
}
```

Add a **TTL index on `createdAt`** in Room (and cascade-delete Players/BankEntries/Turns for that roomId via a scheduled cleanup or a Mongo `$lookup`-based cron/Vercel Cron job — Mongo TTL only auto-deletes the collection it's set on, so write a small cron endpoint that also purges child documents).

---

## 4. Page / Route Structure

```
/                          → landing: choose mode, create or join a game
/create?mode=local|party|online → room setup (name, settings)
/join/[code]               → join screen (enter your name/avatar)
/room/[code]/lobby         → waiting room, player list, host starts game
/room/[code]/play          → main game screen (mode-specific rendering)
/room/[code]/bank          → (party/online) add-to-bank screen, visible pre-game and mid-game
/api/rooms/...             → room CRUD
/api/players/...           → join/leave
/api/bank/...              → submit/approve/fetch bank entries
/api/turns/...             → spin, select, answer, veto
/api/pusher/auth           → Pusher private/presence channel auth
/api/cron/cleanup          → Vercel Cron: purge expired rooms + children
```

---

## 5. Game Flow by Mode

### Mode 1: Local (single device)
- No real-time backend needed at all — can be 100% client-side state (or a lightweight ephemeral Room doc if you want a shared code pattern, but not required).
- Host enters all player names up front.
- Tap to spin a bottle (animated), lands on a player.
- Group verbally decides Truth or Dare, asks live. No bank, no persistence needed.
- Keep this mode simple and offline-capable — it's the "just works, no setup" option.

### Mode 2: Party (multi-device, same room)
- Host creates room → gets a 6-char code + shareable link/QR code.
- Players join via link, pick a name/avatar, land in lobby.
- **Pre-game and mid-game**, any player can open the Bank screen and submit Truth/Dare entries:
  - Toggle: anonymous or labeled with their name.
  - Toggle: visible to everyone or targeted to specific players (multi-select).
  - If `requireHostApproval` is on, entries sit in a pending queue for host to approve/reject before entering the pool (this is your moderation lever — default ON).
- Host starts the round → spin animation (synced via Pusher event so everyone sees the same spin) → lands on random player.
- Server picks a random **eligible** bank entry: must be approved, unused, and either `visibility: everyone` or the selected player is in `targetPlayerIds`.
- Selected player sees Truth/Dare text; group plays it out live (verbal), same as normal.
- Host (or the selected player) marks turn complete → entry marked `used` → next spin.
- Handle edge case: no eligible entries left for that player → re-spin or show a friendly "add more to the bank" prompt.

### Mode 3: Online (multi-device, remote)
- Same lobby/bank/spin flow as Party Mode, plus:
  - **Truth answers**: text box (typed) and/or a "record voice answer" button (MediaRecorder → short audio clip uploaded, playable by the group).
  - **Dare answers**: photo upload as proof, shown to the group once uploaded.
  - Turn phase becomes `proof_pending` until the answer/proof is submitted, with the turn timer visible to everyone (creates fun pressure, also prevents stalling).
  - Everyone sees turn state live via Pusher (who's up, what phase, countdown).
- Reconnect handling: if a player's `connectionStatus` flips to `disconnected` (Pusher presence channel), show them as "away" in the player list rather than removing them; allow rejoin via the same link within the room's TTL window using a locally-stored (localStorage, not DB) player token.

---

## 6. Real-Time Events (Pusher channel design)

Use a **presence channel** per room: `presence-room-{code}`.

Events to publish from API routes and subscribe to on the client:
- `player-joined`, `player-left`, `player-status-changed`
- `bank-entry-added`, `bank-entry-approved`
- `spin-started` (broadcast the spin animation trigger + seed so all clients render the same spin), `spin-result`
- `turn-phase-changed` (spinning → revealed → answering → proof_pending → complete)
- `room-settings-changed`, `game-ended`

Keep payloads small (IDs, not full documents) — client refetches details via API route or you include minimal fields directly.

---

## 7. Moderation & Safety Guardrails (important — don't skip)

- **Host approval queue ON by default** for anonymous bank entries in Party/Online mode.
- Run a basic profanity/NSFW text filter (simple word-list or a lightweight library) on bank submissions as a first pass; host approval is the real backstop.
- Host can remove any bank entry or kick a player at any time.
- Photo/audio proof uploads: no public gallery — visible only within that room's session, deleted when the room expires.
- Add a short in-app content guideline line at bank-submission time (e.g. "Keep it fun, not harmful — host can remove anything").
- Since there's no age gate, keep default copy/tone playful-PG; let groups escalate via their own custom Dares rather than the app suggesting anything explicit.

---

## 8. Edge Cases to Handle Explicitly

- Host disconnects mid-game → auto-promote another connected player to host, or pause game and show "waiting for host" with a takeover option after N seconds.
- Selected player wants to skip/veto → allow one veto per player per game (configurable), then re-spin; track `vetoUsed`.
- Bank runs dry for a given player (no eligible entries) → friendly fallback prompt, don't crash the flow.
- Duplicate room codes → regenerate on collision (check DB before assigning).
- Uploaded photo/audio too large → client-side compress/limit before upload (e.g. max 5MB, resize images).
- Player joins after game already started → allow as spectator or let host admit into rotation (host's choice via a setting).

---

## 9. UI/UX Requirements

- Mobile-first (most players will be on phones, likely portrait). Desktop should still look good but design for phone first.
- The bottle spin should feel like the centerpiece — smooth animation, satisfying deceleration, maybe haptic feedback (`navigator.vibrate`) on mobile when it lands.
- Big, thumb-friendly tap targets throughout — this gets used one-handed at parties.
- Lobby screen should feel like a "waiting room" with visible avatars/names populating live as people join, plus the shareable link/QR code prominent.
- Use playful, energetic visual design (bold color, rounded shapes, fun micro-animations) — this is a party game, not a productivity tool. Avoid generic dashboard-style UI.
- Clear phase indicators during turns ("Waiting for Priya to answer...", countdown timer) so nobody's staring at a blank screen wondering what's happening.

---

## 10. Explicit Non-Goals (don't build these)

- No user accounts, login, or password auth of any kind.
- No permanent storage of names, photos, audio, or bank content beyond the room's lifetime.
- No cross-room history, stats, or leaderboards persisted between games.
- No payment/monetization features.

---

## 11. Build Order (suggested)

1. Scaffold Next.js app, Tailwind, MongoDB connection, basic Room/Player CRUD.
2. Build Local Mode end-to-end first (fully client-side, no real-time needed) — validates the spin animation and core game loop fastest.
3. Add Pusher integration + Room lobby + join flow for Party Mode.
4. Build the Bank submission/approval/selection logic.
5. Wire up the synced spin + turn state machine for Party Mode.
6. Extend to Online Mode: add text/voice answer and photo proof upload steps.
7. Add moderation guardrails, reconnect handling, and edge-case polish last.
