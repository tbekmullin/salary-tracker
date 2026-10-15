'use strict';

/* =====================================================================
   Константы
   ===================================================================== */
const STORAGE_KEY = 'salaryTracker.v1';

const CURRENCIES = {
  UZS: { label: 'Узбекский сум (сум)', symbol: 'сум', decimals: 0 },
  USD: { label: 'Доллар США ($)', symbol: '$', decimals: 2 },
  EUR: { label: 'Евро (€)', symbol: '€', decimals: 2 },
  RUB: { label: 'Российский рубль (₽)', symbol: '₽', decimals: 2 },
  KZT: { label: 'Казахстанский тенге (₸)', symbol: '₸', decimals: 0 },
};

const DEFAULT_CATEGORIES = [
  { name: 'Зарплата', type: 'income', color: '#16a34a' },
  { name: 'Фриланс', type: 'income', color: '#0ea5e9' },
  { name: 'Подарки', type: 'income', color: '#a855f7' },
  { name: 'Прочее', type: 'income', color: '#64748b' },
  { name: 'Продукты', type: 'expense', color: '#f97316' },
  { name: 'Транспорт', type: 'expense', color: '#eab308' },
  { name: 'Жильё и коммуналка', type: 'expense', color: '#ef4444' },
  { name: 'Развлечения', type: 'expense', color: '#ec4899' },
  { name: 'Здоровье', type: 'expense', color: '#14b8a6' },
  { name: 'Прочее', type: 'expense', color: '#64748b' },
];

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/* =====================================================================
   Утилиты
   ===================================================================== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Дата в формате YYYY-MM-DD по локальному времени */
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(s) {
  return parseISODate(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Создание DOM-элемента; текст всегда через textContent (защита от XSS) */
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') Object.assign(node.style, value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

let toastTimer;
function toast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2500);
}

/* =====================================================================
   Хранилище (localStorage)
   ===================================================================== */
const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('localStorage недоступен:', e);
      return null;
    }
  },
  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Не удалось сохранить данные:', e);
    }
  },
  clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  },
};

function createDefaultState() {
  return {
    transactions: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ id: uid(), ...c })),
    settings: { currency: 'UZS' },
  };
}

function isValidState(data) {
  return data
    && Array.isArray(data.transactions)
    && Array.isArray(data.categories)
    && data.settings && typeof data.settings === 'object';
}

let state = (() => {
  const loaded = Storage.load();
  if (!isValidState(loaded)) return createDefaultState();
  if (!CURRENCIES[loaded.settings.currency]) loaded.settings.currency = 'UZS';
  return loaded;
})();

function commit() {
  Storage.save(state);
  render();
}

/* =====================================================================
   CRUD
   ===================================================================== */
const Transactions = {
  create({ type, amount, categoryId, date, note }) {
    const tx = { id: uid(), type, amount, categoryId, date, note: note || '', createdAt: Date.now() };
    state.transactions.push(tx);
    commit();
    return tx;
  },
  read(filter = {}) {
    let list = state.transactions.slice();
    if (filter.type && filter.type !== 'all') list = list.filter((t) => t.type === filter.type);
    if (filter.categoryId && filter.categoryId !== 'all') list = list.filter((t) => t.categoryId === filter.categoryId);
    if (filter.from) list = list.filter((t) => t.date >= filter.from);
    if (filter.to) list = list.filter((t) => t.date <= filter.to);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((t) => {
        const cat = Categories.get(t.categoryId);
        return t.note.toLowerCase().includes(q) || (cat && cat.name.toLowerCase().includes(q));
      });
    }
    const sort = filter.sort || 'date-desc';
    const byDate = (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
    list.sort({
      'date-desc': (a, b) => byDate(b, a),
      'date-asc': byDate,
      'amount-desc': (a, b) => b.amount - a.amount,
      'amount-asc': (a, b) => a.amount - b.amount,
    }[sort]);
    return list;
  },
  get(id) {
    return state.transactions.find((t) => t.id === id);
  },
  update(id, changes) {
    const tx = this.get(id);
    if (!tx) return null;
    Object.assign(tx, changes);
    commit();
    return tx;
  },
  delete(id) {
    state.transactions = state.transactions.filter((t) => t.id !== id);
    commit();
  },
};

const Categories = {
  create({ name, type, color }) {
    const cat = { id: uid(), name, type, color };
    state.categories.push(cat);
    commit();
    return cat;
  },
  read(type) {
    return type ? state.categories.filter((c) => c.type === type) : state.categories.slice();
  },
  get(id) {
    return state.categories.find((c) => c.id === id);
  },
  update(id, changes) {
    const cat = this.get(id);
    if (!cat) return null;
    Object.assign(cat, changes);
    commit();
    return cat;
  },
  /** Удаление; операции категории переносятся в «Прочее» того же типа */
  delete(id) {
    const cat = this.get(id);
    if (!cat) return { ok: false, reason: 'Категория не найдена' };
    const used = state.transactions.filter((t) => t.categoryId === id);
    if (used.length) {
      const fallback = state.categories.find((c) => c.type === cat.type && c.id !== id && c.name === 'Прочее');
      if (!fallback) {
        return { ok: false, reason: 'В категории есть операции, а категории «Прочее» для переноса нет' };
      }
      used.forEach((t) => { t.categoryId = fallback.id; });
    }
    state.categories = state.categories.filter((c) => c.id !== id);
    commit();
    return { ok: true, moved: used.length };
  },
  usageCount(id) {
    return state.transactions.filter((t) => t.categoryId === id).length;
  },
};

const Settings = {
  read() {
    return { ...state.settings };
  },
  update(changes) {
    Object.assign(state.settings, changes);
    commit();
  },
  resetAll() {
    Storage.clear();
    state = createDefaultState();
    commit();
  },
  importData(data) {
    if (!isValidState(data)) throw new Error('Неверный формат файла');
    if (!CURRENCIES[data.settings.currency]) data.settings.currency = 'UZS';
    state = data;
    commit();
  },
};

/* =====================================================================
   Форматирование валюты
   ===================================================================== */
function formatMoney(value, { sign = false } = {}) {
  const cur = CURRENCIES[state.settings.currency] || CURRENCIES.UZS;
  const num = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: cur.decimals,
    maximumFractionDigits: cur.decimals,
  }).format(Math.abs(value));
  const prefix = value < 0 ? '−' : (sign && value > 0 ? '+' : '');
  return `${prefix}${num} ${cur.symbol}`;
}

/** Сокращённая сумма с валютой: 10,65 млн сум */
function formatMoneyShort(value, { sign = false } = {}) {
  const cur = CURRENCIES[state.settings.currency] || CURRENCIES.UZS;
  const prefix = value < 0 ? '−' : (sign && value > 0 ? '+' : '');
  const digits = Math.abs(value) >= 1e6 ? 2 : 0;
  return `${prefix}${formatShort(Math.abs(value), digits)} ${cur.symbol}`.replace(/ /g, ' ');
}

