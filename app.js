/* =====================================================================
   צמיחה — לוז יומי, מעקב מידות וחשבון נפש
   אפליקציה אישית (אתה + אשתך). עובדת מקומית במכשיר, ומוכנה לסנכרון ענן.
   ===================================================================== */
'use strict';

/* ---- הגדרת ענן: הדביקו כאן את אובייקט ההגדרות מ-Firebase כדי להפעיל
   התחברות וסנכרון בין מכשירים. כל עוד null — הנתונים נשמרים במכשיר זה. ---- */
const FIREBASE_CONFIG = null;

// _cloudConfig: FIREBASE_CONFIG overrides localStorage (dev convenience).
// Users can configure via the Settings UI without editing code.
var _cloudConfig = FIREBASE_CONFIG;
(function () {
  try { var s = localStorage.getItem('firebaseConfig'); if (s) _cloudConfig = JSON.parse(s); } catch (e) { /* ignore */ }
}());

/* ---- פלטת צבעים (תואמת לאפליקציית הנקודות) ---- */
const PALETTE = [
  { color: '#B5D4F4', textColor: '#0C447C' },
  { color: '#F4C0D1', textColor: '#72243E' },
  { color: '#9FE1CB', textColor: '#085041' },
  { color: '#FAC775', textColor: '#633806' },
  { color: '#C9B8F4', textColor: '#3A2472' },
  { color: '#F4B89F', textColor: '#7C3A0C' },
];

/* ===================== מחזור לימוד מוסר יומי ===================== */
const MUSSAR_CYCLE = [
  // מסילת ישרים
  { book: 'מסילת ישרים', section: 'חובת האדם בעולמו', ref: 'Mesillat_Yesharim.1',
    mission: 'שאל את עצמך: מה הייתה המטרה האמיתית שלי היום? רשום משפט אחד.' },
  { book: 'מסילת ישרים', section: 'מדת הזהירות', ref: 'Mesillat_Yesharim.2',
    mission: 'לפני כל פעולה גדולה — עצור שנייה ושאל: האם זה מביא אותי קרוב לה\'?' },
  { book: 'מסילת ישרים', section: 'המונעים את הזהירות', ref: 'Mesillat_Yesharim.4',
    mission: 'אתר הרגל אחד שמונע ממך זהירות יותר — וחשוב כיצד להתגבר עליו.' },
  { book: 'מסילת ישרים', section: 'מדת הזריזות', ref: 'Mesillat_Yesharim.5',
    mission: 'בצע דבר אחד שדחית — עשה אותו בזריזות ובשמחה, עוד היום.' },
  { book: 'מסילת ישרים', section: 'קניין הזריזות', ref: 'Mesillat_Yesharim.7',
    mission: 'קבע שעה קבועה ללימוד מחר — ועמוד בה בזריזות, בלי לדחות.' },
  { book: 'מסילת ישרים', section: 'מדת הנקיות', ref: 'Mesillat_Yesharim.8',
    mission: 'בדוק: האם יש דבר שעשית שלא היה לגמרי ישר? אם כן — תקן.' },
  { book: 'מסילת ישרים', section: 'מדת הפרישות', ref: 'Mesillat_Yesharim.10',
    mission: 'הימנע היום מהנאה אחת שאינה הכרחית — אוכל, מסך, שיחה.' },
  { book: 'מסילת ישרים', section: 'מדת הטהרה', ref: 'Mesillat_Yesharim.12',
    mission: 'נסה לכוון לבך בתפילה — אפילו בפסוק אחד בלבד, במתינות.' },
  { book: 'מסילת ישרים', section: 'מדת החסידות', ref: 'Mesillat_Yesharim.13',
    mission: 'עשה טובה לאחר — גם כשאינך חייב לכך, וגם בלי שידעו.' },
  { book: 'מסילת ישרים', section: 'מדת הענווה', ref: 'Mesillat_Yesharim.16',
    mission: 'אם נכנסת לוויכוח — נסה לסיים עם: "יכול להיות שאתה צודק".' },
  { book: 'מסילת ישרים', section: 'יראת חטא', ref: 'Mesillat_Yesharim.18',
    mission: 'שים לב לדבר קטן שנמנעת ממנו היום מפני שאסור — ושמח על כך.' },
  { book: 'מסילת ישרים', section: 'מדת הקדושה', ref: 'Mesillat_Yesharim.20',
    mission: 'קדש דבר אחד גשמי היום — אכילה, שינה או שיחה — בכוונה מפורשת.' },

  // אורחות צדיקים
  { book: 'אורחות צדיקים', section: 'שער הגאוה', ref: 'Orchot_Tzadikim.1',
    mission: 'שים לב אם עלתה מחשבת גאוה — הכר בה ואמור: "הכל מה\'".' },
  { book: 'אורחות צדיקים', section: 'שער הכניעה', ref: 'Orchot_Tzadikim.2',
    mission: 'בשיחה אחת היום — הקשב עד הסוף בלי להפריע כלל.' },
  { book: 'אורחות צדיקים', section: 'שער הבושת', ref: 'Orchot_Tzadikim.3',
    mission: 'האם יש משהו שעשית שלא גאה בו? חשוב אם יש לתקן.' },
  { book: 'אורחות צדיקים', section: 'שער הרחמים', ref: 'Orchot_Tzadikim.5',
    mission: 'עשה מעשה רחמים אחד — כלפי ילד, בן/בת זוג, או אדם זר.' },
  { book: 'אורחות צדיקים', section: 'שער האהבה', ref: 'Orchot_Tzadikim.7',
    mission: 'אמור לאדם קרוב משפט אמיתי של הערכה — מהלב, בלי להגזים.' },
  { book: 'אורחות צדיקים', section: 'שער הקנאה', ref: 'Orchot_Tzadikim.9',
    mission: 'אם עלה רגש קנאה — הפוך אותו: שמח בחלקו של האחר בפה ממש.' },
  { book: 'אורחות צדיקים', section: 'שער השמחה', ref: 'Orchot_Tzadikim.10',
    mission: 'מצא שלושה דברים לשמוח בהם — ושתף אחד עם אשתך בערב.' },
  { book: 'אורחות צדיקים', section: 'שער העצבות', ref: 'Orchot_Tzadikim.11',
    mission: 'אם מרגיש עצב — שאל: האם זו עצבות של תשובה (טובה) או של יאוש (לתקן)?' },
  { book: 'אורחות צדיקים', section: 'שער הנדיבות', ref: 'Orchot_Tzadikim.12',
    mission: 'תן משהו היום — זמן, מחשבה, כסף — לאדם שצריך, בלא ציפייה.' },
  { book: 'אורחות צדיקים', section: 'שער התשובה', ref: 'Orchot_Tzadikim.14',
    mission: 'חשוב על דבר אחד שרוצה לתקן — ועשה צעד קטן אחד עכשיו ממש.' },
  { book: 'אורחות צדיקים', section: 'שער האמת', ref: 'Orchot_Tzadikim.17',
    mission: 'שים לב להגזמה קטנה בדיבורך — ותשתדל לדייק היום.' },
  { book: 'אורחות צדיקים', section: 'שער השתיקה', ref: 'Orchot_Tzadikim.18',
    mission: 'לפני שאתה מגיב — המתן 3 שניות ושאל: האם זה בכלל צריך להיאמר?' },
  { book: 'אורחות צדיקים', section: 'שער הדיבור', ref: 'Orchot_Tzadikim.19',
    mission: 'בדוק: האם אמרת היום משהו שפגע? אם כן — התנצל כנה.' },
  { book: 'אורחות צדיקים', section: 'שער הכעס', ref: 'Orchot_Tzadikim.20',
    mission: 'אם תרגיש כעס עולה — צא רגע, נשום עמוק, ורק אז הגב בשקט.' },
];

