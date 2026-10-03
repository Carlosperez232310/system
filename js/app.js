/* SYSTEM — Solo Leveling style life RPG. All state in localStorage. */
(() => {
'use strict';
const VERSION = '202610021855';
const KEY = 'system.save.v1';
const TZ = 'America/Los_Angeles';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmt = n => Number(n).toLocaleString('en-US');

/* ---------------- time (America/Los_Angeles) ---------------- */
function laParts(d = new Date()) {
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-US', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'}).formatToParts(d)) p[x.type] = x.value;
  return p;
}
function laToday() { const p = laParts(); return `${p.year}-${p.month}-${p.day}`; }
function secsToMidnight() { const p = laParts(); return 86400 - ((+p.hour % 24) * 3600 + (+p.minute) * 60 + (+p.second)); }
function dayNum(s) { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); }
function daysBetween(a, b) { return dayNum(b) - dayNum(a); }
function prettyDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {timeZone: 'UTC', month: 'short', day: 'numeric'}); }
function stamp(t) { return new Date(t).toLocaleString('en-US', {timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) + ' PT'; }

/* ---------------- icons ---------------- */
const IC = {
  potion: '<svg viewBox="0 0 48 48"><path d="M19 5h10v4h-2v8.5c6 2.2 10 7.3 10 13.5 0 7.7-5.8 12-13 12s-13-4.3-13-12c0-6.2 4-11.3 10-13.5V9h-2z" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M13.5 30c4-2 7 1.5 10.5 0s6.5-2 10.5 0c0 6-4.5 9.5-10.5 9.5S13.5 36 13.5 30z" fill="currentColor" fill-opacity=".7"/><circle cx="20" cy="26" r="1.6" fill="#fff"/></svg>',
  pouch: '<svg viewBox="0 0 48 48"><path d="M17 9h14l-3 6c7 3 12 10 12 17 0 7-6 11-16 11S8 39 8 32c0-7 5-14 12-17z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M19 15h10" stroke="currentColor" stroke-width="2.4"/><text x="24" y="35" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="12" fill="currentColor">G</text></svg>',
  scroll: '<svg viewBox="0 0 48 48"><path d="M12 8h22a5 5 0 0 1 5 5v0H17v24a5 5 0 0 1-10 0v-3h5z" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 13v24a5 5 0 0 0 5 3h17a5 5 0 0 0 0-6H22" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M22 19h12M22 25h10" stroke="currentColor" stroke-width="2"/><text x="28" y="33" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="7" fill="currentColor">XP</text></svg>',
  crystal: '<svg viewBox="0 0 48 48"><path d="M24 4 37 17 24 44 11 17z" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 17h26M24 4l-6 13 6 27 6-27z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  box: '<svg viewBox="0 0 48 48"><path d="M6 17 24 9l18 8v18l-18 8-18-8z" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M6 17l18 8 18-8M24 25v18" fill="none" stroke="currentColor" stroke-width="2"/><text x="24" y="21" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="9" fill="currentColor">?</text></svg>',
  title: '<svg viewBox="0 0 48 48"><path d="M8 14l8 6 8-12 8 12 8-6-3 22H11z" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 40h26" stroke="currentColor" stroke-width="2.6"/></svg>',
  shield: '<svg viewBox="0 0 48 48"><path d="M24 4 7 10v12c0 10.5 7.2 18 17 22 9.8-4 17-11.5 17-22V10z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 24l5 5 9-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  elixir: '<svg viewBox="0 0 48 48"><path d="M20 4h8v8l8 9v19a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V21l8-9z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 22c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0c0-3 2-5.5 5-9.5z" fill="currentColor"/></svg>',
  drop: '<svg viewBox="0 0 48 48"><path d="M24 5c7 10 13 16 13 24a13 13 0 0 1-26 0c0-8 6-14 13-24z" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="2.2"/><path d="M18 30a6 6 0 0 0 6 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  gift: '<svg viewBox="0 0 48 48"><path d="M8 18h32v8H8zM11 26h26v16H11zM24 18v24" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 18c-3-8-12-9-12-4s9 4 12 4c3 0 12 1 12-4s-9-4-12 4z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  tri: '<svg viewBox="0 0 24 24"><path d="M12 3 2 21h20z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 17.6v.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
};

/* ---------------- items & loot ---------------- */
const RARITY = {
  common: {label: 'COMMON', w: 58}, rare: {label: 'RARE', w: 29}, epic: {label: 'EPIC', w: 10.5}, legendary: {label: 'LEGENDARY', w: 2.5}
};
const ITEMS = {
  pouch_s:  {name: 'Small Gold Pouch', rarity: 'common', icon: 'pouch', desc: 'Contains 20–40 Gold.', use: () => gainGold(rnd(20, 40), 'Opened Small Gold Pouch')},
  scroll_s: {name: 'Minor XP Scroll', rarity: 'common', icon: 'scroll', desc: 'Grants +30 XP.', use: () => gainXP(30, 'Read Minor XP Scroll')},
  hydra:    {name: 'Hydration Elixir', rarity: 'common', icon: 'drop', desc: "Instantly clears today's water objective.", target: 'water'},
  rest:     {name: 'Potion of Rest', rarity: 'rare', icon: 'potion', desc: "Skip one objective of today's Daily Quest.", target: 'any'},
  pouch_m:  {name: 'Gold Pouch', rarity: 'rare', icon: 'pouch', desc: 'Contains 60–120 Gold.', use: () => gainGold(rnd(60, 120), 'Opened Gold Pouch')},
  scroll_m: {name: 'XP Scroll', rarity: 'rare', icon: 'scroll', desc: 'Grants +80 XP.', use: () => gainXP(80, 'Read XP Scroll')},
  crystal:  {name: 'Stat Crystal', rarity: 'rare', icon: 'crystal', desc: 'Grants +1 free stat point.', use: () => { S.statPoints += 1; return '+1 stat point'; }},
  title_wolf: {name: 'Title: Wolf Slayer', rarity: 'rare', icon: 'title', desc: 'Cosmetic title. Use to unlock and equip.', title: 'Wolf Slayer'},
  mystery:  {name: 'Mystery Box', rarity: 'epic', icon: 'box', desc: 'Open to receive a random item. Rare or better guaranteed.', mystery: true},
  pouch_l:  {name: 'Heavy Gold Pouch', rarity: 'epic', icon: 'pouch', desc: 'Contains 150–300 Gold.', use: () => gainGold(rnd(150, 300), 'Opened Heavy Gold Pouch')},
  scroll_l: {name: 'Greater XP Scroll', rarity: 'epic', icon: 'scroll', desc: 'Grants +250 XP.', use: () => gainXP(250, 'Read Greater XP Scroll')},
  ward:     {name: 'Penalty Ward', rarity: 'epic', icon: 'shield', desc: 'Passive. Automatically negates the next Penalty (Gold & streak are protected). Consumed on trigger.', passive: true},
  title_iron:  {name: 'Title: Iron Will', rarity: 'epic', icon: 'title', desc: 'Cosmetic title. Use to unlock and equip.', title: 'Iron Will'},
  title_demon: {name: 'Title: Demon Hunter', rarity: 'epic', icon: 'title', desc: 'Cosmetic title. Use to unlock and equip.', title: 'Demon Hunter'},
  elixir:   {name: 'Elixir of Life', rarity: 'legendary', icon: 'elixir', desc: 'Grants +3 free stat points.', use: () => { S.statPoints += 3; return '+3 stat points'; }},
  hoard:    {name: "Dragon's Hoard", rarity: 'legendary', icon: 'gift', desc: 'Contains 500–800 Gold.', use: () => gainGold(rnd(500, 800), "Opened Dragon's Hoard")},
  title_monarch: {name: 'Title: Shadow Monarch', rarity: 'legendary', icon: 'title', desc: 'Cosmetic title. Use to unlock and equip. "Arise."', title: 'Shadow Monarch'},
};
const SHOP_ITEMS = [['hydra', 60], ['scroll_m', 100], ['rest', 120], ['mystery', 250], ['ward', 400], ['crystal', 500]];

function rollRarity(boost = 0, minRare = false) {
  const w = {common: minRare ? 0 : Math.max(20, RARITY.common.w - boost * 1.5), rare: RARITY.rare.w + boost * .8,
    epic: RARITY.epic.w + boost * .5 + (minRare ? 12 : 0), legendary: RARITY.legendary.w + boost * .2 + (minRare ? 4 : 0)};
  let t = Object.values(w).reduce((a, b) => a + b, 0), r = Math.random() * t;
  for (const k in w) { if ((r -= w[k]) < 0) return k; }
  return 'common';
}
function rollItem(boost = 0, minRare = false, noMystery = false) {
  const rar = rollRarity(boost, minRare);
  const pool = Object.keys(ITEMS).filter(k => ITEMS[k].rarity === rar && !(noMystery && k === 'mystery'));
  return pool[Math.floor(Math.random() * pool.length)];
}
function dropChance() { return Math.min(.95, .8 + (S.stats.PER - 10) * .01); }
function luckBoost() { return Math.max(0, S.stats.PER - 10) * .5 + Math.min(S.streak, 30) * .2; }

/* ---------------- progression ---------------- */
const RANKS = [[50, 'S', '#ffcf4a'], [35, 'A', '#ff9d4a'], [20, 'B', '#c38bff'], [10, 'C', '#4aa8ff'], [5, 'D', '#6effbe'], [1, 'E', '#b9c9d9']];
function rankOf(lv) { return RANKS.find(r => lv >= r[0]); }
function xpNeed(lv) { return 100 + (lv - 1) * 40; }
const STAT_DESC = {STR: 'Strength — power, push-ups, lifting', AGI: 'Agility — speed, cardio, mobility', VIT: 'Vitality — health, sleep, endurance',
  INT: 'Intelligence — learning, focus', PER: 'Perception — luck & loot drop rates'};

function genQuest(date) {
  const L = S.level;
  const reps = Math.min(100, 20 + (L - 1) * 4), walk = Math.min(60, 15 + (L - 1) * 2);
  return {id: 'daily-' + date, date, kind: 'DAILY QUEST', title: 'Strength Training',
    objectives: [
      {id: 'pushups', name: 'Push-ups', target: reps, current: 0, unit: '', step: 5},
      {id: 'situps', name: 'Sit-ups', target: reps, current: 0, unit: '', step: 5},
      {id: 'squats', name: 'Squats', target: reps, current: 0, unit: '', step: 5},
      {id: 'walk', name: 'Walk or Run', target: walk, current: 0, unit: 'min', step: 5},
      {id: 'water', name: 'Drink Water', target: 8, current: 0, unit: 'glasses', step: 1},
    ],
    reward: {gold: 30 + (L - 1) * 5, xp: 50 + (L - 1) * 5, stat: 'STR'}, completed: false};
}
function genPenalty(date, prevPenalty) {
  const L = S.level, reps = Math.min(150, 30 + (L - 1) * 5);
  const extra = prevPenalty && !prevPenalty.completed ? 1.5 : 1;
  return {id: 'penalty-' + date, date, kind: 'PENALTY QUEST', title: 'Survival',
    objectives: [
      {id: 'p_push', name: 'Push-ups', target: Math.round(reps * extra), current: 0, unit: '', step: 5},
      {id: 'p_squat', name: 'Squats', target: Math.round(reps * extra), current: 0, unit: '', step: 5},
      {id: 'p_burpee', name: 'Burpees', target: Math.round((10 + L) * extra), current: 0, unit: '', step: 5},
    ], reward: {xp: 25 + L * 2}, completed: false};
}

/* ---------------- state ---------------- */
function defaultState() {
  const now = Date.now();
  return {
    v: 1, player: 'Carlos Perez', level: 1, xp: 0, gold: 50,
    stats: {STR: 10, AGI: 10, VIT: 10, INT: 10, PER: 10}, statPoints: 0,
    streak: 0, bestStreak: 0, questsCompleted: 0, penalties: 0,
    title: 'The Awakened', titles: ['The Awakened'],
    inventory: {},
    rewards: [
      {id: uid(), name: 'Buy a video game', price: 1000},
      {id: uid(), name: 'Takeout night', price: 300},
      {id: uid(), name: 'Movie night', price: 150},
      {id: uid(), name: 'Sleep in (no alarm)', price: 200},
      {id: uid(), name: 'New gym gear', price: 600},
    ],
    quest: null, penaltyQuest: null, sideQuests: [],
    log: [{t: now, type: 'quest', text: 'AWAKENING QUEST cleared. The System has chosen you, Player Carlos Perez.', gold: 50}],
    pending: [], settings: {sound: true, tipDismissed: false},
    stats_total: {goldEarned: 50, goldSpent: 0},
    created: now,
  };
}
let S;
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) { console.warn('load failed', e); }
  return defaultState();
}
function normalize(o) {
  const d = defaultState();
  const s = Object.assign(d, o || {});
  s.stats = Object.assign(defaultState().stats, o.stats || {});
  s.settings = Object.assign(defaultState().settings, o.settings || {});
  s.stats_total = Object.assign({goldEarned: 0, goldSpent: 0}, o.stats_total || {});
  if (!Array.isArray(s.log)) s.log = []; if (!Array.isArray(s.rewards)) s.rewards = [];
  if (!Array.isArray(s.sideQuests)) s.sideQuests = []; if (!Array.isArray(s.pending)) s.pending = [];
  if (!Array.isArray(s.titles) || !s.titles.length) s.titles = ['The Awakened'];
  if (typeof s.inventory !== 'object' || Array.isArray(s.inventory) || !s.inventory) s.inventory = {};
  for (const k of ['level', 'xp', 'gold', 'statPoints', 'streak']) s[k] = Math.max(0, Math.floor(Number(s[k]) || 0));
  s.level = Math.max(1, s.level);
  return s;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Save failed: storage full?', 'red'); } }
function log(type, text, gold = 0) { S.log.unshift({t: Date.now(), type, text, gold}); if (S.log.length > 600) S.log.length = 600; }

/* ---------------- economy helpers ---------------- */
function gainGold(n, why) { S.gold += n; S.stats_total.goldEarned += n; if (why) log('item', `${why}: +${n} G`, n); return `+${fmt(n)} Gold`; }
let pendingLevelUps = 0;
function gainXP(n, why) {
  S.xp += n; if (why) log('item', `${why}: +${n} XP`);
  while (S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level); S.level++; S.statPoints += 3; pendingLevelUps++;
    log('level', `LEVEL UP! Reached Lv. ${S.level}. +3 stat points.`);
  }
  return `+${n} XP`;
}
function addItem(k, n = 1) { S.inventory[k] = (S.inventory[k] || 0) + n; }
function takeItem(k) { if (!S.inventory[k]) return false; if (--S.inventory[k] <= 0) delete S.inventory[k]; return true; }

