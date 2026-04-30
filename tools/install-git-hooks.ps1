git config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) {
  throw "Failed to install Git hooks."
}
Write-Host "Git hooks installed: core.hooksPath=.githooks"
