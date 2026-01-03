# Using External USB Drive with Folder Server

## Quick Setup (Windows + WSL2)

### 1. Disable USB Selective Suspend
Windows auto-sleeps USB ports. Disable it:
```powershell
powercfg /SETACVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /SETDCVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
```

### 2. Create `.env` File
```
INDEX_FOLDER=G:/Old Files
DB_USER=admin
DB_PASSWORD=password
DB_NAME=folder_db
APP_HOST_PORT=4001
```
Replace `G:/Old Files` with your USB drive path (use forward slashes).

### 3. Run Startup Script
```powershell
.\mount-and-start.ps1
```
This mounts the USB drive in WSL and starts Docker containers.

### 4. Access API
Open browser: `http://localhost:4001/api-docs`

## What's Happening
- The script creates a direct WSL2 mount to bypass Docker Desktop's unreliable USB mounting
- Without this mount, Docker can't access files on external USB drives reliably
- The startup script should be run each time you restart your PC or reconnect the USB

## Troubleshooting
- **Files not found**: USB might be sleeping → run startup script again
- **Mount failed**: Check drive letter (G:) matches your USB drive
- **Permission denied**: Run PowerShell as Administrator

## Using Internal Folder Instead
If you want to use a local internal folder instead:
```bash
docker-compose -f docker-compose.normal.yml up -d
```
No special mounting needed; files are stored in a Docker volume.
