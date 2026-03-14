# ─── install_ollama.ps1 ─────────────────────────────────────────────────────
# Install Ollama on Windows, pull required models, configure environment.
# Run as Administrator for system-wide env var persistence.

$ErrorActionPreference = "Stop"
$Models = @("llama3", "llama3.2-vision")
$OllamaHost = "127.0.0.1:11434"
$InstallerUrl = "https://ollama.ai/download/ollama-windows-amd64.exe"
$InstallerPath = "$env:TEMP\ollama-installer.exe"

function Log($msg)  { Write-Host "[ollama-install] $msg" -ForegroundColor Cyan }
function Err($msg)  { Write-Host "[ollama-install] ERROR: $msg" -ForegroundColor Red }

# ── 1. Install Ollama if not present ────────────────────────────────────────
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaCmd) {
    Log "Ollama already installed at $($ollamaCmd.Source)"
} else {
    Log "Downloading Ollama installer from $InstallerUrl ..."
    Invoke-WebRequest -Uri $InstallerUrl -OutFile $InstallerPath -UseBasicParsing
    Log "Running installer..."
    Start-Process -FilePath $InstallerPath -ArgumentList "/S" -Wait
    Log "Ollama installed. Refreshing PATH..."
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

# ── 2. Set OLLAMA_HOST environment variable ──────────────────────────────────
Log "Setting OLLAMA_HOST=$OllamaHost ..."
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", $OllamaHost, "User")
$env:OLLAMA_HOST = $OllamaHost
Log "OLLAMA_HOST set for current user (User scope)."

# ── 3. Start Ollama server ───────────────────────────────────────────────────
Log "Starting Ollama server..."
$ollamaProcess = Start-Process -FilePath "ollama" -ArgumentList "serve" -PassThru -WindowStyle Hidden
Log "Ollama server started (PID $($ollamaProcess.Id))"

# Wait for Ollama to be ready (up to 30s)
Log "Waiting for Ollama to be ready at $OllamaHost ..."
$ready = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://$OllamaHost/api/tags" -UseBasicParsing -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            Log "Ollama is ready."
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $ready) {
    Err "Ollama did not become ready within 30 seconds."
    exit 1
}

# ── 4. Pull required models ─────────────────────────────────────────────────
foreach ($model in $Models) {
    Log "Pulling model: $model ..."
    & ollama pull $model
    if ($LASTEXITCODE -ne 0) {
        Err "Failed to pull model $model"
        exit 1
    }
    Log "Model $model ready."
}

# ── 5. Summary ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        Ollama Installation Complete              ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Server: http://$OllamaHost                     ║" -ForegroundColor Green
foreach ($model in $Models) {
    Write-Host "║  Model:  $model" -ForegroundColor Green
}
Write-Host "║                                                  ║" -ForegroundColor Green
Write-Host "║  OLLAMA_HOST set for current user                ║" -ForegroundColor Green
Write-Host "║  Restart your terminal for env var to take effect║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green
