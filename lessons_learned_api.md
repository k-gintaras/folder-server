# Lessons Learned: API Development for Folder Server

## Summary of Discussion
We worked on creating and debugging the folder server API, focusing on the following tasks:

1. **Database Schema and Routes**: Created tables (`files`, `items`) and their CRUD routes.
2. **Indexing Logic**: Implemented logic to populate `files` and `items` tables during folder indexing.
3. **Debugging Issues**:
   - `/api/items` endpoint was inaccessible initially.
   - `items` table was not being populated correctly during indexing.
4. **Adjustments Made**:
   - Added detailed logging and error handling.
   - Ensured `items` table entries are created even if `files` already exist.
   - Simplified debugging by wiping the database and testing from a clean state.

We also worked on ensuring the Dockerized folder server API was accessible and correctly configured, focusing on the following tasks:

1. **Server Accessibility**: Resolved issues with the Swagger API docs not being accessible at the expected ports.
2. **Port Configuration**: Updated the server to bind to `0.0.0.0` and ensured the correct host port was passed into the container environment.
3. **Logging Accuracy**: Fixed server logs to display the correct host port information.
4. **Verification**: Tested HTTP connectivity to `/` and `/api-docs` endpoints to confirm accessibility.

## Mistakes Made
1. **Overlooking Dependencies**: Initially skipped verifying if `items` were inserted when `files` already existed.
2. **Complex Logic**: The indexing logic became overly complex, making debugging harder.
3. **Incomplete Testing**: Assumed functionality without thoroughly testing edge cases.
4. **Rebuilding Workflow**: Missed wiping the database earlier, leading to confusion about existing data.
5. **Initial Binding Issue**: The server was not bound to `0.0.0.0`, causing accessibility issues.
6. **Environment Variables**: Overlooked passing the `APP_HOST_PORT` into the container initially.
7. **Incomplete Verification**: Did not verify the logs and `/api-docs` accessibility together in the first attempt.

## Lessons Learned
1. **Test Incrementally**: Test each component (e.g., `files` and `items` insertion) independently before integrating.
2. **Simplify Logic**: Avoid overly complex conditions; prioritize clarity and maintainability.
3. **Use Clean States**: Start with a clean database state during debugging to eliminate data-related ambiguities.
4. **Add Comprehensive Logs**: Use detailed logs to trace issues quickly.
5. **Validate Assumptions**: Always verify assumptions with tests, especially for edge cases.
6. **Bind to `0.0.0.0` Early**: Always ensure the server binds to `0.0.0.0` for containerized environments.
7. **Verify Logs and Connectivity**: Check both server logs and endpoint accessibility after making changes.
8. **Use Environment Variables**: Pass all necessary environment variables explicitly to avoid misconfigurations.
9. **Rebuild and Test Thoroughly**: Rebuild containers and test all endpoints after configuration changes.
10. **Document Changes**: Keep a record of changes and their impact to streamline future debugging.

By applying these lessons, we can streamline future development and debugging processes, saving time and reducing errors. We can also avoid similar issues and ensure a smoother development process in the future.

## Critical Issue: USB Drive Mounting in Docker with Windows WSL2

### Problem
When running Docker containers on Windows with WSL2, files on an external USB drive (G:) became inaccessible from the containers. The error was:
```
Error: EINVAL: invalid argument, stat '/mnt/index-folder/2022/652372daa4229.mp4'
```

**Key Symptom**: Files worked fine when accessing the PC remotely via TeamViewer, but failed when accessing locally.

### Root Causes (Multiple Issues)
1. **Windows USB Selective Suspend**: Windows was automatically putting the USB port to sleep during idle periods
2. **Docker Desktop's Flaky Mount Path**: Docker Desktop's automatic mount at `/run/desktop/mnt/host/g/` was unreliable with USB drives
3. **Path Format Issues**: Windows backslashes in paths (`G:\Old Files`) vs Docker forward slashes (`G:/Old Files`)
4. **Absolute Path Handling**: Server code didn't properly handle absolute paths set via environment variables

### Solution Applied
1. **Disabled USB Selective Suspend** in Windows Power Settings:
   ```powershell
   powercfg /SETACVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
   powercfg /SETDCVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
   ```

2. **Created Direct WSL2 Mount** instead of relying on Docker Desktop's automatic mounting:
   ```powershell
   wsl -u root sh -c "mkdir -p /mnt/g && mount -t drvfs G: /mnt/g"
   ```

3. **Updated docker-compose.yml** to use environment variable:
   ```yaml
   volumes:
     - ${INDEX_FOLDER}:/mnt/index-folder
   ```

4. **Set INDEX_FOLDER in .env** with forward slashes:
   ```
   INDEX_FOLDER=G:/Old Files
   ```

5. **Fixed server.ts** to handle absolute paths properly:
   ```typescript
   const indexRoot = path.isAbsolute(env.indexFolder) ? env.indexFolder : path.resolve(process.cwd(), env.indexFolder);
   ```

6. **Created startup script** (`mount-and-start.ps1`) to mount before Docker start:
   ```powershell
   wsl -u root sh -c "mkdir -p /mnt/g && mount -t drvfs G: /mnt/g"
   docker-compose up -d
   ```

### Why It Works Now
- **Direct WSL mount** bypasses Docker Desktop's unreliable path translation
- **USB Selective Suspend disabled** prevents the OS from putting the USB port to sleep
- **Startup script** ensures the WSL mount is fresh before each Docker start
- **Forward slashes and proper path handling** work across Windows and Docker boundaries
- The mount persists for the lifetime of WSL until `wsl --shutdown` is called

### Key Learnings
1. **USB drives with Docker + WSL2 are fragile**: Don't rely on Docker Desktop's automatic mounting for USB volumes
2. **Power management affects USB**: USB devices can be suspended by Windows, affecting Docker containers
3. **Use direct WSL mounts**: For external drives on Windows with WSL2, mount directly in WSL before starting Docker
4. **Environment variables need proper formatting**: Forward slashes work in both Windows and Docker paths
5. **Create recovery scripts**: Always have a startup script that remounts/reinitializes critical resources

### When It Fails Again
If the issue recurs:
1. Run the startup script: `.\mount-and-start.ps1`
2. Or manually: `wsl --shutdown` then `mount-and-start.ps1`
3. Check if USB is still connected and accessible from Windows Explorer
4. Verify WSL mount with: `wsl -u root sh -c "ls -la /mnt/g"`
