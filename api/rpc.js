// AMX Case — backend (função serverless da Vercel) + banco Neon (Postgres).
//
// Todas as chamadas do app chegam aqui: POST /api/rpc com { action, ...params }.
// Regras de segurança (valem no servidor, não dependem do navegador):
//   - senhas guardadas com hash scrypt (nunca em texto puro);
//   - sessão em cookie HttpOnly assinado (o JavaScript do navegador não lê);
//   - o servidor confere quem é o usuário e o papel (admin/vendedor) em TODA chamada;
//   - vendedor nunca recebe custo, lucro, fornecedor nem vendas de outros;
//   - preços e estoque vêm sempre do banco (o navegador não manda valores);
//   - limite de tentativas de login e da senha de desconto;
//   - a venda baixa o estoque dentro de uma transação (nunca fica negativo).
//
// O banco é configurado por variável de ambiente (DATABASE_URL, criada pela
// integração Neon da Vercel). A chave do banco nunca vai para o navegador.
import { neon } from "@neondatabase/serverless";
import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const TZ = "America/Sao_Paulo";
const COOKIE = "amx_session";
const SESSION_DAYS = 14;
const DISCOUNT_LIMIT = 20;
const ATTEMPT_WINDOW_MIN = 15;
const PAYMENTS = ["Dinheiro", "PIX", "Débito", "Crédito", "Outros"];
const CATEGORIES = ["Capa", "Película", "Cabo", "Carregador", "Fone", "Suporte", "Adaptador", "Acessório"];
const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// ───────────────────────── erros e validação ─────────────────────────

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code, message) => new HttpError(status, code, message);
const bad = (message) => fail(400, "BAD_REQUEST", message);

function str(v, { min = 0, max = 200, field = "Campo" } = {}) {
  if (typeof v !== "string") throw bad(`${field} inválido.`);
  const s = v.trim();
  if (s.length < min) throw bad(`${field} é obrigatório.`);
  if (s.length > max) throw bad(`${field} é muito longo.`);
  return s;
}
function optStr(v, opts) {
  return v === undefined || v === null ? "" : str(v, opts);
}
function int(v, { min = 0, max = 1000000, field = "Valor" } = {}) {
  const n = Number(v);
  if (v === "" || v === null || !Number.isInteger(n) || n < min || n > max) throw bad(`${field} inválido.`);
  return n;
}
function money(v, field = "Valor") {
  const n = Number(v);
  if (v === "" || v === null || !Number.isFinite(n) || n < 0 || n > 10000000) throw bad(`${field} inválido.`);
  return Math.round(n * 100) / 100;
}
function isoDate(v, field = "Data") {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw bad(`${field} inválida.`);
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw bad(`${field} inválida.`);
  return v;
}
function oneOf(v, list, field) {
  if (typeof v !== "string" || !list.includes(v)) throw bad(`${field} inválido.`);
  return v;
}
const idOf = (v) => str(v, { min: 1, max: 100, field: "Identificador" });
function password(v, field = "Senha") {
  if (typeof v !== "string") throw bad(`${field} inválida.`);
  if (v.length < 6) throw bad(`${field} deve ter pelo menos 6 caracteres.`);
  if (v.length > 100) throw bad(`${field} é muito longa.`);
  return v;
}
function username(v) {
  const s = str(v, { min: 3, max: 40, field: "Usuário" });
  if (!/^[A-Za-z0-9._-]+$/.test(s)) throw bad("Usuário deve ter só letras, números, ponto, hífen ou sublinhado (sem espaços).");
  return s;
}

const num = (v) => Number(v);
const round2 = (n) => Math.round(n * 100) / 100;

// ───────────────────────── datas (horário de Brasília) ─────────────────────────

function nowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const g = (t) => (parts.find((p) => p.type === t) || {}).value || "";
  return { iso: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}` };
}
function isoToBR(iso) {
  const [y, m, d] = String(iso).split("-");
  return `${d}/${m}/${y}`;
}
function weekdayOf(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
function daysBetween(fromIso, toIso) {
  const a = fromIso.split("-").map(Number);
  const b = toIso.split("-").map(Number);
  const diff = Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2]);
  return Math.max(0, Math.round(diff / 86400000));
}

// ───────────────────────── banco de dados ─────────────────────────

function dbUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || "";
}
let _sql = null;
function db() {
  if (_sql) return _sql;
  const url = dbUrl();
  if (!url) throw fail(500, "DB_NOT_CONFIGURED", "Banco de dados não configurado. Conecte o Neon ao projeto na Vercel (variável DATABASE_URL).");
  _sql = neon(url);
  return _sql;
}
const SCHEMA = [
  `create table if not exists amx_users (
    id text primary key,
    name text not null,
    username text not null,
    password_hash text not null,
    role text not null check (role in ('admin','vendedor')),
    status text not null default 'Ativo' check (status in ('Ativo','Inativo')),
    must_change_password boolean not null default false,
    session_version integer not null default 1,
    created_at text not null,
    created_ts timestamptz not null default now()
  )`,
  `create unique index if not exists amx_users_username_key on amx_users (lower(username))`,
  `create table if not exists amx_products (
    id text primary key,
    name text not null,
    sku text not null,
    category text not null,
    brand text not null default '',
    compatibility text not null default '',
    description text not null default '',
    cost numeric(12,2) not null default 0,
    price numeric(12,2) not null default 0,
    stock integer not null default 0 check (stock >= 0),
    min_stock integer not null default 0,
    ideal_stock integer not null default 0,
    supplier text not null default '',
    entry_date text,
    last_entry text,
    last_sale text,
    total_bought integer not null default 0,
    total_sold integer not null default 0,
    status text not null default 'Ativo',
    exclude_from_rotation boolean not null default false,
    created_ts timestamptz not null default now()
  )`,
  `create unique index if not exists amx_products_sku_key on amx_products (lower(sku))`,
  `create table if not exists amx_sales (
    id text primary key,
    created_ts timestamptz not null default now(),
    sale_date text not null,
    sale_time text not null,
    seller_id text not null references amx_users(id) on delete restrict,
    seller_name text not null,
    product_id text not null references amx_products(id) on delete restrict,
    product_name text not null,
    product_sku text not null,
    category text not null,
    quantity integer not null check (quantity > 0),
    original_price numeric(12,2) not null,
    discount numeric(12,2) not null default 0,
    final_price numeric(12,2) not null,
    cost numeric(12,2) not null,
    profit numeric(12,2) not null,
    payment_method text not null,
    status text not null default 'Concluída'
  )`,
  `create index if not exists amx_sales_seller_idx on amx_sales (seller_id)`,
  `create index if not exists amx_sales_date_idx on amx_sales (sale_date)`,
  `create table if not exists amx_stock_movements (
    id text primary key,
    created_ts timestamptz not null default now(),
    move_date text not null,
    move_time text not null,
    type text not null,
    product_id text not null references amx_products(id) on delete cascade,
    product_name text not null,
    quantity integer not null,
    value numeric(12,2) not null default 0,
    user_id text not null,
    user_name text not null,
    notes text,
    sale_id text
  )`,
  `create index if not exists amx_movements_sale_idx on amx_stock_movements (sale_id)`,
  `create table if not exists amx_settings (
    key text primary key,
    value text not null
  )`,
  `create table if not exists amx_login_attempts (
    id text primary key,
    username text not null,
    ip text not null default '',
    created_ts text not null
  )`,
  `create index if not exists amx_login_attempts_user_idx on amx_login_attempts (username, created_ts)`,
];

// Marca em qual etapa um erro aconteceu (aparece na referência do erro, para diagnóstico).
async function at(stage, promise) {
  try {
    return await promise;
  } catch (e) {
    if (e && typeof e === "object" && !e.stage) e.stage = stage;
    throw e;
  }
}

let schemaReady = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = db();
      // Só cria as tabelas se ainda não existirem (confere o último item criado).
      const probe = await at("verificar", sql`select to_regclass('public.amx_login_attempts_user_idx')::text as t`);
      if (!probe[0] || !probe[0].t) {
        for (let i = 0; i < SCHEMA.length; i++) await at(`criar-${i + 1}`, sql.query(SCHEMA[i], []));
      }
      // Primeiro acesso: cria o administrador inicial (precisa trocar a senha no primeiro login).
      const [{ n }] = await at("contar-usuarios", sql`select count(*) as n from amx_users`);
      if (Number(n) === 0) {
        const hash = await hashPassword("admin");
        try {
          await at("criar-admin", sql`insert into amx_users (id, name, username, password_hash, role, status, must_change_password, session_version, created_at)
                    values (${"u-" + randomUUID()}, ${"Elias"}, ${"Elias"}, ${hash}, ${"admin"}, ${"Ativo"}, true, 1, ${nowParts().iso})`);
        } catch (e) {
          if (!e || e.code !== "23505") throw e; // outra instância já criou
        }
      }
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

// Executa várias consultas como uma transação (tudo ou nada) e traduz erros do banco.
async function runTx(sql, queries, msgs = {}) {
  try {
    return await sql.transaction(queries);
  } catch (e) {
    const code = e && e.code;
    if (code === "23514") throw fail(409, "STOCK", msgs.check || "Estoque insuficiente. Atualize a tela e tente de novo.");
    if (code === "23505") throw fail(409, "DUPLICATE", msgs.unique || "Já existe um registro com esses dados.");
    if (code === "23503") throw fail(409, "IN_USE", msgs.fk || "Este registro está em uso e não pode ser removido.");
    throw e;
  }
}

// ───────────────────────── senhas e sessão ─────────────────────────

async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}
async function verifyPassword(pw, stored) {
  const [alg, saltHex, hashHex] = String(stored || "").split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const key = await scrypt(pw, Buffer.from(saltHex, "hex"), expected.length);
  return key.length === expected.length && timingSafeEqual(key, expected);
}
let _dummyHash = null;
async function dummyHash() {
  if (!_dummyHash) _dummyHash = await hashPassword(randomBytes(8).toString("hex"));
  return _dummyHash;
}

function secretKey() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  return createHash("sha256").update(`amx-session-v1:${dbUrl()}`).digest("hex");
}
const b64u = (buf) => Buffer.from(buf).toString("base64url");
function signToken(payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = b64u(createHmac("sha256", secretKey()).update(body).digest());
  return `${body}.${sig}`;
}
function verifyToken(token) {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secretKey()).update(body).digest();
  let given;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload || typeof payload.u !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
function readCookie(req, name) {
  const header = String(req.headers.cookie || "");
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}
function setSessionCookie(req, res, token, maxAgeSeconds) {
  const host = String(req.headers.host || "");
  const secure = !/^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? "; Secure" : ""}`);
}
function issueSession(req, res, user) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  setSessionCookie(req, res, signToken({ u: user.id, v: user.session_version, exp }), SESSION_DAYS * 86400);
}
function clientIp(req) {
  const h = req.headers;
  const first = String(h["x-real-ip"] || String(h["x-forwarded-for"] || "").split(",")[0] || "").trim();
  return first || (req.socket && req.socket.remoteAddress) || "";
}