/* ---------------- day rollover & penalty ---------------- */
function dayCheck() {
  const today = laToday();
  if (!S.quest) { S.quest = genQuest(today); save(); return false; }
  if (S.quest.date === today) return false;
  const prev = S.quest, gap = daysBetween(prev.date, today);
  if (gap > 0) {
    const missed = (prev.completed ? 0 : 1) + Math.max(0, gap - 1);
    if (missed > 0) {
      if (S.inventory.ward) {
        takeItem('ward');
        log('penalty', `Penalty Ward shattered. The penalty for ${missed} missed Daily Quest${missed > 1 ? 's' : ''} was negated.`);
        S.pending.push({type: 'ward', missed});
      } else {
        const loss = Math.min(S.gold, Math.round(Math.max(10, S.gold * .15) * Math.min(missed, 3)));
        const lostStreak = S.streak;
        S.gold -= loss; S.streak = 0; S.penalties++;
        S.penaltyQuest = genPenalty(today, S.penaltyQuest);
        log('penalty', `PENALTY: Daily Quest failed${missed > 1 ? ` (${missed} days missed)` : ''}. −${loss} G, streak ${lostStreak} → 0. Penalty Quest issued.`, -loss);
        S.pending.push({type: 'penalty', missed, loss, lostStreak, questDate: prev.date});
      }
    }
  }
  S.quest = genQuest(today);
  save();
  return true;
}

