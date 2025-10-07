<p align="center">
  <img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="360" alt="Laravel Logo" />
</p>

# Tortillería App — Guía de instalación y ejecución (Windows Local + Docker)

Este proyecto es una aplicación Laravel 12 (PHP 8.2) con Vite/Node que por defecto se ejecuta en modo local, sin necesidad de Docker ni Apache/XAMPP. Usa SQLite como base de datos por defecto para que puedas levantarlo con doble clic en Windows.

Además, incluye un `Dockerfile` para pruebas en contenedor Linux (opcional) y un script de arranque para Linux (`start-tortilleria.sh`).

La guía es extremadamente detallada, con pasos, verificación y solución de errores comunes.

---

## Índice

- Requisitos mínimos en Windows
- Arranque rápido local (doble clic)
- Qué hace el script `start-app.bat` paso a paso
- Variables útiles (`APP_VERBOSE`, `APP_PAUSE`, puerto)
- Solución de problemas (errores frecuentes y cómo resolverlos)
- Ejecución en Docker (Linux) opcional
- Pruebas en “Windows 7/10”: por qué necesitas VM y no Docker
- Mantenimiento, comandos útiles y notas

---

## Requisitos mínimos en Windows

- Windows 10/11 con permisos de escritura en la carpeta del proyecto.
- `PHP` CLI 8.2+ en `PATH`, con extensiones habilitadas: `pdo_sqlite`, `mbstring`, `openssl`, `zip`, `fileinfo`.
- `Composer` instalado globalmente (para usar `composer` en la consola).
- `Node.js` 18 o 20 (recomendado) y `npm`.
- Internet en la primera ejecución (descarga dependencias PHP y NPM).

Notas sobre XAMPP:
- No necesitas iniciar Apache de XAMPP. El proyecto usa `php artisan serve`.
- Si tu PHP viene de XAMPP, agrega `C:\xampp\php` al `PATH` para usar `php` y `composer` desde consola. Asegúrate de habilitar extensiones en `C:\xampp\php\php.ini` (quita `;` en líneas como `extension=pdo_sqlite`).

Verificación rápida en consola (`Win + R` → `cmd`):
- `php -v`
- `composer -V`
- `node -v`
- `npm -v`

---

## Arranque rápido local (doble clic)

1) Doble clic en `start-app.bat` (en la carpeta raíz del proyecto).
- El script verifica herramientas y extensiones de PHP, prepara `.env`, genera `APP_KEY`, asegura SQLite, instala dependencias (`composer`, `npm`), construye assets (`vite build`) y levanta el servidor en `http://127.0.0.1:8001`.
- Verás mensajes con hora y detalle de cada paso. Si algo falta, el script se detiene y te indica cómo corregirlo.

2) Accede a `http://127.0.0.1:8001` en tu navegador.

3) Para reintentar después de corregir un error, vuelve a ejecutar `start-app.bat`.

Ejecución desde consola (opcional, recomendado para ver todo el log):
- Abre `cmd` en la carpeta del proyecto y ejecuta: `start-app.bat`
- Para reducir verbosidad: `set APP_VERBOSE=0` y luego `start-app.bat`.

---

## Qué hace `start-app.bat` paso a paso

- [1/9] Verifica dependencias en `PATH`: `php`, `composer`, `node`, `npm`.
  - Muestra versiones y, en modo detallado, rutas de los ejecutables.
  - Si falta alguna, se detiene con instrucciones.
- [1A/9] Comprueba extensiones de PHP: `pdo_sqlite`, `mbstring`, `openssl`, `zip`, `fileinfo`.
  - Si falta alguna, verás `[FALTA]` y el script se detiene con guía para habilitarla.
- [1B/9] Comprueba versión de Node (advierte si < 18).
- [2/9] Prepara `.env` y `APP_KEY`.
  - Copia `.env.example` → `.env` (si no existe), agrega `APP_KEY` si falta y ejecuta `php artisan key:generate`.
- [3/9] Asegura la base de datos SQLite.
  - Crea `database\database.sqlite` si no existe.