// Limite de tentativas (login e senha de desconto): bloqueia por 15 minutos.
async function attemptsInWindow(sql, key) {
  const cutoff = new Date(Date.now() - ATTEMPT_WINDOW_MIN * 60000).toISOString();
  const [{ n }] = await sql`select count(*) as n from amx_login_attempts where username = ${key} and created_ts > ${cutoff}`;
  return Number(n);
}
async function recordAttempt(sql, key, ip) {
  await sql`insert into amx_login_attempts (id, username, ip, created_ts) values (${randomUUID()}, ${key}, ${ip}, ${new Date().toISOString()})`;
}
async function clearAttempts(sql, key) {
  await sql`delete from amx_login_attempts where username = ${key}`;
}

async function authenticate(ctx) {
  const payload = verifyToken(readCookie(ctx.req, COOKIE));
  if (!payload) return null;
  const rows = await ctx.sql`select * from amx_users where id = ${payload.u}`;
  const u = rows[0];
  if (!u || u.status !== "Ativo" || Number(u.session_version) !== Number(payload.v)) return null;
  return u;
}

// ───────────────────────── conversão banco → app ─────────────────────────

const authUser = (u) => ({
  id: u.id, name: u.name, username: u.username, role: u.role, status: u.status,
  createdAt: u.created_at, mustChangePassword: !!u.must_change_password,
});
const publicUser = (u) => ({ id: u.id, name: u.name, username: u.username, role: u.role, status: u.status, createdAt: u.created_at });

function mapProduct(r, admin, today) {
  const base = r.last_sale || r.entry_date || "";
  return {
    id: r.id, sku: r.sku, name: r.name, category: r.category, brand: r.brand, compatibility: r.compatibility, description: r.description,
    cost: admin ? num(r.cost) : 0, price: num(r.price), stock: num(r.stock), minStock: num(r.min_stock), idealStock: num(r.ideal_stock),
    supplier: admin ? r.supplier : "", entryDate: r.entry_date || "", lastEntry: r.last_entry || undefined, lastSale: r.last_sale || undefined,
    totalBought: num(r.total_bought), totalSold: num(r.total_sold), daysSinceLastSale: base ? daysBetween(base, today) : 0,
    status: r.status, excludeFromRotation: !!r.exclude_from_rotation,
  };
}
function mapSale(r, admin) {
  return {
    id: r.id, date: isoToBR(r.sale_date), time: r.sale_time, weekday: weekdayOf(r.sale_date),
    sellerId: r.seller_id, sellerName: r.seller_name, productId: r.product_id, productName: r.product_name, productSku: r.product_sku,
    category: r.category, quantity: num(r.quantity), originalPrice: num(r.original_price), discount: num(r.discount), finalPrice: num(r.final_price),
    cost: admin ? num(r.cost) : 0, profit: admin ? num(r.profit) : 0, paymentMethod: r.payment_method, status: r.status,
  };
}
const mapMovement = (r) => ({
  id: r.id, date: r.move_date, time: r.move_time, weekday: weekdayOf(r.move_date), type: r.type, productId: r.product_id, productName: r.product_name,
  quantity: num(r.quantity), value: num(r.value), userId: r.user_id, userName: r.user_name, notes: r.notes || undefined,
});

async function discountHash(sql) {
  const rows = await sql`select value from amx_settings where key = ${"discount_password_hash"}`;
  return rows[0] ? rows[0].value : "";
}

// ───────────────────────── ações: sessão ─────────────────────────

