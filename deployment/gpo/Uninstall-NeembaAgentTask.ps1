param(
    [string]$TaskName = "NeembaTracker-AgentCheckin",
    [string]$LocalScriptPath = "C:\ProgramData\NeembaTracker\agent\Neemba-Agent-Checkin.ps1"
)

$ErrorActionPreference = "Stop"

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Tâche '$TaskName' supprimée."
} else {
    Write-Host "Tâche '$TaskName' non trouvée."
}

if (Test-Path $LocalScriptPath) {
    Remove-Item -Path $LocalScriptPath -Force
    Write-Host "Script local supprimé: $LocalScriptPath"
}
