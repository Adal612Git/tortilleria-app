#!/usr/bin/env bash

set -Eeuo pipefail

# Paths y log
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"
mkdir -p storage/logs || true
LOG_FILE="storage/logs/start-tortilleria.log"
echo "==== $(date '+%F %T') :: START ====" >> "$LOG_FILE" 2>/dev/null || true

# Logging simple (sin colores para evitar problemas de quoting)
log()  { printf '[INFO] %s\n' "$*" | tee -a "$LOG_FILE"; }
warn() { printf '[WARN] %s\n' "$*" | tee -a "$LOG_FILE"; }
err()  { printf '[ERR ] %s\n' "$*" | tee -a "$LOG_FILE"; }
ok()   { printf '[ OK ] %s\n' "$*" | tee -a "$LOG_FILE"; }

# Pausa amigable
pause_for_user() {
  if [ -t 0 ]; then
    read -rp "Presiona Enter para cerrar..." _ || true
  elif [ -e /dev/tty ]; then
    read -rp "Presiona Enter para cerrar..." _ </dev/tty || sleep 30
  else
    sleep 30
  fi
}

# Trap de errores
on_error() {
  err "Se produjo un error (línea $1). Revisa:"
  err "  - $LOG_FILE"
  err "  - storage/logs/laravel.log"
  pause_for_user
  exit 1
}
trap 'on_error $LINENO' ERR

log "Iniciando Tortillería (setup + serve)"

# 1) Comprobaciones básicas
if ! command -v php >/dev/null; then
  err "PHP no está instalado en PATH"
  pause_for_user; exit 1
fi
PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
log "PHP ${PHP_VERSION} detectado"

if command -v composer >/dev/null; then
  COMPOSER_OK=1; log "Composer detectado"
else
  COMPOSER_OK=0; warn "Composer no encontrado. Si vendor/ existe, seguiremos."
fi

if command -v npm >/dev/null && command -v node >/dev/null; then
  NPM_OK=1; NODE_VERSION=$(node -v || echo ""); log "Node/NPM detectados (${NODE_VERSION})"
else
  NPM_OK=0; warn "Node/NPM no encontrados. Usando assets existentes si hay."
fi

# 2) .env y APP_KEY
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env; ok ".env creado desde .env.example"
  else
    warn "No existe .env ni .env.example. Creando .env mínimo"
    cat > .env <<'EOF'
APP_NAME=Tortilleria
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=sqlite
SESSION_DRIVER=database
QUEUE_CONNECTION=database
EOF
  fi
fi

if grep -qE '^APP_KEY\s*=\s*$' .env; then
  log "Generando APP_KEY"
  php artisan key:generate --force >/dev/null || warn "No se pudo generar APP_KEY (revisa permisos)"
fi

# 3) Base de datos SQLite
mkdir -p database
SQLITE_PATH=""
if [ -n "${DB_DATABASE:-}" ]; then
  SQLITE_PATH="$DB_DATABASE"
elif [ -f .env ]; then
  SQLITE_PATH=$(grep -m1 '^DB_DATABASE=' .env | cut -d= -f2- || true)
fi
if [ -z "$SQLITE_PATH" ] || [ "$SQLITE_PATH" = "null" ]; then
  SQLITE_PATH="database/database.sqlite"
fi

NEW_SQLITE=0
if [ ! -f "$SQLITE_PATH" ]; then
  mkdir -p "$(dirname "$SQLITE_PATH")" 2>/dev/null || true
  : > "$SQLITE_PATH"
  ok "SQLite inicializada en $SQLITE_PATH"
  NEW_SQLITE=1
fi

# 4) Dependencias PHP
if [ "$COMPOSER_OK" = "1" ]; then
  if [ ! -f vendor/autoload.php ]; then
    log "Instalando dependencias PHP (composer install)"
    composer install --no-interaction --prefer-dist --optimize-autoloader || warn "composer install falló; usando vendor/ si existe"
  else
    log "Actualizando autoload (composer dump-autoload -o)"; composer dump-autoload -o || true
  fi
fi

# 5) Caches y migraciones/seeders
log "Limpiando cachés"; php artisan route:clear || true; php artisan config:clear || true; php artisan view:clear || true; php artisan cache:clear || true

log "Ejecutando migraciones"
if [ "${FORCE_SEED:-0}" = "1" ]; then
  warn "FORCE_SEED=1 activo: migrate --seed"
  php artisan migrate --seed --force || { warn "migrate --seed falló; reintentando"; php artisan migrate --force || true; php artisan db:seed || true; }
else
  if [ "$NEW_SQLITE" = "1" ]; then
    log "Base de datos nueva: migrate --seed"
    php artisan migrate --seed --force || { warn "migrate --seed falló; reintentando"; php artisan migrate --force || true; php artisan db:seed || true; }
  else
    php artisan migrate --force || true
  fi
fi

# 6) Assets (opcional)
if [ "$NPM_OK" = "1" ]; then
  if [ ! -d node_modules ]; then
    log "Instalando dependencias Front (npm ci)"
    npm ci || { warn "npm ci falló, intentando npm install"; npm install || warn "npm install falló"; }
  fi
  log "Construyendo assets (npm run build)"; npm run build || warn "Build falló; usando assets existentes"
else
  if [ -d public/build ]; then log "Usando assets existentes en public/build"; else warn "Sin Node y sin public/build: estilos pueden faltar"; fi
fi

# 7) Selección de puerto
PORT=8001
is_free_port() {
  if command -v lsof >/dev/null; then lsof -i TCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1 && return 1 || return 0; fi
  if command -v ss >/dev/null;   then ss -ltn | awk '{print $4}' | grep -qE "(^|:)($1)$" && return 1 || return 0; fi
  if command -v netstat >/dev/null; then netstat -ltn 2>/dev/null | awk '{print $4}' | grep -qE ":($1)$" && return 1 || return 0; fi
  return 0
}
if ! is_free_port "$PORT"; then for p in $(seq 8002 8010); do if is_free_port "$p"; then PORT="$p"; break; fi; done; fi
ok "Usando puerto $PORT"

# 8) Abrir navegador
URL="http://127.0.0.1:${PORT}/login"
if command -v xdg-open >/dev/null; then ( sleep 2; xdg-open "$URL" >/dev/null 2>&1 || true ) & fi

log "Iniciando servidor en $URL"
printf 'Presiona Ctrl+C para detener el servidor.\n'

# 9) Iniciar servidor
set +e
php artisan serve --host=127.0.0.1 --port="$PORT"
EXIT_CODE=$?
set -e
if [ "$EXIT_CODE" -ne 0 ]; then
  err "El servidor no pudo iniciar (código $EXIT_CODE). Revisa:"
  err "  - $LOG_FILE"
  err "  - storage/logs/laravel.log"
  pause_for_user
  exit "$EXIT_CODE"
fi
