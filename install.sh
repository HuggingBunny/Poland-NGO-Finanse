#!/usr/bin/env bash
set -e

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     KrakowNGO Finanse — Instalator v0.1          ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

OS="$(uname -s)"
info "Wykryty system: $OS"

# ── Node.js ──────────────────────────────────────────────────────────────────
install_node() {
    if [ "$OS" = "Darwin" ]; then
        if command -v brew &>/dev/null; then
            brew install node@20
        else
            error "Homebrew nie zainstalowany. Zainstaluj Node.js ręcznie: https://nodejs.org"
        fi
    elif [ "$OS" = "Linux" ]; then
        if command -v apt-get &>/dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v dnf &>/dev/null; then
            sudo dnf install nodejs -y
        else
            error "Menedżer pakietów nieobsługiwany. Zainstaluj Node.js >=18 ręcznie: https://nodejs.org"
        fi
    else
        error "Windows: pobierz Node.js ze strony https://nodejs.org i uruchom ten skrypt ponownie z Git Bash."
    fi
}

if command -v node &>/dev/null; then
    NODE_VER=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VER | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        success "Node.js $NODE_VER"
    else
        warn "Node.js $NODE_VER jest za stary. Wymagane >=18."
        install_node
    fi
else
    warn "Node.js nie znaleziono. Instaluję..."
    install_node
fi

# ── Rust ─────────────────────────────────────────────────────────────────────
if command -v rustc &>/dev/null; then
    RUST_VER=$(rustc --version | awk '{print $2}')
    success "Rust $RUST_VER"
else
    warn "Rust nie znaleziono. Instaluję przez rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    success "Rust zainstalowany"
fi

# ── Tauri CLI dependencies (Linux only) ──────────────────────────────────────
if [ "$OS" = "Linux" ]; then
    info "Sprawdzam zależności systemowe dla Tauri (Linux)..."
    MISSING=()
    for pkg in libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev; do
        dpkg -l "$pkg" &>/dev/null || MISSING+=("$pkg")
    done
    if [ ${#MISSING[@]} -gt 0 ]; then
        info "Instaluję brakujące zależności: ${MISSING[*]}"
        sudo apt-get update -q && sudo apt-get install -y "${MISSING[@]}"
    else
        success "Zależności systemowe OK"
    fi
fi

# ── Tauri CLI ─────────────────────────────────────────────────────────────────
if ! command -v cargo-tauri &>/dev/null && ! npm list -g @tauri-apps/cli &>/dev/null 2>&1; then
    info "Instaluję Tauri CLI..."
    cargo install tauri-cli --version "^1.6"
    success "Tauri CLI zainstalowany"
else
    success "Tauri CLI OK"
fi

# ── npm install ───────────────────────────────────────────────────────────────
info "Instaluję zależności npm..."
npm install
success "Zależności npm zainstalowane"

# ── Build test ────────────────────────────────────────────────────────────────
info "Testuję build frontendu..."
npm run build
success "Build frontendu OK"

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Instalacja zakończona pomyślnie!${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo "Uruchomienie:"
echo -e "  ${BLUE}npm run dev${NC}             → przeglądarka (tryb deweloperski, dane mock)"
echo -e "  ${BLUE}cargo tauri dev${NC}         → aplikacja desktopowa (pełny Tauri + SQLite)"
echo -e "  ${BLUE}cargo tauri build${NC}       → build produkcyjny (.app / .msi / .deb)"
echo ""