/** Короткий формат для осей графиков: 1,2 млн / 350 тыс. */
function formatShort(value, digits = 1) {
  const abs = Math.abs(value);
  const fmt = (n) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(n);
  if (abs >= 1e9) return fmt(value / 1e9) + ' млрд';
  if (abs >= 1e6) return fmt(value / 1e6) + ' млн';
  if (abs >= 1e3) return fmt(value / 1e3) + ' тыс';
  return fmt(value);
}

/* =====================================================================
   Периоды и агрегаты
   ===================================================================== */
function getPeriodRange(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case 'month':
      return { from: toISODate(new Date(y, m, 1)), to: toISODate(new Date(y, m + 1, 0)) };
    case 'prevMonth':
      return { from: toISODate(new Date(y, m - 1, 1)), to: toISODate(new Date(y, m, 0)) };
    case 'year':
      return { from: toISODate(new Date(y, 0, 1)), to: toISODate(new Date(y, 11, 31)) };
    default:
      return { from: null, to: null };
  }
}

function sumBy(list, type) {
  return list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

/* =====================================================================
   Графики
   ===================================================================== */
const charts = {};

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartTheme() {
  return {
    text: cssVar('--muted'),
    grid: cssVar('--divider'),
    income: cssVar('--income'),
    expense: cssVar('--expense'),
    balance: cssVar('--balance'),
  };
}

function baseChartOptions() {
  const t = chartTheme();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: t.text, boxWidth: 12, boxHeight: 12 } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label || ctx.label}: ${formatMoney(ctx.parsed.y ?? ctx.parsed)}` } },
    },
    scales: {
      x: { ticks: { color: t.text }, grid: { display: false } },
      y: { ticks: { color: t.text, callback: (v) => formatShort(v) }, grid: { color: t.grid }, beginAtZero: true },
    },
  };
}

function upsertChart(key, canvasId, config) {
  if (typeof Chart === 'undefined') return;
  if (charts[key]) {
    charts[key].data = config.data;
    charts[key].options = config.options;
    charts[key].update();
  } else {
    charts[key] = new Chart(document.getElementById(canvasId), config);
  }
}

function renderMonthlyChart() {
  const t = chartTheme();
  const now = new Date();
  const labels = [];
  const income = [];
  const expense = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toISODate(d).slice(0, 7);
    const monthTx = state.transactions.filter((tx) => tx.date.startsWith(key));
    labels.push(`${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`);
    income.push(sumBy(monthTx, 'income'));
    expense.push(sumBy(monthTx, 'expense'));
  }
  upsertChart('monthly', 'chartMonthly', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Доходы', data: income, backgroundColor: t.income, borderRadius: 6, maxBarThickness: 28 },
        { label: 'Расходы', data: expense, backgroundColor: t.expense, borderRadius: 6, maxBarThickness: 28 },
      ],
    },
    options: baseChartOptions(),
  });
}

/* ---------- Объёмная (3D) кольцевая диаграмма ----------
   Кольцо наклоняется (сжатие по вертикали), под ним рисуется «боковая стенка»
   из затемнённых слоёв, сверху — блик. События мыши и подсказки пересчитываются
   под наклон, чтобы наведение работало точно. */
function shadeColor(color, amount) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!m) return color;
  const mix = (c) => {
    const v = parseInt(c, 16);
    const target = amount < 0 ? 0 : 255;
    return Math.round(v + (target - v) * Math.abs(amount));
  };
  return `rgb(${mix(m[1])}, ${mix(m[2])}, ${mix(m[3])})`;
}

function get3dGeometry(chart) {
  const opts = chart.options.plugins.doughnut3d || {};
  const arc = chart.getDatasetMeta(0).data[0];
  if (!arc) return null;
  const tilt = opts.tilt || 0.6;
  const depth = opts.depth || 16;
  const r = arc.outerRadius || 1;
  const area = chart.chartArea;
  // После наклона освобождается место — увеличиваем кольцо, насколько позволяет область
  const k = Math.max(1, Math.min(1.4, (area.width / 2) / r, ((area.height - depth) / 2) / (r * tilt)));
  return { cx: arc.x, cy: arc.y, depth, k, sy: k * tilt };
}

/** Точка «плоского» кольца → координаты на экране */
function to3dScreen(g, x, y) {
  return { x: g.cx + (x - g.cx) * g.k, y: g.cy - g.depth / 2 + (y - g.cy) * g.sy };
}

const doughnut3dPlugin = {
  id: 'doughnut3d',
  beforeDatasetsDraw(chart) {
    const g = get3dGeometry(chart);
    if (!g) return;
    const { ctx } = chart;
    const arcs = chart.getDatasetMeta(0).data;
    const colors = chart.data.datasets[0].backgroundColor;

    ctx.save();
    ctx.translate(g.cx, g.cy - g.depth / 2);
    ctx.scale(g.k, g.sy);
    ctx.translate(-g.cx, -g.cy);

    // Боковая стенка: слои от нижнего к верхнему
    for (let d = g.depth; d > 0; d--) {
      const offset = d / g.sy;
      arcs.forEach((a, i) => {
        const p = a.getProps(['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius']);
        if (p.endAngle - p.startAngle <= 0) return;
        // Учитываем «выдвижение» сегмента при наведении
        const mid = (p.startAngle + p.endAngle) / 2;
        const shift = (a.options && a.options.offset) || 0;
        const x = p.x + Math.cos(mid) * shift;
        const y = p.y + Math.sin(mid) * shift + offset;
        ctx.beginPath();
        ctx.arc(x, y, p.outerRadius, p.startAngle, p.endAngle);
        ctx.arc(x, y, p.innerRadius, p.endAngle, p.startAngle, true);
        ctx.closePath();
        ctx.fillStyle = shadeColor(colors[i], d === g.depth ? -0.55 : -0.35);
        ctx.fill();
      });
    }
  },
  afterDatasetsDraw(chart) {
    const g = get3dGeometry(chart);
    if (!g) return;
    const { ctx } = chart;
    const first = chart.getDatasetMeta(0).data[0];
    const { outerRadius: r, innerRadius: ir } = first.getProps(['outerRadius', 'innerRadius']);

    // Блик на верхней грани
    const gloss = ctx.createLinearGradient(g.cx, g.cy - r, g.cx, g.cy + r);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    gloss.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, r, 0, Math.PI * 2);
    ctx.arc(g.cx, g.cy, ir, Math.PI * 2, 0, true);
    ctx.fillStyle = gloss;
    ctx.fill();

    ctx.restore();
  },
  // Переводим координаты курсора в «плоскую» систему кольца
  beforeEvent(chart, args) {
    const g = get3dGeometry(chart);
    const e = args.event;
    const area = chart.chartArea;
    if (!g || e.x == null || e.x < area.left || e.x > area.right || e.y < area.top || e.y > area.bottom) return;
    e.x = g.cx + (e.x - g.cx) / g.k;
    e.y = g.cy + (e.y - g.cy + g.depth / 2) / g.sy;
  },
};

if (typeof Chart !== 'undefined') {
  // Подсказка: обратно переводим позицию в наклонённую систему
  Chart.Tooltip.positioners.tilted3d = function (elements, eventPosition) {
    const pos = Chart.Tooltip.positioners.average.call(this, elements, eventPosition);
    const g = pos && get3dGeometry(this.chart);
    if (!g) return pos;
    return to3dScreen(g, pos.x, pos.y);
  };
}

function renderCategoriesChart(periodTx) {
  const t = chartTheme();
  const totals = new Map();
  periodTx.filter((tx) => tx.type === 'expense').forEach((tx) => {
    totals.set(tx.categoryId, (totals.get(tx.categoryId) || 0) + tx.amount);
  });
  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  $('#chartCategoriesEmpty').hidden = entries.length > 0;
  $('#chartCategories').parentElement.hidden = entries.length === 0;

  upsertChart('categories', 'chartCategories', {
    type: 'doughnut',
    data: {
      labels: entries.map(([id]) => (Categories.get(id) || { name: 'Без категории' }).name),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map(([id]) => (Categories.get(id) || { color: '#94a3b8' }).color),
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        hoverOffset: 10,
      }],
    },
    plugins: [doughnut3dPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      layout: { padding: 12 },
      // На узких экранах легенда уходит вниз, чтобы кольцо было крупнее
      onResize: (chart, size) => {
        chart.options.plugins.legend.position = size.width < 480 ? 'bottom' : 'right';
      },
      plugins: {
        doughnut3d: { tilt: 0.55, depth: 18 },
        legend: {
          position: $('#chartCategories').parentElement.clientWidth < 480 ? 'bottom' : 'right',
          labels: { color: t.text, boxWidth: 12, boxHeight: 12 },
        },
        tooltip: {
          position: 'tilted3d',
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
              const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
              return ` ${formatMoney(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function renderBalanceChart(period, periodTx) {
  const t = chartTheme();
  let { from, to } = getPeriodRange(period);
  const today = toISODate(new Date());

  if (!from) {
    const dates = state.transactions.map((tx) => tx.date).sort();
    from = dates[0] || today;
    to = dates[dates.length - 1] > today ? dates[dates.length - 1] : today;
  }
  if (to > today && from <= today) to = today;

  const start = parseISODate(from);
  const end = parseISODate(to);
  const spanDays = Math.round((end - start) / 86400000);
  const byMonth = spanDays > 92;

  // Изменения баланса, сгруппированные по дню или месяцу
  const deltas = new Map();
  periodTx.forEach((tx) => {
    const key = byMonth ? tx.date.slice(0, 7) : tx.date;
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    deltas.set(key, (deltas.get(key) || 0) + delta);
  });

  const labels = [];
  const data = [];
  let running = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = byMonth ? toISODate(cursor).slice(0, 7) : toISODate(cursor);
    running += deltas.get(key) || 0;
    labels.push(byMonth
      ? `${MONTHS_SHORT[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`
      : `${cursor.getDate()} ${MONTHS_SHORT[cursor.getMonth()]}`);
    data.push(running);
    if (byMonth) cursor.setMonth(cursor.getMonth() + 1, 1);
    else cursor.setDate(cursor.getDate() + 1);
  }

  const options = baseChartOptions();
  options.plugins.legend.display = false;
  options.scales.y.beginAtZero = false;
  options.scales.x.ticks.maxTicksLimit = 8;

  upsertChart('balance', 'chartBalance', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Баланс',
        data,
        borderColor: t.balance,
        backgroundColor: cssVar('--balance-soft'),
        fill: true,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      }],
    },
    options,
  });
}

