#!/bin/bash

echo "🧹 Starting BookfoldAR cleanup..."

# Delete unused API files
echo "🗑️  Deleting unused API files..."
rm -f pages/api/subscription.ts
rm -f pages/api/stripe/webhook.ts
rm -f pages/api/billing-portal.ts
rm -f pages/api/test-connection.js
rm -f pages/api/test-raw.js

# Delete unused components
echo "🗑️  Deleting unused components..."
rm -f components/PaywallModal.tsx

# Clean up dependencies
echo "📦 Cleaning up package dependencies..."
npm uninstall @types/phoenix undici critters dotenv node-fetch 2>/dev/null || true

# Reinstall clean dependencies
echo "📦 Reinstalling clean dependencies..."
npm install

# Clear build cache
echo "🧹 Clearing build cache..."
rm -rf .next/cache 2>/dev/null || true

# Show results
echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Files deleted:"
echo "   • pages/api/subscription.ts"
echo "   • pages/api/stripe/webhook.ts" 
echo "   • pages/api/billing-portal.ts"
echo "   • pages/api/test-connection.js"
echo "   • pages/api/test-raw.js"
echo "   • components/PaywallModal.tsx"
echo ""
echo "📦 Dependencies removed:"
echo "   • @types/phoenix"
echo "   • undici"
echo "   • critters"
echo "   • dotenv"
echo "   • node-fetch"
echo ""
echo "🚀 Your BookfoldAR codebase is now clean and optimized!"
echo "💡 Next: Run 'npm run build' to test everything still works"