/* ---------------- quest actions ---------------- */
function findObj(qid, oid) { const q = qid === 'penalty' ? S.penaltyQuest : S.quest; return q && [q, q.objectives.find(o => o.id === oid)]; }
function setCount(qid, oid, val) {
  const r = findObj(qid, oid); if (!r || !r[1]) return; const [q, o] = r;
  if (q.completed) return;
  const was = o.current >= o.target || o.skipped;
  o.current = Math.max(0, Math.min(o.target, val));
  if (o.current < o.target) o.skipped = false;
  const now = o.current >= o.target || o.skipped;
  if (!was && now) { toast(`Objective cleared: <b2>${esc(o.name)}</b2>`, 'green', 'CLEARED'); sfx('clear'); popObj = oid; }
  else sfx('tick');
  save();
  if (q.objectives.every(x => x.current >= x.target || x.skipped)) {
    if (qid === 'penalty') completePenalty(); else completeDaily();
  } else render();
}
let popObj = null;

async function completeDaily() {
  const q = S.quest; if (q.completed) return;
  q.completed = true; q.completedAt = Date.now();
  S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak); S.questsCompleted++;
  const streakBonus = Math.min(50, (S.streak - 1) * 2);
  const gold = q.reward.gold + streakBonus;
  S.gold += gold; S.stats_total.goldEarned += gold;
  S.stats[q.reward.stat] += 1;
  const lines = [`<span class="gold">+${gold} Gold</span>${streakBonus ? ` <small>(incl. +${streakBonus} streak bonus)</small>` : ''}`, `<span class="hl">+${q.reward.xp} XP</span>`, `<span class="green">+1 ${q.reward.stat}</span>`];
  let milestone = '';
  if (S.streak > 0 && S.streak % 7 === 0) { S.stats.VIT += 1; S.statPoints += 1; milestone = `${S.streak}-day streak milestone: +1 VIT, +1 stat point`; lines.push(`<span class="green">${milestone}</span>`); }
  log('quest', `DAILY QUEST cleared: ${q.title} (${prettyDate(q.date)}). +${gold} G, +${q.reward.xp} XP, +1 ${q.reward.stat}. Streak ${S.streak}.`, gold);
  gainXP(q.reward.xp);
  let loot = null;
  if (Math.random() < dropChance()) { loot = rollItem(luckBoost()); addItem(loot); log('loot', `Loot drop: [${RARITY[ITEMS[loot].rarity].label}] ${ITEMS[loot].name}`); }
  save(); render();
  sfx('complete');
  await modal({header: 'QUEST COMPLETE', tone: 'cyan', html: `
    <div class="big">DAILY QUEST<br>CLEARED</div>
    <p>You have completed <span class="hl">[${esc(q.title)}]</span>.</p>
    <div class="rlist">${lines.map(l => `<div><i class="dia"></i>${l}</div>`).join('')}</div>
    <p class="label">STREAK: <b style="color:#ffb38a">${S.streak} DAY${S.streak === 1 ? '' : 'S'}</b></p>`, buttons: [{label: loot !== null ? 'CLAIM LOOT' : 'CONFIRM', primary: true}]});
  if (loot) await lootReveal(loot, 'LOOT DROP');
  else toast('No item dropped this time.', '', 'LOOT');
  await flushLevelUps();
}
async function completePenalty() {
  const q = S.penaltyQuest; if (!q || q.completed) return;
  q.completed = true;
  log('penalty', `PENALTY QUEST survived: ${q.title}. +${q.reward.xp} XP.`);
  gainXP(q.reward.xp);
  save(); render(); sfx('complete');
  await modal({header: 'NOTIFICATION', tone: 'cyan', html: `<div class="big">PENALTY<br>CLEARED</div><p>You have survived the Penalty Zone.</p><div class="rlist"><div><i class="dia"></i><span class="hl">+${q.reward.xp} XP</span></div></div>`, buttons: [{label: 'CONFIRM', primary: true}]});
  S.penaltyQuest = null; save(); render();
  await flushLevelUps();
}
async function flushLevelUps() {
  while (pendingLevelUps > 0) {
    const n = pendingLevelUps; pendingLevelUps = 0;
    await levelUpFx();
    await modal({header: 'NOTIFICATION', tone: 'cyan', html: `<div class="big">LEVEL UP!</div><p>You have reached <span class="hl">Lv. ${S.level}</span>.</p>
      <p><span class="gold">+${n * 3} stat points</span> are available to allocate.</p>${rankOf(S.level)[0] === S.level ? `<p class="green">Rank up! You are now <b>${rankOf(S.level)[1]}-Rank</b>.</p>` : ''}
      <p class="label">DAILY QUEST DIFFICULTY INCREASED</p>`, buttons: [{label: 'LATER'}, {label: 'ALLOCATE', primary: true, value: 'go'}]})
      .then(v => { if (v === 'go') nav('status'); });
  }
}

/* ---------------- items ---------------- */
async function useItem(k) {
  const it = ITEMS[k]; if (!it || !S.inventory[k]) return;
  if (it.passive) return toast('Passive item — it triggers automatically.', '', 'INFO');
  if (it.title) {
    takeItem(k);
    if (!S.titles.includes(it.title)) S.titles.push(it.title);
    S.title = it.title; log('item', `Title unlocked & equipped: "${it.title}"`);
    save(); render(); sfx('clear'); closeModals();
    return modal({header: 'NOTIFICATION', html: `<div class="big" style="font-size:20px">TITLE ACQUIRED</div><p>You have earned the title <span class="gold">"${esc(it.title)}"</span>.</p><p class="label">EQUIPPED</p>`, buttons: [{label: 'CONFIRM', primary: true}]});
  }
  if (it.mystery) {
    takeItem(k); const got = rollItem(luckBoost() + 6, true, true); addItem(got);
    log('loot', `Mystery Box opened: [${RARITY[ITEMS[got].rarity].label}] ${ITEMS[got].name}`);
    save(); render(); closeModals();
    return lootReveal(got, 'MYSTERY BOX');
  }
  if (it.target) {
    const q = S.quest;
    if (!q || q.completed) return toast("Today's Daily Quest is already cleared.", '', 'INFO');
    let targetId = it.target;
    if (it.target === 'water') {
      const o = q.objectives.find(x => x.id === 'water');
      if (!o || o.current >= o.target) return toast('Water objective already cleared.', '', 'INFO');
    } else {
      const open = q.objectives.filter(o => o.current < o.target && !o.skipped);
      closeModals();
      targetId = await modal({header: 'POTION OF REST', html: `<p>Choose an objective to skip today.</p><div class="pick">${open.map(o =>
        `<button class="btn" data-mval="${o.id}"><span>${esc(o.name)}</span><span>${o.current}/${o.target}</span></button>`).join('')}</div>`, buttons: [{label: 'CANCEL'}]});
      if (!targetId) return;
    }
    takeItem(k);
    const o = q.objectives.find(x => x.id === targetId);
    if (it.target === 'water') o.current = o.target; else o.skipped = true;
    log('item', `Used ${it.name} on "${o.name}".`);
    toast(`${esc(it.name)} used on ${esc(o.name)}.`, 'green', 'ITEM');
    closeModals(); popObj = o.id; save();
    if (q.objectives.every(x => x.current >= x.target || x.skipped)) { nav('quest'); return completeDaily(); }
    return nav('quest');
  }
  if (it.use) {
    takeItem(k); const msg = it.use(); if (k === 'crystal' || k === 'elixir') log('item', `Used ${it.name}: ${msg}`);
    save(); render(); sfx('coin'); closeModals();
    toast(`${esc(it.name)}: ${msg}`, 'gold', 'ITEM');
    await flushLevelUps();
  }
}

