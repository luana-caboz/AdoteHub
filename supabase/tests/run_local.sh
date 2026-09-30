#!/usr/bin/env bash
# Testa as migrations num Postgres local (sem Docker/Supabase CLI).
# Uso: PGUSER=postgres bash supabase/tests/run_local.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=adotehub_test
dropdb --if-exists "$DB"
createdb "$DB"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/bootstrap_local.sql
for f in supabase/migrations/*.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f"
done
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/rls_test.sql
