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