/* ---------------- shop ---------------- */
async function buyReward(id) {
  const r = S.rewards.find(x => x.id === id); if (!r) return;
  if (S.gold < r.price) { sfx('err'); return toast(`Not enough Gold. Need ${fmt(r.price - S.gold)} more.`, 'red', 'DENIED'); }
  const ok = await modal({header: 'PURCHASE', tone: 'gold', html: `<p>Buy <span class="hl">${esc(r.name)}</span> for <span class="gold">${fmt(r.price)} G</span>?</p><p class="label">BALANCE AFTER: ${fmt(S.gold - r.price)} G</p>`,
    buttons: [{label: 'CANCEL'}, {label: 'BUY', primary: true, value: true, cls: 'gold'}]});
  if (!ok) return;
  S.gold -= r.price; S.stats_total.goldSpent += r.price;
  log('purchase', `Purchased reward: ${r.name}`, -r.price); save(); render(); sfx('coin');
  modal({header: 'NOTIFICATION', tone: 'gold', html: `<div class="big" style="font-size:20px">REWARD UNLOCKED</div><p><span class="gold">${esc(r.name)}</span></p><p>Go enjoy it, Player. You earned it.</p>`, buttons: [{label: 'CONFIRM', primary: true}]});
}
async function buyItem(k, price) {
  if (S.gold < price) { sfx('err'); return toast(`Not enough Gold. Need ${fmt(price - S.gold)} more.`, 'red', 'DENIED'); }
  const ok = await modal({header: 'PURCHASE', tone: 'gold', html: `<p>Buy <span class="hl">${esc(ITEMS[k].name)}</span> for <span class="gold">${fmt(price)} G</span>?</p><p style="color:var(--dim);font-size:15px">${esc(ITEMS[k].desc)}</p>`,
    buttons: [{label: 'CANCEL'}, {label: 'BUY', primary: true, value: true, cls: 'gold'}]});
  if (!ok) return;
  S.gold -= price; S.stats_total.goldSpent += price; addItem(k);
  log('purchase', `Purchased item: ${ITEMS[k].name}`, -price); save(); render(); sfx('coin');
  toast(`${esc(ITEMS[k].name)} added to inventory.`, 'gold', 'SHOP');
}
async function editReward(id) {
  const r = id ? S.rewards.find(x => x.id === id) : null;
  const v = await modal({header: r ? 'EDIT REWARD' : 'NEW REWARD', cls: 'left', html: `
    <div class="field"><span class="label">REWARD NAME</span><input id="f-name" maxlength="60" placeholder="e.g. Buy a video game" value="${esc(r ? r.name : '')}"></div>
    <div class="field"><span class="label">PRICE (GOLD)</span><input id="f-price" type="number" inputmode="numeric" min="1" max="999999" placeholder="300" value="${r ? r.price : ''}"></div>`,
    buttons: [...(r ? [{label: 'DELETE', value: 'del', cls: 'red'}] : []), {label: 'CANCEL'}, {label: 'SAVE', primary: true, value: 'save', collect: true}]});
  if (v === 'del') { S.rewards = S.rewards.filter(x => x.id !== id); log('purchase', `Removed reward: ${r.name}`); save(); render(); return; }
  if (!v || v.value !== 'save') return;
  const name = (v.data['f-name'] || '').trim(), price = Math.floor(Number(v.data['f-price']));
  if (!name || !(price > 0)) return toast('Enter a name and a Gold price.', 'red', 'ERROR');
  if (r) { r.name = name; r.price = price; } else S.rewards.push({id: uid(), name, price});
  S.rewards.sort((a, b) => a.price - b.price);
  save(); render(); toast(r ? 'Reward updated.' : 'Reward added to shop.', 'gold', 'SHOP');
}

/* ---------------- side quests ---------------- */
async function editSide(id) {
  const q = id ? S.sideQuests.find(x => x.id === id) : null;
  const v = await modal({header: q ? 'EDIT SIDE QUEST' : 'NEW SIDE QUEST', cls: 'left', html: `
    <div class="field"><span class="label">QUEST NAME</span><input id="f-name" maxlength="60" placeholder="e.g. Read 20 pages" value="${esc(q ? q.name : '')}"></div>
    <div class="field"><span class="label">GOLD REWARD</span><input id="f-gold" type="number" inputmode="numeric" min="1" max="99999" placeholder="20" value="${q ? q.gold : ''}"></div>
    <button class="toggle ${q && q.daily ? 'on' : ''}" id="f-daily" data-toggle style="width:100%;margin-top:6px"><span>Repeat daily</span><span class="sw"></span></button>
    <p class="p-text" style="font-size:14px">Also grants XP equal to half the Gold reward.</p>`,
    buttons: [...(q ? [{label: 'DELETE', value: 'del', cls: 'red'}] : []), {label: 'CANCEL'}, {label: 'SAVE', primary: true, value: 'save', collect: true}]});
  if (v === 'del') { S.sideQuests = S.sideQuests.filter(x => x.id !== id); save(); render(); return; }
  if (!v || v.value !== 'save') return;
  const name = (v.data['f-name'] || '').trim(), gold = Math.floor(Number(v.data['f-gold']));
  if (!name || !(gold > 0)) return toast('Enter a name and a Gold reward.', 'red', 'ERROR');
  const daily = !!v.data['f-daily'];
  if (q) Object.assign(q, {name, gold, daily}); else S.sideQuests.push({id: uid(), name, gold, daily, doneDate: null, created: Date.now()});
  save(); render(); toast(q ? 'Side quest updated.' : 'Side quest accepted.', '', 'QUEST');
}
async function completeSide(id) {
  const q = S.sideQuests.find(x => x.id === id); if (!q) return;
  const today = laToday(); if (q.doneDate === today) return;
  q.doneDate = today; const xp = Math.max(1, Math.round(q.gold / 2));
  S.gold += q.gold; S.stats_total.goldEarned += q.gold;
  log('side', `SIDE QUEST cleared: ${q.name}. +${q.gold} G, +${xp} XP.`, q.gold);
  gainXP(xp);
  if (!q.daily) S.sideQuests = S.sideQuests.filter(x => x.id !== id);
  save(); render(); sfx('coin');
  toast(`Side quest cleared: +${q.gold} G, +${xp} XP`, 'gold', 'QUEST');
  await flushLevelUps();
}

