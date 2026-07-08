param(
    [string]$InputPath = "C:\Neemba\incoming",
    [string]$ArchivePath = "C:\Neemba\archive",
    [string]$ErrorPath = "C:\Neemba\error",
    [string]$ApiUrl = "https://neemba.example.com/api/agent/checkin",
    [string]$ApiKey = "NEEMBA_AGENT_KEY"
)

$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Normalize-Payload {
    param([hashtable]$Payload)

    if (-not $Payload.ContainsKey('schema')) {
        $Payload.schema = 'neemba.agent.checkin.v1'
    }
    if (-not $Payload.ContainsKey('generatedAt')) {
        $Payload.generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    }
    if (-not $Payload.ContainsKey('source')) {
        $Payload.source = 'agent'
    }
    if (-not $Payload.ContainsKey('auth')) {
        $Payload.auth = @{ apiKey = $ApiKey }
    } elseif ($Payload.auth -is [hashtable]) {
        if (-not $Payload.auth.ContainsKey('apiKey')) {
            $Payload.auth.apiKey = $ApiKey
        }
    }

    return $Payload
}

function Send-CheckIn {
    param([hashtable]$Payload)
    $json = $Payload | ConvertTo-Json -Depth 10 -Compress
    try {
        Invoke-RestMethod -Method Post -Uri $ApiUrl -Body $json -ContentType "application/json" -TimeoutSec 30 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Read-PayloadsFromFile {
    param([string]$FilePath)

    $extension = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
    $raw = Get-Content -Path $FilePath -Raw
    $payloads = New-Object System.Collections.Generic.List[hashtable]

    if ($extension -eq ".ndjson") {
        $lines = $raw -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 }
        foreach ($line in $lines) {
            try {
                $obj = $line | ConvertFrom-Json -AsHashtable
                if ($obj) { $payloads.Add($obj) }
            } catch {}
        }
        return $payloads
    }

    try {
        $parsed = $raw | ConvertFrom-Json -AsHashtable
        if ($parsed -is [hashtable] -and $parsed.ContainsKey('checkins') -and $parsed.checkins -is [array]) {
            foreach ($entry in $parsed.checkins) {
                if ($entry -is [hashtable]) { $payloads.Add($entry) }
            }
        } elseif ($parsed -is [array]) {
            foreach ($entry in $parsed) {
                if ($entry -is [hashtable]) { $payloads.Add($entry) }
            }
        } elseif ($parsed -is [hashtable]) {
            $payloads.Add($parsed)
        }
    } catch {}

    return $payloads
}

Ensure-Directory -Path $InputPath
Ensure-Directory -Path $ArchivePath
Ensure-Directory -Path $ErrorPath

$files = Get-ChildItem -Path $InputPath -File | Where-Object { $_.Extension -in @('.json', '.ndjson', '.txt') }
if (-not $files -or $files.Count -eq 0) {
    Write-Host "Aucun fichier à importer dans $InputPath"
    exit 0
}

foreach ($file in $files) {
    $payloads = Read-PayloadsFromFile -FilePath $file.FullName
    if (-not $payloads -or $payloads.Count -eq 0) {
        Move-Item -Path $file.FullName -Destination (Join-Path $ErrorPath $file.Name) -Force
        Write-Host "Fichier invalide déplacé vers error: $($file.Name)"
        continue
    }

    $allOk = $true
    foreach ($payload in $payloads) {
        $normalized = Normalize-Payload -Payload $payload
        $ok = Send-CheckIn -Payload $normalized
        if (-not $ok) {
            $allOk = $false
            break
        }
    }

    if ($allOk) {
        Move-Item -Path $file.FullName -Destination (Join-Path $ArchivePath $file.Name) -Force
        Write-Host "Import réussi: $($file.Name)"
    } else {
        Move-Item -Path $file.FullName -Destination (Join-Path $ErrorPath $file.Name) -Force
        Write-Host "Import en erreur: $($file.Name)"
    }
}
