#!/bin/bash
# Run from your repo root: bash rebrand-to-UDA.sh
set -e

FILES="client/src/components/Logo.jsx client/src/pages/Profile.jsx client/src/pages/DebateResult.jsx client/src/pages/AITopics.jsx client/src/pages/Notifications.jsx client/src/pages/Landing.jsx client/src/pages/Leaderboard.jsx client/src/pages/DebateRoom.jsx client/src/pages/Dashboard.jsx client/src/pages/PrepWindow.jsx client/src/pages/Login.jsx client/src/pages/Matchmaking.jsx client/src/pages/Register.jsx client/src/pages/SearchUsers.jsx client/src/pages/Onboarding.jsx client/src/routes/ProtectedRoute.jsx server/src/controllers/userController.js server/src/services/aiService.js server/src/app.js server/src/index.js server/package.json client/src/index.css"

for f in $FILES; do
  if [ -f "$f" ]; then
    sed -i 's/VOXIUM/UDA/g; s/Voxium/UDA/g' "$f"
    echo "renamed in: $f"
  else
    echo "SKIPPED (not found): $f"
  fi
done

# index.html needs the fuller name, not just the short code
sed -i \
  -e "s/Voxium - Where Voices Become Legends. The world's first competitive debate platform./UDA - Unlimited Debate Arena. The world's first competitive debate platform./" \
  -e 's/<title>Voxium - Where Voices Become Legends<\/title>/<title>UDA - Unlimited Debate Arena<\/title>/' \
  client/index.html

# Landing.jsx footer had the old tagline baked in after the generic rename
sed -i 's/UDA - Where Voices Become Legends/UDA - Unlimited Debate Arena/' client/src/pages/Landing.jsx

# server/package.json name field
sed -i 's/"voxium-server"/"uda-server"/' server/package.json

echo ""
echo "Done. Checking for anything left over:"
grep -rln "Voxium\|VOXIUM" client/src server/src server/package.json client/index.html 2>/dev/null || echo "  none found — rename is clean"