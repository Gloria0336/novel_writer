$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceEnvPath = Join-Path $repoRoot "workspace.env"
$workspaceEnvExamplePath = Join-Path $repoRoot "workspace.env.example"

function Quote-PowerShellLiteral {
  param([string]$Value)

  return "'" + $Value.Replace("'", "''") + "'"
}

function Remove-WrappingQuotes {
  param([string]$Value)

  if (
    ($Value.StartsWith('"') -and $Value.EndsWith('"')) -or
    ($Value.StartsWith("'") -and $Value.EndsWith("'"))
  ) {
    return $Value.Substring(1, $Value.Length - 2)
  }

  return $Value
}

function Load-WorkspaceConfig {
  param(
    [hashtable]$Config,
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf("=")
    if ($separatorIndex -lt 1) {
      continue
    }

    $key = $trimmed.Substring(0, $separatorIndex).Trim()
    $value = Remove-WrappingQuotes ($trimmed.Substring($separatorIndex + 1).Trim())
    $Config[$key] = $value
  }
}

function Start-WorkspaceProcess {
  param(
    [string]$Title,
    [string]$WorkingDirectory,
    [hashtable]$Environment,
    [string[]]$Commands
  )

  $commandParts = @(
    '$ErrorActionPreference = ''Stop'''
    '$ProgressPreference = ''SilentlyContinue'''
    '$host.UI.RawUI.WindowTitle = ' + (Quote-PowerShellLiteral $Title)
    'Set-Location -LiteralPath ' + (Quote-PowerShellLiteral $WorkingDirectory)
  )

  foreach ($entry in $Environment.GetEnumerator() | Sort-Object Key) {
    $commandParts += '$env:' + $entry.Key + ' = ' + (Quote-PowerShellLiteral ([string]$entry.Value))
  }

  $commandParts += $Commands
  $fullCommand = [string]::Join("; ", $commandParts)

  Start-Process -FilePath "powershell.exe" -WorkingDirectory $WorkingDirectory -ArgumentList @(
    "-NoExit"
    "-ExecutionPolicy"
    "Bypass"
    "-Command"
    $fullCommand
  ) | Out-Null
}

function Assert-PathExists {
  param(
    [string]$Path,
    [string]$Message
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw $Message
  }
}

if (-not (Test-Path -LiteralPath $workspaceEnvPath) -and (Test-Path -LiteralPath $workspaceEnvExamplePath)) {
  Copy-Item -LiteralPath $workspaceEnvExamplePath -Destination $workspaceEnvPath
  Write-Host "Created workspace.env from workspace.env.example."
}

$config = [ordered]@{
  NOVEL_WRITER_FRONTEND_PORT = "4173"
  NOVEL_WRITER_BRIDGE_PORT = "8787"
  VITE_BRIDGE_BASE_URL = ""
  VITE_OPERA_FRONTEND_URL = ""
  NOVEL_WRITER_GITHUB_TOKEN = ""
  NOVEL_WRITER_OPENROUTER_API_KEY = ""
  NOVEL_WRITER_OPERA_BASE_URL = ""
  OPERA_FRONTEND_PORT = "5173"
  OPERA_BACKEND_PORT = "8000"
  OPERA_PYTHON_BIN = "python"
  OPERA_DATABASE_URL = "sqlite+pysqlite:///./opera_trpg.db"
  OPERA_CORS_ORIGINS = ""
  OPENROUTER_API_KEY = ""
  OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
  OPENROUTER_SITE_URL = ""
  OPENROUTER_SITE_NAME = "Opera TRPG"
  OPERA_MEMORY_TOKEN_THRESHOLD = "900"
  OPERA_RETRIEVAL_LIMIT = "4"
}

Load-WorkspaceConfig -Config $config -Path $workspaceEnvPath

if (-not $config["VITE_BRIDGE_BASE_URL"]) {
  $config["VITE_BRIDGE_BASE_URL"] = "http://127.0.0.1:$($config["NOVEL_WRITER_BRIDGE_PORT"])"
}
if (-not $config["VITE_OPERA_FRONTEND_URL"]) {
  $config["VITE_OPERA_FRONTEND_URL"] = "http://127.0.0.1:$($config["OPERA_FRONTEND_PORT"])"
}
if (-not $config["NOVEL_WRITER_OPERA_BASE_URL"]) {
  $config["NOVEL_WRITER_OPERA_BASE_URL"] = "http://127.0.0.1:$($config["OPERA_BACKEND_PORT"])/api"
}
if (-not $config["OPENROUTER_SITE_URL"]) {
  $config["OPENROUTER_SITE_URL"] = "http://127.0.0.1:$($config["OPERA_FRONTEND_PORT"])"
}
if (-not $config["OPERA_CORS_ORIGINS"]) {
  $config["OPERA_CORS_ORIGINS"] = @(
    "http://127.0.0.1:$($config["OPERA_FRONTEND_PORT"])"
    "http://localhost:$($config["OPERA_FRONTEND_PORT"])"
    "http://127.0.0.1:$($config["NOVEL_WRITER_FRONTEND_PORT"])"
    "http://localhost:$($config["NOVEL_WRITER_FRONTEND_PORT"])"
  ) -join ","
}

