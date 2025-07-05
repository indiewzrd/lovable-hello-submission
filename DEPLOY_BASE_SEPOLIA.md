# Deploy to Base Sepolia Guide

## Prerequisites

1. **Base Sepolia ETH**: You need testnet ETH to pay for gas fees.
   - Get free ETH from: https://docs.base.org/docs/tools/network-faucets
   - Alternative faucets: 
     - https://faucet.quicknode.com/base/sepolia
     - https://www.alchemy.com/faucets/base-sepolia

2. **Basescan API Key** (optional but recommended for contract verification):
   - Go to https://basescan.org/
   - Sign up/login and create an API key

## Setup Environment Variables

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Fill in the required values:
```env
# Your wallet's private key (DO NOT SHARE THIS!)
PRIVATE_KEY=your_private_key_here

# Base Sepolia RPC URL (you can use the public one)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API key for contract verification (optional)
BASESCAN_API_KEY=your_basescan_api_key_here
```

## Deploy Contracts

1. Make sure you have Base Sepolia ETH in your wallet

2. Run the deployment script:
```bash
npm run deploy:base-sepolia
```

3. The script will:
   - Check your ETH balance
   - Deploy the PollFactory contract
   - Use the official Base Sepolia USDC address
   - Attempt to verify the contract on Basescan
   - Provide the contract addresses for Vercel

## Update Vercel Environment Variables

After successful deployment, update your Vercel project:

1. Go to your Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Update these variables with the new addresses:
   - `NEXT_PUBLIC_USDC_ADDRESS`: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
   - `NEXT_PUBLIC_POLL_FACTORY_ADDRESS`: [Your deployed factory address]

4. Redeploy your Vercel app for changes to take effect

## Verify Everything Works

1. Check your contract on Basescan:
   - https://sepolia.basescan.org/address/[YOUR_FACTORY_ADDRESS]

2. Visit your Vercel app and test:
   - Connect wallet
   - Create a project
   - Try creating a poll (you'll need Base Sepolia USDC)

## Getting Test USDC

The USDC contract on Base Sepolia (0x036CbD53842c5426634e7929541eC2318f3dCF7e) is the official test USDC. You may need to:
1. Get some from a faucet if available
2. Or ask in the Base Discord for test USDC
3. Or use a DEX on Base Sepolia to swap ETH for USDC

## Troubleshooting

- **"Insufficient funds"**: Make sure you have Base Sepolia ETH
- **"Contract verification failed"**: You can verify manually later with the command shown
- **"Cannot estimate gas"**: Make sure your private key is correct and has ETH