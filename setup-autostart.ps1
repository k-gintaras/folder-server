param(
    [string]$TaskName = "FolderServer-AutoStart",
    [string]$ProjectPath = "C:\Users\Ubaby\Desktop\folder-server",
    [string]$ScriptPath = "C:\Users\Ubaby\Desktop\folder-server\scripts\start-compose.ps1",
    [string]$DelayISO8601 = "PT30S" # 30 seconds delay
)

# Ensure script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Error "Start script not found: $ScriptPath"
    exit 1
}

$trigger = New-ScheduledTaskTrigger -AtLogon -Delay $DelayISO8601
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -ProjectPath `"$ProjectPath`""
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Replace existing task if present
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null

Write-Host "Scheduled Task '$TaskName' registered to start on logon after $DelayISO8601."