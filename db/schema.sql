-- AMX Case — tabelas do banco (Neon / Postgres). Todas começam com "amx_" para não
-- misturar com tabelas de outros projetos no mesmo banco.
-- O sistema cria isto sozinho no primeiro acesso; este arquivo é só para consulta.

create table if not exists amx_users (
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
);

create unique index if not exists amx_users_username_key on amx_users (lower(username));

create table if not exists amx_products (
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
);

create unique index if not exists amx_products_sku_key on amx_products (lower(sku));

create table if not exists amx_sales (
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
);

create index if not exists amx_sales_seller_idx on amx_sales (seller_id);

create index if not exists amx_sales_date_idx on amx_sales (sale_date);

create table if not exists amx_stock_movements (
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
);

create index if not exists amx_movements_sale_idx on amx_stock_movements (sale_id);

create table if not exists amx_settings (
  key text primary key,
  value text not null
);

create table if not exists amx_login_attempts (
  id text primary key,
  username text not null,
  ip text not null default '',
  created_ts text not null
);

create index if not exists amx_login_attempts_user_idx on amx_login_attempts (username, created_ts);
