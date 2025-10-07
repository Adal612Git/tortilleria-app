@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem =============================
rem  Tortilleria App - Arranque
rem =============================
title Tortilleria App - Arranque
echo ==============================================
echo   Tortilleria App - Arranque automatico (Windows)
echo ==============================================

rem Verbosidad por defecto (1 = detallado). Puede desactivarse con: set APP_VERBOSE=0
if not defined APP_VERBOSE set APP_VERBOSE=1
rem Mantener ventana abierta al final (1 = si). Desactiva con: set APP_PAUSE=0
if not defined APP_PAUSE set APP_PAUSE=1

rem Flags de herramientas segun verbosidad
set "COMPOSER_FLAGS="
set "NPM_FLAGS="
set "ARTISAN_FLAGS="
if "%APP_VERBOSE%"=="1" (
  set "COMPOSER_FLAGS=-vvv --profile"
  set "NPM_FLAGS=--verbose"
  set "ARTISAN_FLAGS=-v"
)

rem ===== Salto al flujo principal para evitar ejecutar subrutinas al cargar =====
goto :main

rem Utilidad: timestamp + logger simple
set "__TS__="
for /f "tokens=1,2 delims=." %%A in ("%TIME%") do set "__TS__=%%A"

rem Subrutina: genera variable !TS! = [HH:MM:SS]
:__ts
for /f "tokens=1-3 delims=:., " %%h in ("%TIME%") do (
  set "TS=[%%h:%%i:%%j]"
)
goto :eof

rem Subrutina: logea con timestamp
:log
call :__ts
echo !TS! %*
goto :eof

rem Subrutina: log de inicio y fin de paso
:step_begin
call :__ts
set "__STEP_NAME__=%*"
echo !TS! === Iniciando: !__STEP_NAME__! ===
goto :eof

:step_end
call :__ts
echo !TS! === OK: !__STEP_NAME__! ===
set "__STEP_NAME__="
goto :eof

rem Subrutina: verificar extension de PHP
:check_php_ext
set "EXT=%~1"
php -m | findstr /R /I /C:"^%EXT%$" >nul 2>nul
if errorlevel 1 (
  call :log [FALTA] Extension PHP '%EXT%' no encontrada. Habilitala en php.ini
  set "MISSING_PHP_EXT=1"
  set "MISSING_PHP_EXT_LIST=!MISSING_PHP_EXT_LIST! %EXT%"
) else (
  if "%APP_VERBOSE%"=="1" call :log [OK] PHP ext '%EXT%' presente.
)
goto :eof

:main
REM Ir al directorio del script
cd /d "%~dp0"

REM Puerto de Laravel (puedes cambiarlo)
set PORT=8001

call :step_begin [1/9] Verificando dependencias (php, composer, npm, node)
for %%X in (php composer npm node) do (
  where %%X >nul 2>nul
  if errorlevel 1 (
    call :log [ERROR] No se encontro '%%X' en PATH. Instala o reinicia la consola.
    if "%APP_PAUSE%"=="1" pause
    exit /b 1
  )
)
if "%APP_VERBOSE%"=="1" (
  rem Versiones rapidas
  for /f %%i in ('php -r "echo PHP_VERSION;"') do set "PHPVER=%%i"
  for /f "tokens=1-3" %%a in ('composer --version') do set "COMPOSERVER=%%a %%b %%c"
  for /f %%i in ('node -v') do set "NODEVER=%%i"
  for /f %%i in ('npm -v') do set "NPMVER=%%i"
  call :log Detalles -> PHP: !PHPVER! ^| Composer: !COMPOSERVER! ^| Node: !NODEVER! ^| NPM: !NPMVER!
  for /f "delims=" %%p in ('where php 2^>nul') do call :log PHP exe: %%p
  for /f "delims=" %%p in ('where composer 2^>nul') do call :log Composer exe: %%p
  for /f "delims=" %%p in ('where node 2^>nul') do call :log Node exe: %%p
  for /f "delims=" %%p in ('where npm 2^>nul') do call :log NPM exe: %%p
)
call :step_end

call :step_begin [1A/9] Verificando extensiones PHP requeridas
set "MISSING_PHP_EXT="
set "MISSING_PHP_EXT_LIST="
call :check_php_ext pdo_sqlite
call :check_php_ext mbstring
call :check_php_ext openssl
call :check_php_ext zip
call :check_php_ext fileinfo
if defined MISSING_PHP_EXT (
  call :log [ERROR] Faltan extensiones PHP:!MISSING_PHP_EXT_LIST!
  call :log Edita tu php.ini y habilita (quita ';') por ejemplo: extension=pdo_sqlite
  call :log Si usas XAMPP: C:\xampp\php\php.ini, busca las lineas y habilitalas.
  if "%APP_PAUSE%"=="1" pause
  exit /b 2
)
call :step_end

