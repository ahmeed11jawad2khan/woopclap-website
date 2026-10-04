// Accounts, Gmail notifications, payments, admin and chat. Zero dependencies (Node 20+).
const crypto = require("node:crypto"), fs = require("node:fs"), path = require("node:path"), tls = require("node:tls");
const env = process.env, dataDir = env.DATA_DIR || path.join(__dirname, "data"), mediaDir = path.join(dataDir, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const OWNER = (env.OWNER_EMAIL || "woopclapss@gmail.com").toLowerCase();
const FULL_ACCESS = new Set([OWNER, ...(env.FULL_ACCESS_EMAILS || "ahmed1jdkhan22@gmail.com").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)]);
const ADMINS = new Set([OWNER]);
const ORIGINS = new Set((env.FRONTEND_ORIGINS || "").split(",").map(x => x.trim().replace(/\/$/, "")).filter(Boolean));
const PLANS = ["free", "premium", "premium-plus", "premium-pro", "premium-pro-max"];
const PRICES = { premium: 300, "premium-plus": 550, "premium-pro": 1250, "premium-pro-max": 1500 }; // PKR / month
const AI_DAILY = { free: 3, premium: 20, "premium-plus": 40, "premium-pro": 80, "premium-pro-max": 150 };
const dbFile = path.join(dataDir, "db.json");
let db = { users: {}, sessions: {}, orders: {}, messages: [] };
try { db = { ...db, ...JSON.parse(fs.readFileSync(dbFile, "utf8")) }; } catch {}
for (const u of Object.values(db.users)) u.id ||= crypto.randomUUID();
let saveTimer; const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFile(dbFile + ".tmp", JSON.stringify(db), e => !e && fs.rename(dbFile + ".tmp", dbFile, () => {})), 200); };
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const clean = s => String(s || "").replace(/[\r\n]+/g, " ").slice(0, 200);

// ---- Gmail (SMTP, needs SMTP_USER + SMTP_PASS = a Google "App password") ----
function sendMail(to, subject, text) {
    if (!env.SMTP_PASS) {
        console.log(`[mail not configured] to=${to} | ${subject}\n${text}\n`);
        return Promise.resolve(false);
    }

    const user = env.SMTP_USER || OWNER;

    return new Promise(resolve => {
        const sock = tls.connect(465, "smtp.gmail.com");
        let buf = "", waiter = null;
        let finished = false;

        console.log("SMTP: sendMail started");
        console.log("MAIL TO:",to);

        const done = ok => {
            console.log("SMTP result:", ok);

            if (finished) return;
            finished = true;

            if (!ok) {
                console.error(
                    `[mail failed] to=${clean(to)} subject="${clean(subject)}" (check SMTP_USER / SMTP_PASS and network)`
                );
            }

            try {
                sock.destroy();
            } catch {}

            resolve(ok);
        };

        sock.setTimeout(20000, () => done(false));
        sock.on("error", () => done(false));

        sock.on("data", d => {
            buf += d;

            const lines = buf.split("\r\n");
            const last = lines[lines.length - 2];

            if (last && /^\d{3} /.test(last) && waiter) {
                const w = waiter;
                waiter = null;

                const code = +last.slice(0, 3);
                buf = "";

                w(code);
            }
        });

        const expect = () => new Promise(r => waiter = r);

        const cmd = async (line, ok) => {
            if (line) sock.write(line + "\r\n");

            const c = await expect();

            if (c !== ok) throw new Error(c);
        };

        (async () => {
            await cmd("", 220);
            await cmd("EHLO woopclap", 250);
            await cmd("AUTH LOGIN", 334);

            await cmd(
                Buffer.from(user).toString("base64"),
                334
            );

            await cmd(
                Buffer.from(env.SMTP_PASS.replace(/\s/g, "")).toString("base64"),
                235
            );

            await cmd(`MAIL FROM:<${user}>`, 250);
            await cmd(`RCPT TO:<${clean(to)}>`, 250);
            await cmd("DATA", 354);

            const body =
                `From: Woopclap <${user}>\r\n` +
                `To: ${clean(to)}\r\n` +
                `Subject: ${clean(subject)}\r\n` +
                `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
                `${String(text).replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..")}\r\n.`;

            await cmd(body, 250);

            sock.write("QUIT\r\n");
            done(true);
        })().catch(e => {
            console.error("mail failed", e.message);
            done(false);
        });
    });
}
function notifyLogin(req, x, how) {
    const ip = clean(String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0]), ua = clean(req.headers["user-agent"]).slice(0, 160);
    sendMail(OWNER, "[Woopclap] New login", `Website: Woopclap\nUsername: ${x.username}\nEmail: ${x.email}\nStatus: Successful login (${how})\nIP: ${ip}\nDevice: ${ua}\nTime: ${new Date().toISOString()}`).catch(e => console.error("login notification failed", e.message));
}
const notifyOwner = (subject, text) => sendMail(OWNER, `[Woopclap] ${subject}`, `${text}\n\nTime: ${new Date().toISOString()}`);