/* ---------------- UI: toasts, modals, fx ---------------- */
function toast(html, tone = '', tag = 'SYSTEM') {
  const root = $('#toasts'); if (!root) return;
  const el = document.createElement('div'); el.className = 'toast ' + tone;
  el.innerHTML = `<b>[${tag}]</b><span>${html.replace(/<b2>/g, '<span style="color:var(--cyan-b)">').replace(/<\/b2>/g, '</span>')}</span>`;
  root.appendChild(el); while (root.children.length > 3) root.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2400);
}
let modalChain = Promise.resolve();
function modal(opts) { const p = modalChain.then(() => openModal(opts)); modalChain = p.catch(() => {}); return p; }
function openModal({header = 'NOTIFICATION', html = '', buttons = [{label: 'OK', primary: true}], tone = 'cyan', cls = '', overlayCls = '', delayActions = false}) {
  return new Promise(resolve => {
    const ov = document.createElement('div'); ov.className = 'overlay ' + (tone === 'red' ? 'red ' : '') + overlayCls;
    ov.innerHTML = `<div class="modal panel ${tone === 'red' ? 'red' : ''} ${cls}" role="dialog" aria-modal="true">
      <div class="ptitle"><span class="ex">!</span>${esc(header)}</div>
      <div class="m-body">${html}</div>
      <div class="m-actions ${delayActions ? 'delay' : ''}">${buttons.map((b, i) => `<button class="btn ${b.primary ? '' : 'ghost'} ${b.cls || (tone === 'red' && b.primary ? 'red' : '')}" data-mbtn="${i}">${esc(b.label)}</button>`).join('')}</div></div>`;
    const done = v => { ov.remove(); resolve(v); };
    ov._close = () => done(undefined);
    ov.addEventListener('click', e => {
      const t = e.target.closest('[data-mbtn],[data-mval],[data-toggle]'); if (!t) return;
      if (t.hasAttribute('data-toggle')) { t.classList.toggle('on'); return; }
      if (t.hasAttribute('data-mval')) return done(t.dataset.mval);
      const b = buttons[+t.dataset.mbtn];
      if (b.collect) {
        const data = {}; ov.querySelectorAll('input,textarea').forEach(i => data[i.id] = i.value);
        ov.querySelectorAll('[data-toggle]').forEach(i => data[i.id] = i.classList.contains('on'));
        return done({value: b.value, data});
      }
      done(b.value);
    });
    $('#modal-root').appendChild(ov);
    if (tone === 'red') { flash(true); }
  });
}
function closeModals() { document.querySelectorAll('#modal-root .overlay').forEach(o => o._close && o._close()); }
function flash(red) { const f = $('#flash'); f.classList.toggle('red', !!red); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
function levelUpFx() {
  return new Promise(res => {
    flash(false); sfx('level');
    const el = document.createElement('div'); el.className = 'lvup-text'; el.innerHTML = `<div>LEVEL UP<small>LV. ${S.level}</small></div>`;
    document.body.appendChild(el); setTimeout(() => { el.remove(); res(); }, 1500);
  });
}
function itemIcon(k) { return IC[ITEMS[k].icon] || IC.box; }
function lootReveal(k, header) {
  const it = ITEMS[k]; sfx('loot');
  if (it.rarity === 'legendary' || it.rarity === 'epic') setTimeout(() => flash(false), 1050);
  return modal({header, delayActions: true, html: `
    <div class="loot-stage r-${it.rarity}">
      <div class="loot-rays"></div><div class="loot-burst"></div>
      <div class="loot-box loot-hide">${IC.box}</div>
      <div class="loot-item"><div class="ic">${itemIcon(k)}</div><div class="rr">${RARITY[it.rarity].label}</div><div class="nm">${esc(it.name)}</div></div>
    </div><p class="loot-desc">${esc(it.desc)}</p>`, buttons: [{label: 'TO INVENTORY', primary: true}]});
}

/* sound (WebAudio blips) */
let actx;
function sfx(kind) {
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const seq = {tick: [[880, .03]], clear: [[660, .06], [990, .09]], complete: [[523, .09], [659, .09], [784, .09], [1047, .2]], coin: [[1200, .05], [1600, .1]],
      level: [[392, .1], [523, .1], [659, .1], [784, .1], [1047, .3]], loot: [[300, .08], [400, .08], [500, .08], [800, .25]], err: [[200, .12], [150, .16]], penalty: [[220, .25], [180, .25], [140, .5]]}[kind] || [[600, .05]];
    let t = actx.currentTime;
    for (const [f, d] of seq) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'penalty' || kind === 'err' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'tick' ? .04 : .08, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + .02); t += d * .85;
    }
  } catch (e) {}
  if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(kind === 'tick' ? 8 : kind === 'penalty' ? [80, 40, 120] : 20);
}