/* =====================================================================
   Рендер: Дэшборд
   ===================================================================== */
function renderDashboard() {
  const period = $('#periodSelect').value;
  const range = getPeriodRange(period);
  const periodTx = Transactions.read({ from: range.from, to: range.to });

  const income = sumBy(periodTx, 'income');
  const expense = sumBy(periodTx, 'expense');
  const balance = income - expense;

  // В карточках — сокращённо, полная сумма — во всплывающей подсказке
  const setKpi = (node, value, opts) => {
    node.textContent = formatMoneyShort(value, opts);
    node.title = formatMoney(value, opts);
  };
  setKpi($('#kpiIncome'), income);
  setKpi($('#kpiExpense'), expense);
  const balanceEl = $('#kpiBalance');
  setKpi(balanceEl, balance, { sign: true });
  balanceEl.style.color = balance < 0 ? 'var(--expense)' : 'var(--balance)';

  renderMonthlyChart();
  renderCategoriesChart(periodTx);
  renderBalanceChart(period, periodTx);

  const list = $('#recentList');
  list.replaceChildren();
  const recent = Transactions.read({ sort: 'date-desc' }).slice(0, 5);
  if (!recent.length) {
    list.append(el('li', { class: 'empty' }, 'Пока нет операций — добавьте первую!'));
    return;
  }
  recent.forEach((tx) => list.append(renderRecentItem(tx)));
}

function renderRecentItem(tx) {
  const cat = Categories.get(tx.categoryId) || { name: 'Без категории', color: '#94a3b8' };
  return el('li', {}, [
    el('span', { class: 'dot', style: { background: cat.color } }),
    el('div', { class: 'recent__main' }, [
      el('div', { class: 'recent__title', text: cat.name }),
      el('div', { class: 'recent__sub', text: formatDate(tx.date) + (tx.note ? ` · ${tx.note}` : '') }),
    ]),
    el('span', {
      class: `amount amount--${tx.type}`,
      text: formatMoney(tx.type === 'income' ? tx.amount : -tx.amount, { sign: true }),
    }),
  ]);
}

/* =====================================================================
   Рендер: Аналитика и рекомендации
   ===================================================================== */
const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_PREP = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];

// Категории «необходимого» для правила 50/30/20 (остальные расходы — «желания»)
const NEEDS_CATEGORIES = ['Жильё и коммуналка', 'Продукты', 'Транспорт', 'Здоровье'];
const FIXED_CATEGORIES = ['Жильё и коммуналка'];

const REC_ORDER = { danger: 0, warning: 1, info: 2, good: 3 };
const REC_ICONS = { danger: '🚨', warning: '⚠️', info: '💡', good: '✅' };

let analyticsMonth = null; // 'YYYY-MM', по умолчанию — последний полный месяц

function monthStart(offset) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function monthTx(key) {
  return state.transactions.filter((t) => t.date.startsWith(key));
}

function formatPct(value, digits = 0) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value * 100) + '%';
}

function isNeed(categoryId) {
  const cat = Categories.get(categoryId);
  return !!cat && NEEDS_CATEGORIES.includes(cat.name);
}

function isFixed(categoryId) {
  const cat = Categories.get(categoryId);
  return !!cat && FIXED_CATEGORIES.includes(cat.name);
}

function fillAnalyticsMonths() {
  const select = $('#anMonth');
  select.replaceChildren();
  for (let i = 0; i < 12; i++) {
    const d = monthStart(-i);
    const key = toISODate(d).slice(0, 7);
    const label = `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}${i === 0 ? ' (текущий)' : ''}`;
    select.append(el('option', { value: key }, label));
  }
  if (!analyticsMonth) analyticsMonth = toISODate(monthStart(-1)).slice(0, 7);
  select.value = analyticsMonth;
}

