#!/usr/bin/env bash
# Local/CI database for tests: plain Postgres 16 + pgTAP + a small Supabase stub, then migrations and pgTAP tests.
set -euo pipefail
PG=${PG_BIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d)
# Postgres refuses to run as root (e.g. in a container): run it as the postgres user then
RUN=""; if [ "$(id -u)" = 0 ]; then RUN="runuser -u postgres --"; chown postgres "$DIR"; fi
PORT=${PGPORT_TEST:-55432}
# UTF-8 locale like Supabase (en_US.UTF-8): lower() and pg_trgm must understand Lithuanian and Cyrillic letters
$RUN "$PG/initdb" -D "$DIR" -U postgres -A trust --encoding=UTF8 --locale=C.UTF-8 >/dev/null
$RUN "$PG/pg_ctl" -D "$DIR" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" start >/dev/null
trap '$RUN "$PG/pg_ctl" -D "$DIR" stop -m fast >/dev/null; rm -rf "$DIR"' EXIT
export DATABASE_URL="postgresql://postgres@/postgres?host=$DIR&port=$PORT"
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/_local_supabase_stub.sql
SUPABASE_DB_URL="$DATABASE_URL" npx tsx scripts/db-migrate.ts
SUPABASE_DB_URL="$DATABASE_URL" npx tsx scripts/db-migrate.ts   # second run must be a no-op
SUPABASE_DB_URL="$DATABASE_URL" npx tsx scripts/ingredients-import.ts
SUPABASE_DB_URL="$DATABASE_URL" npx tsx scripts/ingredients-import.ts   # idempotent
SUPABASE_DB_URL="$DATABASE_URL" npx tsx scripts/recipes-import.ts
npx tsx scripts/db-test.ts
