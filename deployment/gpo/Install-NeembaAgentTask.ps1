param(
    [string]$ScriptSourcePath = "\\srv\neemba\deployment\gpo\Neemba-Agent-Checkin.ps1",
    [string]$LocalScriptPath = "C:\ProgramData\NeembaTracker\agent\Neemba-Agent-Checkin.ps1",
    [string]$TaskName = "NeembaTracker-AgentCheckin",
    [string]$ApiUrl = "https://neemba.example.com/api/agent/checkin",
    [string]$ApiKey = "NEEMBA_AGENT_KEY",
    [int]$IntervalMinutes = 240,
    # Le lieu des postes visés par cette stratégie : l'agent ne peut pas le deviner.
    [string]$Country = "",
    [string]$Site = "",
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"

function Ensure-ParentDirectory {
    param([string]$Path)
    $parent = Split-Path -Parent $Path
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
}

Ensure-ParentDirectory -Path $LocalScriptPath
Copy-Item -Path $ScriptSourcePath -Destination $LocalScriptPath -Force

$argList = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$LocalScriptPath`"",
    '-ApiUrl', "`"$ApiUrl`"",
    '-ApiKey', "`"$ApiKey`""
)
if ($Country) { $argList += @('-Country', "`"$Country`"") }
if ($Site) { $argList += @('-Site', "`"$Site`"") }
if ($Service) { $argList += @('-Service', "`"$Service`"") }
$argList = $argList -join ' '

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argList
$triggerAtStartup = New-ScheduledTaskTrigger -AtStartup
$triggerRecurrent = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest -LogonType ServiceAccount

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger @($triggerAtStartup, $triggerRecurrent) `
    -Principal $principal `
    -Settings $settings `
    -Force | Out-Null

Write-Host "Tâche '$TaskName' installée avec succès."
