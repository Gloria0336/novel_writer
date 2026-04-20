[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string]$Title,

    [Parameter()]
    [string]$Slug
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function ConvertTo-AsciiSlug {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value
    )

    $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
    $builder = New-Object System.Text.StringBuilder

    foreach ($char in $normalized.ToCharArray()) {
        $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
        if ($category -eq [Globalization.UnicodeCategory]::NonSpacingMark) {
            continue
        }

        if (($char -ge 'a' -and $char -le 'z') -or ($char -ge 'A' -and $char -le 'Z') -or ($char -ge '0' -and $char -le '9')) {
            [void]$builder.Append($char)
        }
        else {
            [void]$builder.Append('-')
        }
    }

    $slug = $builder.ToString().ToLowerInvariant()
    $slug = $slug -replace '-+', '-'
    $slug = $slug.Trim('-')

    return $slug
}

function Get-NextNovelNumber {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RootPath
    )

    $pattern = '^novel_(\d+)(?:_.+)?$'
    $numbers = @()

    foreach ($directory in Get-ChildItem -LiteralPath $RootPath -Directory) {
        if ($directory.Name -match $pattern) {
            $numbers += [int]$Matches[1]
        }
    }

    if ($numbers.Count -eq 0) {
        return 0
    }

    return ([int](($numbers | Measure-Object -Maximum).Maximum) + 1)
}

function Replace-TemplateTokens {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [hashtable]$Tokens
    )

    $content = Get-Content -LiteralPath $Path -Raw -Encoding utf8
    foreach ($key in $Tokens.Keys) {
        $content = $content.Replace($key, $Tokens[$key])
    }
    Set-Content -LiteralPath $Path -Value $content -Encoding utf8
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$templateDir = Join-Path $scriptDir '_template'

if (-not (Test-Path -LiteralPath $templateDir -PathType Container)) {
    throw "Template directory not found: $templateDir"
}

$resolvedTitle = $Title.Trim()
if ([string]::IsNullOrWhiteSpace($resolvedTitle)) {
    throw 'Title cannot be empty.'
}

$resolvedSlug = if ($PSBoundParameters.ContainsKey('Slug')) {
    ConvertTo-AsciiSlug -Value $Slug
}
else {
    ConvertTo-AsciiSlug -Value $resolvedTitle
}

if ([string]::IsNullOrWhiteSpace($resolvedSlug)) {
    $resolvedSlug = 'untitled'
    if (-not $PSBoundParameters.ContainsKey('Slug')) {
        Write-Warning "Title '$resolvedTitle' could not be converted to a safe ASCII slug. Falling back to 'untitled'."
    }
    else {
        throw "Provided slug '$Slug' does not contain any safe ASCII characters after normalization."
    }
}

$nextNumber = [int](Get-NextNovelNumber -RootPath $scriptDir)
$novelId = 'novel_{0:D2}' -f $nextNumber
$folderName = '{0}_{1}' -f $novelId, $resolvedSlug
$destinationDir = Join-Path $scriptDir $folderName

if (Test-Path -LiteralPath $destinationDir) {
    throw "Target directory already exists: $destinationDir"
}

$createdDate = Get-Date -Format 'yyyy-MM-dd'
$tokens = @{
    '{{NOVEL_TITLE}}'  = $resolvedTitle
    '{{NOVEL_SLUG}}'   = $resolvedSlug
    '{{NOVEL_ID}}'     = $novelId
    '{{CREATED_DATE}}' = $createdDate
}

$created = $false

if ($PSCmdlet.ShouldProcess($destinationDir, 'Create new novel project from template')) {
    New-Item -ItemType Directory -Path $destinationDir | Out-Null
    foreach ($templateItem in Get-ChildItem -LiteralPath $templateDir -Force) {
        Copy-Item -LiteralPath $templateItem.FullName -Destination $destinationDir -Recurse -Force
    }

    $textFiles = Get-ChildItem -LiteralPath $destinationDir -Recurse -File -Force | Where-Object {
        $_.Extension -in @('.md', '.yaml', '.yml', '.txt') -or $_.Name -eq '.cursorrules'
    }

    foreach ($file in $textFiles) {
        Replace-TemplateTokens -Path $file.FullName -Tokens $tokens
    }

    $created = $true
}

if ($created) {
    Write-Host "Created project: $folderName"
    Write-Host "Path: $destinationDir"
}
else {
    Write-Host "Planned project: $folderName"
    Write-Host "Path: $destinationDir"
}
