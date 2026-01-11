#!/bin/bash
set -e

echo "Creating additional databases..."

# Create folder_a if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${POSTGRES_DB:-postgres}" -c "CREATE DATABASE folder_a;" || true

# Create folder_b if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${POSTGRES_DB:-postgres}" -c "CREATE DATABASE folder_b;" || true

echo "Applying schema to folder_a..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "folder_a" -f /docker-entrypoint-initdb.d/00-schema.sql

echo "Applying schema to folder_b..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "folder_b" -f /docker-entrypoint-initdb.d/00-schema.sql

echo "Database initialization complete"