/* ---------------- rendering ---------------- */
let tab = 'quest', logFilter = 'all';
function objRow(o, qid, locked) {
  const done = o.current >= o.target || o.skipped;
  const pct = Math.round(Math.min(1, o.skipped ? 1 : o.current / o.target) * 100);
  return `<div class="obj ${done ? 'done' : ''} ${locked ? 'locked' : ''} ${popObj === o.id ? 'pop' : ''}" ${locked ? '' : `data-action="inc" data-q="${qid}" data-o="${o.id}"`}>
    <div class="chk"></div>
    <div class="oinfo"><div class="oname">${esc(o.name)}</div>
      <div class="ocount">${o.skipped ? 'SKIPPED <small>(POTION OF REST)</small>' : `[${o.current}/${o.target}${o.unit ? ' ' + o.unit : ''}]`}</div></div>
    ${locked ? `<div class="cleared-tag">${done ? 'CLEARED' : ''}</div>` : `<div class="ctrl">
      <button class="btn-sq" data-action="dec" data-q="${qid}" data-o="${o.id}" aria-label="minus 1" ${o.current <= 0 ? 'disabled' : ''}>−1</button>
      <button class="btn-sq" data-action="add" data-q="${qid}" data-o="${o.id}" aria-label="plus ${o.step}" ${done ? 'disabled' : ''}>+${o.step}</button>
      <button class="btn-sq ok" data-action="done" data-q="${qid}" data-o="${o.id}" aria-label="done" ${done ? 'disabled' : ''}>DONE</button></div>`}
    <i class="obar" style="width:${pct}%"></i></div>`;
}
function questPanel(q, qid) {
  const cleared = q.objectives.filter(o => o.current >= o.target || o.skipped).length, n = q.objectives.length;
  const isPen = qid === 'penalty';
  return `<section class="panel ${isPen ? 'red' : 'grow'}">
    <div class="ptitle"><span class="ex">!</span>${isPen ? 'WARNING' : 'QUEST INFO'}</div>
    <div class="q-head"><div class="q-kind">[ ${q.kind} ]</div><div class="q-title">${esc(q.title.toUpperCase())}</div></div>
    ${isPen ? `<div class="warning" style="margin:4px 0 8px"><span class="tri">${IC.tri}</span><span>You failed a Daily Quest. Complete the Penalty Quest to escape the Penalty Zone.</span></div>` :
      `<div class="timer ${secsToMidnight() < 7200 && !q.completed ? 'urgent' : ''}"><span class="lbl"><span style="color:var(--cyan)">${IC.clock}</span><span class="label">${q.completed ? 'NEXT QUEST IN' : 'TIME LIMIT'}</span></span><span class="t" id="timer">--:--:--</span></div>
      <div class="divider">◆ GOALS ◆</div>`}
    <div class="objs">${q.objectives.map(o => objRow(o, qid, q.completed)).join('')}</div>
    <div class="progress"><span class="label">PROGRESS</span><div class="segs">${q.objectives.map(o => `<i class="${o.current >= o.target || o.skipped ? 'on' : ''}"></i>`).join('')}</div><span class="label"><b>${cleared}/${n}</b> CLEARED</span></div>
    ${isPen ? '' : q.completed ? `<div class="complete-banner">QUEST CLEARED<small>Rewards claimed. A new Daily Quest arrives at midnight PT.</small></div>` : `
    <div class="divider gold">◆ REWARDS ◆</div>
    <div class="rewards"><span class="rw"><i class="dia"></i>${q.reward.gold} G</span><span class="rw"><i class="dia"></i>+${q.reward.xp} XP</span><span class="rw"><i class="dia"></i>+1 ${q.reward.stat}</span><span class="rw"><i class="dia"></i>Loot</span></div>
    <div class="warning"><span class="tri">${IC.tri}</span><span><b>WARNING:</b> Failure to complete the daily quest will result in an appropriate penalty.</span></div>`}
  </section>`;
}
function renderQuest() {
  const today = laToday();
  const side = S.sideQuests;
  return `${S.penaltyQuest && !S.penaltyQuest.completed ? questPanel(S.penaltyQuest, 'penalty') : ''}
  ${questPanel(S.quest, 'daily')}
  <section class="panel">
    <div class="sq-head"><span class="h">◆ SIDE QUESTS</span><button class="btn sm" data-action="side-new">+ ADD</button></div>
    ${side.length ? side.map(q => { const done = q.doneDate === today; return `<div class="sq ${done ? 'done' : ''}">
      <div class="oinfo"><div class="oname">${esc(q.name)}</div><div class="meta">+${fmt(q.gold)} G · +${Math.max(1, Math.round(q.gold / 2))} XP<span>${q.daily ? 'DAILY' : 'ONE-TIME'}</span></div></div>
      <button class="edit-btn" data-action="side-edit" data-id="${q.id}" aria-label="edit">${IC.pencil}</button>
      <button class="btn-sq ok" data-action="side-done" data-id="${q.id}" ${done ? 'disabled' : ''}>${done ? '✓' : 'DONE'}</button></div>`; }).join('')
      : `<div class="empty">Add your own bonus quests (e.g. "Read 20 pages — 20 G").</div>`}
  </section>`;
}
function renderStatus() {
  const rk = rankOf(S.level), need = xpNeed(S.level), hp = 100 + (S.stats.VIT - 10) * 10 + S.level * 10, mp = 50 + (S.stats.INT - 10) * 10 + S.level * 5;
  return `<section class="panel grow">
    <div class="ptitle"><span class="ex">!</span>STATUS</div>
    <div class="st-top">
      <div class="lvbox"><span class="label">LEVEL</span><span class="n">${S.level}</span><span class="rank" style="color:${rk[2]};text-shadow:0 0 10px ${rk[2]}">${rk[1]}-RANK</span></div>
      <div class="kv">
        <div class="row"><span class="label">NAME</span><span class="v">${esc(S.player)}</span></div>
        <div class="row"><span class="label">JOB</span><span class="v">None</span></div>
        <div class="row"><span class="label">TITLE</span><button class="v" data-action="titles">${esc(S.title)}</button></div>
        <div class="row"><span class="label">PATH</span><span class="v">Strength</span></div>
      </div>
    </div>
    <div class="bar-row"><span class="label">XP</span><div class="bar"><i style="width:${Math.round(S.xp / need * 100)}%"></i></div><span class="num">${fmt(S.xp)} / ${fmt(need)}</span></div>
    <div class="bar-row"><span class="label">HP</span><div class="bar hp"><i style="width:100%"></i></div><span class="num">${hp} / ${hp}</span></div>
    <div class="bar-row"><span class="label">MP</span><div class="bar mp"><i style="width:100%"></i></div><span class="num">${mp} / ${mp}</span></div>
    <div class="tiles">
      <div class="tile gold"><div class="label">GOLD</div><div class="v">${fmt(S.gold)}</div></div>
      <div class="tile streak"><div class="label">STREAK</div><div class="v">${S.streak}<small style="font-size:11px"> D</small></div></div>
      <div class="tile"><div class="label">CLEARED</div><div class="v">${S.questsCompleted}</div></div>
    </div>
    <div class="divider">◆ STATS ◆</div>
    <div class="stats">${Object.keys(S.stats).map(k => `<div class="stat" id="stat-${k}"><span class="sn">${k}</span><span class="sd">${STAT_DESC[k]}</span><span class="sv">${S.stats[k]}</span>
      ${S.statPoints > 0 ? `<button class="btn-sq" data-action="alloc" data-k="${k}" aria-label="add point to ${k}">+</button>` : ''}</div>`).join('')}</div>
    <div class="points ${S.statPoints > 0 ? 'has' : ''}"><span class="label">AVAILABLE ABILITY POINTS</span><span class="v">${S.statPoints}</span></div>
  </section>`;
}
function renderItems() {
  const keys = Object.keys(S.inventory).filter(k => ITEMS[k] && S.inventory[k] > 0)
    .sort((a, b) => Object.keys(RARITY).indexOf(ITEMS[b].rarity) - Object.keys(RARITY).indexOf(ITEMS[a].rarity));
  const total = keys.reduce((a, k) => a + S.inventory[k], 0);
  return `<section class="panel grow">
    <div class="ptitle"><span class="ex">!</span>INVENTORY</div>
    <div class="balance" style="margin-bottom:10px"><span class="label">ITEMS HELD</span><span class="label" style="color:var(--white)">${total} ITEM${total === 1 ? '' : 'S'} · ${keys.length} TYPE${keys.length === 1 ? '' : 'S'}</span></div>
    ${keys.length ? `<div class="grid">${keys.map(k => `<button class="item r-${ITEMS[k].rarity}" data-action="item" data-k="${k}">
      <span class="ic">${itemIcon(k)}</span><span><div class="nm">${esc(ITEMS[k].name)}</div><div class="rr">${RARITY[ITEMS[k].rarity].label}</div></span>
      ${S.inventory[k] > 1 ? `<span class="qty">×${S.inventory[k]}</span>` : ''}</button>`).join('')}${'<div class="slot">EMPTY</div>'.repeat(Math.max(0, 6 - keys.length) + (keys.length > 6 && keys.length % 2 ? 1 : 0))}</div>` :
      `<div class="fill-hint">${IC.box}<div style="font-size:18px;color:var(--white)">Your inventory is empty.</div><div>Clear Daily Quests for a chance at loot drops,<br>or buy items in the Shop.</div></div>`}
    <div class="divider">◆ DROP RATES ◆</div>
    <div class="rates">${Object.keys(RARITY).map(r => `<div class="rate r-${r}"><div class="label">${RARITY[r].label}</div><div class="v">${RARITY[r].w}%</div></div>`).join('')}</div>
    <p class="p-text" style="font-size:14px;margin:8px 0 0">Daily Quest drop chance: <b>${Math.round(dropChance() * 100)}%</b>. Higher PER and longer streaks improve rarity odds.</p>
  </section>
  <section class="panel"><div class="sq-head"><span class="h">◆ TITLES</span><span class="label">TAP TO EQUIP</span></div>
    <div class="titles">${S.titles.map(t => `<button class="tchip ${t === S.title ? 'on' : ''}" data-action="equip" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></section>`;
}
function renderShop() {
  return `<section class="panel">
    <div class="ptitle"><span class="ex">!</span>SHOP</div>
    <div class="balance"><span class="label">YOUR GOLD</span><span class="v">${fmt(S.gold)} G</span></div>
  </section>
  <section class="panel grow">
    <div class="sq-head"><span class="h">◆ REAL-LIFE REWARDS</span><button class="btn sm gold" data-action="reward-new">+ NEW</button></div>
    ${S.rewards.length ? S.rewards.map(r => `<div class="shop-row">
      <div class="oinfo"><div class="oname">${esc(r.name)}</div><div class="price">${fmt(r.price)} G${S.gold < r.price ? ` <span style="color:var(--dim);font-family:var(--body);font-weight:600">· need ${fmt(r.price - S.gold)} more</span>` : ''}</div></div>
      <button class="edit-btn" data-action="reward-edit" data-id="${r.id}" aria-label="edit">${IC.pencil}</button>
      <button class="btn sm gold" data-action="buy-reward" data-id="${r.id}" ${S.gold < r.price ? 'style="opacity:.45"' : ''}>BUY</button></div>`).join('')
      : `<div class="empty">No rewards yet. Tap + NEW to define one (e.g. "Takeout night — 300 G").</div>`}
    <div style="flex:1;min-height:6px"></div>
    <div class="divider" style="margin-top:14px">◆ SYSTEM ITEMS ◆</div>
    ${SHOP_ITEMS.map(([k, p]) => `<div class="shop-row ig r-${ITEMS[k].rarity}"><span class="ic">${itemIcon(k)}</span>
      <div class="oinfo"><div class="oname">${esc(ITEMS[k].name)}</div><div class="desc">${esc(ITEMS[k].desc)}</div><div class="price">${fmt(p)} G</div></div>
      <button class="btn sm gold" data-action="buy-item" data-k="${k}" data-p="${p}" ${S.gold < p ? 'style="opacity:.45"' : ''}>BUY</button></div>`).join('')}
  </section>`;
}
const LOG_TYPES = {quest: ['QUESTS', 'var(--cyan)'], side: ['QUESTS', 'var(--purple)'], purchase: ['SHOP', 'var(--gold)'], loot: ['LOOT', 'var(--c-epic)'], item: ['LOOT', 'var(--c-rare)'], penalty: ['PENALTY', 'var(--red)'], level: ['QUESTS', 'var(--green)']};
function renderLog() {
  const f = {all: () => true, quests: e => ['quest', 'side', 'level'].includes(e.type), shop: e => e.type === 'purchase', loot: e => ['loot', 'item'].includes(e.type), penalty: e => e.type === 'penalty'}[logFilter];
  const list = S.log.filter(f).slice(0, 200);
  return `<section class="panel grow">
    <div class="ptitle"><span class="ex">!</span>LOG</div>
    <div class="summary">
      <div class="tile gold"><div class="label">EARNED</div><div class="v">${fmt(S.stats_total.goldEarned)}</div></div>
      <div class="tile"><div class="label">SPENT</div><div class="v" style="color:var(--red-soft)">${fmt(S.stats_total.goldSpent)}</div></div>
      <div class="tile streak"><div class="label">BEST STREAK</div><div class="v">${S.bestStreak}</div></div>
    </div>
    <div class="filters" style="margin-top:12px">${['all', 'quests', 'shop', 'loot', 'penalty'].map(k => `<button class="fchip ${logFilter === k ? 'on' : ''}" data-action="filter" data-f="${k}">${k.toUpperCase()}</button>`).join('')}</div>
    <div class="entries">${list.length ? list.map(e => `<div class="entry" style="--ec:${(LOG_TYPES[e.type] || [0, 'var(--cyan)'])[1]}"><i class="dot"></i>
      <div class="tx">${esc(e.text)}<div class="tm">${stamp(e.t)}</div></div>${e.gold ? `<span class="g ${e.gold > 0 ? 'pos' : 'neg'}">${e.gold > 0 ? '+' : '−'}${fmt(Math.abs(e.gold))} G</span>` : ''}</div>`).join('')
      : `<div class="fill-hint"><div>No entries yet.</div></div>`}</div>
  </section>`;
}
function renderSettings() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<section class="panel">
    <div class="ptitle"><span class="ex">!</span>SETTINGS</div>
    <div class="field" style="margin-top:0"><span class="label">PLAYER NAME</span><input id="s-name" maxlength="40" value="${esc(S.player)}"></div>
    <button class="toggle ${S.settings.sound ? 'on' : ''}" data-action="sound" style="width:100%;margin-top:6px"><span style="font-size:17px">Sound FX & haptics</span><span class="sw"></span></button>
  </section>
  <section class="panel">
    <div class="sq-head"><span class="h">◆ SAVE DATA</span></div>
    <p class="p-text">Your progress lives only on this device. Export a backup regularly; import it to restore or move to another device.</p>
    <div class="btn-row"><button class="btn" data-action="export">EXPORT</button><button class="btn" data-action="copy">COPY JSON</button></div>
    <div class="btn-row" style="margin-top:8px"><button class="btn" data-action="import-file">IMPORT FILE</button><button class="btn" data-action="import-paste">PASTE JSON</button></div>
    <input type="file" id="import-input" accept="application/json,.json,text/plain" hidden>
  </section>
  <section class="panel grow">
    <div class="sq-head"><span class="h">◆ ${standalone ? 'APP' : 'INSTALL ON IPHONE'}</span></div>
    ${standalone ? '<p class="p-text">Running as an installed app. Works offline.</p>' : `<p class="p-text">In <b>Safari</b>, tap the <b>Share</b> button, then <b>Add to Home Screen</b> → <b>Add</b>. Open SYSTEM from the new icon for a full-screen, offline app.</p>`}
    <p class="p-text">Daily Quests reset at <b>midnight Pacific Time</b>. Missing one triggers a Penalty the next time you open the app.</p>
    <div style="flex:1"></div>
    <button class="btn red block" data-action="reset" style="margin-top:12px">RESET ALL PROGRESS</button>
    <p class="label" style="text-align:center;margin-top:12px">SYSTEM v${VERSION} · PLAYER SINCE ${esc(stamp(S.created))}</p>
  </section>`;
}

