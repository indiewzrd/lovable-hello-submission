#!/bin/bash

echo "Updating Vercel environment variables..."

# Remove old variables
echo "Removing old variables..."
echo "yes" | npx vercel env rm NEXT_PUBLIC_USDC_ADDRESS production
echo "yes" | npx vercel env rm NEXT_PUBLIC_POLL_FACTORY_ADDRESS production

# Add new variables
echo "Adding new variables..."
echo "0x036CbD53842c5426634e7929541eC2318f3dCF7e" | npx vercel env add NEXT_PUBLIC_USDC_ADDRESS production
echo "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6" | npx vercel env add NEXT_PUBLIC_POLL_FACTORY_ADDRESS production

echo "Environment variables updated!"
echo "Redeploying to Vercel..."
npx vercel --prod