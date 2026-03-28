#!/bin/sh
# notify_manager.sh
# Simple helper to POST a new_application payload that will notify manager clients.
# Usage:
#   ./notify_manager.sh [application_id] [member_number] [first_name] [last_name]
# Environment:
#   HOST - base url for staff server (default: http://localhost:5000)

HOST=${HOST:-http://localhost:5000}
APPLICATION_ID=${1:-999}
MEMBER_NUMBER=${2:-MEM0001}
FIRST_NAME=${3:-Auto}
LAST_NAME=${4:-Notify}

PAYLOAD_FILE=$(mktemp /tmp/notify.XXXX.json)
cat > "$PAYLOAD_FILE" <<EOF
{
  "application_id": ${APPLICATION_ID},
  "member_number": "${MEMBER_NUMBER}",
  "first_name": "${FIRST_NAME}",
  "last_name": "${LAST_NAME}",
  "review_status": "under_review",
  "notify_role": "manager"
}
EOF

echo "Posting notification to ${HOST}/api/notify/new-application"
echo "Payload:"
cat "$PAYLOAD_FILE"

echo
curl -v -X POST "${HOST}/api/notify/new-application" \
  -H "Content-Type: application/json" \
  -d @"${PAYLOAD_FILE}"

# cleanup
rm -f "$PAYLOAD_FILE"