function setKpiText(id, value, sub) {
  $(`#${id}`).textContent = value;
  $(`#${id}Sub`).textContent = sub || '';
}

function renderAnalytics() {
  fillAnalyticsMonths();

  const key = analyticsMonth;
  const [y, m] = key.split('-').map(Number);
  const monthDate = new Date(y, m - 1, 1);
  const now = new Date();
  const currentKey = toISODate(now).slice(0, 7);
  const isCurrent = key === currentKey;
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysPassed = isCurrent ? now.getDate() : daysInMonth;
  const monthName = MONTHS_PREP[monthDate.getMonth()];

  const tx = monthTx(key);
  const income = sumBy(tx, 'income');
  const expense = sumBy(tx, 'expense');

  // База для сравнения — до 3 предыдущих месяцев, в которых есть операции
  const baseline = [1, 2, 3]
    .map((i) => toISODate(new Date(y, m - 1 - i, 1)).slice(0, 7))
    .map(monthTx)
    .filter((list) => list.length);
  const avgOf = (fn) => (baseline.length ? baseline.reduce((s, l) => s + fn(l), 0) / baseline.length : null);
  const avgIncome = avgOf((l) => sumBy(l, 'income'));
  const avgExpense = avgOf((l) => sumBy(l, 'expense'));

  $('#anSubtitle').textContent = isCurrent
    ? `${MONTHS_FULL[monthDate.getMonth()]} ещё не закончился — данные за ${daysPassed} из ${daysInMonth} дней`
    : `Анализ за ${MONTHS_FULL[monthDate.getMonth()].toLowerCase()} ${y} в сравнении со средним за предыдущие месяцы`;

  /* ---------- Ключевые метрики ---------- */
  const savingsRate = income > 0 ? (income - expense) / income : null;
  setKpiText('anSavings',
    savingsRate === null ? '—' : formatPct(savingsRate),
    savingsRate === null ? 'нет доходов за месяц' : `отложено ${formatMoneyShort(Math.max(income - expense, 0))}`);

  const daily = expense / daysPassed;
  const avgDaily = avgExpense !== null ? avgExpense / 30.4 : null;
  setKpiText('anDaily', formatMoneyShort(daily),
    avgDaily ? `в среднем ранее ${formatMoneyShort(avgDaily)}` : '');

  // Прогноз: постоянные траты (аренда и т.п.) берём как есть, переменные — по текущему темпу
  const curTx = monthTx(currentKey).filter((t) => t.type === 'expense');
  const curFixed = curTx.filter((t) => isFixed(t.categoryId)).reduce((s, t) => s + t.amount, 0);
  const curVariable = curTx.reduce((s, t) => s + t.amount, 0) - curFixed;
  const curDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const forecast = curFixed + (curVariable / now.getDate()) * curDays;
  const prevAvgExpense = (() => {
    const lists = [1, 2, 3].map((i) => monthTx(toISODate(monthStart(-i)).slice(0, 7))).filter((l) => l.length);
    return lists.length ? lists.reduce((s, l) => s + sumBy(l, 'expense'), 0) / lists.length : null;
  })();
  setKpiText('anForecast', formatMoneyShort(forecast),
    prevAvgExpense ? `${forecast > prevAvgExpense ? 'выше' : 'ниже'} среднего на ${formatPct(Math.abs(forecast / prevAvgExpense - 1))}` : 'расходы к концу месяца');

  const totalBalance = sumBy(state.transactions, 'income') - sumBy(state.transactions, 'expense');
  const cushionBase = avgExpense || expense;
  const cushionMonths = cushionBase > 0 ? Math.max(totalBalance, 0) / cushionBase : null;
  setKpiText('anCushion',
    cushionMonths === null ? '—' : `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(cushionMonths)} мес.`,
    `накоплено ${formatMoneyShort(totalBalance)}`);

  /* ---------- Расходы по категориям к среднему ---------- */
  const expenseCats = Categories.read('expense');
  const trends = expenseCats.map((c) => {
    const cur = tx.filter((t) => t.type === 'expense' && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0);
    const avg = avgOf((l) => l.filter((t) => t.type === 'expense' && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0));
    // Для незавершённого месяца переменные траты сравниваем с пропорциональной частью среднего
    const avgComparable = avg !== null && isCurrent && !isFixed(c.id) ? avg * (daysPassed / daysInMonth) : avg;
    return { cat: c, cur, avg, avgComparable, change: avgComparable ? cur / avgComparable - 1 : null };
  }).filter((r) => r.cur > 0 || r.avg > 0).sort((a, b) => b.cur - a.cur);

  $('#anColMonth').textContent = MONTHS_FULL[monthDate.getMonth()];
  const body = $('#anTrendBody');
  body.replaceChildren();
  trends.forEach((r) => {
    let badge = el('span', { class: 'badge', text: 'новая' });
    if (r.change !== null) {
      const up = r.change > 0.05;
      const down = r.change < -0.05;
      badge = el('span', {
        class: `badge ${up ? 'badge--up' : down ? 'badge--down' : ''}`,
        text: `${r.change >= 0.005 ? '+' : r.change <= -0.005 ? '−' : ''}${formatPct(Math.abs(r.change))}`,
      });
    }
    body.append(el('tr', {}, [
      el('td', {}, el('span', { class: 'cat-cell' }, [el('span', { class: 'dot', style: { background: r.cat.color } }), r.cat.name])),
      el('td', { class: 'num', text: formatMoneyShort(r.cur) }),
      el('td', { class: 'num', text: r.avg !== null ? formatMoneyShort(r.avg) : '—' }),
      el('td', { class: 'num' }, badge),
    ]));
  });
  $('#anTrendEmpty').hidden = trends.length > 0;

  /* ---------- 50/30/20 ---------- */
  const needs = tx.filter((t) => t.type === 'expense' && isNeed(t.categoryId)).reduce((s, t) => s + t.amount, 0);
  const wants = expense - needs;
  const saved = Math.max(income - expense, 0);
  const parts = [
    { name: 'Необходимое', hint: NEEDS_CATEGORIES.join(', '), value: needs, target: 0.5, color: 'var(--balance)', over: true },
    { name: 'Желания', hint: 'развлечения, покупки и прочее', value: wants, target: 0.3, color: 'var(--warning)', over: true },
    { name: 'Сбережения', hint: 'доходы минус расходы', value: saved, target: 0.2, color: 'var(--income)', over: false },
  ];
  const base = Math.max(income, expense, 1);
  $('#splitBar').replaceChildren(...parts.map((p) => el('span', {
    style: { width: `${(p.value / base) * 100}%`, background: p.color },
    title: `${p.name}: ${formatMoney(p.value)}`,
  })));
  $('#splitLegend').replaceChildren(...parts.map((p) => {
    const share = income > 0 ? p.value / income : null;
    const ok = share === null ? true : (p.over ? share <= p.target : share >= p.target);
    return el('li', {}, [
      el('span', { class: 'dot', style: { background: p.color } }),
      el('span', { class: 'split-legend__name' }, [p.name, el('small', { text: p.hint })]),
      el('span', { class: 'split-legend__value' }, [
        el('span', { class: ok ? '' : 'text-expense', text: share === null ? '—' : formatPct(share) }),
        el('small', { text: `цель ${p.over ? '≤' : '≥'} ${formatPct(p.target)} · ${formatMoneyShort(p.value)}` }),
      ]),
    ]);
  }));

  /* ---------- Рекомендации ---------- */
  const recs = [];
  const add = (level, title, text) => recs.push({ level, title, text });

  if (!state.transactions.length) {
    add('info', 'Добавьте первые операции', 'Рекомендации появятся, когда в трекере будут доходы и расходы хотя бы за один месяц.');
  } else if (!tx.length) {
    add('info', `В ${monthName} нет операций`, 'Выберите другой месяц или добавьте операции за этот период.');
  } else if (isCurrent) {
    // Месяц не завершён: доля от дохода и экономия ещё не показательны,
    // поэтому сравниваем только темп трат с пропорциональным средним
    add('info', 'Месяц ещё не закончился',
      `Выводы предварительные: учтено ${daysPassed} из ${daysInMonth} дней. Полный разбор доступен для прошлых месяцев.`);
    const minDiff = Math.max((avgIncome || income) * 0.02, 50000);
    trends
      .filter((r) => r.change !== null && r.change > 0.25 && r.cur - r.avgComparable > minDiff)
      .sort((a, b) => (b.cur - b.avgComparable) - (a.cur - a.avgComparable))
      .slice(0, 3)
      .forEach((r) => add('warning', `Траты растут быстрее обычного: ${r.cat.name}`,
        `Уже ${formatMoneyShort(r.cur)}, а к этому дню обычно уходит ${formatMoneyShort(r.avgComparable)}. Притормозите траты в этой категории до конца месяца.`));
  } else {
    if (expense > income) {
      add('danger', 'Расходы превышают доходы',
        `В ${monthName} вы потратили на ${formatMoneyShort(expense - income)} больше, чем заработали. Пересмотрите крупные траты ниже и отложите необязательные покупки.`);
    } else if (savingsRate !== null && savingsRate < 0.1) {
      add('warning', 'Низкая норма сбережений',
        `Откладывается лишь ${formatPct(savingsRate)} дохода. Попробуйте сразу после зарплаты переводить 10–20% (${formatMoneyShort(income * 0.1)}–${formatMoneyShort(income * 0.2)}) на отдельный счёт.`);
    } else if (savingsRate !== null && savingsRate < 0.2) {
      add('info', 'Сбережения можно увеличить',
        `Вы откладываете ${formatPct(savingsRate)}. До рекомендуемых 20% не хватает ${formatMoneyShort(income * 0.2 - (income - expense))} в месяц.`);
    } else if (savingsRate !== null) {
      add('good', 'Отличная норма сбережений',
        `Вы сохранили ${formatPct(savingsRate)} дохода (${formatMoneyShort(income - expense)}). Подумайте, как заставить эти деньги работать: депозит или инвестиции.`);
    }

    // Рост и снижение по категориям
    const minDiff = Math.max(income * 0.02, 50000);
    trends
      .filter((r) => r.change !== null && r.change > 0.25 && r.cur - r.avgComparable > minDiff)
      .sort((a, b) => (b.cur - b.avgComparable) - (a.cur - a.avgComparable))
      .slice(0, 3)
      .forEach((r) => add('warning', `Выросли траты: ${r.cat.name}`,
        `${formatMoneyShort(r.cur)} против ${formatMoneyShort(r.avgComparable)} в среднем — на ${formatPct(r.change)} больше. Если рост не разовый, установите себе лимит на эту категорию.`));

    const best = trends
      .filter((r) => r.change !== null && r.change < -0.2 && r.avgComparable - r.cur > minDiff)
      .sort((a, b) => (b.avgComparable - b.cur) - (a.avgComparable - a.cur))[0];
    if (best) {
      add('good', `Удалось сэкономить: ${best.cat.name}`,
        `Траты снизились на ${formatPct(Math.abs(best.change))} — это ${formatMoneyShort(best.avgComparable - best.cur)} экономии. Так держать!`);
    }

    // Структура расходов
    if (income > 0) {
      const housing = tx.filter((t) => t.type === 'expense' && isFixed(t.categoryId)).reduce((s, t) => s + t.amount, 0);
      if (housing / income > 0.35) {
        add('warning', 'Жильё занимает большую долю дохода',
          `${formatPct(housing / income)} дохода уходит на жильё и коммуналку при рекомендуемых 30–35%. Проверьте тарифы или условия аренды.`);
      }
      if (wants / income > 0.3) {
        add('warning', 'Много трат на желания',
          `На необязательные расходы ушло ${formatPct(wants / income)} дохода — больше ориентира в 30% на ${formatMoneyShort(wants - income * 0.3)}.`);
      }
    }

    // Финансовая подушка
    if (cushionMonths !== null) {
      if (cushionMonths < 3) {
        const goal = cushionBase * 3;
        const need = goal - Math.max(totalBalance, 0);
        add('warning', 'Создайте финансовую подушку',
          `Накоплений хватит на ${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(cushionMonths)} мес. Цель — минимум 3 месяца расходов (${formatMoneyShort(goal)}). Откладывая ${formatMoneyShort(need / 12)} в месяц, вы соберёте её за год.`);
      } else if (cushionMonths >= 6) {
        add('good', 'Финансовая подушка сформирована',
          `Накоплений хватит на ${Math.floor(cushionMonths)} мес. расходов. Излишек сверх 6 месяцев можно направить в инвестиции.`);
      } else {
        add('info', 'Подушка безопасности в норме',
          `Запаса хватит на ${Math.floor(cushionMonths)} мес. Чтобы чувствовать себя увереннее, доведите его до 6 месяцев (${formatMoneyShort(cushionBase * 6)}).`);
      }
    }

    // Зависимость от одного источника дохода
    const incomeBySource = new Map();
    tx.filter((t) => t.type === 'income').forEach((t) => incomeBySource.set(t.categoryId, (incomeBySource.get(t.categoryId) || 0) + t.amount));
    const topSource = [...incomeBySource.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topSource && income > 0 && topSource[1] / income >= 0.9) {
      const cat = Categories.get(topSource[0]);
      add('info', 'Доход зависит от одного источника',
        `${formatPct(topSource[1] / income)} дохода — «${cat ? cat.name : 'один источник'}». Дополнительный источник (фриланс, проценты по вкладу) снизит риски.`);
    }

    // Доход относительно среднего
    if (avgIncome && income < avgIncome * 0.8 && !isCurrent) {
      add('warning', 'Доход ниже обычного',
        `В ${monthName} доход на ${formatPct(1 - income / avgIncome)} ниже среднего. Сократите необязательные расходы, пока доход не восстановится.`);
    }
  }

  // Прогноз текущего месяца — актуален всегда
  if (prevAvgExpense && forecast > prevAvgExpense * 1.1 && curTx.length) {
    add('warning', 'Текущий месяц идёт дороже обычного',
      `При текущем темпе расходы составят ~${formatMoneyShort(forecast)}, что на ${formatMoneyShort(forecast - prevAvgExpense)} больше среднего. До конца месяца стоит тратить не более ${formatMoneyShort(Math.max(prevAvgExpense - curTx.reduce((s, t) => s + t.amount, 0), 0) / Math.max(curDays - now.getDate(), 1))} в день.`);
  }

  recs.sort((a, b) => REC_ORDER[a.level] - REC_ORDER[b.level]);
  $('#recList').replaceChildren(...recs.map((r) => el('li', { class: `rec rec--${r.level}` }, [
    el('span', { class: 'rec__icon', text: REC_ICONS[r.level] }),
    el('div', {}, [el('div', { class: 'rec__title', text: r.title }), el('div', { class: 'rec__text', text: r.text })]),
  ])));
}