// ---- helpers ----
function effectivePlan(u) {
    if (!u) return "free";
    if (u.verified && FULL_ACCESS.has(u.email)) return "premium-pro-max";
    return u.plan !== "free" && u.expires > Date.now() ? u.plan : "free";
}
const pub = u => ({ email: u.email, username: u.username, plan: effectivePlan(u), expires: u.expires || 0, isAdmin: u.verified && ADMINS.has(u.email), fullAccess: u.verified && FULL_ACCESS.has(u.email) });
const isOnline = em => (streams.get(em)?.size || 0) > 0;
const badge = u => ({ username: u.username, online: isOnline(u.email), plan: effectivePlan(u), color: parseInt(sha(u.email).slice(0, 6), 16) % 360 });
function cookies(req) { return Object.fromEntries(String(req.headers.cookie || "").split(";").map(c => c.trim().split(/=(.*)/s).slice(0, 2)).filter(x => x[0])); }
function userOf(req) { const t = cookies(req).wc_session; const s = t && db.sessions[sha(t)]; if (!s || s.exp < Date.now()) return null; return db.users[s.email] || null; }
const isCross = req => { try { return !!req.headers.origin && new URL(req.headers.origin).host !== req.headers.host; } catch { return false; } };
const cookieFlags = req => { const https = req.headers["x-forwarded-proto"] === "https" || !!req.socket.encrypted; return isCross(req) ? "; SameSite=None; Secure" : "; SameSite=Lax" + (https ? "; Secure" : ""); };
function startSession(req, res, u) {
    const t = crypto.randomBytes(32).toString("hex"); db.sessions[sha(t)] = { email: u.email, exp: Date.now() + 30 * 864e5 };
    res.setHeader("Set-Cookie", `wc_session=${t}; HttpOnly; Path=/; Max-Age=${30 * 86400}${cookieFlags(req)}`); save();
}
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.end(JSON.stringify(obj)); };
async function body(req, max = 20000) {
    const chunks = []; let n = 0;
    for await (const c of req) { n += c.length; if (n > max) throw Object.assign(new Error("Request too large."), { code: 413 }); chunks.push(c); }
    try { return JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch { throw Object.assign(new Error("Invalid JSON."), { code: 400 }); }
}
const hits = new Map();
function limited(req, key, max, windowMs = 600000) {
    const k = key + (req.headers["x-forwarded-for"] || req.socket.remoteAddress); const now = Date.now(); const h = hits.get(k);
    if (!h || now - h.t > windowMs) { hits.set(k, { t: now, n: 1 }); return false; } return ++h.n > max;
}
function makePassword(pw) { const salt = crypto.randomBytes(16); return salt.toString("hex") + ":" + crypto.scryptSync(pw, salt, 64).toString("hex"); }
function checkPassword(pw, stored) { const [s, h] = String(stored || "").split(":"); if (!h) return false; return crypto.timingSafeEqual(Buffer.from(h, "hex"), crypto.scryptSync(pw, Buffer.from(s, "hex"), 64)); }
const emailOk = e => /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length < 120;

// ---- chat live streams ----
const streams = new Map();
const presence = (u, online) => { for (const [em, set] of streams) if (em !== u.email && set.size) push(em, { t: "presence", username: u.username, online }); };
const push = (email, ev) => (streams.get(email) || []).forEach(r => r.write(`data: ${JSON.stringify(ev)}\n\n`));
const MIME = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3" };

// ---- AI guard used by server.js ----
function guardAI(req) {
    const u = userOf(req); if (!u) return { status: 401, error: "Log in to use the AI study tools." };
    if (!u.verified) return { status: 403, error: "Verify your email first." };
    const day = new Date().toISOString().slice(0, 10); const plan = effectivePlan(u);
    if (u.aiDay !== day) { u.aiDay = day; u.aiCount = 0; }
    if (u.aiCount >= AI_DAILY[plan]) return { status: 429, error: `Daily AI limit reached for your ${plan} plan (${AI_DAILY[plan]}/day). Upgrade for more.` };
    u.aiCount++; db.stats = db.stats || {}; db.stats.ai = (db.stats.ai || 0) + 1; save(); return null;
}

async function handle(req, res, url) {
    const p = url.pathname;
    if (!p.startsWith("/api/") && !p.startsWith("/media/")) return false;
    if (p === "/api/generate" || p === "/api/chat") return false; // existing AI routes
    const origin = req.headers.origin; let allowed = !origin;
    if (origin) { let h = ""; try { h = new URL(origin).host; } catch {} allowed = h === req.headers.host || ORIGINS.has(origin.replace(/\/$/, ""));
        if (allowed) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); res.setHeader("Access-Control-Allow-Credentials", "true"); res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); } }
    if (req.method === "OPTIONS") return res.writeHead(204).end(), true;
    try {
        const u = userOf(req), m = req.method;
        if (m !== "GET" && !allowed) return json(res, 403, { error: "Cross-origin request blocked." }), true;
        if (p === "/api/health") return json(res, 200, { ok: true, mail: !!env.SMTP_PASS }), true;
        if (p === "/api/config" && m === "GET") return json(res, 200, { googleClientId: env.GOOGLE_CLIENT_ID || "", prices: PRICES, currency: "PKR", payInfo: env.PAYMENT_INSTRUCTIONS || "Send the amount via JazzCash/Easypaisa to the number the owner shows here, then paste your transaction ID." }), true;
        if (p === "/api/me" && m === "GET") return json(res, 200, { user: u && pub(u) }), true;
        if (p === "/api/auth/signup" && m === "POST") {
            if (limited(req, "signup", 8)) return json(res, 429, { error: "Too many attempts. Try later." }), true;
            const b = await body(req), email = String(b.email || "").trim().toLowerCase(), username = String(b.username || "").trim().toLowerCase();
            if (!emailOk(email)) return json(res, 400, { error: "Enter a valid email." }), true;
            if (!/^[a-z0-9_.]{3,20}$/.test(username)) return json(res, 400, { error: "Username: 3-20 letters, numbers, _ or ." }), true;
            if (String(b.password || "").length < 8 || String(b.password).length > 128) return json(res, 400, { error: "Password must be 8 to 128 characters." }), true;
            if (db.users[email]?.verified) return json(res, 409, { error: "This email is already registered. Log in instead." }), true;
            if (Object.values(db.users).some(x => x.username === username && x.email !== email)) return json(res, 409, { error: "Username taken." }), true;
            const code = String(crypto.randomInt(100000, 1000000));
            db.users[email] = { email, username, pass: makePassword(b.password), verified: false, plan: "free", expires: 0, created: Date.now(), code: sha(code), codeExp: Date.now() + 9e5, tries: 0 }; save();
            const sent = await sendMail(email, "Your Woopclap verification code", `Your code is ${code}. It expires in 15 minutes.`);
            notifyOwner("New registration", `Email: ${email}\nUsername: ${username}`);
            if (!sent) {
                if (FULL_ACCESS.has(email)) { delete db.users[email]; save(); return json(res, 503, { error: "Email sending is not set up on the server (add SMTP_PASS). Owner accounts must be verified by email or Google sign-in." }), true; }
                const x = db.users[email]; x.verified = true; delete x.code; startSession(req, res, x); save();
                return json(res, 200, { ok: true, user: pub(x) }), true;
            }
            return json(res, 200, { ok: true, needsVerify: true }), true;
        }
        if (p === "/api/auth/verify" && m === "POST") {
            const b = await body(req), x = db.users[String(b.email || "").trim().toLowerCase()];
            if (!x || x.verified || x.codeExp < Date.now() || x.tries >= 5) return json(res, 400, { error: "Code expired or invalid. Sign up again." }), true;
            if (sha(String(b.code || "").trim()) !== x.code) { x.tries++; save(); return json(res, 400, { error: "Wrong code." }), true; }
            x.verified = true; delete x.code; startSession(req, res, x);
            notifyOwner("New user signed up", `Email: ${x.email}\nUsername: ${x.username}`); return json(res, 200, { user: pub(x) }), true;
        }
        if (p === "/api/auth/login" && m === "POST") {
            if (limited(req, "login", 10)) return json(res, 429, { error: "Too many login attempts. Try again in 10 minutes." }), true;
            const b = await body(req), id = String(b.email || b.identifier || "").trim().toLowerCase(), uname = String(b.username || "").trim().toLowerCase();
            if (!id || !b.password) return json(res, 400, { error: "Enter your email (or username) and password." }), true;
            const x = db.users[id] || Object.values(db.users).find(y => y.username === id);
            if (!x || (uname && x.username !== uname) || !checkPassword(String(b.password), x.pass)) return json(res, 401, { error: "Incorrect email/username or password." }), true;
            if (!x.verified) return json(res, 403, { error: "Please verify your email first. Sign up again to get a new code." }), true;
            x.lastLogin = Date.now(); startSession(req, res, x); notifyLogin(req, x, "password");
            return json(res, 200, { user: pub(x) }), true;
        }
        if (p === "/api/auth/google" && m === "POST") {
            if (!env.GOOGLE_CLIENT_ID) return json(res, 503, { error: "Google sign-in is not configured (GOOGLE_CLIENT_ID)." }), true;
            const b = await body(req), r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(String(b.credential || "")));
            const t = r.ok ? await r.json() : null;
            if (!t || t.aud !== env.GOOGLE_CLIENT_ID || t.email_verified !== "true") return json(res, 401, { error: "Google sign-in failed." }), true;
            const email = t.email.toLowerCase(); let x = db.users[email], fresh = !x?.verified;
            if (!x || !x.verified) {
                let base = email.split("@")[0].replace(/[^a-z0-9_.]/g, "").slice(0, 16).padEnd(3, "0"), name = base;
                while (Object.values(db.users).some(y => y.username === name && y.email !== email)) name = base + crypto.randomInt(10, 999);
                x = db.users[email] = { ...(x || {}), email, username: x?.username || name, pass: x?.pass || "", verified: true, plan: x?.plan || "free", expires: x?.expires || 0, created: x?.created || Date.now() };
            }
            x.lastLogin = Date.now(); startSession(req, res, x); notifyLogin(req, x, fresh ? "Google sign-up" : "Google");
            return json(res, 200, { user: pub(x) }), true;
        }
        if (p === "/api/auth/logout" && m === "POST") { const t = cookies(req).wc_session; if (t) { delete db.sessions[sha(t)]; save(); } res.setHeader("Set-Cookie", `wc_session=; HttpOnly; Max-Age=0; Path=/${cookieFlags(req)}`); return json(res, 200, { ok: true }), true; }
        if (!u || !u.verified) return json(res, 401, { error: "Please log in." }), true;

        // ---- payments: order -> user submits transaction id -> owner approves (or a provider webhook can call approve) ----
        if (p === "/api/pay/order" && m === "POST") {
            const b = await body(req); if (!PRICES[b.plan]) return json(res, 400, { error: "Unknown plan." }), true;
            const id = "WC-" + crypto.randomBytes(4).toString("hex").toUpperCase();
            db.orders[id] = { id, email: u.email, plan: b.plan, amount: PRICES[b.plan], status: "created", created: Date.now() }; save();
            return json(res, 200, { order: db.orders[id] }), true;
        }
        if (p === "/api/pay/submit" && m === "POST") {
            const b = await body(req), o = db.orders[b.orderId]; const tx = clean(b.txid).trim();
            if (!o || o.email !== u.email || o.status === "approved" || tx.length < 4) return json(res, 400, { error: "Invalid order or transaction ID." }), true;
            o.txid = tx; o.status = "pending"; save();
            notifyOwner("Payment submitted - needs approval", `Order ${o.id}\nUser: ${u.email}\nPlan: ${o.plan}\nAmount: Rs ${o.amount}\nTransaction ID: ${tx}\nApprove it in the Admin panel after checking your account.`);
            return json(res, 200, { ok: true }), true;
        }
        // ---- chat ----
        if (p === "/api/chat/stream" && m === "GET") {
            res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" }); res.write(": ok\n\n");
            const set = streams.get(u.email) || new Set(); const was = set.size > 0; set.add(res); streams.set(u.email, set); if (!was) presence(u, true);
            const ping = setInterval(() => res.write(": ping\n\n"), 25000);
            req.on("close", () => { clearInterval(ping); set.delete(res); if (!set.size) { u.lastSeen = Date.now(); save(); presence(u, false); } }); return true;
        }
        if (p === "/api/users" && m === "GET") {
            const q = (url.searchParams.get("q") || "").trim().toLowerCase(); if (q.length < 2) return json(res, 200, { users: [] }), true;
            const users = Object.values(db.users).filter(x => x.verified && x.email !== u.email && (x.username.includes(q) || x.email === q)).slice(0, 20).map(badge);
            return json(res, 200, { users }), true;
        }
        if (p === "/api/profile" && m === "GET") {
            const o = Object.values(db.users).find(x => x.verified && x.username === url.searchParams.get("u")); if (!o) return json(res, 404, { error: "User not found." }), true;
            return json(res, 200, { profile: { ...badge(o), bio: o.bio || "", joined: o.created, lastSeen: o.lastSeen || 0, isMe: o.email === u.email } }), true;
        }
        if (p === "/api/profile/update" && m === "POST") { const b = await body(req); u.bio = String(b.bio || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 200); save(); return json(res, 200, { ok: true }), true; }
        if (p === "/api/chat/read" && m === "POST") {
            const b = await body(req), o = Object.values(db.users).find(x => x.username === b.u); if (!o) return json(res, 404, { error: "User not found." }), true;
            let n = 0; db.messages.forEach(g => { if (g.to === u.email && g.from === o.email && g.read === false) { g.read = true; n++; } });
            if (n) { save(); push(o.email, { t: "read", by: u.username }); } return json(res, 200, { ok: true }), true;
        }
        if (p === "/api/chat/threads" && m === "GET") {
            const seen = new Map();
            for (const g of db.messages) if (g.from === u.email || g.to === u.email) seen.set(g.from === u.email ? g.to : g.from, g);
            const threads = [...seen].reverse().map(([em, last]) => ({ ...badge(db.users[em]), last: last.type === "text" ? last.body.slice(0, 60) : "[" + last.type + "]", at: last.at, unread: db.messages.filter(g => g.to === u.email && g.from === em && g.read === false).length }));
            return json(res, 200, { threads }), true;
        }
        if (p === "/api/chat/with" && m === "GET") {
            const o = Object.values(db.users).find(x => x.username === url.searchParams.get("u")); if (!o) return json(res, 404, { error: "User not found." }), true;
            let n = 0; db.messages.forEach(g => { if (g.to === u.email && g.from === o.email && g.read === false) { g.read = true; n++; } }); if (n) { save(); push(o.email, { t: "read", by: u.username }); }
            const msgs = db.messages.filter(g => (g.from === u.email && g.to === o.email) || (g.from === o.email && g.to === u.email)).slice(-200).map(g => ({ id: g.id, mine: g.from === u.email, type: g.type, body: g.body, at: g.at, read: g.read !== false }));
            return json(res, 200, { user: badge(o), messages: msgs }), true;
        }
        if (p === "/api/chat/send" && m === "POST") {
            if (limited(req, "send" + u.email, 60, 60000)) return json(res, 429, { error: "Slow down." }), true;
            const b = await body(req, 4_500_000), o = Object.values(db.users).find(x => x.username === b.to);
            if (!o || !o.verified || o.email === u.email) return json(res, 404, { error: "User not found." }), true;
            const g = { id: crypto.randomBytes(6).toString("hex"), from: u.email, to: o.email, type: b.type, at: Date.now(), read: false };
            if (b.type === "text") { g.body = String(b.body || "").trim().slice(0, 2000); if (!g.body) return json(res, 400, { error: "Empty message." }), true; }
            else if (b.type === "image" || b.type === "voice") {
                const mt = /^data:([a-z0-9\/+.-]+)(?:;[^,]*)?;base64,(.+)$/s.exec(String(b.data || "")); const mime = mt && mt[1];
                const ok = mime && MIME[mime] && (b.type === "image" ? mime.startsWith("image/") : mime.startsWith("audio/"));
                if (!ok) return json(res, 400, { error: "Unsupported file type." }), true;
                const buf = Buffer.from(mt[2], "base64"); if (buf.length > 3_000_000) return json(res, 413, { error: "File over 3 MB." }), true;
                g.body = g.id + "." + MIME[mime]; fs.writeFileSync(path.join(mediaDir, g.body), buf);
            } else return json(res, 400, { error: "Bad message type." }), true;
            db.messages.push(g); db.stats = db.stats || {}; db.stats.msgs = (db.stats.msgs || 0) + 1; save();
            const view = (mine) => ({ id: g.id, mine, type: g.type, body: g.body, at: g.at, read: false });
            push(o.email, { t: "msg", from: badge(u), msg: view(false) }); push(u.email, { t: "msg", from: badge(o), msg: view(true) });
            return json(res, 200, { msg: view(true) }), true;
        }
        if (p.startsWith("/media/") && m === "GET") {
            const f = path.basename(p); const g = db.messages.find(x => x.body === f && x.type !== "text");
            if (!g || (g.from !== u.email && g.to !== u.email)) return res.writeHead(404).end(), true;
            const ext = path.extname(f).slice(1), type = Object.keys(MIME).find(k => MIME[k] === ext);
            res.writeHead(200, { "Content-Type": type, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" });
            return fs.createReadStream(path.join(mediaDir, f)).pipe(res), true;
        }
        // ---- admin (owner only) ----
        if (p.startsWith("/api/admin/")) {
            if (!pub(u).isAdmin) return json(res, 403, { error: "Admins only." }), true;
            if (p === "/api/admin/stats" && m === "GET") {
                const us = Object.values(db.users).filter(x => x.verified), by = Object.fromEntries(PLANS.map(k => [k, 0]));
                us.forEach(x => by[effectivePlan(x)]++);
                const ord = Object.values(db.orders), ap = ord.filter(o => o.status === "approved"), wk = Date.now() - 6048e5;
                return json(res, 200, { total: us.length, byPlan: by, active: us.filter(x => effectivePlan(x) !== "free" && !FULL_ACCESS.has(x.email)).length,
                    expired: us.filter(x => x.plan !== "free" && x.expires < Date.now() && !FULL_ACCESS.has(x.email)).length, revenue: ap.reduce((s, o) => s + o.amount, 0),
                    newThisWeek: us.filter(x => x.created > wk).length, conversions: us.length ? Math.round(100 * new Set(ap.map(o => o.email)).size / us.length) : 0,
                    messages: db.stats?.msgs || 0, aiRequests: db.stats?.ai || 0, pending: ord.filter(o => o.status === "pending") }), true;
            }
            if (p === "/api/admin/approve" && m === "POST") {
                const b = await body(req), o = db.orders[b.orderId], x = o && db.users[o.email];
                if (!o || o.status !== "pending") return json(res, 400, { error: "Order not pending." }), true;
                o.status = b.reject ? "rejected" : "approved";
                if (!b.reject) { x.plan = o.plan; x.expires = Math.max(x.expires || 0, Date.now()) + 30 * 864e5; }
                save(); sendMail(x.email, b.reject ? "Woopclap payment not verified" : "Woopclap plan activated", b.reject ? `We could not verify order ${o.id}. Contact support.` : `Your ${o.plan} plan is active for 30 days.`);
                notifyOwner(b.reject ? "Payment rejected" : "Payment approved", `Order ${o.id} (${o.email}, ${o.plan}, Rs ${o.amount})`); return json(res, 200, { ok: true }), true;
            }
        }
        return json(res, 404, { error: "Not found." }), true;
    } catch (e) { return json(res, e.code && e.code < 600 ? e.code : 500, { error: e.message || "Server error." }), true; }
}
module.exports = { handle, guardAI };