async function actLogin(ctx, p) {
  const { sql, req, res } = ctx;
  const uname = str(p.username, { min: 1, max: 60, field: "Usuário" }).toLowerCase();
  const pw = typeof p.password === "string" ? p.password : "";
  if (!pw || pw.length > 200) throw bad("Informe usuário e senha.");
  const ip = clientIp(req);
  const key = `login:${uname}`;
  if ((await at("login-tentativas", attemptsInWindow(sql, key))) >= 8) throw fail(429, "TOO_MANY", "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  const rows = await at("login-usuario", sql`select * from amx_users where lower(username) = ${uname}`);
  const u = rows[0];
  const ok = await verifyPassword(pw, u ? u.password_hash : await dummyHash());
  if (!u || !ok || u.status !== "Ativo") {
    await recordAttempt(sql, key, ip);
    throw fail(401, "BAD_CREDENTIALS", "Usuário ou senha inválidos.");
  }
  await clearAttempts(sql, key);
  issueSession(req, res, u);
  return { user: authUser(u) };
}

async function actLogout(ctx) {
  setSessionCookie(ctx.req, ctx.res, "", 0);
  return {};
}

async function actMe(ctx) {
  return { user: authUser(ctx.user) };
}

async function actChangePassword(ctx, p) {
  const { sql, user, req, res } = ctx;
  const current = typeof p.currentPassword === "string" ? p.currentPassword : "";
  const next = password(p.newPassword, "Nova senha");
  const key = `pwd:${user.id}`;
  if ((await attemptsInWindow(sql, key)) >= 8) throw fail(429, "TOO_MANY", "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  if (!current || !(await verifyPassword(current, user.password_hash))) {
    await recordAttempt(sql, key, clientIp(req));
    throw fail(400, "BAD_PASSWORD", "Senha atual incorreta.");
  }
  if (next === current) throw bad("A nova senha deve ser diferente da atual.");
  if (next.toLowerCase() === String(user.username).toLowerCase()) throw bad("A senha não pode ser igual ao usuário.");
  const hash = await hashPassword(next);
  const version = Number(user.session_version) + 1;
  await runTx(sql, [sql`update amx_users set password_hash = ${hash}, must_change_password = ${false}, session_version = ${version} where id = ${user.id}`]);
  await clearAttempts(sql, key);
  issueSession(req, res, { id: user.id, session_version: version });
  return {};
}

// ───────────────────────── ação: carregar dados ─────────────────────────

async function actBootstrap(ctx) {
  const { sql, user } = ctx;
  const admin = user.role === "admin";
  const today = nowParts().iso;
  let productRows, saleRows, userRows, moveRows, settingRows;
  if (admin) {
    [productRows, saleRows, userRows, moveRows, settingRows] = await sql.transaction([
      sql`select * from amx_products order by lower(name)`,
      sql`select * from amx_sales order by created_ts desc, id desc limit 5000`,
      sql`select * from amx_users order by created_ts, id`,
      sql`select * from amx_stock_movements order by created_ts desc, id desc limit 1000`,
      sql`select value from amx_settings where key = ${"discount_password_hash"}`,
    ]);
  } else {
    [productRows, saleRows, userRows, settingRows] = await sql.transaction([
      sql`select * from amx_products where status = ${"Ativo"} order by lower(name)`,
      sql`select * from amx_sales where seller_id = ${user.id} order by created_ts desc, id desc limit 2000`,
      sql`select * from amx_users where id = ${user.id}`,
      sql`select value from amx_settings where key = ${"discount_password_hash"}`,
    ]);
    moveRows = [];
  }
  return {
    products: productRows.map((r) => mapProduct(r, admin, today)),
    sales: saleRows.map((r) => mapSale(r, admin)),
    users: userRows.map(publicUser),
    movements: moveRows.map(mapMovement),
    hasDiscountPassword: settingRows.length > 0,
  };
}

// ───────────────────────── ações: produtos (admin) ─────────────────────────

function productFields(p, cur) {
  const has = (k) => p[k] !== undefined;
  const name = has("name") ? str(p.name, { min: 1, max: 150, field: "Nome do produto" }) : cur.name;
  const category = has("category") ? oneOf(p.category, CATEGORIES, "Categoria") : cur.category;
  const brand = has("brand") ? optStr(p.brand, { max: 80, field: "Marca" }) : cur.brand;
  const compatibility = has("compatibility") ? optStr(p.compatibility, { max: 150, field: "Compatibilidade" }) : cur.compatibility;
  const description = has("description") ? optStr(p.description, { max: 500, field: "Descrição" }) : cur.description;
  const cost = has("cost") ? money(p.cost, "Custo") : num(cur.cost);
  const price = has("price") ? money(p.price, "Preço") : num(cur.price);
  const minStock = has("minStock") ? int(p.minStock, { field: "Estoque mínimo" }) : num(cur.min_stock);
  const idealStock = has("idealStock") ? int(p.idealStock, { field: "Estoque ideal" }) : num(cur.ideal_stock);
  const supplier = has("supplier") ? optStr(p.supplier, { max: 120, field: "Fornecedor" }) : cur.supplier;
  const status = has("status") ? oneOf(p.status, ["Ativo", "Inativo"], "Status") : cur.status;
  const exclude = has("excludeFromRotation") ? !!p.excludeFromRotation : !!cur.exclude_from_rotation;
  if (idealStock < minStock) throw bad("O estoque ideal não pode ser menor que o estoque mínimo.");
  return { name, category, brand, compatibility, description, cost, price, minStock, idealStock, supplier, status, exclude };
}

async function actAddProduct(ctx, p) {
  const { sql, user } = ctx;
  if (p.name === undefined) throw bad("Nome do produto é obrigatório.");
  const f = productFields(p, { name: "", category: "Capa", brand: "", compatibility: "", description: "", cost: 0, price: 0, min_stock: 0, ideal_stock: 0, supplier: "", status: "Ativo", exclude_from_rotation: false });
  const sku = str(p.sku, { min: 1, max: 60, field: "Código / SKU" });
  const stock = p.stock === undefined || p.stock === "" ? 0 : int(p.stock, { field: "Estoque inicial" });
  const entryDate = p.entryDate ? isoDate(p.entryDate, "Data de entrada") : nowParts().iso;
  const pid = `p-${randomUUID()}`;
  const queries = [
    sql`insert into amx_products (id, name, sku, category, brand, compatibility, description, cost, price, stock, min_stock, ideal_stock, supplier, entry_date, last_entry, last_sale, total_bought, total_sold, status, exclude_from_rotation)
        values (${pid}, ${f.name}, ${sku}, ${f.category}, ${f.brand}, ${f.compatibility}, ${f.description}, ${f.cost}, ${f.price}, ${stock}, ${f.minStock}, ${f.idealStock}, ${f.supplier}, ${entryDate}, ${stock > 0 ? entryDate : null}, ${null}, ${stock}, ${0}, ${"Ativo"}, ${f.exclude})`,
  ];
  if (stock > 0) {
    const n = nowParts();
    queries.push(sql`insert into amx_stock_movements (id, created_ts, move_date, move_time, type, product_id, product_name, quantity, value, user_id, user_name, notes, sale_id)
        values (${`m-${randomUUID()}`}, ${new Date().toISOString()}, ${entryDate}, ${n.time}, ${"Entrada"}, ${pid}, ${f.name}, ${stock}, ${round2(f.cost * stock)}, ${user.id}, ${user.name}, ${"Estoque inicial"}, ${null})`);
  }
  await runTx(sql, queries, { unique: "Já existe um produto cadastrado com este SKU." });
  return { id: pid };
}

async function actUpdateProduct(ctx, p) {
  const { sql } = ctx;
  const pid = idOf(p.id);
  const patch = p.patch && typeof p.patch === "object" ? p.patch : {};
  const [cur] = await sql`select * from amx_products where id = ${pid}`;
  if (!cur) throw fail(404, "NOT_FOUND", "Produto não encontrado.");
  const f = productFields(patch, cur);
  await runTx(sql, [sql`update amx_products set name = ${f.name}, category = ${f.category}, brand = ${f.brand}, compatibility = ${f.compatibility}, description = ${f.description},
      cost = ${f.cost}, price = ${f.price}, min_stock = ${f.minStock}, ideal_stock = ${f.idealStock}, supplier = ${f.supplier}, status = ${f.status}, exclude_from_rotation = ${f.exclude}
      where id = ${pid}`]);
  return {};
}

async function actDeleteProduct(ctx, p) {
  const { sql } = ctx;
  const pid = idOf(p.id);
  const [{ n }] = await sql`select count(*) as n from amx_sales where product_id = ${pid}`;
  if (Number(n) > 0) throw fail(409, "IN_USE", "Este produto possui vendas registradas e não pode ser excluído. Você pode inativá-lo.");
  await runTx(sql, [sql`delete from amx_products where id = ${pid}`]);
  return {};
}

async function actAddStock(ctx, p) {
  const { sql, user } = ctx;
  const pid = idOf(p.id);
  const qty = int(p.quantity, { min: 1, max: 100000, field: "Quantidade" });
  const entry = p.entryDate ? isoDate(p.entryDate, "Data de entrada") : nowParts().iso;
  const [cur] = await sql`select * from amx_products where id = ${pid}`;
  if (!cur) throw fail(404, "NOT_FOUND", "Produto não encontrado.");
  const n = nowParts();
  await runTx(sql, [
    sql`update amx_products set stock = stock + ${qty}, total_bought = total_bought + ${qty}, last_entry = ${entry}, entry_date = coalesce(entry_date, ${entry}) where id = ${pid}`,
    sql`insert into amx_stock_movements (id, created_ts, move_date, move_time, type, product_id, product_name, quantity, value, user_id, user_name, notes, sale_id)
        values (${`m-${randomUUID()}`}, ${new Date().toISOString()}, ${entry}, ${n.time}, ${"Entrada"}, ${pid}, ${cur.name}, ${qty}, ${round2(num(cur.cost) * qty)}, ${user.id}, ${user.name}, ${null}, ${null})`,
  ]);
  return {};
}

// ───────────────────────── ações: vendas ─────────────────────────

async function actRegisterSale(ctx, p) {
  const { sql, user, req } = ctx;
  if (!Array.isArray(p.items) || p.items.length < 1 || p.items.length > 50) throw bad("Adicione ao menos um item.");
  const wanted = new Map();
  for (const it of p.items) {
    const pid = idOf(it && it.productId);
    const q = int(it && it.quantity, { min: 1, max: 100000, field: "Quantidade" });
    wanted.set(pid, (wanted.get(pid) || 0) + q);
  }
  const paymentMethod = oneOf(p.paymentMethod, PAYMENTS, "Forma de pagamento");
  const discountPercent = Number(p.discountPercent);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) throw bad("Percentual de desconto inválido.");

  // Vendedor só vende em nome próprio; admin pode escolher o vendedor.
  const sellerId = user.role === "admin" && p.sellerId ? idOf(p.sellerId) : user.id;
  const [seller] = await sql`select * from amx_users where id = ${sellerId}`;
  if (!seller || seller.status !== "Ativo") throw fail(404, "NOT_FOUND", "Vendedor não encontrado ou inativo.");

  if (discountPercent > DISCOUNT_LIMIT) {
    const hash = await discountHash(sql);
    if (!hash) throw fail(403, "DISCOUNT_LOCKED", "O administrador ainda não definiu a senha para descontos acima de 20%.");
    const key = `discount:${user.id}`;
    if ((await attemptsInWindow(sql, key)) >= 8) throw fail(429, "TOO_MANY", "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
    const given = typeof p.overridePassword === "string" ? p.overridePassword : "";
    if (!given || !(await verifyPassword(given, hash))) {
      await recordAttempt(sql, key, clientIp(req));
      throw fail(403, "DISCOUNT_DENIED", "Senha de autorização para desconto acima de 20% inválida.");
    }
    await clearAttempts(sql, key);
  }

  const ids = [...wanted.keys()];
  const found = await sql.transaction(ids.map((pid) => sql`select * from amx_products where id = ${pid}`));
  const items = ids.map((pid, i) => {
    const prod = found[i][0];
    if (!prod || prod.status !== "Ativo") throw fail(404, "NOT_FOUND", "Produto não encontrado.");
    const qty = wanted.get(pid);
    if (qty > num(prod.stock)) throw fail(409, "STOCK", `Estoque insuficiente para ${prod.name}. Disponível: ${num(prod.stock)}.`);
    return { prod, qty };
  });

  const subtotal = items.reduce((s, it) => s + num(it.prod.price) * it.qty, 0);
  const totalDiscount = subtotal * (discountPercent / 100);
  const now = nowParts();
  const createdTs = new Date().toISOString();
  const saleRows = items.map(({ prod, qty }) => {
    const original = num(prod.price) * qty;
    const itemDiscount = subtotal ? totalDiscount * (original / subtotal) : 0;
    const final = original - itemDiscount;
    const cost = num(prod.cost) * qty;
    return {
      id: `v-${randomUUID()}`, sale_date: now.iso, sale_time: now.time, seller_id: seller.id, seller_name: seller.name,
      product_id: prod.id, product_name: prod.name, product_sku: prod.sku, category: prod.category, quantity: qty,
      original_price: num(prod.price), discount: round2(itemDiscount), final_price: round2(final), cost: round2(cost),
      profit: round2(final - cost), payment_method: paymentMethod, status: "Concluída",
    };
  });

  const queries = [];
  for (const s of saleRows) {
    // O banco recusa estoque negativo (check stock >= 0): se outra venda acabou de levar o estoque, tudo é desfeito.
    queries.push(sql`update amx_products set stock = stock - ${s.quantity}, total_sold = total_sold + ${s.quantity}, last_sale = ${now.iso} where id = ${s.product_id}`);
    queries.push(sql`insert into amx_sales (id, created_ts, sale_date, sale_time, seller_id, seller_name, product_id, product_name, product_sku, category, quantity, original_price, discount, final_price, cost, profit, payment_method, status)
        values (${s.id}, ${createdTs}, ${s.sale_date}, ${s.sale_time}, ${s.seller_id}, ${s.seller_name}, ${s.product_id}, ${s.product_name}, ${s.product_sku}, ${s.category}, ${s.quantity}, ${s.original_price}, ${s.discount}, ${s.final_price}, ${s.cost}, ${s.profit}, ${s.payment_method}, ${s.status})`);
    queries.push(sql`insert into amx_stock_movements (id, created_ts, move_date, move_time, type, product_id, product_name, quantity, value, user_id, user_name, notes, sale_id)
        values (${`m-${randomUUID()}`}, ${createdTs}, ${now.iso}, ${now.time}, ${"Saída"}, ${s.product_id}, ${s.product_name}, ${s.quantity}, ${s.final_price}, ${seller.id}, ${seller.name}, ${`Venda ${s.id}`}, ${s.id})`);
  }
  await runTx(sql, queries, { check: "Estoque insuficiente: outra venda acabou de usar o estoque. Atualize a tela e tente de novo." });
  return { sales: saleRows.map((r) => mapSale(r, user.role === "admin")) };
}

async function loadSale(sql, sid) {
  const [sale] = await sql`select * from amx_sales where id = ${sid}`;
  if (!sale) throw fail(404, "NOT_FOUND", "Venda não encontrada.");
  return sale;
}

async function actUpdateSale(ctx, p) {
  const { sql } = ctx;
  const sid = idOf(p.id);
  const patch = p.patch && typeof p.patch === "object" ? p.patch : {};
  const sale = await loadSale(sql, sid);
  if (sale.status !== "Concluída") throw fail(409, "BAD_STATE", "Apenas vendas concluídas podem ser editadas.");
  const [prod] = await sql`select * from amx_products where id = ${sale.product_id}`;
  if (!prod) throw fail(404, "NOT_FOUND", "Produto da venda não encontrado.");
  const oldQty = num(sale.quantity);
  const newQty = patch.quantity !== undefined ? int(patch.quantity, { min: 1, max: 100000, field: "Quantidade" }) : oldQty;
  const delta = newQty - oldQty;
  if (delta > num(prod.stock)) throw fail(409, "STOCK", `Estoque insuficiente. Disponível: ${num(prod.stock)}.`);
  const unit = num(sale.original_price);
  let pct;
  if (patch.discountPercent !== undefined) {
    pct = Number(patch.discountPercent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw bad("Percentual de desconto inválido.");
  } else {
    pct = unit * oldQty ? (num(sale.discount) / (unit * oldQty)) * 100 : 0;
  }
  const method = patch.paymentMethod !== undefined ? oneOf(patch.paymentMethod, PAYMENTS, "Forma de pagamento") : sale.payment_method;
  const subtotal = unit * newQty;
  const discount = round2(subtotal * (pct / 100));
  const finalPrice = round2(subtotal - discount);
  const cost = round2(num(prod.cost) * newQty);
  const profit = round2(finalPrice - cost);
  await runTx(sql, [
    sql`update amx_products set stock = stock - ${delta}, total_sold = case when total_sold + ${delta} < 0 then 0 else total_sold + ${delta} end where id = ${prod.id}`,
    sql`update amx_sales set quantity = ${newQty}, discount = ${discount}, final_price = ${finalPrice}, cost = ${cost}, profit = ${profit}, payment_method = ${method} where id = ${sid}`,
  ]);
  return {};
}

async function actDeleteSale(ctx, p) {
  const { sql } = ctx;
  const sid = idOf(p.id);
  const sale = await loadSale(sql, sid);
  const q = num(sale.quantity);
  const queries = [];
  if (sale.status === "Concluída") {
    queries.push(sql`update amx_products set stock = stock + ${q}, total_sold = case when total_sold - ${q} < 0 then 0 else total_sold - ${q} end where id = ${sale.product_id}`);
  }
  queries.push(sql`delete from amx_stock_movements where sale_id = ${sid}`);
  queries.push(sql`delete from amx_sales where id = ${sid}`);
  await runTx(sql, queries);
  return {};
}

async function actCancelSale(ctx, p) {
  const { sql, user } = ctx;
  const sid = idOf(p.id);
  const sale = await loadSale(sql, sid);
  if (sale.status !== "Concluída") throw fail(409, "BAD_STATE", "Apenas vendas concluídas podem ser canceladas.");
  const q = num(sale.quantity);
  const n = nowParts();
  await runTx(sql, [
    sql`update amx_sales set status = ${"Cancelada"} where id = ${sid}`,
    sql`update amx_products set stock = stock + ${q}, total_sold = case when total_sold - ${q} < 0 then 0 else total_sold - ${q} end where id = ${sale.product_id}`,
    sql`insert into amx_stock_movements (id, created_ts, move_date, move_time, type, product_id, product_name, quantity, value, user_id, user_name, notes, sale_id)
        values (${`m-${randomUUID()}`}, ${new Date().toISOString()}, ${n.iso}, ${n.time}, ${"Estorno"}, ${sale.product_id}, ${sale.product_name}, ${q}, ${num(sale.final_price)}, ${user.id}, ${user.name}, ${`Estorno da venda ${sid}`}, ${null})`,
  ]);
  return {};
}

// ───────────────────────── ações: usuários e configurações (admin) ─────────────────────────

async function otherActiveAdmins(sql, exceptId) {
  const [{ n }] = await sql`select count(*) as n from amx_users where role = ${"admin"} and status = ${"Ativo"} and id <> ${exceptId}`;
  return Number(n);
}

async function actAddUser(ctx, p) {
  const { sql } = ctx;
  const name = str(p.name, { min: 1, max: 80, field: "Nome" });
  const uname = username(p.username);
  const hash = await hashPassword(password(p.password));
  const role = p.role === undefined ? "vendedor" : oneOf(p.role, ["admin", "vendedor"], "Perfil");
  const status = p.status === undefined ? "Ativo" : oneOf(p.status, ["Ativo", "Inativo"], "Status");
  const uid = `u-${randomUUID()}`;
  await runTx(sql, [sql`insert into amx_users (id, name, username, password_hash, role, status, must_change_password, session_version, created_at)
      values (${uid}, ${name}, ${uname}, ${hash}, ${role}, ${status}, ${false}, ${1}, ${nowParts().iso})`], { unique: "Este usuário já está cadastrado." });
  return { id: uid };
}

async function actUpdateUser(ctx, p) {
  const { sql, user } = ctx;
  const uid = idOf(p.id);
  const patch = p.patch && typeof p.patch === "object" ? p.patch : {};
  const [cur] = await sql`select * from amx_users where id = ${uid}`;
  if (!cur) throw fail(404, "NOT_FOUND", "Usuário não encontrado.");
  const name = patch.name !== undefined ? str(patch.name, { min: 1, max: 80, field: "Nome" }) : cur.name;
  const uname = patch.username !== undefined ? username(patch.username) : cur.username;
  const status = patch.status !== undefined ? oneOf(patch.status, ["Ativo", "Inativo"], "Status") : cur.status;
  if (status === "Inativo" && cur.role === "admin") {
    if (uid === user.id) throw fail(409, "FORBIDDEN", "Você não pode inativar a sua própria conta.");
    if ((await otherActiveAdmins(sql, uid)) < 1) throw fail(409, "FORBIDDEN", "É preciso manter pelo menos um administrador ativo.");
  }
  let hash = cur.password_hash;
  let version = Number(cur.session_version);
  if (patch.password !== undefined && patch.password !== "") {
    hash = await hashPassword(password(patch.password));
    version += 1; // derruba as sessões abertas desse usuário
  }
  await runTx(sql, [sql`update amx_users set name = ${name}, username = ${uname}, status = ${status}, password_hash = ${hash}, session_version = ${version},
      must_change_password = ${hash === cur.password_hash ? !!cur.must_change_password : false} where id = ${uid}`], { unique: "Este usuário já está cadastrado." });
  return {};
}

async function actDeleteUser(ctx, p) {
  const { sql, user } = ctx;
  const uid = idOf(p.id);
  if (uid === user.id) throw fail(409, "FORBIDDEN", "Você não pode remover a sua própria conta.");
  const [cur] = await sql`select * from amx_users where id = ${uid}`;
  if (!cur) throw fail(404, "NOT_FOUND", "Usuário não encontrado.");
  if (cur.role === "admin" && cur.status === "Ativo" && (await otherActiveAdmins(sql, uid)) < 1) {
    throw fail(409, "FORBIDDEN", "É preciso manter pelo menos um administrador ativo.");
  }
  const [{ n }] = await sql`select count(*) as n from amx_sales where seller_id = ${uid}`;
  if (Number(n) > 0) throw fail(409, "IN_USE", "Este vendedor possui vendas registradas e não pode ser excluído. Você pode inativá-lo.");
  await runTx(sql, [sql`delete from amx_users where id = ${uid}`]);
  return {};
}

async function actSetDiscountPassword(ctx, p) {
  const { sql } = ctx;
  const pw = typeof p.password === "string" ? p.password : "";
  if (pw.length < 4 || pw.length > 100) throw bad("A senha de desconto deve ter pelo menos 4 caracteres.");
  const hash = await hashPassword(pw);
  await runTx(sql, [sql`insert into amx_settings (key, value) values (${"discount_password_hash"}, ${hash}) on conflict (key) do update set value = excluded.value`]);
  return {};
}

// ───────────────────────── roteamento ─────────────────────────

// auth: false = público | "any" = qualquer usuário logado | "admin" = só administrador
const ACTIONS = {
  login: { auth: false, run: actLogin },
  logout: { auth: false, run: actLogout },
  me: { auth: "any", allowMustChange: true, run: actMe },
  changePassword: { auth: "any", allowMustChange: true, run: actChangePassword },
  bootstrap: { auth: "any", run: actBootstrap },
  registerSale: { auth: "any", run: actRegisterSale },
  addProduct: { auth: "admin", run: actAddProduct },
  updateProduct: { auth: "admin", run: actUpdateProduct },
  deleteProduct: { auth: "admin", run: actDeleteProduct },
  addStock: { auth: "admin", run: actAddStock },
  updateSale: { auth: "admin", run: actUpdateSale },
  deleteSale: { auth: "admin", run: actDeleteSale },
  cancelSale: { auth: "admin", run: actCancelSale },
  addUser: { auth: "admin", run: actAddUser },
  updateUser: { auth: "admin", run: actUpdateUser },
  deleteUser: { auth: "admin", run: actDeleteUser },
  setDiscountPassword: { auth: "admin", run: actSetDiscountPassword },
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  let b = req.body;
  if (typeof b === "string") {
    try {
      b = JSON.parse(b);
    } catch {
      throw bad("Requisição inválida.");
    }
  }
  if (!b || typeof b !== "object" || Array.isArray(b)) throw bad("Requisição inválida.");
  return b;
}

// Defesa extra contra requisições vindas de outros sites.
function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  let host = "";
  try {
    host = new URL(origin).host;
  } catch {
    throw fail(403, "FORBIDDEN", "Origem não permitida.");
  }
  if (host !== String(req.headers.host || "")) throw fail(403, "FORBIDDEN", "Origem não permitida.");
}

function errorRef(e) {
  const name = e && e.name ? e.name : "Error";
  let ref = e && e.code ? `${name}/${e.code}` : name;
  if (e && e.stage) ref += ` etapa=${e.stage}`;
  if (e && e.table) ref += ` tabela=${e.table}`;
  if (e && e.routine) ref += ` rotina=${e.routine}`;
  return ref;
}

export default async function handler(req, res) {
  let actionName = "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      throw fail(405, "METHOD", "Método não permitido.");
    }
    checkOrigin(req);
    const body = parseBody(req);
    actionName = typeof body.action === "string" ? body.action : "";
    const def = typeof body.action === "string" && Object.prototype.hasOwnProperty.call(ACTIONS, body.action) ? ACTIONS[body.action] : null;
    if (!def) throw bad("Ação desconhecida.");
    await ensureSchema();
    const ctx = { req, res, sql: db(), user: null };
    if (def.auth) {
      ctx.user = await authenticate(ctx);
      if (!ctx.user) throw fail(401, "UNAUTHENTICATED", "Sessão expirada. Entre novamente.");
      if (def.auth === "admin" && ctx.user.role !== "admin") throw fail(403, "FORBIDDEN", "Apenas o administrador pode fazer isso.");
      if (ctx.user.must_change_password && !def.allowMustChange) throw fail(403, "MUST_CHANGE_PASSWORD", "Troque sua senha para continuar.");
    }
    const data = await def.run(ctx, body);
    send(res, 200, { ok: true, data });
  } catch (e) {
    if (e instanceof HttpError) {
      send(res, e.status, { ok: false, error: { code: e.code, message: e.message } });
      return;
    }
    const stack = e && e.stack ? String(e.stack).split("\n").slice(0, 5).join(" | ") : "";
    console.error("[amx-api] erro inesperado em", actionName, "|", errorRef(e), "|", e && e.message ? e.message : e, "|", stack);
    // Na tela só vai uma referência curta. Com API_DEBUG=1 (variável na Vercel) vai também a mensagem, para diagnóstico.
    const detail = process.env.API_DEBUG === "1" ? ` ${String(e && e.message ? e.message : e).slice(0, 300)}` : "";
    send(res, 500, { ok: false, error: { code: "INTERNAL", message: `Erro interno do servidor (ref: ${errorRef(e)}).${detail}` } });
  }
}
