(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
const NAMES = { free: "FREE", premium: "PREMIUM", "premium-plus": "PLUS", "premium-pro": "PRO", "premium-pro-max": "PRO MAX" };
const BASE = "http://localhost:3000"; 
let unreadTotal = 0, chatUI = null;
let user = null, cfg = { prices: {}, currency: "PKR" }, current = null, es = null;
async function api(path, opts = {}) {
    let r; try { r = await fetch(BASE + path, { method: opts.body ? "POST" : "GET", headers: opts.body ? { "Content-Type": "application/json" } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: BASE ? "include" : "same-origin" }); } catch { throw new Error("Cannot reach the server. Start it with: node server.js, then open http://localhost:3000"); }
    const d = await r.json().catch(() => null); if (d === null) throw new Error("Server not reachable. Open the site through the Node server (node server.js, then http://localhost:3000), not by double-clicking quiz.html.");
    if (!r.ok) throw new Error(d.error || "Something went wrong."); return d;
}
const hue = h => `hsl(${h} 80% 60%)`;
function avatar(u) { const a = el("div", "wc-av", (u.username || "?")[0].toUpperCase()); a.style.background = `linear-gradient(135deg,${hue(u.color)},${hue((u.color + 70) % 360)})`; return a; }
function overlay(content, wide) { const o = el("div", "wc-overlay open"); o.append(content); o.addEventListener("mousedown", e => { if (e.target === o) o.remove(); }); document.body.append(o); return o; }
function modal(title) { const m = el("div", "wc-glass wc-modal"); m.style.position = "relative"; const x = el("button", "wc-x", "×"); x.onclick = () => m.parentNode.remove(); m.append(x, el("h3", "", title)); return m; }
const field = (type, ph) => { const i = el("input"); i.type = type; i.placeholder = ph; i.autocomplete = type === "password" ? "current-password" : "on"; return i; };

// ---- session / session-linked plan for the existing demo gating in app.js ----
function applyPlan() {
    const plan = user ? user.plan : "free";
    try { localStorage.setItem("wooclap-subscription", JSON.stringify({ plan, status: plan === "free" ? "free" : "active", provider: "server", changedAt: new Date().toISOString() })); } catch {}
}
function renderHeader() {
    const box = $(".header-actions"); box.querySelectorAll(".wc-auth").forEach(n => n.remove());
    const wrap = el("span", "wc-userchip wc-auth");
    if (!user) {
        const li = el("button", "wc-btn ghost", "Log in"), su = el("button", "wc-btn wc-grad", "Sign up");
        li.onclick = () => authModal("login"); su.onclick = () => authModal("signup"); wrap.append(li, su);
    } else {
        const b = el("button", "wc-btn wc-grad", user.username); b.onclick = accountModal;
        const pill = el("span", "wc-pill wc-grad", NAMES[user.plan]); wrap.append(pill, b);
    }
    box.prepend(wrap); applyPlan();
    window.dispatchEvent(new Event("storage")); if (window.WoopRefresh) window.WoopRefresh();
}
async function loadMe() { try { user = (await api("/api/me")).user; } catch { user = null; } renderHeader(); if (user) { startStream(); refreshUnread(); } }

function authModal(mode) {
    const m = modal(mode === "login" ? "Welcome back" : "Create your account"), err = el("div", "wc-err");
    const em = field(mode === "login" ? "text" : "email", mode === "login" ? "Gmail / email (or username)" : "Gmail / email"), un = field("text", mode === "login" ? "Username (optional)" : "Username"), pw = field("password", "Password (8+ characters)");
    const go = el("button", "wc-btn wc-grad", mode === "login" ? "Log in" : "Sign up");
    const sw = el("button", "wc-btn ghost", mode === "login" ? "New here? Create an account" : "Have an account? Log in");
    sw.onclick = () => { m.parentNode.remove(); authModal(mode === "login" ? "signup" : "login"); };
    const finish = u => { user = u; m.parentNode.remove(); renderHeader(); };
    go.onclick = async () => {
        err.textContent = ""; go.disabled = true;
        try {
            if (mode === "login") finish((await api("/api/auth/login", { body: { email: em.value, username: un.value, password: pw.value } })).user);
            else { const r = await api("/api/auth/signup", { body: { email: em.value, username: un.value, password: pw.value } }); if (r.user) finish(r.user); else verifyStep(r); }
        } catch (e) { err.textContent = e.message; } go.disabled = false;
    };
    function verifyStep(r = {}) {
        m.replaceChildren(el("h3", "", "Check your email")); const c = field("text", "6-digit code"), v = el("button", "wc-btn wc-grad", "Verify"), e2 = el("div", "wc-err");
        m.append(el("p", "", r.emailConfigured === false ? `Email sending is not set up on the server yet. Your code (local testing only): ${r.devCode || "see the server console"}` : `We sent a code to ${em.value}.`), c, v, e2);
        v.onclick = async () => { try { finish((await api("/api/auth/verify", { body: { email: em.value, code: c.value } })).user); } catch (e) { e2.textContent = e.message; } };
    }
    m.append(em, un); m.append(pw, err, go);
    if (cfg.googleClientId) {
        const g = el("div"); g.style.marginTop = ".8rem"; m.append(g);
        const init = () => { google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: async r => { try { finish((await api("/api/auth/google", { body: { credential: r.credential } })).user); } catch (e) { err.textContent = e.message; } } }); google.accounts.id.renderButton(g, { theme: "filled_blue", shape: "pill", size: "large" }); };
        if (window.google?.accounts) init(); else { const s = el("script"); s.src = "https://accounts.google.com/gsi/client"; s.onload = init; document.head.append(s); }
    }
    m.append(sw); overlay(m);
}

