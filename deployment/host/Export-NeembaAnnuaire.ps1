# Source « Annuaire » : envoie au serveur de collecte les ordinateurs d'Active Directory.
#
# À planifier sur un poste du domaine qui a le module ActiveDirectory (RSAT). L'annuaire ne
# connaît que le nom, le système et la dernière ouverture de session : le numéro de série et
# les logiciels viennent de l'agent, et le serveur réunit les deux sous la même machine.
#
#   -StaleDays 90   n'envoie pas les comptes muets depuis plus de 90 jours (0 : tous).
#   -DryRun         affiche le lot sans l'envoyer.
param(
    [string]$ApiUrl = "https://neemba.example.com/api/agent/checkin",
    [string]$ApiKey = "NEEMBA_AGENT_KEY",
    [string]$SearchBase = "",
    [int]$StaleDays = 90,
    [string]$Country = "",
    [string]$Site = "",
    [int]$BatchSize = 500,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Get-DirectoryComputers {
    Import-Module ActiveDirectory
    $query = @{
        Filter = 'Enabled -eq $true'
        Properties = @('DNSHostName', 'OperatingSystem', 'OperatingSystemVersion', 'LastLogonTimestamp', 'Description')
    }
    if ($SearchBase) { $query.SearchBase = $SearchBase }
    return @(Get-ADComputer @query)
}

function ConvertTo-CheckIn {
    param($Computer, [datetime]$Now)
    $seen = $null
    if ($Computer.LastLogonTimestamp) { $seen = [datetime]::FromFileTimeUtc([long]$Computer.LastLogonTimestamp) }
    if ($StaleDays -gt 0 -and $seen -and $seen -lt $Now.AddDays(-$StaleDays)) { return $null }

    $hostname = [string]$Computer.DNSHostName
    if (-not $hostname) { $hostname = [string]$Computer.Name }
    $generatedAt = $Now
    if ($seen) { $generatedAt = $seen }
    $domain = ""
    if ($hostname -like "*.*") { $domain = $hostname.Substring($hostname.IndexOf('.') + 1) }

    return @{
        schema = "neemba.agent.checkin.v1"
        source = "active_directory"
        generatedAt = $generatedAt.ToString("o")
        # Un compte qui n'a pas rouvert de session depuis le dernier export n'est pas renvoyé.
        checkinId = ("ad-{0}-{1}" -f $Computer.Name, $generatedAt.ToString("yyyyMMddHHmm"))
        device = @{
            machineName = [string]$Computer.Name
            hostname = $hostname
            os = ("{0} {1}" -f $Computer.OperatingSystem, $Computer.OperatingSystemVersion).Trim()
            domain = $domain
        }
        context = @{ country = $Country; site = $Site }
    }
}

function Send-Batch {
    param([object[]]$CheckIns)
    $json = @{ checkins = $CheckIns } | ConvertTo-Json -Depth 8 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return Invoke-RestMethod -Method Post -Uri ($ApiUrl.TrimEnd('/') + '/batch') -Body $bytes `
        -ContentType "application/json; charset=utf-8" `
        -Headers @{ "x-api-key" = $ApiKey } -TimeoutSec 120
}

function Invoke-Export {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    } catch { }

    $now = (Get-Date).ToUniversalTime()
    $checkIns = @(Get-DirectoryComputers | ForEach-Object { ConvertTo-CheckIn -Computer $_ -Now $now } | Where-Object { $_ })
    if ($DryRun) {
        Write-Output (@{ checkins = $checkIns } | ConvertTo-Json -Depth 8)
        return
    }

    $stored = 0; $duplicates = 0; $rejected = 0
    for ($start = 0; $start -lt $checkIns.Count; $start += $BatchSize) {
        $end = [Math]::Min($start + $BatchSize, $checkIns.Count) - 1
        $result = Send-Batch -CheckIns $checkIns[$start..$end]
        $stored += [int]$result.stored
        $duplicates += [int]$result.duplicates
        $rejected += [int]$result.rejected
    }
    Write-Host ("Annuaire : {0} ordinateur(s), {1} enregistré(s), {2} déjà connu(s), {3} refusé(s)" -f $checkIns.Count, $stored, $duplicates, $rejected)
}

# Chargé par « . .\Export-NeembaAnnuaire.ps1 », le script ne fait que définir ses fonctions.
if ($MyInvocation.InvocationName -ne '.') {
    Invoke-Export
}
