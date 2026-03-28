#!/bin/bash

# Database migration script to add id_document_path column
echo "Running database migration to add id_document_path column..."

# Run the SQL migration
psql -U postgres -d slz_coop_staff -f add_id_document_column.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

echo "Database migration finished."