#!/bin/bash

# Simple script to add credits to a user via Supabase
# Usage: ./database/add-credits.sh <user-id> <amount> [description]

USER_ID=$1
AMOUNT=$2
DESCRIPTION=${3:-"Admin credit addition"}

if [ -z "$USER_ID" ] || [ -z "$AMOUNT" ]; then
  echo "❌ Missing required arguments"
  echo ""
  echo "Usage:"
  echo "  ./database/add-credits.sh <user-id> <amount> [description]"
  echo ""
  echo "Examples:"
  echo "  ./database/add-credits.sh user_33Fdrdz4hyXRWshiOjEsVOGmbTv 100"
  echo "  ./database/add-credits.sh user_33Fdrdz4hyXRWshiOjEsVOGmbTv 50 \"Testing credits\""
  exit 1
fi

cat <<EOF

═══════════════════════════════════════════════════════════════
🎯 QUICK CREDIT ADDITION - Copy SQL below to Supabase
═══════════════════════════════════════════════════════════════

1. Go to: https://supabase.com/dashboard/project/atopvinhrlicujtwltsg/sql/new
2. Paste and run this SQL:

------------------------------------------------------------
SELECT add_credits(
  '$USER_ID',
  $AMOUNT,
  '$DESCRIPTION'
);

-- View updated balance
SELECT id, email, credit_balance
FROM users
WHERE id = '$USER_ID';
------------------------------------------------------------

Done! The user will have $AMOUNT more credits.

═══════════════════════════════════════════════════════════════
EOF
