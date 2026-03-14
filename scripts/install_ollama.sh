#!/usr/bin/env bash
set -euo pipefail

# ─── install_ollama.sh ──────────────────────────────────────────────────────
# Install Ollama, pull required models, configure environment.
# Supports: macOS (Homebrew), Linux (systemctl), fallback (background process)

MODELS=("llama3" "llama3.2-vision")
OLLAMA_HOST="127.0.0.1:11434"

log()  { echo "[ollama-install] $*"; }
err()  { echo "[ollama-install] ERROR: $*" >&2; }

# ── 1. Install Ollama if not present ────────────────────────────────────────
if command -v ollama &>/dev/null; then
    log "Ollama already installed: $(ollama --version 2>/dev/null || echo 'version unknown')"
else
    log "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    log "Ollama installed."
fi

# ── 2. Start the Ollama service ─────────────────────────────────────────────
OS="$(uname -s)"

start_ollama_background() {
    log "Starting Ollama in background..."
    nohup ollama serve >/tmp/ollama.log 2>&1 &
    OLLAMA_PID=$!
    log "Ollama started (PID $OLLAMA_PID). Logs: /tmp/ollama.log"
    sleep 3
}

if [[ "$OS" == "Darwin" ]]; then
    # macOS: prefer launchctl service if available, else background
    if brew list --cask ollama &>/dev/null 2>&1; then
        log "Ollama installed via Homebrew Cask. Attempting to start service..."
        brew services start ollama || true
    else
        start_ollama_background
    fi
elif [[ "$OS" == "Linux" ]]; then
    if systemctl is-enabled ollama &>/dev/null 2>&1; then
        log "Starting Ollama via systemctl..."
        sudo systemctl enable --now ollama || true
    else
        start_ollama_background
    fi
else
    log "Unknown OS ($OS), starting Ollama in background..."
    start_ollama_background
fi

# Wait for Ollama to be ready (up to 30s)
log "Waiting for Ollama to be ready at $OLLAMA_HOST..."
for i in $(seq 1 30); do
    if curl -sf "http://${OLLAMA_HOST}/api/tags" >/dev/null 2>&1; then
        log "Ollama is ready."
        break
    fi
    if [[ $i -eq 30 ]]; then
        err "Ollama did not become ready within 30 seconds. Check logs."
        exit 1
    fi
    sleep 1
done

# ── 3. Pull required models ─────────────────────────────────────────────────
for model in "${MODELS[@]}"; do
    log "Pulling model: $model"
    OLLAMA_HOST="$OLLAMA_HOST" ollama pull "$model"
    log "Model $model ready."
done

# ── 4. Add OLLAMA_HOST to shell rc if not present ───────────────────────────
EXPORT_LINE="export OLLAMA_HOST=${OLLAMA_HOST}"

add_to_rc() {
    local rcfile="$1"
    if [[ -f "$rcfile" ]]; then
        if ! grep -qF "OLLAMA_HOST" "$rcfile"; then
            echo "" >> "$rcfile"
            echo "# Ollama local server" >> "$rcfile"
            echo "$EXPORT_LINE" >> "$rcfile"
            log "Added OLLAMA_HOST to $rcfile"
        else
            log "OLLAMA_HOST already present in $rcfile"
        fi
    fi
}

add_to_rc "$HOME/.bashrc"
add_to_rc "$HOME/.zshrc"
add_to_rc "$HOME/.profile"

# ── 5. Summary ───────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        Ollama Installation Complete              ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Server: http://${OLLAMA_HOST}                  ║"
for model in "${MODELS[@]}"; do
echo "║  Model:  $model"
done
echo "║                                                  ║"
echo "║  OLLAMA_HOST added to shell rc files             ║"
echo "║  Restart your terminal or: source ~/.zshrc       ║"
echo "╚══════════════════════════════════════════════════╝"
