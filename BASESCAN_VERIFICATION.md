# Basescan Contract Verification Guide

## Getting a Basescan API Key

1. Go to https://basescan.org/
2. Click "Sign In" in the top right
3. Create an account or sign in
4. Once logged in, hover over your username and click "API Keys"
5. Click "Add" to create a new API key
6. Give it a name like "Stakedriven Verification"
7. Copy the API key

## Manual Verification (Alternative)

If you prefer to verify manually through the Basescan interface:

1. Go to your contract: https://sepolia.basescan.org/address/0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Fill in the verification form:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.24+commit.e11b9ed9
   - Open Source License Type: MIT
   - Click "Continue"
5. On the next page:
   - Paste the contract source code
   - Constructor Arguments: Leave empty (no constructor arguments)
   - Click "Verify and Publish"

## Contract Information for Verification

**PollFactory Contract:**
- Address: 0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6
- Compiler: v0.8.24
- Optimization: Enabled with 200 runs
- No constructor arguments

**Poll Contract (deployed by factory):**
- Will be automatically verified when factory is verified
- Uses the same compiler settings