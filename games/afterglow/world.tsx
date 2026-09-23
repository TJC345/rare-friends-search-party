"use client";
import { useEffect, useRef, useState } from "react";
import { createFriendReader, decodeGenerationSprites, spriteFrame, type GenerationSprites } from "@rarefriends/friendsdk/sprites";
export type FriendSearchIdentity = Readonly<{ familyId: number; familyName: string; seed: number }>;
async function loadFriendArtwork(friendId: bigint, signal: AbortSignal) {
  try {
    const relayOrigin = location.protocol === "blob:"
      ? new URL(location.href.slice("blob:".length)).origin
      : location.origin;
    const response = await fetch(`${relayOrigin}/api/friend-art?friendId=${friendId.toString()}`, { signal });
    if (!response.ok) throw new Error("Artwork relay unavailable");
    const body = await response.json() as { familyId?: unknown; seed?: unknown; frames?: unknown };
    if (!Number.isInteger(body.familyId) || !Number.isInteger(body.seed) || !Array.isArray(body.frames) ||
        body.frames.length !== 64 || body.frames.some((frame) => typeof frame !== "string" || !/^\d+$/.test(frame))) {
      throw new Error("Artwork relay returned invalid data");
    }
    return decodeGenerationSprites(friendId, body.familyId as number, body.seed as number, body.frames.map(BigInt));
  } catch (error) {
    if (signal.aborted) throw error;
    return createFriendReader().read(friendId);
  }
}
function drawFriend(c: CanvasRenderingContext2D, sprites: GenerationSprites, x: number, y: number, frame: number) { const boundedFrame = frame % 8, pixels = spriteFrame(sprites, "down", boundedFrame > 3, boundedFrame, "right").frame.rows, scale = 6, left = x - 8 * scale, top = y - 15 * scale; c.fillStyle = "#f4f2e9"; pixels.forEach((row, py) => [...row].forEach((pixel, px) => pixel === "#" && c.fillRect(left + px * scale - 2, top + py * scale - 2, scale + 4, scale + 4))); c.fillStyle = "#111"; pixels.forEach((row, py) => [...row].forEach((pixel, px) => pixel === "#" && c.fillRect(left + px * scale, top + py * scale, scale, scale))); }
export function SearchWorld({ friendId, reducedMotion, destination, travelling, ready, onIdentity }: { friendId: bigint; reducedMotion: boolean; destination: string | null; travelling: boolean; ready: boolean; onIdentity?: (identity: FriendSearchIdentity) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null); const [status, setStatus] = useState("Loading Friend artwork…"), [artAttempt, setArtAttempt] = useState(0);
  useEffect(() => { const node = canvas.current, c = node?.getContext("2d"); if (!node || !c) return; const controller = new AbortController(); let sprites: GenerationSprites | undefined, raf = 0;
    const loadArt = async () => { setStatus("Loading on-chain Friend artwork…"); for (let attempt = 0; attempt < 3; attempt++) { try { const value = await loadFriendArtwork(friendId, controller.signal); if (controller.signal.aborted) return; sprites = value; onIdentity?.({ familyId: value.familyId, familyName: value.familyName, seed: value.seed }); setStatus(""); return; } catch { if (controller.signal.aborted) return; if (attempt < 2) { setStatus(`Friend art RPC busy · retrying ${attempt + 2}/3…`); await new Promise(resolve => window.setTimeout(resolve, 700 * (attempt + 1))); } } } if (!controller.signal.aborted) setStatus("Friend art unavailable · retry"); };
    void loadArt();
    const draw = (now: number) => { const t = now / 1000; c.clearRect(0, 0, 960, 640); c.imageSmoothingEnabled = false; c.fillStyle = "#f4f2e9"; c.fillRect(0, 0, 960, 640); c.strokeStyle = "#1112"; c.lineWidth = 1; c.setLineDash([2, 10]); for (let x = 0; x < 960; x += 48) { c.beginPath(); c.moveTo(x, 76); c.lineTo(x, 640); c.stroke(); } for (let y = 76; y < 640; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke(); } c.setLineDash([]);
      c.save(); c.translate(480, 385); c.scale(1, .48); c.fillStyle = "#ff977e"; c.beginPath(); c.arc(0, 26, 310, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#111"; c.lineWidth = 6; c.stroke(); c.fillStyle = "#caff00"; c.beginPath(); c.arc(0, 0, 310, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
      c.strokeStyle = "#111"; c.lineWidth = 4; c.fillStyle = "#f4f2e9"; c.fillRect(396, 254, 168, 120); c.strokeRect(396, 254, 168, 120); c.fillStyle = ready ? "#caff00" : "#111"; c.fillRect(414, 272, 132, 72); c.fillStyle = ready ? "#111" : "#caff00"; c.font = "700 13px monospace"; c.textAlign = "center"; c.fillText(ready ? "RETURN" : travelling ? "UPLINK" : "DISPATCH", 480, 314);
      c.strokeStyle = "#111"; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const radius = 94 + i * 32 + (reducedMotion ? 0 : (t * 18) % 30); c.globalAlpha = Math.max(.05, .34 - i * .08); c.beginPath(); c.arc(480, 306, radius, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); } c.globalAlpha = 1;
      const marker = (x: number, y: number, label: string, active: boolean) => { c.fillStyle = active ? "#111" : "#f4f2e9"; c.fillRect(x - 42, y - 18, 84, 36); c.strokeRect(x - 42, y - 18, 84, 36); c.fillStyle = active ? "#caff00" : "#111"; c.font = "700 10px monospace"; c.fillText(label, x, y + 4); }; marker(210, 245, "MEMPOOL", destination === "mempool"); marker(750, 270, "BRIDGE", destination === "bridge"); marker(700, 500, "GRAVEYARD", destination === "graveyard"); c.fillStyle = "#111"; c.fillRect(250, 440, 112, 58); c.fillStyle = "#f4f2e9"; c.fillText("HOME CACHE", 306, 474);
      if (!travelling && sprites) drawFriend(c, sprites, 480 + (ready || reducedMotion ? 0 : Math.sin(t * 1.4) * 4), ready ? 435 : 510, reducedMotion ? 0 : Math.floor(now / 130)); else if (travelling) { const x = 480 + (reducedMotion ? 0 : Math.sin(t * 3) * 150), y = 430 - (reducedMotion ? 0 : Math.abs(Math.cos(t * 3)) * 120); c.strokeStyle = "#caff00"; c.lineWidth = 4; c.beginPath(); c.moveTo(480, 430); c.lineTo(x, y); c.stroke(); if (sprites) drawFriend(c, sprites, x, y + 36, reducedMotion ? 0 : Math.floor(now / 100)); else { c.fillStyle = "#111"; c.fillRect(x - 8, y - 8, 16, 16); } } raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw); return () => { controller.abort(); cancelAnimationFrame(raf); };
  }, [friendId, reducedMotion, destination, travelling, ready, onIdentity, artAttempt]);
  return <div className="sp-world"><canvas ref={canvas} width={960} height={640} aria-label="Rare Friends home island and crypto internet search map"/>{status && <div className="sp-art-status"><p>{status}</p>{status === "Friend art unavailable · retry" && <button type="button" onClick={() => setArtAttempt(value => value + 1)}>RETRY FRIEND ART</button>}</div>}</div>;
}