- [4/9] Instala dependencias PHP (`composer install`).
  - Con `-vvv --profile` para ver progreso detallado la primera vez (puede tardar minutos).
- [5/9] Genera autoload optimizado y ejecuta caches/migraciones/seeders.
  - `composer dump-autoload -o` con logs detallados.
  - `php artisan config:clear` y `php artisan migrate --seed --force`.
- [6/9] Instala dependencias NPM (`npm install`).
  - Usa `--verbose` en modo detallado.
- [7/9] Construye assets (`npm run build`).
- [8/9] Inicia el servidor Laravel en `127.0.0.1:8001`.
  - Abre una nueva ventana “Laravel Server”.
- [9/9] Abre el navegador en `http://127.0.0.1:8001`.

---

## Variables útiles y ajustes

- `APP_VERBOSE` (por defecto `1`):
  - `1` = verboso (Composer `-vvv --profile`, NPM `--verbose`, Artisan `-v`).
  - `0` = menos ruido.
  - Ejemplo: `set APP_VERBOSE=0` antes de ejecutar el `.bat`.

- `APP_PAUSE` (por defecto `1`):
  - `1` = al final (o en error) la ventana espera tecla y no se cierra.
  - `0` = comportamiento normal de consola.

- Puerto del servidor:
  - Por defecto `8001`. Para cambiarlo, edita la línea `set PORT=8001` en `start-app.bat`.
  - Alternativa rápida: deja `8001` y si está ocupado, cambia a `8002` y vuelve a ejecutar.

- Base de datos:
  - Por defecto `DB_CONNECTION=sqlite` con archivo `database\database.sqlite`.
  - Para usar MySQL, ajusta `.env` (host, puerto, usuario, contraseña) y habilita `pdo_mysql` en `php.ini`. Luego corre `php artisan migrate --force`.

---

## Solución de problemas (FAQ)

- Error: “`'php' no se reconoce como un comando interno o externo`”
  - Causa: PHP no está en `PATH`.
  - Solución: Instala PHP CLI 8.2+ o agrega `C:\xampp\php` al `PATH`. Abre nueva consola y verifica con `php -v`.

- Error: “`'composer' no se reconoce...`”
  - Causa: Composer no está instalado en PATH.
  - Solución: Instala Composer para Windows (instalador oficial), cierra y abre consola, `composer -V`.

- Error: “`'node'` o `'npm'` no se reconocen”
  - Causa: Node.js/npm no instalados o no en PATH.
  - Solución: Instala Node 18/20 desde nodejs.org, reabre consola, `node -v`, `npm -v`.

- Error: Falta la extensión `pdo_sqlite`/`mbstring`/`openssl`/`zip`/`fileinfo`.
  - Causa: extensiones deshabilitadas en `php.ini`.
  - Solución: Edita `php.ini` y habilita: `extension=pdo_sqlite`, `extension=sqlite3`, `extension=mbstring`, `extension=openssl`, `extension=zip`, `extension=fileinfo`. Guarda, abre nueva consola.
  - XAMPP: `C:\xampp\php\php.ini`.

- “Generated optimized autoload files containing ... classes” se queda varios minutos.
  - Causa: primera generación de classmap de Composer; antivirus/OneDrive pueden ralentizar E/S.
  - Solución: esperar (normal la 1ª vez). Para ver progreso: el script ya usa `-vvv --profile`.
  - Mejora: mover el proyecto a `C:\dev\tortilleria` (fuera de OneDrive), excluir carpeta del antivirus.

- Error: `SQLSTATE[HY000]: General error: 1 no such table ...`
  - Causa: migraciones no ejecutadas.
  - Solución: `php artisan migrate --force`. El script lo hace en el paso [5/9].

- Error: `APP_KEY` ausente o cifrado inválido
  - Causa: `APP_KEY` vacío en `.env`.
  - Solución: `php artisan key:generate`. El script lo genera en [2/9].