/* =====================================================================
   Рендер: Операции
   ===================================================================== */
function readFilters() {
  return {
    type: $('#fType').value,
    categoryId: $('#fCategory').value,
    from: $('#fFrom').value || null,
    to: $('#fTo').value || null,
    search: $('#fSearch').value.trim(),
    sort: $('#fSort').value,
  };
}

function fillCategoryFilter() {
  const select = $('#fCategory');
  const current = select.value;
  select.replaceChildren(el('option', { value: 'all' }, 'Все категории'));
  [['income', 'Доходы'], ['expense', 'Расходы']].forEach(([type, label]) => {
    const group = el('optgroup', { label });
    Categories.read(type).forEach((c) => group.append(el('option', { value: c.id }, c.name)));
    select.append(group);
  });
  select.value = Categories.get(current) ? current : 'all';
}

function renderTransactions() {
  fillCategoryFilter();
  const list = Transactions.read(readFilters());
  const body = $('#txBody');
  body.replaceChildren();

  list.forEach((tx) => {
    const cat = Categories.get(tx.categoryId) || { name: 'Без категории', color: '#94a3b8' };
    body.append(el('tr', {}, [
      el('td', { text: formatDate(tx.date) }),
      el('td', {}, el('span', { class: 'cat-cell' }, [
        el('span', { class: 'dot', style: { background: cat.color } }),
        cat.name,
      ])),
      el('td', { class: 'note', text: tx.note || '—', title: tx.note }),
      el('td', {
        class: `num amount amount--${tx.type}`,
        text: formatMoney(tx.type === 'income' ? tx.amount : -tx.amount, { sign: true }),
      }),
      el('td', { class: 'actions' }, [
        el('button', { class: 'icon-btn', title: 'Изменить', 'aria-label': 'Изменить', dataset: { action: 'edit-tx', id: tx.id } }, '✎'),
        el('button', { class: 'icon-btn icon-btn--danger', title: 'Удалить', 'aria-label': 'Удалить', dataset: { action: 'delete-tx', id: tx.id } }, '🗑'),
      ]),
    ]));
  });

  $('#txEmpty').hidden = list.length > 0;

  const income = sumBy(list, 'income');
  const expense = sumBy(list, 'expense');
  const foot = $('#txTotal');
  foot.replaceChildren(
    el('span', {}, ['Операций: ', el('b', { text: String(list.length) })]),
    el('span', {}, ['Доходы: ', el('b', { class: 'text-income', text: formatMoney(income) })]),
    el('span', {}, ['Расходы: ', el('b', { class: 'text-expense', text: formatMoney(expense) })]),
    el('span', {}, ['Итог: ', el('b', { text: formatMoney(income - expense, { sign: true }) })]),
  );
}