/* ===================== כלים ===================== */
function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateStr(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function sundayOf(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // 0 = ראשון
  return x;
}
function weekKey(d) { return 'W' + dateStr(sundayOf(d || new Date())); }
function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function periodKey(recurrence, d) {
  d = d || new Date();
  if (recurrence === 'daily') return dateStr(d);
  if (recurrence === 'weekly') return weekKey(d);
  if (recurrence === 'monthly') return monthKey(d);
  return 'once';
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function recurLabel(r) {
  return r === 'daily' ? 'יומי' : r === 'weekly' ? 'שבועי' : r === 'monthly' ? 'חודשי' : 'חד-פעמי';
}
function scopeLabel(s) { return s === 'week' ? 'שבועי' : s === 'month' ? 'חודשי' : 'יומי'; }
function hebDate() {
  try {
    const wd = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(new Date());
    const heb = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const greg = new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    return 'יום ' + wd + ' · ' + heb + ' · ' + greg;
  } catch (e) { return dateStr(); }
}
function hebDateShort() {
  try {
    return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long' }).format(new Date()) +
      ' · ' + new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit' }).format(new Date());
  } catch (e) { return dateStr(); }
}

/* ===================== נתוני ברירת מחדל ===================== */
function makeTask(areaId, title, recurrence, points, owner) {
  return { id: uid(), areaId: areaId, title: title, recurrence: recurrence, points: points, owner: owner, target: '', active: true, createdAt: Date.now() };
}
function seedState() {
  const m1 = uid(), m2 = uid();
  const aTorah = uid(), aTefila = uid(), aMidot = uid(), aChinuch = uid(), aBayit = uid();
  return {
    version: 1,
    members: [
      { id: m1, name: 'אבא', color: PALETTE[0].color, textColor: PALETTE[0].textColor },
      { id: m2, name: 'אמא', color: PALETTE[1].color, textColor: PALETTE[1].textColor },
    ],
    currentMemberId: m1,
    areas: [
      { id: aTorah,   name: 'תורה',  icon: '📖', color: '#378ADD' },
      { id: aTefila,  name: 'תפילה', icon: '🙏', color: '#1D9E75' },
      { id: aMidot,   name: 'מידות', icon: '🌱', color: '#BA7517' },
      { id: aChinuch, name: 'חינוך', icon: '👨‍👩‍👧‍👦', color: '#D4537E' },
      { id: aBayit,   name: 'בית',   icon: '🏠', color: '#7A5BD0' },
    ],
    tasks: [
      makeTask(aTorah, 'לימוד תורה יומי', 'daily', 2, m1),
      makeTask(aTorah, 'שיעור / סדר שבועי', 'weekly', 3, m1),
      makeTask(aTefila, 'תפילה במניין', 'daily', 2, m1),
      makeTask(aMidot, 'להישמר מכעס', 'daily', 3, 'shared'),
      makeTask(aMidot, 'לדייק באמת ולהימנע מהגזמה', 'daily', 2, 'shared'),
      makeTask(aMidot, 'לדון אחרים לכף זכות', 'daily', 2, 'shared'),
      makeTask(aMidot, 'לשמוח ולמצוא את הטוב', 'daily', 2, 'shared'),
      makeTask(aMidot, 'לחשוב לפני שמדברים', 'daily', 2, 'shared'),
      makeTask(aMidot, 'ענווה — להקשיב לאחרים בלי להפריע', 'daily', 2, 'shared'),
      makeTask(aMidot, 'שלום בית — שיחת ערב עם אשתי', 'daily', 2, m1),
      makeTask(aMidot, 'לבצע את משימת המוסר היומית', 'daily', 3, 'shared'),
      makeTask(aMidot, 'חשבון נפש על מידות השבוע', 'weekly', 4, 'shared'),
      makeTask(aChinuch, 'זמן איכות עם הילדים', 'daily', 2, 'shared'),
      makeTask(aChinuch, 'שיחה אישית עם כל ילד', 'weekly', 3, 'shared'),
      makeTask(aBayit, 'סדר וניקיון יומי', 'daily', 1, 'shared'),
      makeTask(aBayit, 'תיקונים בבית', 'weekly', 2, m1),
    ],
    log: [],
    reflections: [],
  };
}

/* ===================== אחסון ===================== */
let state = null;
let scoreScope = 'week';
let formSubmit = null;
let learningData = null;
const LS_KEY = 'growthState_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  if (cloud.enabled) cloud.push();
}

/* ===================== בוחרים (selectors) ===================== */
function curMember() { return state.members.find(function (m) { return m.id === state.currentMemberId; }) || state.members[0]; }
function areaById(id) { return state.areas.find(function (a) { return a.id === id; }); }
function memberById(id) { return state.members.find(function (m) { return m.id === id; }); }
function tasksForMember(memberId) {
  return state.tasks.filter(function (t) { return t.active && (t.owner === memberId || t.owner === 'shared'); });
}
function logEntry(taskId, memberId, recurrence, d) {
  const pk = periodKey(recurrence, d);
  return state.log.find(function (l) { return l.taskId === taskId && l.memberId === memberId && l.periodKey === pk; });
}

/* ===================== פעולות צ'ק-אין ===================== */
function setStatus(taskId, status) {
  const t = state.tasks.find(function (x) { return x.id === taskId; });
  if (!t) return;
  const mId = state.currentMemberId;
  const pk = periodKey(t.recurrence);
  let e = state.log.find(function (l) { return l.taskId === taskId && l.memberId === mId && l.periodKey === pk; });
  if (status === null) {
    if (e) state.log = state.log.filter(function (l) { return l !== e; });
  } else {
    const pts = status === 'done' ? t.points : status === 'partial' ? Math.max(1, Math.round(t.points / 2)) : 0;
    if (e) { e.status = status; e.points = pts; e.ts = Date.now(); e.date = dateStr(); }
    else state.log.push({ id: uid(), taskId: taskId, memberId: mId, recurrence: t.recurrence, periodKey: pk, status: status, points: pts, date: dateStr(), ts: Date.now() });
  }
  saveState(); renderToday(); renderScore();
}
function toggleStatus(taskId, status) {
  const t = state.tasks.find(function (x) { return x.id === taskId; });
  if (!t) return;
  const e = logEntry(taskId, state.currentMemberId, t.recurrence);
  const cur = e ? e.status : null;
  setStatus(taskId, cur === status ? null : status);
}

/* ===================== ניקוד ===================== */
function inScope(l, scope, now) {
  if (scope === 'all') return true;
  const d = new Date(l.date + 'T00:00:00');
  if (scope === 'week') return sundayOf(d).getTime() === sundayOf(now).getTime();
  return monthKey(d) === monthKey(now);
}
function scoreFor(memberId, scope) {
  const now = new Date();
  const logs = state.log.filter(function (l) { return l.memberId === memberId && inScope(l, scope, now); });
  let points = 0, done = 0, partial = 0, fail = 0;
  logs.forEach(function (l) {
    points += l.points || 0;
    if (l.status === 'done') done++;
    else if (l.status === 'partial') partial++;
    else if (l.status === 'fail') fail++;
  });
  return { points: points, done: done, partial: partial, fail: fail, total: done + partial + fail };
}
function currentStreak(memberId) {
  function hasDaily(ds) {
    return state.log.some(function (l) { return l.memberId === memberId && l.recurrence === 'daily' && l.date === ds && l.status === 'done'; });
  }
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (!hasDaily(dateStr(d))) d.setDate(d.getDate() - 1); // אורכה ליום הנוכחי
  while (hasDaily(dateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function areaBreakdown(memberId, scope) {
  const now = new Date();
  const byArea = {};
  state.log.filter(function (l) { return l.memberId === memberId && inScope(l, scope, now); })
    .forEach(function (l) {
      const t = state.tasks.find(function (x) { return x.id === l.taskId; });
      if (!t) return;
      byArea[t.areaId] = (byArea[t.areaId] || 0) + (l.points || 0);
    });
  const entries = Object.keys(byArea).map(function (k) { return [k, byArea[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  if (!entries.length) return '';
  const max = Math.max.apply(null, entries.map(function (e) { return e[1]; }).concat([1]));
  return '<div class="breakdown">' + entries.map(function (pair) {
    const a = areaById(pair[0]) || {};
    return '<div class="bd-row"><span class="bd-name">' + (a.icon || '') + ' ' + esc(a.name || '') +
      '</span><div class="bar-wrap"><div class="bar" style="width:' + Math.round(pair[1] / max * 100) + '%;background:' + (a.color || '#888') +
      '"></div></div><span class="bd-pts">' + pair[1] + '</span></div>';
  }).join('') + '</div>';
}

/* ===================== רכיבי UI משותפים ===================== */
function memberChips(activeId, handler) {
  return state.members.map(function (m) {
    const on = m.id === activeId;
    const style = on ? 'background:' + m.color + ';color:' + m.textColor + ';border-color:' + m.color : '';
    return '<button class="chip ' + (on ? 'active' : '') + '" style="' + style + '" onclick="' + handler + "('" + m.id + "')\">" + esc(m.name) + '</button>';
  }).join('');
}

/* ===================== מסך: היום (לוז) ===================== */
function taskRow(t) {
  const mId = state.currentMemberId;
  const e = logEntry(t.id, mId, t.recurrence);
  const st = e ? e.status : null;
  const area = areaById(t.areaId) || {};
  return '<div class="trow ' + (st ? 's-' + st : '') + '">' +
    '<span class="dot" style="background:' + (area.color || '#ccc') + '"></span>' +
    '<div class="tmain"><div class="ttitle">' + esc(t.title) + '</div>' +
    '<div class="tmeta">' + (area.icon || '') + ' ' + esc(area.name || '') +
    (t.target ? ' · ' + esc(t.target) : '') + ' · ' + recurLabel(t.recurrence) + ' · ' + t.points + " נק'</div></div>" +
    '<div class="tbtns">' +
    '<button class="sb fail ' + (st === 'fail' ? 'on' : '') + '" title="כשלון" onclick="toggleStatus(\'' + t.id + "','fail')\">✗</button>" +
    '<button class="sb part ' + (st === 'partial' ? 'on' : '') + '" title="חלקי" onclick="toggleStatus(\'' + t.id + "','partial')\">◑</button>" +
    '<button class="sb done ' + (st === 'done' ? 'on' : '') + '" title="הצלחה" onclick="toggleStatus(\'' + t.id + "','done')\">✓</button>" +
    '</div></div>';
}
function renderToday() {
  if (!state) return;
  const mId = state.currentMemberId;
  const tasks = tasksForMember(mId);
  const groups = [['daily', '📅 היום'], ['weekly', '🗓️ השבוע'], ['monthly', '📆 החודש'], ['once', '📌 חד-פעמי']];
  let html = '';
  groups.forEach(function (g) {
    let list = tasks.filter(function (t) { return t.recurrence === g[0]; });
    if (g[0] === 'once') list = list.filter(function (t) { const e = logEntry(t.id, mId, 'once'); return !(e && e.status === 'done'); });
    if (!list.length) return;
    html += '<div class="section-label">' + g[1] + '</div>' + list.map(taskRow).join('');
  });
  if (!html) html = '<div class="empty">אין משימות עדיין.<br>עברו ל<b>יעדים</b> כדי להוסיף.</div>';
  const todayPts = state.log.filter(function (l) { return l.memberId === mId && l.date === dateStr(); })
    .reduce(function (s, l) { return s + (l.points || 0); }, 0);
  document.getElementById('todayHead').innerHTML =
    '<div class="dateline">' + hebDate() + '</div>' +
    '<div class="memberbar">' + memberChips(mId, 'switchMember') + '</div>' +
    '<div class="todaypts">היום: <b>' + todayPts + "</b> נק'</div>";
  document.getElementById('todayList').innerHTML = html;
}
function switchMember(id) { state.currentMemberId = id; saveState(); renderAll(); }

/* ===================== מסך: יעדים (ניהול) ===================== */
function ownerLabel(o) { if (o === 'shared') return 'משותף'; const m = memberById(o); return m ? m.name : '—'; }
function renderGoals() {
  if (!state) return;
  let html = '';
  state.areas.forEach(function (a) {
    const ts = state.tasks.filter(function (t) { return t.areaId === a.id; });
    html += '<div class="card"><div class="card-head">' +
      '<span class="aicon" style="background:' + a.color + '22;color:' + a.color + '">' + (a.icon || '•') + '</span>' +
      '<span class="aname">' + esc(a.name) + '</span>' +
      '<button class="mini" onclick="editArea(\'' + a.id + '\')">✎</button>' +
      '<button class="mini danger" onclick="deleteArea(\'' + a.id + '\')">🗑</button></div>' +
      ts.map(function (t) {
        return '<div class="grow"><div><div class="gtitle">' + esc(t.title) +
          (t.active ? '' : ' <span class="off">(כבוי)</span>') + '</div>' +
          '<div class="gmeta">' + recurLabel(t.recurrence) + ' · ' + t.points + " נק' · " + esc(ownerLabel(t.owner)) + '</div></div>' +
          '<div><button class="mini" onclick="editTask(\'' + t.id + '\')">✎</button>' +
          '<button class="mini danger" onclick="deleteTask(\'' + t.id + '\')">🗑</button></div></div>';
      }).join('') +
      '<button class="addbtn" onclick="addTask(\'' + a.id + '\')">+ הוסף משימה</button></div>';
  });
  html += '<button class="addbtn big" onclick="addArea()">+ הוסף תחום</button>';
  document.getElementById('goalsList').innerHTML = html;
}
function recurOptions() {
  return [['daily', 'יומי'], ['weekly', 'שבועי'], ['monthly', 'חודשי'], ['once', 'חד-פעמי']]
    .map(function (p) { return { value: p[0], label: p[1] }; });
}
function ownerOptions() {
  return [{ value: 'shared', label: 'משותף' }].concat(state.members.map(function (m) { return { value: m.id, label: m.name }; }));
}
function addArea() {
  openForm('תחום חדש', [
    { key: 'name', label: 'שם התחום', value: '' },
    { key: 'icon', label: 'אימוג׳י', value: '⭐' },
    { key: 'color', label: 'צבע', type: 'color', value: '#378ADD' },
  ], function (d) {
    if (!d.name.trim()) return;
    state.areas.push({ id: uid(), name: d.name.trim(), icon: d.icon || '•', color: d.color || '#378ADD' });
    saveState(); renderGoals(); renderToday();
  });
}
function editArea(id) {
  const a = areaById(id); if (!a) return;
  openForm('עריכת תחום', [
    { key: 'name', label: 'שם התחום', value: a.name },
    { key: 'icon', label: 'אימוג׳י', value: a.icon },
    { key: 'color', label: 'צבע', type: 'color', value: a.color },
  ], function (d) {
    a.name = d.name.trim() || a.name; a.icon = d.icon || a.icon; a.color = d.color || a.color;
    saveState(); renderGoals(); renderToday(); renderScore();
  });
}
function deleteArea(id) {
  const a = areaById(id); if (!a) return;
  if (!confirm('למחוק את התחום "' + a.name + '" וכל המשימות שבו?')) return;
  const taskIds = state.tasks.filter(function (t) { return t.areaId === id; }).map(function (t) { return t.id; });
  state.areas = state.areas.filter(function (x) { return x.id !== id; });
  state.tasks = state.tasks.filter(function (t) { return t.areaId !== id; });
  state.log = state.log.filter(function (l) { return taskIds.indexOf(l.taskId) === -1; });
  saveState(); renderGoals(); renderToday(); renderScore();
}
function addTask(areaId) {
  openForm('משימה חדשה', [
    { key: 'title', label: 'שם המשימה', value: '' },
    { key: 'recurrence', label: 'תדירות', type: 'select', value: 'daily', options: recurOptions() },
    { key: 'owner', label: 'שייך ל', type: 'select', value: state.currentMemberId, options: ownerOptions() },
    { key: 'points', label: 'נקודות', type: 'number', value: 2, attr: 'min="0"' },
    { key: 'target', label: 'יעד (לא חובה)', value: '' },
  ], function (d) {
    if (!d.title.trim()) return;
    state.tasks.push({ id: uid(), areaId: areaId, title: d.title.trim(), recurrence: d.recurrence, owner: d.owner, points: parseInt(d.points, 10) || 0, target: d.target || '', active: true, createdAt: Date.now() });
    saveState(); renderGoals(); renderToday();
  });
}
function editTask(id) {
  const t = state.tasks.find(function (x) { return x.id === id; }); if (!t) return;
  openForm('עריכת משימה', [
    { key: 'title', label: 'שם המשימה', value: t.title },
    { key: 'recurrence', label: 'תדירות', type: 'select', value: t.recurrence, options: recurOptions() },
    { key: 'owner', label: 'שייך ל', type: 'select', value: t.owner, options: ownerOptions() },
    { key: 'points', label: 'נקודות', type: 'number', value: t.points, attr: 'min="0"' },
    { key: 'target', label: 'יעד (לא חובה)', value: t.target },
    { key: 'active', label: 'פעיל', type: 'select', value: t.active ? '1' : '0', options: [{ value: '1', label: 'כן' }, { value: '0', label: 'לא' }] },
  ], function (d) {
    t.title = d.title.trim() || t.title; t.recurrence = d.recurrence; t.owner = d.owner;
    t.points = parseInt(d.points, 10) || 0; t.target = d.target; t.active = d.active === '1';
    saveState(); renderGoals(); renderToday(); renderScore();
  });
}
function deleteTask(id) {
  const t = state.tasks.find(function (x) { return x.id === id; }); if (!t) return;
  if (!confirm('למחוק את "' + t.title + '"?')) return;
  state.tasks = state.tasks.filter(function (x) { return x.id !== id; });
  state.log = state.log.filter(function (l) { return l.taskId !== id; });
  saveState(); renderGoals(); renderToday(); renderScore();
}

/* ===================== מסך: ניקוד ===================== */
function renderScore() {
  if (!state) return;
  let html = '<div class="seg">' +
    [['week', 'שבוע'], ['month', 'חודש'], ['all', 'הכל']].map(function (p) {
      return '<button class="' + (scoreScope === p[0] ? 'active' : '') + '" onclick="setScope(\'' + p[0] + '\')">' + p[1] + '</button>';
    }).join('') + '</div>';
  let combined = 0;
  const cards = state.members.map(function (m) {
    const s = scoreFor(m.id, scoreScope);
    combined += s.points;
    const rate = s.total ? Math.round(s.done / s.total * 100) : 0;
    const streak = currentStreak(m.id);
    return '<div class="card"><div class="card-head">' +
      '<span class="avatar" style="background:' + m.color + ';color:' + m.textColor + '">' + esc((m.name[0] || '?')) + '</span>' +
      '<div><div class="aname">' + esc(m.name) + '</div><div class="sub">' + s.points + " נק' · רצף " + streak + ' ימים 🔥</div></div></div>' +
      '<div class="statgrid">' +
      '<div class="stat ok"><b>' + s.done + '</b><span>הצלחות</span></div>' +
      '<div class="stat mid"><b>' + s.partial + '</b><span>חלקי</span></div>' +
      '<div class="stat bad"><b>' + s.fail + '</b><span>כשלונות</span></div>' +
      '<div class="stat"><b>' + rate + '%</b><span>אחוז הצלחה</span></div></div>' +
      areaBreakdown(m.id, scoreScope) + '</div>';
  }).join('');
  html += '<div class="combined">🌟 ביחד: <b>' + combined + "</b> נק'</div>" + cards;
  document.getElementById('scoreList').innerHTML = html;
}
function setScope(v) { scoreScope = v; renderScore(); }

/* ===================== מסך: חשבון נפש ===================== */
function renderReflect() {
  if (!state) return;
  const mId = state.currentMemberId;
  const list = state.reflections.filter(function (r) { return r.memberId === mId; }).sort(function (a, b) { return b.ts - a.ts; });
  let html = '<div class="memberbar">' + memberChips(mId, 'switchMember') + '</div>' +
    '<button class="addbtn big" onclick="addReflection()">+ חשבון נפש חדש</button>';
  if (!list.length) html += '<div class="empty">אין רשומות עדיין.<br>כתבו חשבון נפש יומי, שבועי או חודשי.</div>';
  else html += list.map(function (r) {
    return '<div class="card refl"><div class="refl-head">' +
      '<span class="refl-scope">' + scopeLabel(r.scope) + '</span>' +
      '<span class="refl-date">' + esc(r.dateLabel || r.date) + '</span></div>' +
      (r.rating ? '<div class="stars">' + '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) + '</div>' : '') +
      '<div class="refl-text">' + esc(r.text).replace(/\n/g, '<br>') + '</div>' +
      '<button class="mini danger" onclick="deleteReflection(\'' + r.id + '\')">🗑 מחק</button></div>';
  }).join('');
  document.getElementById('reflectList').innerHTML = html;
}
function addReflection() {
  openForm('חשבון נפש', [
    { key: 'scope', label: 'תקופה', type: 'select', value: 'day', options: [{ value: 'day', label: 'יומי' }, { value: 'week', label: 'שבועי' }, { value: 'month', label: 'חודשי' }] },
    { key: 'rating', label: 'איך הרגשתי', type: 'select', value: '4', options: [1, 2, 3, 4, 5].map(function (n) { return { value: String(n), label: '★'.repeat(n) }; }) },
    { key: 'text', label: 'הצלחות, מה לשפר, מחשבות', type: 'textarea', value: '' },
  ], function (d) {
    if (!d.text.trim()) return;
    state.reflections.push({ id: uid(), memberId: state.currentMemberId, scope: d.scope, rating: parseInt(d.rating, 10) || 0, text: d.text.trim(), date: dateStr(), dateLabel: hebDateShort(), ts: Date.now() });
    saveState(); renderReflect();
  });
}
function deleteReflection(id) {
  if (!confirm('למחוק רשומה זו?')) return;
  state.reflections = state.reflections.filter(function (r) { return r.id !== id; });
  saveState(); renderReflect();
}

/* ===================== מסך: הגדרות ===================== */
function renderSettings() {
  if (!state) return;
  let html = '<div class="section-label">משתמשים</div>';
  html += state.members.map(function (m) {
    return '<div class="grow"><div><span class="avatar sm" style="background:' + m.color + ';color:' + m.textColor + '">' +
      esc((m.name[0] || '?')) + '</span> ' + esc(m.name) + '</div><div>' +
      '<button class="mini" onclick="editMember(\'' + m.id + '\')">✎</button>' +
      (state.members.length > 1 ? '<button class="mini danger" onclick="deleteMember(\'' + m.id + '\')">🗑</button>' : '') +
      '</div></div>';
  }).join('');
  html += '<button class="addbtn" onclick="addMember()">+ הוסף משתמש</button>';
  html += '<div class="section-label">סנכרון וענן</div>';
  if (cloud.status === 'connected') {
    html += '<div class="card">' +
      '<div class="cloud-ok">☁ מחובר לענן ✓</div>' +
      '<div style="font-size:13px;color:#374151;margin:6px 0 10px">מחובר כ: <b>' + esc(cloud.user.email) + '</b><br>הנתונים מסונכרנים בין כל המכשירים.</div>' +
      '<button class="addbtn" onclick="cloudSyncNow()">עדכן עכשיו</button>' +
      '<button class="mini" style="width:auto;padding:0 14px;margin-top:8px" onclick="cloudLogout()">התנתקות</button>' +
      '</div>';
  } else if (cloud.status === 'configured') {
    html += '<div class="card">' +
      '<div style="font-size:13px;color:#374151;margin-bottom:12px">Firebase מוגדר — התחברו כדי להפעיל סנכרון.<br>' +
      '<span style="font-size:12px;color:#9ca3af">השתמשו באותו דוא"ל וסיסמה בשני המכשירים.</span></div>' +
      '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">דוא"ל</label>' +
      '<input id="cloudEmail" type="email" placeholder="family@email.com" style="display:block;width:100%;padding:9px 10px;border:1px solid #d1d5db;border-radius:9px;font-size:15px;box-sizing:border-box;margin-bottom:10px">' +
      '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">סיסמה</label>' +
      '<input id="cloudPass" type="password" placeholder="••••••••" style="display:block;width:100%;padding:9px 10px;border:1px solid #d1d5db;border-radius:9px;font-size:15px;box-sizing:border-box;margin-bottom:6px">' +
      '<div id="cloudMsg" style="color:#dc2626;font-size:13px;min-height:18px;margin-bottom:8px"></div>' +
      '<div style="display:flex;gap:8px">' +
        '<button class="addbtn" style="margin-top:0;flex:1" onclick="cloudLogin()">כניסה</button>' +
        '<button class="addbtn" style="margin-top:0;flex:1" onclick="cloudSignup()">הרשמה</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button class="mini" style="width:auto;padding:0 12px" onclick="cloudForgotPassword()">שכחתי סיסמה</button>' +
        '<button class="mini danger" style="width:auto;padding:0 12px" onclick="cloudRemoveConfig()">הסר הגדרות</button>' +
      '</div></div>';
  } else {
    html += '<div class="card">' +
      '<div style="font-size:13px;color:#374151;margin-bottom:10px">כרגע הנתונים נשמרים <b>במכשיר זה בלבד</b>.<br>' +
      'כדי לסנכרן בין הנייד והמחשב — שלך ושל אשתך — הפעילו Firebase (חינמי, כ-5 דקות).</div>' +
      '<details style="margin-bottom:10px"><summary style="cursor:pointer;font-weight:600;color:#1b5e20;font-size:13px">⟨ איך מגדירים Firebase</summary>' +
        '<ol style="margin:8px 0 4px 18px;font-size:12px;line-height:2;color:#374151">' +
          '<li>פתחו <code>console.firebase.google.com</code> → צרו פרויקט חדש</li>' +
          '<li>הוסיפו Web App (⊕) → העתיקו את אובייקט ה-<code>firebaseConfig</code></li>' +
          '<li>הפעילו Authentication → Sign-in → Email/Password</li>' +
          '<li>הפעילו Firestore Database → Start in production mode</li>' +
          '<li>בFirestore → Rules → הדביקו:<br><code>match /households/{uid} {<br>&nbsp;allow read,write: if request.auth.uid==uid;<br>}</code></li>' +
          '<li>לחצו כאן → הדביקו את ה-JSON</li>' +
        '</ol>' +
      '</details>' +
      '<button class="addbtn" onclick="cloudSetupFlow()">הגדר סנכרון ענן ←</button>' +
      '</div>';
  }
  html += '<div class="section-label">נתונים וגיבוי</div>';
  html += '<div class="card">' +
    '<button class="addbtn" onclick="exportData()">⬇ ייצוא גיבוי (קובץ)</button>' +
    '<button class="addbtn" onclick="document.getElementById(\'importFile\').click()">⬆ ייבוא גיבוי</button>' +
    '<input type="file" id="importFile" accept="application/json" style="display:none" onchange="importData(event)">' +
    '<button class="danger-btn" onclick="resetData()">🗑 איפוס כל הנתונים</button></div>';
  html += '<div class="footnote">צמיחה · גרסה 1 · נבנה באהבה 💛</div>';
  document.getElementById('settingsList').innerHTML = html;
}
function addMember() {
  const p = PALETTE[state.members.length % PALETTE.length];
  openForm('משתמש חדש', [{ key: 'name', label: 'שם', value: '' }], function (d) {
    if (!d.name.trim()) return;
    state.members.push({ id: uid(), name: d.name.trim(), color: p.color, textColor: p.textColor });
    saveState(); renderSettings(); renderAll();
  });
}
function editMember(id) {
  const m = memberById(id); if (!m) return;
  openForm('עריכת משתמש', [
    { key: 'name', label: 'שם', value: m.name },
    { key: 'color', label: 'צבע', type: 'color', value: m.color },
  ], function (d) {
    m.name = d.name.trim() || m.name; m.color = d.color || m.color;
    saveState(); renderSettings(); renderAll();
  });
}
function deleteMember(id) {
  if (state.members.length <= 1) return;
  const m = memberById(id); if (!m) return;
  if (!confirm('למחוק את ' + m.name + '? הנתונים שלו יישמרו אך לא יוצגו.')) return;
  state.members = state.members.filter(function (x) { return x.id !== id; });
  if (state.currentMemberId === id) state.currentMemberId = state.members[0].id;
  saveState(); renderAll(); renderSettings();
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'growth-backup-' + dateStr() + '.json';
  a.click();
}
function importData(ev) {
  const f = ev.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = function () {
    try {
      const obj = JSON.parse(r.result);
      if (obj && obj.members && obj.tasks) { state = obj; normalizeState(); saveState(); renderAll(); alert('הגיבוי יובא בהצלחה ✓'); }
      else alert('קובץ לא תקין');
    } catch (e) { alert('קובץ לא תקין'); }
  };
  r.readAsText(f);
}
function resetData() {
  if (!confirm('לאפס את כל הנתונים ולהתחיל מחדש?')) return;
  if (!confirm('בטוח? פעולה זו אינה הפיכה.')) return;
  state = seedState(); saveState(); renderAll();
}

/* ===================== מודאל טופס גנרי ===================== */
function openForm(title, fields, onSubmit) {
  formSubmit = onSubmit;
  const body = fields.map(function (f) {
    if (f.type === 'select') {
      return '<label>' + esc(f.label) + '<select data-key="' + f.key + '">' +
        f.options.map(function (o) {
          return '<option value="' + esc(o.value) + '"' + (String(o.value) === String(f.value) ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('') + '</select></label>';
    }
    if (f.type === 'textarea') {
      return '<label>' + esc(f.label) + '<textarea data-key="' + f.key + '" rows="4">' + esc(f.value || '') + '</textarea></label>';
    }
    return '<label>' + esc(f.label) + '<input data-key="' + f.key + '" type="' + (f.type || 'text') +
      '" value="' + esc(f.value == null ? '' : f.value) + '" ' + (f.attr || '') + '></label>';
  }).join('');
  document.getElementById('formTitle').textContent = title;
  document.getElementById('formBody').innerHTML = body;
  document.getElementById('formModal').classList.add('show');
  const first = document.querySelector('#formBody [data-key]');
  if (first) setTimeout(function () { first.focus(); }, 80);
}
function submitForm() {
  const data = {};
  document.querySelectorAll('#formBody [data-key]').forEach(function (el) { data[el.getAttribute('data-key')] = el.value; });
  document.getElementById('formModal').classList.remove('show');
  const cb = formSubmit; formSubmit = null;
  if (cb) cb(data);
}
function closeForm() { document.getElementById('formModal').classList.remove('show'); formSubmit = null; }

/* ===================== ניווט וריענון ===================== */
function renderAll() { renderToday(); renderMussarCard(); renderGoals(); renderScore(); renderReflect(); renderSettings(); }
function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.nav button').forEach(function (b) { b.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo(0, 0);
}

/* ===================== לימוד יומי ===================== */
const SEFARIA_API = 'https://www.sefaria.org/api/calendars?timezone=Asia/Jerusalem';

var textCache = {};

function textApiUrl(ref) { return 'https://www.sefaria.org/api/texts/' + ref + '?context=0&pad=0'; }

function sanitizeSefaria(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/ on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
function flattenSegments(node, out) {
  out = out || [];
  if (Array.isArray(node)) node.forEach(function (x) { flattenSegments(x, out); });
  else if (typeof node === 'string' && node.trim()) out.push(node);
  return out;
}
function fetchSefariaText(refs) {
  var list = Array.isArray(refs) ? refs.slice() : [refs];
  var key = list.join('|');
  if (textCache[key]) return Promise.resolve(textCache[key]);
  function tryNext(i) {
    if (i >= list.length) return Promise.reject(new Error('not found'));
    return fetch(textApiUrl(list[i]))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http ' + r.status)); })
      .then(function (data) {
        var segs = flattenSegments(data.he);
        if (!segs.length) return tryNext(i + 1);
        var res = { heRef: data.heRef || '', segments: segs };
        textCache[key] = res;
        return res;
      })
      .catch(function () { return tryNext(i + 1); });
  }
  return tryNext(0);
}
// מייצר רשימת הפניות מועמדות (לכיסוי הבדלי תעתיק בספריא)
function mussarRefs(entry) {
  var r = entry.ref, cands = [r];
  if (r.indexOf('Mesillat_Yesharim') === 0) cands.push(r.replace('Mesillat_Yesharim', 'Mesilat_Yesharim'));
  else if (r.indexOf('Mesilat_Yesharim') === 0) cands.push(r.replace('Mesilat_Yesharim', 'Mesillat_Yesharim'));
  return cands;
}
function toggleReader(key, btn) {
  var box = document.getElementById('reader-' + key);
  if (!box) return;
  if (box.style.display === 'block') {
    box.style.display = 'none';
    if (btn) btn.textContent = btn.getAttribute('data-open');
    return;
  }
  box.style.display = 'block';
  if (btn) btn.textContent = btn.getAttribute('data-close');
  if (box.getAttribute('data-loaded') === '1') return;
  var refs = (box.getAttribute('data-refs') || '').split('|');
  box.innerHTML = '<div class="reader-loading">טוען טקסט…</div>';
  fetchSefariaText(refs).then(function (res) {
    box.setAttribute('data-loaded', '1');
    var body = res.segments.map(function (s) { return '<p class="seg">' + sanitizeSefaria(s) + '</p>'; }).join('');
    box.innerHTML = (res.heRef ? '<div class="reader-ref">' + esc(res.heRef) + '</div>' : '') + body;
  }).catch(function () {
    box.innerHTML = '<div class="reader-loading">לא ניתן לטעון את הטקסט כעת — בדקו חיבור לאינטרנט ונסו שוב.</div>';
  });
}
function readerBlock(key, refs) {
  return '<button class="reader-toggle" data-open="▾ הצג טקסט ללימוד" data-close="▴ הסתר" onclick="toggleReader(\'' + key + '\', this)">▾ הצג טקסט ללימוד</button>' +
    '<div class="reader" id="reader-' + key + '" data-refs="' + esc(refs.join('|')) + '" style="display:none"></div>';
}

function fetchLearning() {
  var el = document.getElementById('learningCard');
  if (el) el.innerHTML = '<div class="learn-card"><div class="learn-loading">טוען לוח שנה...</div></div>';
  fetch(SEFARIA_API)
    .then(function (r) { return r.json(); })
    .then(function (data) { learningData = data; renderLearningCard(); })
    .catch(function () { renderLearningCard(); });
}

function renderLearningCard() {
  var el = document.getElementById('learningCard');
  if (!el) return;

  var items = (learningData && learningData.calendar_items) || [];

  var daf = null, tehillim = null, parasha = null;
  items.forEach(function (item) {
    var titleHe = (item.title && item.title.he) || '';
    var titleEn = (item.title && item.title.en) || '';
    if (!daf && (titleHe.indexOf('דף יומי') !== -1 || titleEn.toLowerCase().indexOf('daf yomi') !== -1)) daf = item;
    if (!tehillim && (titleHe.indexOf('תהל') !== -1 || titleEn.toLowerCase().indexOf('psalm') !== -1 || titleEn.toLowerCase().indexOf('tehil') !== -1)) tehillim = item;
    if (!parasha && (titleHe.indexOf('פרש') !== -1 || item.category === 'Parasha' || titleEn.toLowerCase().indexOf('parash') !== -1)) parasha = item;
  });

  function row(emoji, label, item, key) {
    var name = (item.displayValue && item.displayValue.he) || (item.displayValue && item.displayValue.en) || '';
    return '<div class="learn-row">' +
      '<div class="learn-item-title">' + emoji + ' ' + esc(label) + ' · <b>' + esc(name) + '</b></div>' +
      readerBlock(key, [item.url]) +
      '</div>';
  }

  var html = '<div class="learn-card">';
  html += '<div class="learn-title">📚 לימוד היום</div>';

  if (!daf && !tehillim && !parasha) {
    html += '<div class="learn-loading">טוען לימוד יומי… אם זה נמשך, בדקו חיבור לאינטרנט.</div>';
  } else {
    if (daf) html += row('📖', 'דף יומי', daf, 'daf');
    if (tehillim) html += row('🙏', 'תהילים יומי', tehillim, 'tehillim');
    if (parasha) html += row('📜', 'שניים מקרא', parasha, 'parasha');
  }

  html += '</div>';
  el.innerHTML = html;
}

/* ===================== מוסר יומי ===================== */
function mussarToday() {
  var d = new Date(); d.setHours(0, 0, 0, 0);
  var epoch = new Date('2020-01-01').getTime();
  var days = Math.floor((d.getTime() - epoch) / 86400000);
  return MUSSAR_CYCLE[Math.abs(days) % MUSSAR_CYCLE.length];
}

function renderMussarCard() {
  var el = document.getElementById('mussarCard');
  if (!el) return;
  var entry = mussarToday();
  el.innerHTML =
    '<div class="mussar-card">' +
      '<div class="mussar-title">🌱 מוסר יומי</div>' +
      '<div class="mussar-body">' +
        '<div class="mussar-book">' + esc(entry.book) + '</div>' +
        '<div class="mussar-section">' + esc(entry.section) + '</div>' +
        readerBlock('mussar', mussarRefs(entry)) +
        '<div class="mussar-mission-label">משימת היום</div>' +
        '<div class="mussar-mission">' + esc(entry.mission) + '</div>' +
      '</div>' +
    '</div>';
}

/* ===================== ענן — Firebase Sync ===================== */
var cloud = {
  // status: 'unconfigured' | 'configured' (SDK ready, not logged in) | 'connected' (logged in)
  status: _cloudConfig ? 'configured' : 'unconfigured',
  enabled: false,
  user: null,
  auth: null,
  db: null,
  _timer: null,

  _ref: function () {
    return (cloud.user && cloud.db) ? cloud.db.collection('households').doc(cloud.user.uid) : null;
  },

  push: function () {
    if (!cloud.enabled) return;
    clearTimeout(cloud._timer);
    cloud._timer = setTimeout(function () {
      var r = cloud._ref();
      if (r) r.set({ s: JSON.stringify(state), t: Date.now() }).catch(function (e) { console.warn('cloud push', e); });
    }, 1200);
  },

  pull: function () {
    var r = cloud._ref();
    if (!r) return Promise.resolve();
    return r.get().then(function (snap) {
      if (!snap.exists) { cloud.push(); return; }
      var remote;
      try { remote = JSON.parse(snap.data().s); } catch (e) { return; }
      if (remote) { state = mergeRemoteState(state, remote); saveState(); }
    }).catch(function (e) { console.warn('cloud pull', e); });
  },

  init: function (auth, db) {
    cloud.auth = auth;
    cloud.db = db;
    auth.onAuthStateChanged(function (u) {
      cloud.user = u;
      cloud.enabled = !!u;
      cloud.status = u ? 'connected' : 'configured';
      if (u) { cloud.pull().then(function () { renderAll(); renderSettings(); }); }
      else { renderSettings(); }
    });
  },

  login:    function (email, pw) { return cloud.auth.signInWithEmailAndPassword(email, pw); },
  signup:   function (email, pw) { return cloud.auth.createUserWithEmailAndPassword(email, pw); },
  resetPw:  function (email)     { return cloud.auth.sendPasswordResetEmail(email); },

  logout: function () {
    if (cloud.auth) cloud.auth.signOut();
    cloud.enabled = false; cloud.user = null; cloud.status = 'configured';
    renderSettings();
  },

  removeConfig: function () {
    if (!confirm('להסיר הגדרות Firebase? תצטרכו להגדיר שוב כדי להתחבר לענן.')) return;
    cloud.logout();
    try { localStorage.removeItem('firebaseConfig'); } catch (e) { /* ignore */ }
    _cloudConfig = null;
    cloud.status = 'unconfigured';
    renderSettings();
  },
};

/* ---- Cloud helpers ---- */
function mergeRemoteState(local, remote) {
  if (!remote || !remote.version) return local;
  var merged = JSON.parse(JSON.stringify(remote));
  // Members: keep local edits, add remote-only members
  var mMap = {};
  local.members.forEach(function (m) { mMap[m.id] = m; });
  remote.members.forEach(function (m) { if (!mMap[m.id]) mMap[m.id] = m; });
  merged.members = Object.values(mMap);
  // Tasks: union by id, remote wins on conflict
  var tMap = {};
  local.tasks.forEach(function (t) { tMap[t.id] = t; });
  remote.tasks.forEach(function (t) { tMap[t.id] = t; });
  merged.tasks = Object.values(tMap);
  // Log: union by composite key (last-write-wins per period entry)
  var lMap = {};
  function lk(l) { return l.taskId + '|' + l.memberId + '|' + l.periodKey; }
  local.log.forEach(function (l) { lMap[lk(l)] = l; });
  remote.log.forEach(function (l) { lMap[lk(l)] = l; });
  merged.log = Object.values(lMap);
  // Reflections: union by id
  var rMap = {};
  (local.reflections || []).forEach(function (r) { rMap[r.id] = r; });
  (remote.reflections || []).forEach(function (r) { rMap[r.id] = r; });
  merged.reflections = Object.values(rMap);
  merged.currentMemberId = local.currentMemberId;
  return merged;
}

function loadFirebaseSDK() {
  return new Promise(function (resolve, reject) {
    if (typeof firebase !== 'undefined') { resolve(); return; }
    var urls = [
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
    ];
    var n = 0;
    urls.forEach(function (src) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { if (++n === urls.length) resolve(); };
      s.onerror = function () { reject(new Error('Failed to load Firebase SDK')); };
      document.head.appendChild(s);
    });
  });
}

function initCloudSync(cfg) {
  return loadFirebaseSDK().then(function () {
    var app;
    try { app = firebase.app(); } catch (e) { app = firebase.initializeApp(cfg); }
    cloud.init(firebase.auth(app), firebase.firestore(app));
  });
}

/* Cloud Settings UI handlers */
function cloudSetupFlow() {
  openForm('הגדרת Firebase Sync', [
    { key: 'cfg', label: 'הדביקו את ה-firebaseConfig מ-Firebase Console (JSON):', type: 'textarea', value: '' },
  ], function (d) {
    var cfg;
    try { cfg = JSON.parse(d.cfg.trim()); } catch (e) { alert('JSON לא תקין: ' + e.message); return; }
    if (!cfg.apiKey || !cfg.projectId) { alert('חסרים שדות — ודאו שהדבקתם את כל אובייקט ה-firebaseConfig'); return; }
    try { localStorage.setItem('firebaseConfig', JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    _cloudConfig = cfg;
    cloud.status = 'configured';
    renderSettings();
    initCloudSync(cfg).catch(function (e) { alert('שגיאת Firebase: ' + e.message); });
  });
}

function _cloudFields() {
  return {
    email: document.getElementById('cloudEmail'),
    pass:  document.getElementById('cloudPass'),
    msg:   document.getElementById('cloudMsg'),
  };
}
function _authErr(e) {
  return ({
    'auth/user-not-found':       'משתמש לא נמצא',
    'auth/wrong-password':       'סיסמה שגויה',
    'auth/invalid-credential':   'דוא"ל או סיסמה שגויים',
    'auth/email-already-in-use': 'דוא"ל כבר רשום — נסו להתחבר',
    'auth/weak-password':        'הסיסמה קצרה מדי (לפחות 6 תווים)',
    'auth/invalid-email':        'כתובת דוא"ל לא תקינה',
    'auth/network-request-failed': 'אין חיבור לאינטרנט',
    'auth/too-many-requests':    'יותר מדי ניסיונות — נסו מאוחר יותר',
  })[e.code] || e.message;
}

function cloudLogin() {
  var f = _cloudFields();
  if (f.msg) f.msg.textContent = 'מתחבר…';
  cloud.login((f.email && f.email.value) || '', (f.pass && f.pass.value) || '')
    .catch(function (e) { if (f.msg) f.msg.textContent = _authErr(e); });
}
function cloudSignup() {
  var f = _cloudFields();
  var addr = (f.email && f.email.value) || '';
  if (!confirm('ליצור חשבון בית חדש עם הדוא"ל: ' + addr + '?\n\nהשתמשו באותו דוא"ל וסיסמה בשני המכשירים.')) return;
  if (f.msg) f.msg.textContent = 'יוצר חשבון…';
  cloud.signup(addr, (f.pass && f.pass.value) || '')
    .catch(function (e) { if (f.msg) f.msg.textContent = _authErr(e); });
}
function cloudForgotPassword() {
  var f = _cloudFields();
  var addr = (f.email && f.email.value.trim()) || prompt('הכנס כתובת דוא"ל:');
  if (!addr) return;
  cloud.resetPw(addr).then(function () { alert('קישור לאיפוס נשלח לדוא"ל.'); }).catch(function (e) { alert(_authErr(e)); });
}
function cloudLogout() { cloud.logout(); }
function cloudRemoveConfig() { cloud.removeConfig(); }
function cloudSyncNow() {
  var btn = event && event.target;
  if (btn) { btn.disabled = true; btn.textContent = 'מעדכן…'; }
  cloud.pull().then(function () { renderAll(); }).catch(function () { /* ignore */ }).finally(function () {
    if (btn) { btn.disabled = false; btn.textContent = 'עדכן עכשיו'; }
  });
}

/* ===================== אתחול ===================== */
function normalizeState() {
  if (!state || !state.members || !state.members.length) { state = seedState(); return; }
  state.areas = state.areas || [];
  state.tasks = state.tasks || [];
  state.log = state.log || [];
  state.reflections = state.reflections || [];
  if (!state.currentMemberId || !memberById(state.currentMemberId)) state.currentMemberId = state.members[0].id;
}
function init() {
  state = loadState() || seedState();
  normalizeState();
  saveState();
  renderAll();
  fetchLearning();
  if (_cloudConfig) {
    initCloudSync(_cloudConfig).catch(function (e) { console.warn('Firebase init:', e); });
  }
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