call :step_begin [1B/9] Verificando version de Node.js
set "NODEVER_RAW="
for /f %%i in ('node -v 2^>nul') do set "NODEVER_RAW=%%i"
set "NODEVER_CLEAN=!NODEVER_RAW:v=!"
for /f "tokens=1,2 delims=." %%a in ("!NODEVER_CLEAN!") do (
  set "NODE_MAJ=%%a"
  set "NODE_MIN=%%b"
)
if defined NODE_MAJ (
  if !NODE_MAJ! LSS 18 (
    call :log [WARN] Node !NODEVER_CLEAN! detectado. Se recomienda 18+ (ideal 18/20).
  ) else (
    if "%APP_VERBOSE%"=="1" call :log [OK] Node version adecuada (!NODEVER_CLEAN!).
  )
) else (
  call :log [WARN] No se pudo determinar la version de Node.
)
call :step_end

call :step_begin [2/9] Preparando entorno (.env y APP_KEY)
if not exist ".env" (
  if exist ".env.example" (
    call :log Copiando .env.example a .env...
    copy /Y ".env.example" ".env" >nul
  ) else (
    call :log .env.example no encontrado. Creando .env minimo...
    (echo APP_ENV=local)> .env
    (echo APP_KEY=)>> .env
    (echo APP_DEBUG=true)>> .env
    (echo DB_CONNECTION=sqlite)>> .env
  )
)

REM Asegurar que exista la linea APP_KEY
set "APPKEY_LINE="
for /f "usebackq tokens=1* delims==" %%A in (`findstr /R /C:"^APP_KEY=" ".env"`) do (
  set "APPKEY_LINE=%%B"
)
if not defined APPKEY_LINE (
  call :log Agregando linea APP_KEY al .env...
  (echo APP_KEY=)>> .env
)

REM Obtener valor de APP_KEY
set "APPKEY_VAL="
for /f "usebackq tokens=1* delims==" %%A in (`findstr /R /C:"^APP_KEY=" ".env"`) do (
  set "APPKEY_VAL=%%B"
)
if "!APPKEY_VAL!"=="" (
  call :log Generando APP_KEY...
  php artisan key:generate --force %ARTISAN_FLAGS%
  if errorlevel 1 goto :error
) else (
  call :log APP_KEY ya configurado.
)
call :step_end

call :step_begin [3/9] Asegurando base de datos SQLite
if not exist "database" mkdir "database"
if not exist "database\database.sqlite" (
  type nul > "database\database.sqlite"
  call :log Creado database\database.sqlite
) else (
  call :log SQLite ya existe.
)
call :step_end

call :step_begin [4/9] Dependencias PHP (composer)
if not exist "vendor\autoload.php" (
  call :log Ejecutando: composer install --no-interaction --prefer-dist %COMPOSER_FLAGS%
  call composer install --no-interaction --prefer-dist %COMPOSER_FLAGS%
  if errorlevel 1 goto :error
) else (
  call :log Vendor ya presente, omitiendo composer install.
)
call :step_end

call :step_begin [5/9] Autoload, cache y migraciones
call :log Generando autoload optimizado (classmap). Esto puede tardar varios minutos la primera vez.
call :log Ejecutando: composer dump-autoload --optimize --no-interaction %COMPOSER_FLAGS%
call composer dump-autoload --optimize --no-interaction %COMPOSER_FLAGS%
if errorlevel 1 goto :error
if exist "storage\logs\laravel.log" (
  del /Q "storage\logs\laravel.log"
)
call :log Limpiando caches de Laravel
php artisan config:clear %ARTISAN_FLAGS%
if errorlevel 1 goto :error
call :log Ejecutando migraciones y seeders (puede tardar)
php artisan migrate --seed --force %ARTISAN_FLAGS%
if errorlevel 1 goto :error
call :step_end

call :step_begin [6/9] Dependencias NPM
if not exist "node_modules" (
  call :log Ejecutando: npm install --no-audit --no-fund %NPM_FLAGS%
  call npm install --no-audit --no-fund %NPM_FLAGS%
  if errorlevel 1 goto :error
) else (
  call :log node_modules presente, verificando dependencias...
  call npm install --no-audit --no-fund %NPM_FLAGS%
  if errorlevel 1 goto :error
)
call :step_end

call :step_begin [7/9] Construyendo assets (vite build)
call :log Ejecutando: npm run build %NPM_FLAGS%
call npm run build %NPM_FLAGS%
if errorlevel 1 goto :error
call :step_end

call :step_begin [8/9] Iniciando servidor Laravel
call :log Puerto seleccionado: %PORT%
start "Laravel Server" cmd /k "php artisan serve --port=%PORT%"
call :step_end

call :step_begin [9/9] Abriendo navegador
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"

call :step_end

echo.
call :log Listo! El servidor esta levantado en http://127.0.0.1:%PORT%/
call :log Esta ventana seguira mostrando el progreso y cualquier error.
if "%APP_PAUSE%"=="1" (
  call :log Presiona una tecla para cerrar esta ventana...
  pause
)
exit /b 0

:error
echo.
call :log [FALLO] Ocurrio un error en el paso anterior. Revisa el mensaje y vuelve a intentar.
if "%APP_PAUSE%"=="1" pause
exit /b 1