/* =====================================================================
   Рендер: Категории
   ===================================================================== */
function renderCategories() {
  [['income', '#catListIncome'], ['expense', '#catListExpense']].forEach(([type, sel]) => {
    const list = $(sel);
    list.replaceChildren();
    const cats = Categories.read(type);
    if (!cats.length) list.append(el('li', { class: 'empty' }, 'Нет категорий'));
    cats.forEach((c) => {
      const count = Categories.usageCount(c.id);
      list.append(el('li', {}, [
        el('span', { class: 'dot', style: { background: c.color } }),
        el('span', { class: 'cat-list__name', text: c.name }),
        el('span', { class: 'cat-list__count', text: `${count} опер.` }),
        el('button', { class: 'icon-btn', title: 'Изменить', 'aria-label': 'Изменить', dataset: { action: 'edit-cat', id: c.id } }, '✎'),
        el('button', { class: 'icon-btn icon-btn--danger', title: 'Удалить', 'aria-label': 'Удалить', dataset: { action: 'delete-cat', id: c.id } }, '🗑'),
      ]));
    });
  });
}

function resetCategoryForm() {
  $('#catForm').reset();
  $('#catId').value = '';
  $('#catColor').value = '#6366f1';
  $('#catSubmit').textContent = 'Добавить';
  $('#catCancel').hidden = true;
  $('#catType').disabled = false;
}

/* =====================================================================
   Рендер: Настройки
   ===================================================================== */
function renderSettings() {
  const select = $('#currencySelect');
  if (!select.options.length) {
    Object.entries(CURRENCIES).forEach(([code, c]) => select.append(el('option', { value: code }, c.label)));
  }
  select.value = state.settings.currency;
}

/* =====================================================================
   Навигация и общий рендер
   ===================================================================== */
const TABS = ['dashboard', 'analytics', 'transactions', 'categories', 'settings'];

function currentTab() {
  const hash = location.hash.slice(1);
  return TABS.includes(hash) ? hash : 'dashboard';
}

function render() {
  const tab = currentTab();
  TABS.forEach((name) => { $(`#tab-${name}`).hidden = name !== tab; });
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  $('#txCurrencyLabel').textContent = CURRENCIES[state.settings.currency].symbol;

  if (tab === 'dashboard') renderDashboard();
  if (tab === 'analytics') renderAnalytics();
  if (tab === 'transactions') renderTransactions();
  if (tab === 'categories') renderCategories();
  if (tab === 'settings') renderSettings();
}

/** Переключение вкладок с плавной анимацией */
let shownTab = null;
function switchTab() {
  const next = currentTab();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (shownTab === null || shownTab === next || reduceMotion) {
    shownTab = next;
    render();
    return;
  }
  shownTab = next;
  const update = () => {
    render();
    window.scrollTo(0, 0);
  };
  if (document.startViewTransition) {
    // При быстром переключении браузер прерывает предыдущий переход — это нормально
    const transition = document.startViewTransition(update);
    transition.ready.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
    transition.finished.catch(() => {});
  } else {
    update();
    const section = $(`#tab-${next}`);
    section.classList.remove('tab--enter');
    void section.offsetWidth; // перезапуск анимации
    section.classList.add('tab--enter');
  }
}

