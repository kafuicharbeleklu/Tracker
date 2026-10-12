# Dépose des fichiers de remontées au serveur de collecte, un lot par fichier.
#
# Chaque fichier (.json, .ndjson, .txt) part tel quel vers /api/agent/checkin/batch : c'est le
# serveur qui le lit (tableau, objet « checkins », ou une remontée par ligne). Rien n'est relu
# en objet ici, donc le script tourne aussi sous Windows PowerShell 5.1.
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

# Rend la réponse du serveur, ou $null s'il n'a pas pu être joint ou a refusé le lot entier.
function Send-Batch {
    param([string]$FilePath)
    $bytes = [System.IO.File]::ReadAllBytes($FilePath)
    $batchUrl = $ApiUrl.TrimEnd('/') + '/batch'
    try {
        return Invoke-RestMethod -Method Post -Uri $batchUrl -Body $bytes `
            -ContentType "application/x-ndjson; charset=utf-8" `
            -Headers @{ "x-api-key" = $ApiKey } -TimeoutSec 120
    } catch {
        Write-Host ("  " + $_.Exception.Message)
        return $null
    }
}

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch { }

Ensure-Directory -Path $InputPath
Ensure-Directory -Path $ArchivePath
Ensure-Directory -Path $ErrorPath

$files = @(Get-ChildItem -Path $InputPath -File | Where-Object { $_.Extension -in @('.json', '.ndjson', '.txt') })
if ($files.Count -eq 0) {
    Write-Host "Aucun fichier à importer dans $InputPath"
    exit 0
}

$failed = 0
foreach ($file in $files) {
    $result = Send-Batch -FilePath $file.FullName
    if ($null -eq $result) {
        # Serveur injoignable ou lot refusé : le fichier reste là, il repartira au prochain passage.
        Write-Host "Non envoyé, laissé en place : $($file.Name)"
        $failed++
        continue
    }

    $summary = "{0} reçue(s), {1} enregistrée(s), {2} déjà connue(s), {3} refusée(s)" -f `
        $result.received, $result.stored, $result.duplicates, $result.rejected
    if ([int]$result.rejected -eq 0) {
        Move-Item -Path $file.FullName -Destination (Join-Path $ArchivePath $file.Name) -Force
        Write-Host "Importé : $($file.Name) ($summary)"
    } else {
        Move-Item -Path $file.FullName -Destination (Join-Path $ErrorPath $file.Name) -Force
        Write-Host "Importé en partie, rangé dans error : $($file.Name) ($summary)"
        foreach ($entry in @($result.results | Where-Object { -not $_.ok })) {
            Write-Host ("  ligne {0} : {1}" -f ([int]$entry.index + 1), $entry.message)
        }
        $failed++
    }
}

if ($failed -gt 0) { exit 1 }
