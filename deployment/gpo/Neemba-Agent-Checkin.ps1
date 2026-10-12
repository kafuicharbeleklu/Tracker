# Agent de collecte du Tracker : relève le poste et l'envoie au serveur de collecte.
#
# Lancé par la tâche planifiée que pose Install-NeembaAgentTask.ps1. Compatible avec
# Windows PowerShell 5.1, celui que Windows 10 et 11 livrent.
#
#   -DryRun   affiche la remontée sans rien envoyer ni mettre en file.
param(
    [string]$ApiUrl = "https://neemba.example.com/api/agent/checkin",
    [string]$ApiKey = "NEEMBA_AGENT_KEY",
    [string]$QueuePath = "C:\ProgramData\NeembaTracker\queue\agent-checkins.jsonl",
    [int]$QueueFlushLimit = 50,
    [int]$QueueMaxLines = 500,
    [string]$Country = "",
    [string]$Site = "",
    [string]$Service = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$AgentVersion = "2.0.0"

function Ensure-Directory {
    param([string]$Path)
    $directory = Split-Path -Parent $Path
    if ($directory -and -not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
}

# Une classe WMI absente ou refusée ne doit pas faire perdre toute la remontée.
function Read-Safely {
    param([scriptblock]$Read)
    try { return & $Read } catch { return $null }
}

# Le type vient du châssis (Win32_SystemEnclosure) : il valait « Laptop » pour tout le monde.
function Get-DeviceType {
    param($ChassisTypes)
    foreach ($chassis in @($ChassisTypes)) {
        $code = [int]$chassis
        if ($code -in 8, 9, 10, 11, 12, 14, 18, 21, 31, 32) { return "Laptop" }
        if ($code -eq 30) { return "Tablet" }
        if ($code -in 17, 23, 28) { return "Server" }
        if ($code -in 3, 4, 5, 6, 7, 13, 15, 16, 35, 36) { return "Desktop" }
    }
    return ""
}

# Qui se sert du poste. La tâche planifiée tourne sous SYSTEM : $env:USERNAME ne dit donc
# rien. On prend la session ouverte à la console, à défaut la dernière ouverte, sans le
# domaine ; jamais un compte de machine (« PC-01$ ») ni un compte du système.
function Resolve-SessionUser {
    param([string[]]$Candidates)
    foreach ($candidate in $Candidates) {
        if (-not $candidate) { continue }
        $name = $candidate.Trim()
        if ($name.Contains('\')) { $name = $name.Substring($name.LastIndexOf('\') + 1) }
        if ($name.Contains('@')) { $name = $name.Substring(0, $name.IndexOf('@')) }
        if (-not $name -or $name.EndsWith('$')) { continue }
        if ($name -in @('SYSTEM', 'SYSTÈME', 'LOCAL SERVICE', 'NETWORK SERVICE', 'defaultuser0')) { continue }
        return $name
    }
    return ""
}

function Test-AnyPath {
    param([string[]]$Paths)
    foreach ($path in $Paths) {
        if (Test-Path $path) { return $true }
    }
    return $false
}

function Get-DeviceFacts {
    $computerSystem = Read-Safely { Get-CimInstance Win32_ComputerSystem }
    $bios = Read-Safely { Get-CimInstance Win32_BIOS }
    $os = Read-Safely { Get-CimInstance Win32_OperatingSystem }
    $processor = Read-Safely { Get-CimInstance Win32_Processor | Select-Object -First 1 }
    $enclosure = Read-Safely { Get-CimInstance Win32_SystemEnclosure | Select-Object -First 1 }
    $diskBytes = Read-Safely { (Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Measure-Object -Property Size -Sum).Sum }
    $mac = Read-Safely { (Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true -and $_.MACAddress } | Select-Object -First 1).MACAddress }
    $lastLoggedOn = Read-Safely { (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Authentication\LogonUI").LastLoggedOnUser }
    $ipv4 = Read-Safely { (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress }

    $ramGb = 0
    if ($computerSystem -and $computerSystem.TotalPhysicalMemory) {
        $ramGb = [Math]::Round(($computerSystem.TotalPhysicalMemory / 1GB), 0)
    }
    $storageGb = 0
    if ($diskBytes) { $storageGb = [Math]::Round(($diskBytes / 1GB), 0) }
    $osName = ""
    if ($os) { $osName = ("{0} {1}" -f $os.Caption, $os.Version).Trim() }
    $model = ""
    if ($computerSystem) { $model = ("{0} {1}" -f $computerSystem.Manufacturer, $computerSystem.Model).Trim() }
    $chassisTypes = @()
    if ($enclosure) { $chassisTypes = $enclosure.ChassisTypes }

    return @{
        schema = "neemba.agent.checkin.v1"
        generatedAt = (Get-Date).ToUniversalTime().ToString("o")
        source = "agent"
        agentVersion = $AgentVersion
        checkinId = ("chk-{0}-{1}" -f $env:COMPUTERNAME, [DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
        device = @{
            machineName = [string]$env:COMPUTERNAME
            hostname = [string]$env:COMPUTERNAME
            assetId = ""
            serialNumber = [string]$bios.SerialNumber
            biosUuid = [string]$computerSystem.UUID
            os = $osName
            ramGb = $ramGb
            storageGb = $storageGb
            cpu = [string]$processor.Name
            macAddress = [string]$mac
            ipAddress = [string]$ipv4
            domain = [string]$env:USERDOMAIN
            type = (Get-DeviceType -ChassisTypes $chassisTypes)
            model = $model
        }
        user = @{
            name = (Resolve-SessionUser @([string]$computerSystem.UserName, [string]$lastLoggedOn, [string]$env:USERNAME))
            email = ""
        }
        context = @{
            country = $Country
            site = $Site
            service = $Service
        }
        apps = @{
            sentinelOne = (Test-AnyPath @("C:\Program Files\SentinelOne\Sentinel Agent*"))
            matrix42 = (Test-AnyPath @("C:\Program Files\Matrix42*", "C:\Program Files (x86)\Matrix42*"))
            manageEngine = (Test-AnyPath @("C:\Program Files (x86)\ManageEngine*", "C:\Program Files\ManageEngine*"))
        }
    }
}

# Rend « sent », « dropped » (le serveur refuse : inutile de réessayer) ou « retry ».
# La clé voyage dans l'en-tête : elle n'est ni dans le corps ni dans la file sur le disque.
function Send-CheckIn {
    param([string]$Json)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Json)
    try {
        Invoke-RestMethod -Method Post -Uri $ApiUrl -Body $bytes `
            -ContentType "application/json; charset=utf-8" `
            -Headers @{ "x-api-key" = $ApiKey } -TimeoutSec 20 | Out-Null
        return "sent"
    } catch {
        $status = 0
        $response = $_.Exception.Response
        if ($response -and $response.StatusCode) { $status = [int]$response.StatusCode }
        if ($status -ge 400 -and $status -lt 500 -and $status -ne 408 -and $status -ne 429) {
            return "dropped"
        }
        return "retry"
    }
}

function Read-Queue {
    if (-not (Test-Path $QueuePath)) { return @() }
    return @(Get-Content -Path $QueuePath -Encoding UTF8 | Where-Object { $_ -and $_.Trim().Length -gt 0 })
}

# La file garde les dernières remontées : un poste longtemps hors réseau ne remplit pas le disque.
function Write-Queue {
    param([string[]]$Lines)
    if (-not $Lines -or $Lines.Count -eq 0) {
        Remove-Item -Path $QueuePath -Force -ErrorAction SilentlyContinue
        return
    }
    Ensure-Directory -Path $QueuePath
    $kept = @($Lines | Select-Object -Last $QueueMaxLines)
    Set-Content -Path $QueuePath -Value $kept -Encoding UTF8
}

# Les lignes repartent telles qu'elles ont été écrites : rien n'est relu en objet, donc rien
# ne dépend de la version de PowerShell.
function Flush-Queue {
    $lines = Read-Queue
    if ($lines.Count -eq 0) { return }

    $remaining = New-Object System.Collections.Generic.List[string]
    $attempts = 0
    $serverDown = $false
    foreach ($line in $lines) {
        if ($serverDown -or $attempts -ge $QueueFlushLimit) {
            $remaining.Add($line)
            continue
        }
        $attempts++
        $outcome = Send-CheckIn -Json $line
        if ($outcome -eq "retry") {
            $remaining.Add($line)
            $serverDown = $true
        }
    }
    Write-Queue -Lines $remaining.ToArray()
}

function Invoke-CheckIn {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    } catch { }

    $json = (Get-DeviceFacts) | ConvertTo-Json -Depth 8 -Compress
    if ($DryRun) {
        Write-Output $json
        return
    }

    Flush-Queue
    $outcome = Send-CheckIn -Json $json
    if ($outcome -eq "retry") {
        $queued = New-Object System.Collections.Generic.List[string]
        foreach ($line in (Read-Queue)) { $queued.Add($line) }
        $queued.Add($json)
        Write-Queue -Lines $queued.ToArray()
    }
}

# Chargé par « . .\Neemba-Agent-Checkin.ps1 », le script ne fait que définir ses fonctions.
if ($MyInvocation.InvocationName -ne '.') {
    Invoke-CheckIn
}