/* =====================================================================
   Модальное окно операции (create / update)
   ===================================================================== */
const modal = $('#txModal');
const form = $('#txForm');

function getFormType() {
  return form.querySelector('input[name="txType"]:checked').value;
}

function fillTxCategories(type, selectedId) {
  const select = $('#txCategory');
  select.replaceChildren();
  Categories.read(type).forEach((c) => select.append(el('option', { value: c.id }, c.name)));
  if (selectedId && Categories.get(selectedId)) select.value = selectedId;
}

function clearErrors() {
  form.querySelectorAll('.error').forEach((e) => { e.textContent = ''; });
  form.querySelectorAll('.invalid').forEach((e) => e.classList.remove('invalid'));
}

function openTxModal(id) {
  clearErrors();
  form.reset();
  const tx = id ? Transactions.get(id) : null;
  const type = tx ? tx.type : 'expense';

  $('#txModalTitle').textContent = tx ? 'Редактировать операцию' : 'Новая операция';
  $('#txId').value = tx ? tx.id : '';
  form.querySelector(`input[name="txType"][value="${type}"]`).checked = true;
  fillTxCategories(type, tx && tx.categoryId);
  $('#txAmount').value = tx ? tx.amount : '';
  $('#txDate').value = tx ? tx.date : toISODate(new Date());
  $('#txNote').value = tx ? tx.note : '';

  modal.hidden = false;
  setTimeout(() => $('#txAmount').focus(), 50);
}

function closeTxModal() {
  modal.hidden = true;
}

function showError(field, inputSel, message) {
  form.querySelector(`[data-error="${field}"]`).textContent = message;
  $(inputSel).classList.add('invalid');
}

function handleTxSubmit(e) {
  e.preventDefault();
  clearErrors();

  const data = {
    type: getFormType(),
    amount: Number($('#txAmount').value),
    categoryId: $('#txCategory').value,
    date: $('#txDate').value,
    note: $('#txNote').value.trim(),
  };

  let valid = true;
  if (!data.amount || !Number.isFinite(data.amount) || data.amount <= 0) {
    showError('amount', '#txAmount', 'Введите сумму больше нуля');
    valid = false;
  }
  if (!data.categoryId || !Categories.get(data.categoryId)) {
    showError('category', '#txCategory', 'Выберите категорию');
    valid = false;
  }
  if (!data.date) {
    showError('date', '#txDate', 'Укажите дату');
    valid = false;
  }
  if (!valid) return;

  const id = $('#txId').value;
  if (id) {
    Transactions.update(id, data);
    toast('Операция обновлена');
  } else {
    Transactions.create(data);
    toast('Операция добавлена');
  }
  closeTxModal();
}

/* =====================================================================
   Обработчики событий
   ===================================================================== */
function bindEvents() {
  window.addEventListener('hashchange', switchTab);

  // Делегирование кликов по кнопкам действий
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;

    if (action === 'add-transaction') openTxModal();

    if (action === 'edit-tx') openTxModal(id);

    if (action === 'delete-tx' && confirm('Удалить эту операцию?')) {
      Transactions.delete(id);
      toast('Операция удалена');
    }

    if (action === 'edit-cat') {
      const c = Categories.get(id);
      if (!c) return;
      $('#catId').value = c.id;
      $('#catName').value = c.name;
      $('#catType').value = c.type;
      $('#catType').disabled = true;
      $('#catColor').value = c.color;
      $('#catSubmit').textContent = 'Сохранить';
      $('#catCancel').hidden = false;
      $('#catName').focus();
    }

    if (action === 'delete-cat') {
      const c = Categories.get(id);
      if (!c) return;
      const count = Categories.usageCount(id);
      const msg = count
        ? `Удалить категорию «${c.name}»? ${count} опер. будут перенесены в «Прочее».`
        : `Удалить категорию «${c.name}»?`;
      if (!confirm(msg)) return;
      const res = Categories.delete(id);
      toast(res.ok ? 'Категория удалена' : res.reason);
      if (res.ok && $('#catId').value === id) resetCategoryForm();
    }
  });

  // Модалка
  form.addEventListener('submit', handleTxSubmit);
  modal.querySelectorAll('[data-close]').forEach((n) => n.addEventListener('click', closeTxModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeTxModal();
  });
  form.querySelectorAll('input[name="txType"]').forEach((r) => {
    r.addEventListener('change', () => fillTxCategories(getFormType()));
  });

  // Дэшборд
  $('#periodSelect').addEventListener('change', renderDashboard);

  // Аналитика
  $('#anMonth').addEventListener('change', (e) => {
    analyticsMonth = e.target.value;
    renderAnalytics();
  });

  // Фильтры операций
  ['#fType', '#fCategory', '#fFrom', '#fTo', '#fSort'].forEach((sel) => {
    $(sel).addEventListener('change', renderTransactions);
  });
  $('#fSearch').addEventListener('input', renderTransactions);
  $('#fReset').addEventListener('click', () => {
    $('#fType').value = 'all';
    $('#fCategory').value = 'all';
    $('#fFrom').value = '';
    $('#fTo').value = '';
    $('#fSearch').value = '';
    $('#fSort').value = 'date-desc';
    renderTransactions();
  });

  // Категории: create / update
  $('#catForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#catName').value.trim();
    if (!name) return;
    const id = $('#catId').value;
    const type = $('#catType').value;
    const duplicate = state.categories.some((c) => c.type === type && c.id !== id && c.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      toast('Такая категория уже есть');
      return;
    }
    if (id) {
      Categories.update(id, { name, color: $('#catColor').value });
      toast('Категория обновлена');
    } else {
      Categories.create({ name, type, color: $('#catColor').value });
      toast('Категория добавлена');
    }
    resetCategoryForm();
  });
  $('#catCancel').addEventListener('click', resetCategoryForm);

  // Настройки
  $('#currencySelect').addEventListener('change', (e) => {
    Settings.update({ currency: e.target.value });
    toast(`Валюта: ${CURRENCIES[e.target.value].label}`);
  });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `finance-backup-${toISODate(new Date())}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  $('#importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (!confirm('Импорт заменит все текущие данные. Продолжить?')) return;
        Settings.importData(JSON.parse(reader.result));
        toast('Данные импортированы');
      } catch (err) {
        toast('Ошибка импорта: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  });

  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Удалить все операции, категории и настройки? Это действие необратимо.')) {
      Settings.resetAll();
      toast('Все данные удалены');
    }
  });

  // Перерисовка графиков при смене светлой/тёмной темы
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
}

/* =====================================================================
   Кастомный выпадающий список
   Нативный <select> остаётся в DOM (скрытым) и хранит значение — весь
   остальной код работает с ним как раньше. Поверх рисуется своя кнопка
   и «стеклянная» панель с вариантами.
   ===================================================================== */
const selectValueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
let openSelectState = null;

function enhanceSelect(select) {
  if (select.dataset.enhanced) return;
  select.dataset.enhanced = '1';

  const wrap = el('div', { class: 'cselect' });
  const btn = el('button', {
    type: 'button',
    class: 'input cselect__btn',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
  });
  if (select.getAttribute('aria-label')) btn.setAttribute('aria-label', select.getAttribute('aria-label'));
  select.before(wrap);
  wrap.append(btn, select);
  select.classList.add('cselect__native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const update = () => {
    const options = [...select.options];
    const current = select.options[select.selectedIndex];
    // Невидимые «распорки» со всеми вариантами задают ширину кнопки, как у нативного списка
    btn.replaceChildren(
      el('span', { class: 'cselect__value' }, [
        ...options.map((o) => el('span', { class: 'cselect__sizer', text: o.textContent })),
        el('span', { class: 'cselect__label', text: current ? current.textContent : '' }),
      ]),
      el('span', { class: 'cselect__chevron' }),
    );
    btn.disabled = select.disabled;
    btn.classList.toggle('invalid', select.classList.contains('invalid'));
    if (openSelectState && openSelectState.select === select) renderSelectPanel();
  };
  select._csUpdate = update;
  select._csButton = btn;

  // Программная установка select.value тоже обновляет кнопку
  Object.defineProperty(select, 'value', {
    configurable: true,
    get() { return selectValueDescriptor.get.call(this); },
    set(v) { selectValueDescriptor.set.call(this, v); update(); },
  });

  new MutationObserver(update).observe(select, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'class', 'label'],
  });
  select.addEventListener('change', update);
  if (select.form) select.form.addEventListener('reset', () => setTimeout(update));

  btn.addEventListener('click', () => {
    if (openSelectState && openSelectState.select === select) closeSelect();
    else openSelect(select);
  });
  btn.addEventListener('keydown', (e) => handleSelectKeys(e, select));

  update();
}

function openSelect(select) {
  closeSelect();
  const btn = select._csButton;
  const panel = el('div', { class: 'cselect__panel', role: 'listbox', style: { top: '0px', left: '0px' } });
  openSelectState = { select, btn, panel, active: Math.max(select.selectedIndex, 0) };
  document.body.append(panel);
  renderSelectPanel();
  positionSelectPanel();
  btn.classList.add('is-open');
  btn.setAttribute('aria-expanded', 'true');
}

function renderSelectPanel() {
  const { select, panel } = openSelectState;
  const items = [];
  const makeOption = (option) => {
    const index = [...select.options].indexOf(option);
    const item = el('div', {
      class: `cselect__option${index === select.selectedIndex ? ' is-selected' : ''}`,
      role: 'option',
      'aria-selected': String(index === select.selectedIndex),
    }, [el('span', { text: option.textContent }), el('span', { class: 'cselect__check', text: '✓' })]);
    item.addEventListener('click', () => chooseSelectOption(index));
    item.addEventListener('mousemove', () => setActiveOption(index));
    items[index] = item;
    return item;
  };
  panel.replaceChildren(...[...select.children].flatMap((child) => (child.tagName === 'OPTGROUP'
    ? [el('div', { class: 'cselect__group', text: child.label }), ...[...child.children].map(makeOption)]
    : [makeOption(child)])));
  openSelectState.items = items;
  setActiveOption(openSelectState.active, true);
}

function positionSelectPanel() {
  const { btn, panel } = openSelectState;
  const rect = btn.getBoundingClientRect();
  panel.style.minWidth = `${rect.width}px`;
  const height = Math.min(panel.scrollHeight, 300);
  const below = window.innerHeight - rect.bottom - 8;
  const up = below < height && rect.top > below;
  panel.classList.toggle('is-up', up);
  panel.style.top = `${up ? rect.top - height - 6 : rect.bottom + 6}px`;
  panel.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - panel.offsetWidth - 8))}px`;
}

