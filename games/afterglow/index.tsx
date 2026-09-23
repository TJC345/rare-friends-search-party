"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { GameMenu } from "@rarefriends/friendsdk/frame";
import { ItemArt, formatGameAmount } from "@rarefriends/friendsdk/ui";
import { maximumPrize, type GameSnapshot } from "@rarefriends/friendsdk/game";
import {
  createFriendSoundKit,
  type FriendSoundCue,
  type FriendSoundKit,
} from "@rarefriends/friendsdk/sounds";
import type { GameItem } from "@rarefriends/friendsdk/items";
import { SearchWorld, type FriendSearchIdentity } from "./world";
import "./style.css";

type Screen =
  "map" | "dispatch" | "reveal" | "archive" | "mystery" | "odds" | "faq" | "settings";
type Destination = {
  id: string;
  name: string;
  eyebrow: string;
  time: string;
  minutes: number;
  testSeconds: number;
  risk: string;
  description: string;
  color: string;
  signal: string;
};
type Preparation = { id: string; name: string; note: string; effect: string };
type Expedition = {
  playId: string;
  settlementOutcomeId: number;
  artifactId: number | null;
  zonkId?: string;
  boosted: boolean;
  chance: number;
  destinationId: string;
  preparationId: string;
  started: number;
  end: number;
  duration: number;
  restored?: boolean;
};
type Discovery = {
  id: string;
  kind: "artifact" | "zonk";
  outcomeId?: number;
  zonkId?: string;
  destinationId: string;
  preparationId: string;
  foundAt: number;
  cluePoints: number;
  rfPayout?: string;
};
type RevealedFind = {
  id: bigint;
  artifactId: number | null;
  zonkId?: string;
  boosted: boolean;
  chance: number;
  payout: bigint;
  milestone: bigint;
  signal: number;
};
const destinations: readonly Destination[] = [
  {
    id: "mempool",
    name: "THE MEMPOOL",
    eyebrow: "30 MINUTE SEARCH",
    time: "00:30",
    minutes: 30,
    testSeconds: 25,
    risk: "LOW STATIC",
    description:
      "Fresh blocks, loose gas and transactions that never quite landed.",
    color: "#caff00",
    signal: "Fast fragments and everyday artifacts",
  },
  {
    id: "bridge",
    name: "BRIDGE CITY",
    eyebrow: "4 HOUR SEARCH",
    time: "04:00",
    minutes: 240,
    testSeconds: 50,
    risk: "MEDIUM STATIC",
    description:
      "Cross-chain alleys full of receipts, relayers and questionable shortcuts.",
    color: "#8ed8ff",
    signal: "Receipts, coordinates and stronger clues",
  },
  {
    id: "graveyard",
    name: "NFT GRAVEYARD",
    eyebrow: "10 HOUR SEARCH",
    time: "10:00",
    minutes: 600,
    testSeconds: 75,
    risk: "HIGH STATIC",
    description:
      "Abandoned mints, forgotten JPEGs and metadata that still whispers.",
    color: "#ff8be8",
    signal: "Strange artifacts and anomaly signals",
  },
] as const;
const preparations: readonly Preparation[] = [
  {
    id: "snack",
    name: "BLOCK SNACK",
    note: "Steady and dependable.",
    effect: "+1 Community Signal on every return.",
  },
  {
    id: "antenna",
    name: "SIGNAL ANTENNA",
    note: "Tunes into the shared mystery.",
    effect: "+2 Community Signal when an artifact is found.",
  },
  {
    id: "charm",
    name: "LUCKY CHARM",
    note: "No promises. Excellent vibes.",
    effect: "+5 percentage points to artifact chance.",
  },
] as const;
const rows = [
  [
    "................",
    "......####......",
    "....########....",
    "...##..##..##...",
    "....########....",
    "......####......",
    "................",
    "................",
  ],
  [
    "..############..",
    "..##..........##",
    "..##..######..##",
    "..##..##..##..##",
    "..##..######..##",
    "..##..........##",
    "..############..",
    "................",
  ],
  [
    ".......##.......",
    ".....######.....",
    "....##.##.##....",
    "...##..##..##...",
    "....##.##.##....",
    ".....######.....",
    ".......##.......",
    "................",
  ],
  [
    "...##......##...",
    "....##....##....",
    "..############..",
    "..##..####..##..",
    "..##........##..",
    "...##########...",
    ".....##..##.....",
    "................",
  ],
  [
    "......####......",
    "....########....",
    "...##..##..##...",
    "..##...##...##..",
    "...##..##..##...",
    "....########....",
    "......####......",
    "................",
  ],
  [
    "..##........##..",
    "...###......###.",
    "....###....###..",
    ".....########...",
    "....##########..",
    "...###..##..###.",
    "..##....##....##",
    "................",
  ],
  [
    ".......##.......",
    "...##..##..##...",
    "....########....",
    "..############..",
    ".####..####..####",
    "...##########...",
    ".....######.....",
    ".......##.......",
  ],
] as const;
const rarity = [
  "common",
  "common",
  "uncommon",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const;
const lore = [
  "A tiny record of a very expensive moment.",
  "It confirms that something crossed. It refuses to say what.",
  "Still unclaimed. Still somehow promising.",
  "Soft, suspicious and definitely pulled from under someone.",
  "A mint that should not exist on any known block.",
  "The whitepaper says everything and explains nothing.",
  "One of a pair. The other may contain the private key.",
] as const;
const rf = (value: bigint) => `${formatGameAmount(value, 18)} RF`;
const clock = (seconds: number) => {
  const value = Math.max(0, Math.ceil(seconds)),
    hours = Math.floor(value / 3600),
    minutes = Math.floor((value % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
};
const destinationFor = (id: string) =>
  destinations.find((value) => value.id === id) ?? destinations[0];
const preparationFor = (id: string) =>
  preparations.find((value) => value.id === id) ?? preparations[0];
const clueValues = [1, 1, 2, 2, 4, 7, 15] as const;
const generationOdds = [65, 55, 45, 36, 28, 21, 15] as const;
const familySpecialties = ["graveyard", "mempool", "bridge", "bridge", "mempool", "bridge", "graveyard", "mempool", "graveyard"] as const;
const boostBonus = 15;
const RF_UNIT = 10n ** 18n;
const FIELD_FUNDS = 4n * RF_UNIT / 10n;
const BOOST_PRICE = RF_UNIT / 4n;
const artifactPayouts = [RF_UNIT / 10n, RF_UNIT / 10n, RF_UNIT / 4n, RF_UNIT / 4n, 3n * RF_UNIT / 4n, 3n * RF_UNIT / 2n, 4n * RF_UNIT] as const;
const milestonePayouts = new Map([[3, RF_UNIT], [5, 3n * RF_UNIT], [7, 8n * RF_UNIT]]);
const destinationArtifacts: Readonly<Record<string, readonly number[]>> = {
  mempool: [1, 2, 3],
  bridge: [1, 2, 3, 4, 5],
  graveyard: [1, 2, 3, 4, 5, 6, 7],
};
const zonks = [
  { id: "discord", name: "EXPIRED DISCORD INVITE", note: "The alpha was apparently in there." },
  { id: "floor", name: "YESTERDAY'S FLOOR PRICE", note: "Historically accurate. Emotionally devastating." },
  { id: "airpod", name: "ONE LEFT AIRPOD", note: "The right one may be bridging." },
  { id: "gas", name: "GASLESS GAS RECEIPT", note: "Paid nothing. Received even less." },
  { id: "rug", name: "DEFINITELY NOT A RUG", note: "It is a very small rug." },
] as const;
const zonkRows = [
  "................", "...##########...", "..##........##..", ".....######.....",
  "......####......", ".......##.......", "................", "................",
] as const;
const roll = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max;
const oddsFor = (generation?: number) => generationOdds[Math.min(6, Math.max(1, generation ?? 6))];
const zonkFor = (id?: string) => zonks.find((value) => value.id === id) ?? zonks[0];
const NETWORK_BASE = 3842,
  NETWORK_GOAL = 5000;
const season = {
  name: "SEASON ZERO · THE SILENT SIGNAL",
  fragments: [
    { threshold: 3900, title: "FRAGMENT 01", text: "The signal is not coming from space. It is coming from an abandoned group chat." },
    { threshold: 4100, title: "FRAGMENT 02", text: "Someone keeps typing, deleting and typing again. The account has no wallet." },
    { threshold: 4350, title: "FRAGMENT 03", text: "The first coordinate points to a vending machine that accepts only expired governance tokens." },
    { threshold: 4650, title: "FRAGMENT 04", text: "A voice asks whether the Friends brought snacks. This may be important." },
    { threshold: 5000, title: "FINAL TRANSMISSION", text: "Decoder Keys are required. The sender claims to be a Friend nobody minted." },
  ],
} as const;

export default function SearchParty({
  friendId,
  generation,
  client,
  storage,
  paused,
}: GameComponentProps) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null),
    [screen, setScreen] = useState<Screen>("map");
  const [destination, setDestination] = useState<Destination>(destinations[0]);
  const [preparation, setPreparation] = useState<Preparation>(preparations[0]);
  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [remaining, setRemaining] = useState(0),
    [result, setResult] = useState<RevealedFind | null>(null);
  const [journal, setJournal] = useState<Discovery[]>([]),
    [contribution, setContribution] = useState(0);
  const [boostCredits, setBoostCredits] = useState(0),
    [useBoost, setUseBoost] = useState(false);
  const [fieldBalance, setFieldBalance] = useState<bigint | null>(null),
    [jackpotContribution, setJackpotContribution] = useState(0n),
    [milestonesPaid, setMilestonesPaid] = useState<number[]>([]),
    [decoderKeys, setDecoderKeys] = useState(0);
  const [fieldTest, setFieldTest] = useState(true),
    [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [muted, setMuted] = useState(true),
    [reducedMotion, setReducedMotion] = useState(false);
  const [friendIdentity, setFriendIdentity] = useState<FriendSearchIdentity | null>(null);
  const locked = useRef(false),
    alive = useRef(true),
    sound = useRef<FriendSoundKit | null>(null);
  const definition = client.definition;
  const items = useMemo<readonly GameItem[]>(
    () =>
      definition.outcomes.map((outcome, index) => ({
        id: `artifact-${index + 1}`,
        name: outcome.name,
        rarity: rarity[index],
        art: { rows: rows[index] },
      })),
    [definition],
  );

  useEffect(() => {
    alive.current = true;
    sound.current = createFriendSoundKit({ muted: true, volume: 0.6 });
    void Promise.all([client.read(), storage.load()])
      .then(([value, saved]) => {
        if (!alive.current) return;
        setSnapshot(value);
        let restoredBalance = value.rfBalance;
        if (saved)
          try {
            const profile = JSON.parse(saved) as {
              version?: unknown;
              expedition?: Expedition | null;
              journal?: Discovery[];
              contribution?: number;
              fieldTest?: boolean;
              boostCredits?: number;
              economyDelta?: string;
              fieldBalance?: string;
              jackpotContribution?: string;
              milestonesPaid?: number[];
              decoderKeys?: number;
            };
            if (profile.version === 1) {
              const hasPersistentBalance = typeof profile.fieldBalance === "string" && /^\d+$/.test(profile.fieldBalance);
              if (Array.isArray(profile.journal))
                setJournal(
                  profile.journal
                    .filter((row) => row && (
                      (Number.isInteger(row.outcomeId) && Number(row.outcomeId) >= 1 && Number(row.outcomeId) <= 7) ||
                      (row.kind === "zonk" && typeof row.zonkId === "string")
                    ))
                    .map((row) => ({ ...row, kind: row.kind === "zonk" ? "zonk" as const : "artifact" as const }))
                    .slice(-100),
                );
              if (
                Number.isInteger(profile.contribution) &&
                Number(profile.contribution) >= 0
              )
                setContribution(Number(profile.contribution));
              if (typeof profile.fieldTest === "boolean")
                setFieldTest(profile.fieldTest);
              if (Number.isInteger(profile.boostCredits) && Number(profile.boostCredits) >= 0)
                setBoostCredits(Number(profile.boostCredits));
              if (typeof profile.fieldBalance === "string" && /^\d+$/.test(profile.fieldBalance))
                restoredBalance = BigInt(profile.fieldBalance);
              else if (typeof profile.economyDelta === "string" && /^-?\d+$/.test(profile.economyDelta))
                restoredBalance = value.rfBalance + BigInt(profile.economyDelta);
              if (typeof profile.jackpotContribution === "string" && /^\d+$/.test(profile.jackpotContribution))
                setJackpotContribution(BigInt(profile.jackpotContribution));
              if (Array.isArray(profile.milestonesPaid))
                setMilestonesPaid(profile.milestonesPaid.filter((value) => value === 3 || value === 5 || value === 7));
              if (Number.isInteger(profile.decoderKeys) && Number(profile.decoderKeys) >= 0)
                setDecoderKeys(Number(profile.decoderKeys));
              else if (profile.milestonesPaid?.includes(7))
                setDecoderKeys(1);
              if (
                profile.expedition &&
                typeof profile.expedition.end === "number"
              ) {
                if (!hasPersistentBalance)
                  restoredBalance = restoredBalance > definition.price ? restoredBalance - definition.price : 0n;
                setExpedition({
                  ...profile.expedition,
                  artifactId: "artifactId" in profile.expedition
                    ? profile.expedition.artifactId
                    : Number((profile.expedition as Expedition & { outcomeId?: number }).outcomeId) || null,
                  boosted: Boolean(profile.expedition.boosted),
                  chance: Number(profile.expedition.chance) || oddsFor(generation),
                  settlementOutcomeId: Number(profile.expedition.settlementOutcomeId) || Number((profile.expedition as Expedition & { outcomeId?: number }).outcomeId) || 1,
                  restored: true,
                });
              }
            }
          } catch {
            setMessage(
              "The old field journal could not be read. A fresh one was opened.",
            );
          }
        setFieldBalance(restoredBalance < 0n ? 0n : restoredBalance);
        setHydrated(true);
      })
      .catch(
        (cause) =>
          alive.current &&
          setError(
            cause instanceof Error
              ? cause.message
              : "Search Party could not load.",
          ),
      );
    const query = window.matchMedia("(prefers-reduced-motion: reduce)"),
      update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => {
      alive.current = false;
      sound.current?.dispose();
      query.removeEventListener("change", update);
    };
  }, [client, friendId, storage]);
  useEffect(() => {
    if (!hydrated) return;
    void storage
      .save(
        JSON.stringify({
          version: 1,
          expedition,
          pickerStatus: expedition ? { destination: destinationFor(expedition.destinationId).name, end: expedition.end } : null,
          journal,
          contribution,
          fieldTest,
          boostCredits,
          fieldBalance: (fieldBalance ?? snapshot?.rfBalance ?? 0n).toString(),
          jackpotContribution: jackpotContribution.toString(),
          milestonesPaid,
          decoderKeys,
        }),
      )
      .catch(() => setError("Progress could not be saved on this device."));
  }, [storage, hydrated, expedition, journal, contribution, fieldTest, boostCredits, fieldBalance, jackpotContribution, milestonesPaid, decoderKeys, snapshot]);
  useEffect(() => {
    if (!expedition) return;
    const tick = () =>
      setRemaining(Math.max(0, (expedition.end - Date.now()) / 1000));
    tick();
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [expedition]);

  async function action(
    work: () => Promise<void>,
    cue?: FriendSoundCue,
    after?: () => void,
  ) {
    if (locked.current || paused) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    void sound.current?.unlock();
    try {
      await work();
      const value = await client.read();
      if (alive.current) {
        setSnapshot(value);
        cue && sound.current?.play(cue);
        after?.();
      }
    } catch (cause) {
      if (alive.current)
        setError(
          cause instanceof Error ? cause.message : "The preview action failed.",
        );
    } finally {
      locked.current = false;
      alive.current && setBusy(false);
    }
  }
  const navigate = (next: Screen) => {
    if (!busy && !paused) {
      setScreen(next);
      setError("");
      sound.current?.play("select");
    }
  };
  const buyBoost = () =>
    action(
      async () => {
        if (fieldBalance === null || fieldBalance < BOOST_PRICE)
          throw new Error("This Friend needs 0.25 RF for a Signal Boost.");
        setFieldBalance((value) => (value ?? 0n) - BOOST_PRICE);
        setJackpotContribution((value) => value + BOOST_PRICE / 5n);
        setBoostCredits((value) => value + 1);
        setUseBoost(true);
      },
      "purchase",
      () => setMessage("Signal Boost packed. It will be consumed by one expedition."),
    );
  const dispatch = () =>
    action(
      async () => {
        if (!snapshot) return;
        await client.buy(1n);
        setJackpotContribution((value) => value + definition.price / 5n);
        const [play] = await client.play(1n);
        if (!play)
          throw new Error(
            "No search was created. Refresh before trying again.",
          );
        const settled = await client.settle(play.id);
        if (!settled.outcomeId)
          throw new Error("The search signal did not resolve.");
        const boosted = useBoost && boostCredits > 0;
        const chance = Math.min(80, oddsFor(generation) + (boosted ? boostBonus : 0) + (preparation.id === "charm" ? 5 : 0));
        const meaningful = roll(10_000) < chance * 100;
        const eligible = destinationArtifacts[destination.id] ?? destinationArtifacts.mempool;
        const artifactId = meaningful
          ? eligible[(settled.outcomeId - 1) % eligible.length]
          : null;
        const duration = fieldTest
          ? destination.testSeconds * 1000
          : destination.minutes * 60_000;
        const now = Date.now();
        setResult(null);
        setFieldBalance((value) => (value ?? snapshot.rfBalance) - definition.price);
        setExpedition({
          playId: play.id.toString(),
          settlementOutcomeId: settled.outcomeId,
          artifactId,
          zonkId: artifactId ? undefined : zonks[roll(zonks.length)].id,
          boosted,
          chance,
          destinationId: destination.id,
          preparationId: preparation.id,
          started: now,
          end: now + duration,
          duration,
          restored: false,
        });
        if (boosted) {
          setBoostCredits((value) => Math.max(0, value - 1));
          setUseBoost(false);
        }
        setRemaining(duration / 1000);
      },
      "action-start",
      () => {
        setScreen("map");
        setMessage(
          `Friend #${friendId} entered ${destination.name} with a ${preparation.name}.`,
        );
      },
    );
  const recover = () => {
    if (!expedition || remaining > 0 || busy) return;
    const artifactId = expedition.artifactId;
    const existingUnique = new Set(
        journal.filter((entry) => entry.kind === "artifact" && entry.outcomeId).map((entry) => entry.outcomeId!),
      ),
      nextUnique = new Set(existingUnique);
    if (artifactId) nextUnique.add(artifactId);
    const duplicate = Boolean(artifactId && existingUnique.has(artifactId)),
      recentMempool = [...journal].reverse().findIndex((entry) => entry.destinationId !== "mempool"),
      mempoolStreak = recentMempool === -1 ? journal.length : recentMempool,
      destinationMultiplier = expedition.destinationId === "graveyard" ? 2.5 : expedition.destinationId === "bridge" ? 1.5 : mempoolStreak >= 4 ? .3 : mempoolStreak >= 2 ? .6 : 1,
      specialtyMultiplier = friendIdentity && familySpecialties[friendIdentity.familyId] === expedition.destinationId ? 1.15 : 1,
      raritySignal = artifactId ? clueValues[artifactId - 1] ?? 1 : 1,
      duplicateMultiplier = duplicate ? .3 : 1,
      preparationSignal = expedition.preparationId === "antenna" && artifactId ? 2 : expedition.preparationId === "snack" ? 1 : 0,
      cluePoints = Math.max(1, Math.round((raritySignal + preparationSignal) * destinationMultiplier * duplicateMultiplier * specialtyMultiplier));
    const newlyEarnedMilestones = [...milestonePayouts.entries()].filter(
        ([threshold]) => nextUnique.size >= threshold && !milestonesPaid.includes(threshold),
      ),
      milestone = newlyEarnedMilestones.reduce((sum, [, payout]) => sum + payout, 0n),
      artifactPayout = artifactId ? artifactPayouts[artifactId - 1] : 0n,
      payout = FIELD_FUNDS + artifactPayout + milestone;
    const discovery: Discovery = {
      id: `${friendId}-${expedition.playId}-${expedition.end}`,
      kind: artifactId ? "artifact" : "zonk",
      outcomeId: artifactId ?? undefined,
      zonkId: expedition.zonkId,
      destinationId: expedition.destinationId,
      preparationId: expedition.preparationId,
      foundAt: Date.now(),
      cluePoints,
      rfPayout: payout.toString(),
    };
    void action(
      async () => {
        if (!expedition.restored)
          await client.redeem(expedition.settlementOutcomeId, 1n);
        setResult({
          id: BigInt(expedition.playId), artifactId, zonkId: expedition.zonkId,
          boosted: expedition.boosted, chance: expedition.chance, payout, milestone, signal: cluePoints,
        });
        setJournal((value) => [...value, discovery].slice(-100));
        if (cluePoints) setContribution((value) => value + cluePoints);
        setFieldBalance((value) => (value ?? 0n) + payout);
        if (newlyEarnedMilestones.length)
          setMilestonesPaid((value) => [...new Set([...value, ...newlyEarnedMilestones.map(([threshold]) => threshold)])]);
        if (newlyEarnedMilestones.some(([threshold]) => threshold === 7))
          setDecoderKeys((value) => value + 1);
        setExpedition(null);
      },
      "reward",
      () => setScreen("reveal"),
    );
  };

  if (!snapshot)
    return (
      <div className="sp-loading" role={error ? "alert" : "status"}>
        <b>SEARCH PARTY</b>
        <span>{error || "Finding your Friend on the network…"}</span>
      </div>
    );
  const total = journal.length,
    artifactReturns = journal.filter((entry) => entry.kind === "artifact").length,
    outcome = result?.artifactId
      ? definition.outcomes[result.artifactId - 1]
      : null,
    found = result?.artifactId ? items[result.artifactId - 1] : null,
    zonk = result && !result.artifactId ? zonkFor(result.zonkId) : null,
    currentOdds = oddsFor(generation),
    effectiveBalance = fieldBalance ?? snapshot.rfBalance,
    networkSignal = NETWORK_BASE + contribution,
    nextFragment = season.fragments.find((fragment) => networkSignal < fragment.threshold),
    leaderboard = [
      { friend: "Friend #404", generation: 2, signal: 186, collections: 1, current: false },
      { friend: "Friend #777", generation: 1, signal: 151, collections: 0, current: false },
      { friend: "Friend #1337", generation: 4, signal: 118, collections: 0, current: false },
      { friend: `Friend #${friendId}`, generation: generation ?? 6, signal: contribution, collections: decoderKeys, current: true },
    ].sort((a, b) => b.signal - a.signal);
  const specialty = friendIdentity ? destinationFor(familySpecialties[friendIdentity.familyId]) : null;
  const max = maximumPrize(definition),
    canBuy =
      effectiveBalance >= definition.price &&
      snapshot.freeStake >= max &&
      snapshot.freeStake + definition.price >= max;
  const feedback = (
    <p className="sp-feedback" role={error ? "alert" : "status"}>
      {error ||
        message ||
        (busy
          ? "Confirming simulated search…"
          : "Preview only · RF and discoveries are simulated")}
    </p>
  );

  return (
    <section
      className="sp"
      aria-label="Rare Friends Search Party"
      aria-busy={busy}
    >
      <div
        className="sp-world-shell"
        inert={screen !== "map" || paused || undefined}
      >
        <SearchWorld
          friendId={friendId}
          onIdentity={setFriendIdentity}
          reducedMotion={reducedMotion}
          destination={expedition?.destinationId ?? null}
          travelling={!!expedition && remaining > 0}
          ready={!!expedition && remaining <= 0}
        />
        <header className="sp-hud">
          <div className="sp-brand">
            <span>RARE FRIENDS</span>
            <strong>SEARCH PARTY</strong>
          </div>
          <div className="sp-wallet">
            <span>FRIEND FIELD WALLET</span>
            <b>{rf(effectiveBalance)}</b>
          </div>
          <button type="button" onClick={() => navigate("mystery")}>
            SIGNAL {contribution}
          </button>
          <button type="button" onClick={() => navigate("archive")}>
            JOURNAL ({total})
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => navigate("settings")}
          >
            ☰
          </button>
        </header>
        <aside className="sp-friend-card">
          <small>FIELD AGENT</small>
          <strong>FRIEND #{friendId.toString()}</strong>
          <b>GEN {generation ?? "?"} · {currentOdds}% ARTIFACT ODDS</b>
          {friendIdentity && <b>{friendIdentity.familyName.toUpperCase()} · {specialty?.name} SPECIALIST</b>}
          <span>
            {expedition
              ? remaining > 0
                ? `SEARCHING · ${clock(remaining)}`
                : "RETURN SIGNAL FOUND"
              : "READY FOR DISPATCH"}
          </span>
        </aside>
        {!expedition && (
          <div className="sp-destinations">
            <p>CHOOSE WHERE TO SEARCH</p>
            {destinations.map((place) => (
              <button
                key={place.id}
                type="button"
                style={{ "--place": place.color } as React.CSSProperties}
                onClick={() => {
                  setDestination(place);
                  navigate("dispatch");
                }}
              >
                <small>{place.eyebrow}</small>
                <strong>{place.name}</strong>
                <span>{place.risk} →</span>
              </button>
            ))}
          </div>
        )}
        {expedition && (
          <div className="sp-expedition-card" data-ready={remaining <= 0}>
            <small>{remaining > 0 ? "FRIEND AWAY" : "FRIEND RETURNED"}</small>
            <strong>{destinationFor(expedition.destinationId).name}</strong>
            <b>{remaining > 0 ? clock(remaining) : "DISCOVERY READY"}</b>
            <div>
              <i
                style={{
                  width: `${Math.max(0, Math.min(100, 100 - ((remaining * 1000) / expedition.duration) * 100))}%`,
                }}
              />
            </div>
            <p>
              {remaining > 0
                ? `Packed: ${preparationFor(expedition.preparationId).name}. You can safely leave and return later.`
                : "Something followed your Friend home."}
            </p>
            <button
              className="sp-primary"
              type="button"
              disabled={remaining > 0 || busy}
              onClick={recover}
            >
              OPEN FIELD BAG →
            </button>
          </div>
        )}
        {(message || error) && (
          <div className="sp-world-feedback">{feedback}</div>
        )}
      </div>
      {screen !== "map" && (
        <GameMenu
          title={
            screen === "dispatch"
              ? "Dispatch board"
              : screen === "reveal"
                ? "Field bag opened"
                : screen === "archive"
                  ? "Field journal"
                  : screen === "mystery"
                    ? "The silent signal"
                    : screen === "odds"
                      ? "Search odds"
                      : screen === "faq"
                        ? "Field guide · FAQ"
                      : "Settings"
          }
          onClose={
            busy || screen === "reveal" ? undefined : () => navigate("map")
          }
        >
          {screen === "dispatch" ? (
            <div className="sp-dispatch">
              <span className="sp-stamp">DESTINATION</span>
              <h2>{destination.name}</h2>
              <p>{destination.description}</p>
              <dl>
                <div>
                  <dt>FIELD TIME</dt>
                  <dd>
                    {fieldTest
                      ? `${destination.testSeconds} SEC TEST`
                      : destination.time}
                  </dd>
                </div>
                <div>
                  <dt>STATIC</dt>
                  <dd>{destination.risk.replace(" STATIC", "")}</dd>
                </div>
                <div>
                  <dt>PERMIT</dt>
                  <dd>{rf(definition.price)}</dd>
                </div>
              </dl>
              <p className="sp-signal-note">{destination.signal}</p>
              {specialty?.id === destination.id && (
                <p className="sp-resonance">FRIEND RESONANCE · {friendIdentity!.familyName.toUpperCase()} FAMILY EARNS +15% SIGNAL HERE</p>
              )}
              <div className="sp-boost">
                <div>
                  <strong>SIGNAL BOOST · +{boostBonus}%</strong>
                  <small>One expedition only · {boostCredits} packed</small>
                </div>
                {boostCredits > 0 ? (
                  <button type="button" aria-pressed={useBoost} onClick={() => setUseBoost((value) => !value)}>
                    {useBoost ? "BOOST ON" : "USE BOOST"}
                  </button>
                ) : (
                  <button type="button" disabled={!canBuy || busy} onClick={() => void buyBoost()}>
                    BUY · {rf(BOOST_PRICE)}
                  </button>
                )}
              </div>
              <p className="sp-signal-note">
                Meaningful find: {Math.min(80, currentOdds + (useBoost && boostCredits ? boostBonus : 0) + (preparation.id === "charm" ? 5 : 0))}% · Other returns are Rugged Relics.
              </p>
              <fieldset className="sp-preparations">
                <legend>PACK ONE ITEM</legend>
                {preparations.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={preparation.id === item.id}
                    onClick={() => setPreparation(item)}
                  >
                    <strong>{item.name}</strong>
                    <small>{item.note}</small>
                    <span>{item.effect}</span>
                  </button>
                ))}
              </fieldset>
              <div className="sp-route">
                <span>HOME ISLAND</span>
                <i>····················→</i>
                <b>{destination.name}</b>
              </div>
              <button
                className="sp-primary"
                type="button"
                disabled={!canBuy || busy || paused}
                onClick={() => void dispatch()}
              >
                BUY PERMIT + DISPATCH · {rf(definition.price)}
              </button>
              <button
                className="sp-link"
                type="button"
                onClick={() => navigate("odds")}
              >
                View discovery odds
              </button>
              {!canBuy && (
                <p className="sp-warning">
                  Searches are paused until the preview wallet and prize reserve
                  can cover this trip.
                </p>
              )}
              {feedback}
            </div>
          ) : screen === "reveal" && outcome && found ? (
            <div className="sp-reveal" data-rarity={found.rarity}>
              <div className="sp-radar" />
              <ItemArt item={found} />
              <small>{found.rarity} CRYPTO ARTIFACT</small>
              <h2>{outcome.name}</h2>
              <p>{lore[result!.artifactId! - 1]}</p>
              <div className="sp-result-meta">
                <span>FOUND BY FRIEND #{friendId.toString()}</span>
                <span>{result!.chance}% MEANINGFUL FIND ODDS</span>
                {result!.boosted && <span>RF SIGNAL BOOST USED</span>}
                <span>RF RETURN {rf(result!.payout)}</span>
                <span>+{result!.signal} COMMUNITY SIGNAL</span>
                {result!.milestone > 0n && <span>INCLUDES {rf(result!.milestone)} COLLECTION BONUS</span>}
              </div>
              <button
                className="sp-primary"
                type="button"
                onClick={() => {
                  sound.current?.play(
                    found.rarity === "legendary"
                      ? "reveal-legendary"
                      : found.rarity === "rare" || found.rarity === "epic"
                        ? "reveal-rare"
                        : "reveal-common",
                  );
                  navigate("archive");
                }}
              >
                KEEP IN FIELD BAG →
              </button>
            </div>
          ) : screen === "reveal" && zonk ? (
            <div className="sp-reveal sp-zonk">
              <ItemArt item={{ id: `zonk-${zonk.id}`, name: zonk.name, rarity: "common", art: { rows: zonkRows } }} />
              <small>RUGGED RELIC · NO COLLECTION PROGRESS</small>
              <h2>{zonk.name}</h2>
              <p>{zonk.note}</p>
              <div className="sp-result-meta">
                <span>FOUND BY FRIEND #{friendId.toString()}</span>
                <span>{result!.chance}% MEANINGFUL FIND ODDS</span>
                {result!.boosted && <span>RF SIGNAL BOOST USED</span>}
                <span>FIELD FUNDS RECOVERED {rf(result!.payout)}</span>
                <span>+{result!.signal} COMMUNITY SIGNAL</span>
                {result!.milestone > 0n && <span>INCLUDES {rf(result!.milestone)} COLLECTION BONUS</span>}
              </div>
              <button className="sp-primary" type="button" onClick={() => navigate("archive")}>
                LOG THIS NON-DISCOVERY →
              </button>
            </div>
          ) : screen === "archive" ? (
            <div className="sp-archive">
              <header>
                <div>
                  <small>FRIEND #{friendId.toString()}</small>
                  <h2>FIELD JOURNAL</h2>
                </div>
                <b>{artifactReturns} ARTIFACTS · {total} RETURNS</b>
              </header>
              <section className="sp-collection">
                <h3>
                  ARTIFACT COLLECTION · {items.filter((_, index) => journal.some((entry) => entry.kind === "artifact" && entry.outcomeId === index + 1)).length}/{items.length}
                </h3>
                <div>
                  {items.map((item, index) => {
                    const count = journal.filter((entry) => entry.kind === "artifact" && entry.outcomeId === index + 1).length;
                    return (
                      <article key={item.id} data-owned={count > 0}>
                        <ItemArt item={item} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.rarity} · {rf(artifactPayouts[index])} · {index < 3 ? "Mempool+" : index < 5 ? "Bridge City+" : "NFT Graveyard only"}</small>
                        </span>
                        <b>×{count}</b>
                      </article>
                    );
                  })}
                </div>
              </section>
              <h3 className="sp-log-title">RECENT FIELD LOG</h3>
              {journal.length === 0 ? (
                <div className="sp-empty">
                  <b>NO ENTRIES YET</b>
                  <p>
                    Dispatch your Friend. Artifacts advance this Friend’s
                    collection; Rugged Relics are logged for posterity.
                  </p>
                </div>
              ) : (
                <div className="sp-field-log">
                  {[...journal].reverse().slice(0, 20).map((entry) => {
                    const isArtifact = entry.kind === "artifact" && entry.outcomeId;
                    const item = isArtifact ? items[entry.outcomeId! - 1] : null;
                    const joke = item ? null : zonkFor(entry.zonkId);
                    return (
                      <article key={entry.id} data-owned={isArtifact ? "true" : "false"}>
                        <ItemArt item={item ?? { id: `zonk-${joke!.id}`, name: joke!.name, rarity: "common", art: { rows: zonkRows } }} />
                        <span>
                          <strong>{item?.name ?? joke!.name}</strong>
                          <small>
                            {item ? item.rarity : "RUGGED RELIC · NO PROGRESS"} ·{" "}
                            {destinationFor(entry.destinationId).name}
                          </small>
                          <em>
                            {preparationFor(entry.preparationId).name} · {entry.cluePoints ? `+${entry.cluePoints} signal` : joke!.note} · {rf(BigInt(entry.rfPayout ?? "0"))}
                          </em>
                        </span>
                        <b>{new Date(entry.foundAt).toLocaleDateString()}</b>
                      </article>
                    );
                  })}
                </div>
              )}
              {feedback}
            </div>
          ) : screen === "mystery" ? (
            <div className="sp-mystery">
              <span className="sp-stamp">
                COMMUNITY MYSTERY · PREVIEW NETWORK
              </span>
              <h2>{season.name}</h2>
              <p>
                Friends keep returning with fragments of the same impossible
                transmission. Nobody has decoded the sender—or why it knows
                every Friend by number.
              </p>
              <div className="sp-mystery-meter">
                <div>
                  <i
                    style={{
                      width: `${Math.min(100, (networkSignal / NETWORK_GOAL) * 100)}%`,
                    }}
                  />
                </div>
                <b>
                  {networkSignal.toLocaleString()} /{" "}
                  {NETWORK_GOAL.toLocaleString()} SIGNAL MARKS
                </b>
              </div>
              <dl>
                <div>
                  <dt>YOUR FRIEND</dt>
                  <dd>+{contribution}</dd>
                </div>
                <div>
                  <dt>NEXT UNLOCK</dt>
                  <dd>{nextFragment ? `${nextFragment.threshold - networkSignal} SIGNAL` : "FINAL REVEALED"}</dd>
                </div>
                <div>
                  <dt>JACKPOT FUNDED</dt>
                  <dd>{rf(jackpotContribution)}</dd>
                </div>
                <div>
                  <dt>DECODER KEYS</dt>
                  <dd>{decoderKeys}</dd>
                </div>
              </dl>
              <section className="sp-fragments">
                <h3>RECOVERED TRANSMISSIONS</h3>
                {season.fragments.map((fragment) => {
                  const unlocked = networkSignal >= fragment.threshold;
                  return <article key={fragment.threshold} data-unlocked={unlocked}>
                    <b>{unlocked ? fragment.title : `LOCKED · ${fragment.threshold} SIGNAL`}</b>
                    <p>{unlocked ? fragment.text : "▓▓▓▓▓▓▓ TRANSMISSION ENCRYPTED ▓▓▓▓▓▓▓"}</p>
                  </article>;
                })}
              </section>
              <section className="sp-leaderboard">
                <h3>SEASON SIGNAL LEADERS</h3>
                <table><thead><tr><th>Friend</th><th>Gen</th><th>Signal</th><th>Sets</th></tr></thead>
                  <tbody>{leaderboard.map((row) => <tr key={row.friend} data-current={row.current}>
                    <th>{row.friend}</th><td>{row.generation}</td><td>{row.signal}</td><td>{row.collections}</td>
                  </tr>)}</tbody>
                </table>
                <p className="sp-preview-note">Preview anti-farming rules: duplicates earn 70% less Signal, repeated Mempool searches diminish, Bridge City and NFT Graveyard carry larger multipliers, and the production owner leaderboard will count only an owner’s top three Friends.</p>
              </section>
              <p className="sp-preview-note">
                The network total and other leaders are staged for this private
                preview. Your selected Friend’s contribution, Decoder Keys and
                journal are saved on this device. A shared season backend will
                replace staged community data after playtesting.
              </p>
              <button
                className="sp-primary"
                type="button"
                onClick={() => navigate("map")}
              >
                RETURN TO THE MAP →
              </button>
            </div>
          ) : screen === "odds" ? (
            <div className="sp-odds">
              <h2>EVERY SEARCH RETURNS. NOT EVERY RETURN MATTERS.</h2>
              <p>
                Each Friend owns a separate seven-artifact collection. A Search
                Permit costs {rf(definition.price)}; a one-trip Signal Boost
                costs {rf(BOOST_PRICE)} and adds {boostBonus} points. Every completed
                search recovers {rf(FIELD_FUNDS)} before artifact and milestone rewards.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Friend</th>
                    <th>Artifact</th>
                    <th>Boosted</th>
                  </tr>
                </thead>
                <tbody>
                  {["Genesis", "Gen 1", "Gen 2", "Gen 3", "Gen 4", "Gen 5", "Gen 6"].map((label, index) => (
                    <tr key={label} data-current={generation === index}>
                      <th>{label}</th>
                      <td>{generationOdds[index]}%</td>
                      <td>{Math.min(80, generationOdds[index] + boostBonus)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                Mempool can return artifacts 1–3; Bridge City 1–5; NFT
                Graveyard all seven. A failed artifact roll returns a Rugged Relic and
                no collection progress, but still returns field funds. Collection
                bonuses pay 1 RF at three, 3 RF at five and 8 RF at seven unique artifacts.
                Twenty percent of permit and boost revenue funds the community jackpot.
              </p>
              <button type="button" onClick={() => navigate("dispatch")}>
                Back to dispatch
              </button>
              {feedback}
            </div>
          ) : screen === "faq" ? (
            <div className="sp-faq">
              <h2>SEARCH PARTY FIELD GUIDE</h2>
              <p>Everything a Friend needs before disappearing into the chain.</p>
              <details open>
                <summary>WHAT AM I TRYING TO DO?</summary>
                <p>Send each Rare Friend on passive searches, complete that Friend’s seven-artifact collection and contribute Community Signal toward the shared mystery.</p>
              </details>
              <details>
                <summary>WHAT DO THE PACKED ITEMS DO?</summary>
                <p><strong>Block Snack:</strong> +1 Community Signal on every return.</p>
                <p><strong>Signal Antenna:</strong> +2 Community Signal when an artifact is found.</p>
                <p><strong>Lucky Charm:</strong> +5 percentage points to the artifact chance.</p>
              </details>
              <details>
                <summary>DO GENERATIONS MATTER?</summary>
                <p>Yes. Genesis has the best base artifact odds, followed by Gen 1 through Gen 6. Open Search Odds for the complete table. Rare traits create identity and specialties; they do not automatically overpower another Friend.</p>
              </details>
              <details>
                <summary>WHY SEARCH DIFFERENT LOCATIONS?</summary>
                <p>The Mempool can find artifacts 1–3, Bridge City can find 1–5 and the NFT Graveyard can find all seven. Longer searches reach deeper artifact pools.</p>
              </details>
              <details>
                <summary>WHAT IS A RUGGED RELIC?</summary>
                <p>A humorous non-artifact return. It is recorded in the Field Journal and returns field funds, but it does not advance the artifact collection.</p>
              </details>
              <details>
                <summary>WHAT DO RF BOOSTS AND PAYOUTS DO?</summary>
                <p>A one-expedition Signal Boost costs {rf(BOOST_PRICE)} and adds {boostBonus} percentage points to artifact odds. Searches recover field funds, artifacts have simulated RF payouts and unique-collection milestones award additional simulated RF.</p>
              </details>
              <details>
                <summary>IS ANY REAL RF BEING SPENT?</summary>
                <p>No. This Vibeathon preview clearly simulates purchases, rewards and outcomes. It does not send live game transactions.</p>
              </details>
              <details>
                <summary>WHERE IS MY PROGRESS SAVED?</summary>
                <p>Progress is currently saved on this device and separately for each Friend. Use My Friends to switch among eligible hardwired Rare Friends in the connected wallet.</p>
              </details>
              <button type="button" onClick={() => navigate("settings")}>BACK TO SETTINGS</button>
              {feedback}
            </div>
          ) : screen === "settings" ? (
            <div className="sp-settings">
              <h2>FIELD SETTINGS</h2>
              <p>
                Use the accelerated clock while testing. Turn it off to
                experience the intended 30-minute, 4-hour and 10-hour rhythm.
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={fieldTest}
                  disabled={!!expedition}
                  onChange={(event) => setFieldTest(event.target.checked)}
                />{" "}
                ACCELERATED FIELD-TEST CLOCK
              </label>
              <button
                type="button"
                aria-pressed={!muted}
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  sound.current?.setMuted(next);
                  if (!next) void sound.current?.unlock();
                }}
              >
                {muted ? "TURN SOUND ON" : "MUTE SOUND"}
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                />{" "}
                REDUCE MOTION
              </label>
              <button type="button" onClick={() => navigate("odds")}>
                VIEW TRANSPARENT ODDS
              </button>
              <button type="button" onClick={() => navigate("faq")}>
                OPEN FIELD GUIDE · FAQ
              </button>
              {feedback}
            </div>
          ) : null}
        </GameMenu>
      )}
    </section>
  );
}
