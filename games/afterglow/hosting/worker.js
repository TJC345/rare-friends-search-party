const GENERATIONS = "0x14c49e6118f46525de9ab41a51cbaa3c6ebf181d";
const RPC = "https://rpc.mainnet.chain.robinhood.com";
const MAX_STATE_BYTES = 200_000;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

function validWallet(value) {
  return typeof value === "string" && /^0x[0-9a-f]{40}$/.test(value);
}

function validFriendId(value) {
  return typeof value === "string" && /^[1-9][0-9]{0,77}$/.test(value) && BigInt(value) < (1n << 256n);
}

function validGame(value) {
  return value === "Rare Friends: Search Party";
}

async function ownsFriend(wallet, friendId) {
  const encodedId = BigInt(friendId).toString(16).padStart(64, "0");
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: GENERATIONS, data: `0x6352211e${encodedId}` }, "latest"],
    }),
  });
  if (!response.ok) throw new Error("Ownership service unavailable");
  const body = await response.json();
  if (typeof body.result !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(body.result)) return false;
  return `0x${body.result.slice(-40)}`.toLowerCase() === wallet;
}

async function progress(request, env, url) {
  if (!env.DB) return json({ error: "Progress storage unavailable" }, 503);
  if (request.method === "GET") {
    const wallet = (url.searchParams.get("wallet") ?? "").toLowerCase();
    const friendId = url.searchParams.get("friendId") ?? "";
    const game = url.searchParams.get("game") ?? "";
    if (!validWallet(wallet) || !validFriendId(friendId) || !validGame(game)) return json({ error: "Invalid progress key" }, 400);
    if (!(await ownsFriend(wallet, friendId))) return json({ error: "Wallet does not own this Friend" }, 403);
    const row = await env.DB.prepare(
      "SELECT state, updated_at AS updatedAt FROM wallet_progress WHERE wallet = ? AND friend_id = ? AND game = ?",
    ).bind(wallet, friendId, game).first();
    return row ? json(row) : json({ error: "No saved progress" }, 404);
  }
  if (request.method === "PUT") {
    if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") return json({ error: "JSON required" }, 415);
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_STATE_BYTES + 2048) return json({ error: "Progress is too large" }, 413);
    const body = await request.json().catch(() => null);
    const wallet = typeof body?.wallet === "string" ? body.wallet.toLowerCase() : "";
    const friendId = body?.friendId;
    const game = body?.game;
    const state = body?.state;
    if (!validWallet(wallet) || !validFriendId(friendId) || !validGame(game) || typeof state !== "string") return json({ error: "Invalid progress record" }, 400);
    if (new TextEncoder().encode(state).byteLength > MAX_STATE_BYTES) return json({ error: "Progress is too large" }, 413);
    try { JSON.parse(state); } catch { return json({ error: "Progress state is invalid" }, 400); }
    if (!(await ownsFriend(wallet, friendId))) return json({ error: "Wallet does not own this Friend" }, 403);
    const updatedAt = Date.now();
    await env.DB.prepare(
      "INSERT INTO wallet_progress (wallet, friend_id, game, state, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(wallet, friend_id, game) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at",
    ).bind(wallet, friendId, game, state, updatedAt).run();
    return json({ saved: true, updatedAt });
  }
  return new Response(null, { status: 405, headers: { allow: "GET, PUT" } });
}

const ASSETS = __ASSETS__;
const TYPES = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/progress") {
      try { return await progress(request, env, url); }
      catch { return json({ error: "Progress service unavailable" }, 503); }
    }
    if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    const name = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const body = ASSETS[name];
    if (typeof body !== "string") return new Response("Not found", { status: 404 });
    const extension = name.split(".").pop();
    return new Response(request.method === "HEAD" ? null : body, {
      headers: {
        "content-type": TYPES[extension] ?? "application/octet-stream",
        "cache-control": name.endsWith(".html") ? "no-cache" : "public, max-age=300",
        "x-content-type-options": "nosniff",
      },
    });
  },
};