function setActiveOption(index, scroll) {
  const state = openSelectState;
  if (!state || !state.items[index]) return;
  state.items.forEach((item, i) => item && item.classList.toggle('is-active', i === index));
  state.active = index;
  // Прокручиваем только саму панель (scrollIntoView сдвинул бы и страницу)
  if (scroll) {
    const item = state.items[index];
    const { panel } = state;
    if (item.offsetTop < panel.scrollTop) panel.scrollTop = item.offsetTop - 6;
    else if (item.offsetTop + item.offsetHeight > panel.scrollTop + panel.clientHeight) {
      panel.scrollTop = item.offsetTop + item.offsetHeight - panel.clientHeight + 6;
    }
  }
}

function chooseSelectOption(index) {
  const { select, btn } = openSelectState;
  closeSelect();
  btn.focus();
  if (select.selectedIndex === index) return;
  select.selectedIndex = index;
  select._csUpdate();
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function closeSelect() {
  if (!openSelectState) return;
  const { btn, panel } = openSelectState;
  panel.remove();
  btn.classList.remove('is-open');
  btn.setAttribute('aria-expanded', 'false');
  openSelectState = null;
}

function handleSelectKeys(e, select) {
  const isOpen = openSelectState && openSelectState.select === select;
  const count = select.options.length;
  if (!isOpen) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openSelect(select);
    }
    return;
  }
  const { active } = openSelectState;
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); setActiveOption(Math.min(active + 1, count - 1), true); break;
    case 'ArrowUp': e.preventDefault(); setActiveOption(Math.max(active - 1, 0), true); break;
    case 'Home': e.preventDefault(); setActiveOption(0, true); break;
    case 'End': e.preventDefault(); setActiveOption(count - 1, true); break;
    case 'Enter':
    case ' ': e.preventDefault(); chooseSelectOption(active); break;
    case 'Escape': e.preventDefault(); e.stopPropagation(); closeSelect(); break;
    case 'Tab': closeSelect(); break;
    default: {
      // Быстрый переход по первой букве
      if (e.key.length === 1) {
        const letter = e.key.toLowerCase();
        const options = [...select.options];
        const next = options.findIndex((o, i) => i > active && o.textContent.toLowerCase().startsWith(letter));
        const found = next !== -1 ? next : options.findIndex((o) => o.textContent.toLowerCase().startsWith(letter));
        if (found !== -1) setActiveOption(found, true);
      }
    }
  }
}

function initCustomSelects() {
  $$('select.input').forEach(enhanceSelect);
  document.addEventListener('mousedown', (e) => {
    if (!openSelectState) return;
    if (openSelectState.panel.contains(e.target) || openSelectState.btn.contains(e.target)) return;
    closeSelect();
  });
  // При прокрутке и изменении размера окна панель следует за кнопкой
  const follow = (e) => {
    if (!openSelectState || (e && openSelectState.panel.contains(e.target))) return;
    const rect = openSelectState.btn.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) closeSelect();
    else positionSelectPanel();
  };
  window.addEventListener('resize', follow);
  document.addEventListener('scroll', follow, true);
  window.addEventListener('hashchange', closeSelect);
}

/* =====================================================================
   Старт
   ===================================================================== */
if (typeof Chart === 'undefined') {
  console.warn('Chart.js не загружен — графики недоступны (нет интернета?)');
}
Storage.save(state);
initCustomSelects();
bindEvents();
switchTab();