function accountModal() {
    const m = modal("Your account");
    m.append(el("p", "", `${user.username} · ${user.email}`), el("p", "", `Plan: ${NAMES[user.plan]}${user.fullAccess ? " (owner full access)" : user.expires ? ` · renews by ${new Date(user.expires).toLocaleDateString()}` : ""}`));
    const up = el("button", "wc-btn wc-grad", "View plans & upgrade"); up.onclick = () => { m.parentNode.remove(); location.hash = "#pricing"; $("[data-open-study]")?.click(); setTimeout(() => $("#tab-plans")?.click(), 150); };
    const mp = el("button", "wc-btn ghost", "My profile"); mp.onclick = () => { m.parentNode.remove(); myProfile(); };
    const ch = el("button", "wc-btn ghost", "Open chat"); ch.onclick = () => { m.parentNode.remove(); openChat(); };
    m.append(up, mp, ch);
    if (user.isAdmin) { const ad = el("button", "wc-btn ghost", "Admin dashboard"); ad.onclick = () => { m.parentNode.remove(); adminModal(); }; m.append(ad); }
    const lo = el("button", "wc-btn ghost", "Log out"); lo.onclick = async () => { await api("/api/auth/logout", { body: {} }); user = null; stopStream(); m.parentNode.remove(); renderHeader(); };
    m.append(lo); overlay(m);
}

// ---- checkout (server order; owner verifies payment before the plan changes) ----
async function checkout(planId) {
    if (!user) return authModal("signup");
    if (planId === "free") return;
    const m = modal(`Upgrade to ${NAMES[planId]}`), err = el("div", "wc-err");
    try {
        const { order } = await api("/api/pay/order", { body: { plan: planId } });
        m.append(el("p", "", `Amount: Rs ${order.amount} / month · Order ${order.id}`), el("p", "", cfg.payInfo), el("p", "", "Never share card numbers here. Enter the transaction ID from your payment app:"));
        const tx = field("text", "Transaction ID"), b = el("button", "wc-btn wc-grad", "I've paid - notify owner");
        b.onclick = async () => { try { await api("/api/pay/submit", { body: { orderId: order.id, txid: tx.value } }); m.replaceChildren(el("h3", "", "Thank you!"), el("p", "", "Your payment is being verified. Your plan activates as soon as it's approved - you'll get an email.")); } catch (e) { err.textContent = e.message; } };
        m.append(tx, err, b);
    } catch (e) { m.append(el("p", "", e.message)); }
    overlay(m);
}

