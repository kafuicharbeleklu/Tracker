param(
    [string]$ApiUrl = "https://neemba.example.com/api/agent/checkin",
    [string]$ApiKey = "NEEMBA_AGENT_KEY",
    [string]$QueuePath = "C:\ProgramData\NeembaTracker\queue\agent-checkins.jsonl",
    [int]$QueueFlushLimit = 50
)

$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param([string]$Path)
    $directory = Split-Path -Parent $Path
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
}

function Get-DeviceFacts {
    $computerSystem = Get-CimInstance Win32_ComputerSystem
    $bios = Get-CimInstance Win32_BIOS
    $os = Get-CimInstance Win32_OperatingSystem
    $processor = Get-CimInstance Win32_Processor | Select-Object -First 1
    $diskBytes = (Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Measure-Object -Property Size -Sum).Sum
    $mac = (Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true -and $_.MACAddress } | Select-Object -First 1).MACAddress
    $ipv4 = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress

    $sentinelOne = Test-Path "C:\Program Files\SentinelOne\Sentinel Agent*"
    $matrix42 = Test-Path "C:\Program Files\Matrix42*"
    $manageEngine = Test-Path "C:\Program Files (x86)\ManageEngine*" -or (Test-Path "C:\Program Files\ManageEngine*")

    return @{
        schema = "neemba.agent.checkin.v1"
        generatedAt = (Get-Date).ToUniversalTime().ToString("o")
        source = "agent"
        agentVersion = "1.0.0"
        checkinId = ("chk-{0}-{1}" -f $env:COMPUTERNAME, [DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
        auth = @{
            apiKey = $ApiKey
        }
        device = @{
            machineName = $env:COMPUTERNAME
            hostname = $env:COMPUTERNAME
            assetId = ""
            serialNumber = [string]$bios.SerialNumber
            biosUuid = [string]$computerSystem.UUID
            os = "$($os.Caption) $($os.Version)"
            ramGb = [Math]::Round(($computerSystem.TotalPhysicalMemory / 1GB), 0)
            storageGb = [Math]::Round(($diskBytes / 1GB), 0)
            cpu = [string]$processor.Name
            macAddress = [string]$mac
            ipAddress = [string]$ipv4
            domain = [string]$env:USERDOMAIN
            type = "Laptop"
            model = "$($computerSystem.Manufacturer) $($computerSystem.Model)"
        }
        user = @{
            name = [string]$env:USERNAME
            email = ""
        }
        context = @{
            country = ""
            site = ""
            service = ""
        }
        apps = @{
            sentinelOne = [bool]$sentinelOne
            matrix42 = [bool]$matrix42
            manageEngine = [bool]$manageEngine
        }
    }
}

function Send-CheckIn {
    param([hashtable]$Payload)
    $json = $Payload | ConvertTo-Json -Depth 8 -Compress
    try {
        Invoke-RestMethod -Method Post -Uri $ApiUrl -Body $json -ContentType "application/json" -TimeoutSec 20 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Append-ToQueue {
    param([hashtable]$Payload)
    Ensure-Directory -Path $QueuePath
    $line = $Payload | ConvertTo-Json -Depth 8 -Compress
    Add-Content -Path $QueuePath -Value $line
}

function Flush-Queue {
    if (-not (Test-Path $QueuePath)) { return }
    $lines = Get-Content -Path $QueuePath
    if (-not $lines -or $lines.Count -eq 0) { return }

    $remaining = New-Object System.Collections.Generic.List[string]
    $processed = 0
    foreach ($line in $lines) {
        if ($processed -ge $QueueFlushLimit) {
            $remaining.Add($line)
            continue
        }
        $parsed = $null
        try {
            $parsed = $line | ConvertFrom-Json -AsHashtable
        } catch {
            continue
        }
        if ($null -eq $parsed) { continue }
        $ok = Send-CheckIn -Payload $parsed
        if (-not $ok) {
            $remaining.Add($line)
        } else {
            $processed++
        }
    }

    if ($remaining.Count -eq 0) {
        Remove-Item -Path $QueuePath -Force -ErrorAction SilentlyContinue
    } else {
        $remaining | Set-Content -Path $QueuePath
    }
}

Ensure-Directory -Path $QueuePath
Flush-Queue

$payload = Get-DeviceFacts
$sent = Send-CheckIn -Payload $payload
if (-not $sent) {
    Append-ToQueue -Payload $payload
}