- Error de permiso en `storage/logs/laravel.log` o `bootstrap/cache`
  - Causa: permisos de escritura insuficientes en la carpeta del proyecto.
  - Solución: ejecuta la consola como Administrador o revisa atributos de la carpeta. Asegura escritura en `storage` y `bootstrap/cache`.

- Assets (CSS/JS) no cargan, 404 o página sin estilos
  - Causa: falta construir assets.
  - Solución: `npm install` y `npm run build`. El script lo hace en [6/9] y [7/9].

- `php artisan serve` no inicia: puerto en uso
  - Causa: `8001` ocupado.
  - Solución: cambia `set PORT=8002` en `start-app.bat` y reintenta. Para ver qué ocupa: `netstat -ano | findstr :8001`.

- Composer “Allowed memory size exhausted”
  - Solución rápida: `set COMPOSER_MEMORY_LIMIT=-1` y reintenta `composer install`/`dump-autoload`.

- NPM muy lento o errores de red (proxy)
  - Solución: `npm config set registry https://registry.npmmirror.com` (o tu proxy corporativo), y `npm install`.

---

## Ejecución en Docker (Linux) — opcional

Docker no emula Windows 7/10. Si quieres probar en contenedor Linux, usa el `Dockerfile` incluido.

Preparación (en el host):
- `npm ci`
- `npm run build`
- Asegura `.env` con `APP_KEY` y `DB_CONNECTION=sqlite`.
- Crea BD: `type nul > database\database.sqlite`

Build y run:
- Construir imagen: `docker build -t tortilleria-app .`
- Ejecutar contenedor: `docker run --rm -p 8001:8000 --name tortilleria tortilleria-app`
- Accede: `http://localhost:8001`

Persistencia de BD y logs (recomendado en Windows PowerShell):
- `docker run --rm -p 8001:8000 --name tortilleria ^
  --mount type=bind,source="${PWD}\database",target=/var/www/html/database ^
  --mount type=bind,source="${PWD}\storage",target=/var/www/html/storage ^
  tortilleria-app`

Claves y migraciones dentro del contenedor:
- `docker exec -it tortilleria bash -lc "php artisan key:generate --force"`
- `docker exec -it tortilleria bash -lc "php artisan migrate --seed --force"`

Problemas comunes en Docker:
- Permisos en `storage/`/`bootstrap/cache/`: `docker exec -it tortilleria bash -lc "chown -R www-data:www-data storage bootstrap/cache database"`.
- Assets faltantes: asegúrate de ejecutar `npm run build` antes del `docker build` o adapta el `Dockerfile` para construirlos dentro.

Compose (opcional):
- Crea `compose.yaml` y define un servicio `app` que haga build de `.` y monte `./database` y `./storage`. Inicia con `docker compose up --build -d`.

---

## “Probar en Windows 7/10” — usa una VM, no Docker

Docker no ejecuta Windows 7/10 de escritorio (los contenedores Windows se basan en Windows Server y comparten kernel). Si necesitas probar en un SO Windows específico, usa una máquina virtual:

- VirtualBox/VMware/Hyper-V.
- Instala Windows 10/11 (las VMs de desarrollo de Microsoft son gratuitas) o Windows 7 (EOL, requiere ISO/licencia propia).
- Dentro de la VM, instala PHP 8.2, Composer y Node 18/20; clona el proyecto y ejecuta `start-app.bat`.

---

## Mantenimiento y comandos útiles

- Limpiar caches de Laravel: `php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan view:clear`
- Regenerar autoload de Composer: `composer dump-autoload -o`
- Resetear BD SQLite: borra `database\database.sqlite` y ejecuta `php artisan migrate --seed`
- Ver logs de Laravel: `storage\logs\laravel.log`
- Capturar salida del script en archivo (Windows): abre `cmd` y ejecuta `start-app.bat > storage\logs\start-app-windows.log 2>&1`

---

## Créditos y licencia

- Framework: Laravel 12 (PHP 8.2)
- Este proyecto se distribuye bajo licencia MIT.

Para documentación oficial de Laravel visita https://laravel.com/docs.