// ---- admin ----
async function adminModal() {
    const m = modal("Admin dashboard"); m.style.width = "min(560px,100%)";
    try {
        const s = await api("/api/admin/stats"), t = el("table", "wc-table");
        [["Total users", s.total], ...Object.entries(s.byPlan).map(([k, v]) => [NAMES[k] + " users", v]), ["Active subscriptions", s.active], ["Expired", s.expired], ["Revenue (PKR)", s.revenue], ["New this week", s.newThisWeek], ["Conversion %", s.conversions], ["Chat messages", s.messages], ["AI requests", s.aiRequests]]
            .forEach(([a, b]) => { const r = t.insertRow(); r.insertCell().textContent = a; r.insertCell().textContent = b; });
        m.append(t, el("h3", "", "Pending payments"));
        if (!s.pending.length) m.append(el("p", "", "None."));
        s.pending.forEach(o => { const row = el("div", "wc-dm"); row.append(el("div", "", `${o.id} · ${o.email} · ${o.plan} · Rs ${o.amount} · tx ${o.txid}`));
            [["✓", false], ["✗", true]].forEach(([l, rej]) => { const b = el("button", "wc-ic", l); b.onclick = async () => { await api("/api/admin/approve", { body: { orderId: o.id, reject: rej } }); m.parentNode.remove(); adminModal(); }; row.append(b); }); m.append(row); });
    } catch (e) { m.append(el("p", "", e.message)); }
    overlay(m);
}