$novelWriterFrontendPath = Join-Path $repoRoot "frontend"
$bridgePath = Join-Path $repoRoot "backend\mcp_bridge"
$operaRoot = Join-Path $repoRoot "external\opera"
$operaFrontendPath = Join-Path $operaRoot "frontend"

Assert-PathExists -Path $novelWriterFrontendPath -Message "Novel Writer frontend was not found."
Assert-PathExists -Path $bridgePath -Message "Novel Writer bridge was not found."
Assert-PathExists -Path $operaRoot -Message "Opera submodule was not found at external\opera. Initialize the submodule first."
Assert-PathExists -Path $operaFrontendPath -Message "Opera frontend was not found."

if (-not (Test-Path -LiteralPath (Join-Path $novelWriterFrontendPath "node_modules"))) {
  Write-Warning "frontend/node_modules is missing. Run npm install in frontend if the frontend window fails to start."
}
if (-not (Test-Path -LiteralPath (Join-Path $bridgePath "node_modules"))) {
  Write-Warning "backend/mcp_bridge/node_modules is missing. Run npm install in backend/mcp_bridge if the bridge window fails to start."
}
if (-not (Test-Path -LiteralPath (Join-Path $operaFrontendPath "node_modules"))) {
  Write-Warning "external/opera/frontend/node_modules is missing. Run npm install in external/opera/frontend if the Opera window fails to start."
}

Start-WorkspaceProcess -Title "Opera Backend" -WorkingDirectory $operaRoot -Environment @{
  OPERA_DATABASE_URL = $config["OPERA_DATABASE_URL"]
  OPENROUTER_API_KEY = $config["OPENROUTER_API_KEY"]
  OPENROUTER_BASE_URL = $config["OPENROUTER_BASE_URL"]
  OPENROUTER_SITE_URL = $config["OPENROUTER_SITE_URL"]
  OPENROUTER_SITE_NAME = $config["OPENROUTER_SITE_NAME"]
  OPERA_MEMORY_TOKEN_THRESHOLD = $config["OPERA_MEMORY_TOKEN_THRESHOLD"]
  OPERA_RETRIEVAL_LIMIT = $config["OPERA_RETRIEVAL_LIMIT"]
  OPERA_CORS_ORIGINS = $config["OPERA_CORS_ORIGINS"]
  OPERA_BACKEND_PORT = $config["OPERA_BACKEND_PORT"]
  OPERA_PYTHON_BIN = $config["OPERA_PYTHON_BIN"]
} -Commands @(
  '& $env:OPERA_PYTHON_BIN -m uvicorn backend.app.main:app --host 127.0.0.1 --port $env:OPERA_BACKEND_PORT --reload'
)

Start-Sleep -Milliseconds 400

Start-WorkspaceProcess -Title "Opera Frontend" -WorkingDirectory $operaFrontendPath -Environment @{
  VITE_API_BASE = $config["NOVEL_WRITER_OPERA_BASE_URL"]
  OPERA_FRONTEND_PORT = $config["OPERA_FRONTEND_PORT"]
} -Commands @(
  'npm run dev -- --host 127.0.0.1 --port $env:OPERA_FRONTEND_PORT'
)

Start-Sleep -Milliseconds 400

Start-WorkspaceProcess -Title "Novel Writer Bridge" -WorkingDirectory $bridgePath -Environment @{
  NOVEL_WRITER_GITHUB_TOKEN = $config["NOVEL_WRITER_GITHUB_TOKEN"]
  NOVEL_WRITER_OPENROUTER_API_KEY = $config["NOVEL_WRITER_OPENROUTER_API_KEY"]
  NOVEL_WRITER_BRIDGE_PORT = $config["NOVEL_WRITER_BRIDGE_PORT"]
  NOVEL_WRITER_OPERA_BASE_URL = $config["NOVEL_WRITER_OPERA_BASE_URL"]
} -Commands @(
  'npm run build'
  'if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }'
  'npm start'
)

Start-Sleep -Milliseconds 400

Start-WorkspaceProcess -Title "Novel Writer Frontend" -WorkingDirectory $novelWriterFrontendPath -Environment @{
  NOVEL_WRITER_FRONTEND_PORT = $config["NOVEL_WRITER_FRONTEND_PORT"]
  VITE_BRIDGE_BASE_URL = $config["VITE_BRIDGE_BASE_URL"]
  VITE_OPERA_FRONTEND_URL = $config["VITE_OPERA_FRONTEND_URL"]
} -Commands @(
  'npm run dev -- --host 127.0.0.1 --port $env:NOVEL_WRITER_FRONTEND_PORT'
)

Write-Host ""
Write-Host "Workspace processes launched:"
Write-Host "  Novel Writer:   http://127.0.0.1:$($config["NOVEL_WRITER_FRONTEND_PORT"])"
Write-Host "  Bridge API:     http://127.0.0.1:$($config["NOVEL_WRITER_BRIDGE_PORT"])"
Write-Host "  Opera frontend: http://127.0.0.1:$($config["OPERA_FRONTEND_PORT"])"
Write-Host "  Opera backend:  http://127.0.0.1:$($config["OPERA_BACKEND_PORT"])/api"