function render(animate) {
  const scr = $('#screen');
  const fn = {quest: renderQuest, status: renderStatus, items: renderItems, shop: renderShop, log: renderLog, settings: renderSettings}[tab];
  scr.innerHTML = fn();
  if (animate) { scr.classList.remove('animate'); void scr.offsetWidth; scr.classList.add('animate'); clearTimeout(render._t); render._t = setTimeout(() => scr.classList.remove('animate'), 800); }
  popObj = null;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $('#top-lv').textContent = `LV ${S.level}`;
  $('#top-gold span').textContent = fmt(S.gold);
  const cnt = Object.values(S.inventory).reduce((a, b) => a + b, 0), b = $('#badge-items');
  b.textContent = cnt > 99 ? '99+' : cnt; b.classList.toggle('on', cnt > 0);
  tickTimer();
}
function nav(t) { if (t === tab && t !== 'settings') { $('#main').scrollTo({top: 0, behavior: 'smooth'}); return; } tab = t; $('#main').scrollTop = 0; render(true); }
function tickTimer() {
  const el = $('#timer'); if (!el) return;
  const s = secsToMidnight(), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  el.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}

/* ---------------- events ---------------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]'); if (!el || el.closest('.overlay')) return;
  const a = el.dataset.action;
  if (['dec', 'add', 'done'].includes(a)) e.stopPropagation();
  const step = () => { const r = findObj(el.dataset.q, el.dataset.o); return r && r[1]; };
  switch (a) {
    case 'nav': sfx('tick'); nav(el.dataset.tab); break;
    case 'inc': { const o = step(); if (o && o.current < o.target && !o.skipped) setCount(el.dataset.q, o.id, o.current + 1); break; }
    case 'add': { const o = step(); if (o) setCount(el.dataset.q, o.id, o.current + o.step); break; }
    case 'dec': { const o = step(); if (o) setCount(el.dataset.q, o.id, o.current - 1); break; }
    case 'done': { const o = step(); if (o) setCount(el.dataset.q, o.id, o.target); break; }
    case 'alloc': {
      const k = el.dataset.k; if (S.statPoints <= 0) break;
      S.statPoints--; S.stats[k]++; log('level', `Allocated 1 point to ${k} (${S.stats[k]}).`); save(); render(); sfx('clear');
      const s = $('#stat-' + k); if (s) { s.classList.add('flash'); }
      break;
    }
    case 'titles': nav('items'); break;
    case 'equip': S.title = el.dataset.t; save(); render(); toast(`Title equipped: "${esc(S.title)}"`, 'gold', 'TITLE'); break;
    case 'item': {
      const k = el.dataset.k, it = ITEMS[k];
      const v = await modal({header: 'ITEM', html: `<div class="loot-stage r-${it.rarity}" style="height:150px"><div class="loot-item" style="animation-delay:0s"><div class="ic">${itemIcon(k)}</div><div class="rr">${RARITY[it.rarity].label}</div><div class="nm">${esc(it.name)}</div></div></div>
        <p>${esc(it.desc)}</p><p class="label">OWNED: ${S.inventory[k] || 0}</p>`, buttons: [{label: 'CLOSE'}, ...(it.passive ? [] : [{label: it.mystery ? 'OPEN' : 'USE', primary: true, value: 'use'}])]});
      if (v === 'use') useItem(k);
      break;
    }
    case 'buy-reward': buyReward(el.dataset.id); break;
    case 'buy-item': buyItem(el.dataset.k, +el.dataset.p); break;
    case 'reward-new': editReward(null); break;
    case 'reward-edit': editReward(el.dataset.id); break;
    case 'side-new': editSide(null); break;
    case 'side-edit': editSide(el.dataset.id); break;
    case 'side-done': completeSide(el.dataset.id); break;
    case 'filter': logFilter = el.dataset.f; render(); break;
    case 'sound': S.settings.sound = !S.settings.sound; save(); render(); sfx('clear'); break;
    case 'export': exportSave(); break;
    case 'copy': copySave(); break;
    case 'import-file': $('#import-input').click(); break;
    case 'import-paste': {
      const v = await modal({header: 'IMPORT SAVE', cls: 'left', html: `<div class="field"><span class="label">PASTE SAVE JSON</span><textarea id="f-json" placeholder="{ ... }"></textarea></div>`,
        buttons: [{label: 'CANCEL'}, {label: 'IMPORT', primary: true, value: 'go', collect: true}]});
      if (v && v.value === 'go') importSave(v.data['f-json']);
      break;
    }
    case 'reset': {
      const v = await modal({header: 'WARNING', tone: 'red', html: `<p>Erase <b>all</b> progress and start over at Level 1?</p><p class="red">This cannot be undone. Export a backup first.</p>`, buttons: [{label: 'CANCEL'}, {label: 'RESET', primary: true, value: 'yes'}]});
      if (v === 'yes') { S = defaultState(); S.quest = genQuest(laToday()); save(); tab = 'quest'; render(true); toast('The System has been reinitialized.', '', 'SYSTEM'); }
      break;
    }
  }
});
document.addEventListener('change', e => {
  if (e.target.id === 's-name') { const v = e.target.value.trim(); if (v) { S.player = v; save(); toast('Player name updated.'); } }
  if (e.target.id === 'import-input' && e.target.files[0]) { const r = new FileReader(); r.onload = () => importSave(r.result); r.readAsText(e.target.files[0]); e.target.value = ''; }
});

function saveJSON() { return JSON.stringify(Object.assign({}, S, {exportedAt: new Date().toISOString(), app: 'SYSTEM', appVersion: VERSION}), null, 2); }
async function exportSave() {
  const name = `system-save-${laToday()}.json`, json = saveJSON();
  const file = new File([json], name, {type: 'application/json'});
  try {
    if (navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: 'SYSTEM save'}); toast('Save exported.', 'green', 'BACKUP'); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Save file downloaded.', 'green', 'BACKUP');
}
async function copySave() {
  try { await navigator.clipboard.writeText(saveJSON()); toast('Save JSON copied to clipboard.', 'green', 'BACKUP'); }
  catch (e) { modal({header: 'SAVE JSON', cls: 'left', html: `<div class="field"><span class="label">SELECT ALL & COPY</span><textarea readonly>${esc(saveJSON())}</textarea></div>`, buttons: [{label: 'CLOSE', primary: true}]}); }
}
async function importSave(text) {
  let o;
  try { o = JSON.parse(text); } catch (e) { return toast('Invalid JSON.', 'red', 'ERROR'); }
  if (!o || typeof o !== 'object' || typeof o.level !== 'number' || !o.stats || typeof o.gold !== 'number') return toast('Not a SYSTEM save file.', 'red', 'ERROR');
  const v = await modal({header: 'IMPORT SAVE', html: `<p>Replace current progress with this save?</p><p><span class="hl">${esc(o.player || 'Player')}</span> · Lv. ${o.level} · <span class="gold">${fmt(o.gold)} G</span></p>`, buttons: [{label: 'CANCEL'}, {label: 'IMPORT', primary: true, value: 'yes'}]});
  if (v !== 'yes') return;
  delete o.exportedAt; delete o.app; delete o.appVersion;
  S = normalize(o); log('item', 'Save data imported.'); dayCheck(); save(); tab = 'quest'; render(true); toast('Save imported.', 'green', 'BACKUP'); showPending();
}

/* ---------------- pending notices (penalty) ---------------- */
async function showPending() {
  while (S.pending.length) {
    const p = S.pending.shift(); save();
    if (p.type === 'penalty') {
      sfx('penalty'); document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 600);
      await modal({header: 'WARNING', tone: 'red', html: `
        <div class="big" style="color:#ffe3e3;text-shadow:0 0 12px var(--red),0 0 30px var(--red)">PENALTY</div>
        <p>The Daily Quest <span class="red">[Strength Training]</span>${p.missed > 1 ? ` was not completed for <b>${p.missed} days</b>` : ` of ${prettyDate(p.questDate)} was not completed`}.</p>
        <p>You will now be transported to the <b class="red">Penalty Zone</b>.</p>
        <div class="rlist">
          <div style="border-color:rgba(255,70,80,.4);background:rgba(90,10,20,.3)"><i class="dia" style="background:var(--red);box-shadow:0 0 6px var(--red)"></i><span class="red">−${fmt(p.loss)} Gold</span></div>
          <div style="border-color:rgba(255,70,80,.4);background:rgba(90,10,20,.3)"><i class="dia" style="background:var(--red);box-shadow:0 0 6px var(--red)"></i><span class="red">Streak reset (${p.lostStreak} → 0)</span></div>
          <div style="border-color:rgba(255,70,80,.4);background:rgba(90,10,20,.3)"><i class="dia" style="background:var(--red);box-shadow:0 0 6px var(--red)"></i><span class="red">PENALTY QUEST issued: Survival</span></div>
        </div>`, buttons: [{label: 'ACCEPT', primary: true}]});
      nav('quest');
    } else if (p.type === 'ward') {
      await modal({header: 'NOTIFICATION', html: `<div class="big" style="font-size:20px">PENALTY NEGATED</div><p>You missed ${p.missed} Daily Quest${p.missed > 1 ? 's' : ''}, but your <span class="hl">Penalty Ward</span> shattered and absorbed the penalty.</p>`, buttons: [{label: 'CONFIRM', primary: true}]});
    }
  }
}

/* ---------------- boot ---------------- */
function rollover() { if (dayCheck()) { render(); showPending(); toast('A new Daily Quest has arrived.', '', 'SYSTEM'); } }
S = load();
dayCheck();
save();
render(true);
setTimeout(showPending, 350);
setInterval(() => { tickTimer(); if (secsToMidnight() >= 86398 || (S.quest && S.quest.date !== laToday())) rollover(); }, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { S = load(); rollover(); render(); } });
window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); render(); } });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (isIOS && !standalone && !S.settings.tipDismissed) {
  const tip = document.createElement('div'); tip.className = 'install-tip';
  tip.innerHTML = `<span class="tx"><b style="font-family:var(--head);font-size:11px;color:var(--cyan)">[SYSTEM]</b> Install: tap <b>Share</b> → <b>Add to Home Screen</b> for full-screen mode.</span><button class="btn sm ghost">OK</button>`;
  tip.querySelector('button').onclick = () => { S.settings.tipDismissed = true; save(); tip.remove(); };
  document.body.appendChild(tip);
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
window.__SYSTEM = {get state() { return S; }, save, load: () => { S = load(); render(); }, dayCheck: rollover, render, nav};
})();