// ---- chat (real time over Server-Sent Events, authenticated by the session cookie) ----
const fmt = t => new Date(t).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
function setBadge() { const b = $(".wc-aha .wc-btn"); if (b) b.textContent = "Open chat →" + (unreadTotal ? ` (${unreadTotal} new)` : ""); }
async function refreshUnread() { try { const { threads } = await api("/api/chat/threads"); unreadTotal = threads.reduce((n, t) => n + t.unread, 0); setBadge(); return threads; } catch { return []; } }
function toast(text, onclick) { const t = el("div", "wc-glass wc-toast", text); t.onclick = () => { t.remove(); onclick && onclick(); }; document.body.append(t); setTimeout(() => t.remove(), 6000); }
function startStream() {
    if (es || !user) return;
    es = new EventSource(BASE + "/api/chat/stream", { withCredentials: !!BASE });
    es.onmessage = e => {
        const ev = JSON.parse(e.data), live = chatUI && chatUI.box.isConnected;
        if (live) chatUI.onEvent(ev);
        if (ev.t === "msg" && !ev.msg.mine) {
            if (!(live && chatUI.current === ev.from.username)) {
                toast(`New message from ${ev.from.username}`, () => openChat(ev.from.username));
                if (window.Notification && Notification.permission === "granted" && document.hidden) new Notification("Woopclap - " + ev.from.username, { body: ev.msg.type === "text" ? ev.msg.body.slice(0, 80) : "Sent a " + ev.msg.type });
            }
            refreshUnread();
        }
    };
}
function stopStream() { es?.close(); es = null; unreadTotal = 0; chatUI = null; setBadge(); }
function showProfile(name, onMessage) {
    api("/api/profile?u=" + encodeURIComponent(name)).then(({ profile: p }) => {
        const m = modal("Profile"); m.classList.add("wc-profile"); const a = avatar(p); a.style.cssText += ";margin:0 auto 1rem;width:80px;height:80px;font-size:2rem";
        m.append(a, el("h3", "", p.username), el("span", "wc-pill wc-grad", NAMES[p.plan] + " member"), el("p", "", p.online ? "● Online" : p.lastSeen ? "Last seen " + fmt(p.lastSeen) : "Offline"), el("p", "", p.bio || "No bio yet."), el("p", "", "Joined " + new Date(p.joined).toLocaleDateString()));
        if (!p.isMe) { const b = el("button", "wc-btn wc-grad", "Message"); b.onclick = () => { m.parentNode.remove(); onMessage ? onMessage(p.username) : openChat(p.username); }; m.append(b); }
        overlay(m);
    }).catch(e => alert(e.message));
}
function myProfile() {
    const m = modal("My profile"), bio = el("textarea", "wc-input"), st = el("div", "wc-err"); bio.rows = 3; bio.maxLength = 200; bio.placeholder = "Short bio (max 200 characters)";
    api("/api/profile?u=" + encodeURIComponent(user.username)).then(r => { bio.value = r.profile.bio; });
    const sv = el("button", "wc-btn wc-grad", "Save bio"); sv.onclick = async () => { try { await api("/api/profile/update", { body: { bio: bio.value } }); st.textContent = "Saved."; } catch (e) { st.textContent = e.message; } };
    const view = el("button", "wc-btn ghost", "See how others view it"); view.onclick = () => showProfile(user.username);
    m.append(el("p", "", `${user.username} · ${user.email}`), bio, st, sv, view); overlay(m);
}
function openChat(startWith) {
    if (!user) return authModal("login");
    startStream(); if (window.Notification && Notification.permission === "default") Notification.requestPermission();
    const box = el("div", "wc-glass wc-chat"), side = el("div", "wc-side"), main = el("div", "wc-main"), list = el("div", "wc-list");
    const search = el("input", "wc-input"); search.placeholder = "Search by username or exact Gmail"; search.style.borderRadius = "999px";
    const x = el("button", "wc-x", "×"); const ov = overlay(box); x.onclick = () => { ov.remove(); refreshUnread(); }; box.append(x);
    side.append(el("strong", "", "Messages"), search, list); box.append(side, main);
    const ui = chatUI = { box, current: null, onEvent: () => {} }; let msgsBox, seen = new Set(), statusEl;
    main.replaceChildren(el("div", "wc-empty", "Search for a friend to start chatting."));
    function row(u, sub, toProfile) {
        const r = el("div", "wc-dm" + (ui.current === u.username ? " on" : "")), t = el("div"); t.style.flex = "1";
        t.append(el("strong", "", u.username + " "), el("span", "wc-pill wc-grad", NAMES[u.plan]), el("span", "wc-dot" + (u.online ? " on" : "")));
        if (sub) t.append(el("small", "", sub)); r.append(avatar(u), t); if (u.unread) r.append(el("span", "wc-unread", u.unread));
        r.onclick = () => toProfile ? showProfile(u.username, openThread) : openThread(u.username); return r;
    }
    async function threads() { const th = await refreshUnread(); list.replaceChildren(...(th.length ? th.map(t => row(t, t.last)) : [el("div", "wc-empty", "No chats yet.")])); }
    let timer; search.oninput = () => { clearTimeout(timer); timer = setTimeout(async () => { if (search.value.trim().length < 2) return threads(); try { const { users } = await api("/api/users?q=" + encodeURIComponent(search.value)); list.replaceChildren(...(users.length ? users.map(u => row(u, "", true)) : [el("div", "wc-empty", "No users found.")])); } catch (e) { list.replaceChildren(el("div", "wc-empty", e.message)); } }, 250); };
    function add(msg) {
        if (seen.has(msg.id)) return; seen.add(msg.id);
        const b = el("div", "wc-m" + (msg.mine ? " me" : ""));
        if (msg.type === "text") b.append(el("div", "", msg.body));
        else if (msg.type === "image") { const i = el("img"); i.src = BASE + "/media/" + msg.body; i.alt = "Image"; b.append(i); }
        else { const a = el("audio"); a.controls = true; a.src = BASE + "/media/" + msg.body; b.append(a); }
        const meta = el("small", "wc-time", fmt(msg.at) + " "); if (msg.mine) meta.append(el("span", "wc-tick", msg.read ? "✓✓" : "✓")); b.append(meta);
        msgsBox.append(b); msgsBox.scrollTop = 1e9;
    }
    const status = u => u.online ? "● Online" : "Offline";
    async function openThread(name) {
        ui.current = name; seen = new Set();
        let d; try { d = await api("/api/chat/with?u=" + encodeURIComponent(name)); } catch (e) { return alert(e.message); }
        const head = el("div", "wc-head"), t = el("div"); statusEl = el("div", "", status(d.user)); t.append(el("strong", "", d.user.username), statusEl); head.append(avatar(d.user), t);
        head.onclick = () => showProfile(name, () => {});
        msgsBox = el("div", "wc-msgs"); d.messages.forEach(add);
        const bar = el("div", "wc-glass wc-bar"), inp = el("input", "wc-input"), file = el("input"), img = el("button", "wc-ic", "🖼"), mic = el("button", "wc-ic", "🎤"), send = el("button", "wc-ic wc-grad", "➤");
        inp.placeholder = "Message..."; file.type = "file"; file.accept = "image/png,image/jpeg,image/webp,image/gif"; file.hidden = true;
        const post = async (type, payload) => { try { const r = await api("/api/chat/send", { body: { to: name, type, ...payload } }); add(r.msg); } catch (e) { alert(e.message); } };
        send.onclick = () => { if (inp.value.trim()) { post("text", { body: inp.value }); inp.value = ""; } }; inp.onkeydown = e => { if (e.key === "Enter") send.click(); };
        img.onclick = () => file.click();
        file.onchange = () => { const f = file.files[0]; if (!f) return; if (f.size > 2_000_000) return alert("Image must be under 2 MB."); const r = new FileReader(); r.onload = () => post("image", { data: r.result }); r.readAsDataURL(f); file.value = ""; };
        let rec, chunks = [];
        mic.onclick = async () => {
            if (rec?.state === "recording") return rec.stop();
            try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); rec = new MediaRecorder(st); chunks = []; rec.ondataavailable = e => chunks.push(e.data);
                rec.onstop = () => { st.getTracks().forEach(k => k.stop()); mic.classList.remove("rec"); const blob = new Blob(chunks, { type: rec.mimeType.split(";")[0] }); if (blob.size > 2_000_000) return alert("Voice note too long."); const r = new FileReader(); r.onload = () => post("voice", { data: r.result }); r.readAsDataURL(blob); };
                rec.start(); mic.classList.add("rec"); } catch { alert("Microphone permission is needed for voice messages."); }
        };
        bar.append(img, inp, mic, send, file); main.replaceChildren(head, msgsBox, bar); threads();
    }
    ui.onEvent = ev => {
        if (ev.t === "msg") { if (ev.from.username === ui.current && !ev.msg.mine) { add(ev.msg); api("/api/chat/read", { body: { u: ev.from.username } }).catch(() => {}); } else if (ev.msg.mine && ev.from.username === ui.current) add(ev.msg); threads(); }
        else if (ev.t === "presence") { if (ev.username === ui.current && statusEl) statusEl.textContent = status(ev); threads(); }
        else if (ev.t === "read" && ev.by === ui.current) msgsBox?.querySelectorAll(".wc-tick").forEach(k => k.textContent = "✓✓");
    };
    threads(); if (startWith) openThread(startWith);
}

// ---- page injection: "aha" section above Three Steps ----
function injectAha() {
    const how = $("#how"); if (!how || $(".wc-aha")) return;
    const s = el("section", "wc-aha wc-grad"); s.id = "aha-chat";
    const t = el("div"); t.append(el("p", "eyebrow", "Aha moment · Live poll + Chat"), el("h2", "", "Talk to students everywhere"), el("p", "", "Message classmates, share photos and send voice notes in our own live chat."));
    const b = el("button", "wc-btn", "Open chat →"); b.onclick = openChat; s.append(t, b); how.before(s);
}
window.WoopAuth = { checkout, user: () => user, openLogin: () => authModal("login"), openChat };
document.addEventListener("DOMContentLoaded", async () => { injectAha(); try { cfg = { ...cfg, ...(await api("/api/config")) }; } catch {} loadMe(); });
})();
