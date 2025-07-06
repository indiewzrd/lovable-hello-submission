# PollFactory Verification Guide

## Why Verify PollFactory?

When the PollFactory contract is verified on BaseScan, **all Poll contracts deployed by it will be automatically verified**. This means you won't need to verify each individual Poll contract - they'll all inherit verification from the factory!

## PollFactory Contract Details

- **Address**: `0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6`
- **Network**: Base Sepolia (Chain ID: 84532)
- **Compiler**: v0.8.24+commit.e11b9ed9
- **Optimization**: Yes, 200 runs
- **License**: MIT

## Method 1: Using BaseScan Web Interface (Recommended)

1. **Go to BaseScan Verification Page**
   - Visit: https://sepolia.basescan.org/verifyContract?a=0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6

2. **Fill in Contract Details**
   - Contract Address: `0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6` (pre-filled)
   - Contract Name: `PollFactory`
   - Compiler Type: `Solidity (Single file)`
   - Compiler Version: `v0.8.24+commit.e11b9ed9`
   - Open Source License Type: `MIT License (MIT)`

3. **Optimization Settings**
   - Optimization: `Yes`
   - Runs: `200`

4. **Source Code**
   - Copy the entire contents of `PollFactory-Flattened.sol` from the verification-info folder
   - Paste into the "Enter the Solidity Contract Code" field

5. **Constructor Arguments**
   - Leave empty (PollFactory has no constructor arguments)

6. **Complete Verification**
   - Solve the CAPTCHA
   - Click "Verify and Publish"

## Method 2: Using Hardhat (Requires API Key)

1. **Get BaseScan API Key**
   - Register at: https://basescan.org/register
   - Go to: https://basescan.org/myapikey
   - Create new API key

2. **Add to Environment**
   ```bash
   echo "BASESCAN_API_KEY=your_api_key_here" >> .env.local
   ```

3. **Run Verification Script**
   ```bash
   npx hardhat run scripts/verify-factory-contract.js --network baseSepolia
   ```

## Method 3: Using Remix IDE

1. **Open Remix**: https://remix.ethereum.org

2. **Create New File**: `PollFactory.sol`

3. **Paste Source**: Copy contents from `PollFactory-Flattened.sol`

4. **Compile**:
   - Compiler: 0.8.24
   - Enable optimization: 200 runs
   - Compile

5. **Use Etherscan Plugin**:
   - Install "ETHERSCAN - CONTRACT VERIFICATION" plugin
   - Select Base Sepolia network
   - Enter contract address: `0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6`
   - Verify

## After Verification

Once PollFactory is verified:

1. **Check Verification Status**
   - Visit: https://sepolia.basescan.org/address/0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6#code
   - You should see "Contract Source Code Verified"

2. **Test Auto-Verification**
   - Deploy a new Poll using the factory
   - Check the new Poll contract on BaseScan
   - It should show as verified automatically!

## Benefits of Factory Verification

✅ **Automatic Poll Verification**: All deployed Polls are instantly verified
✅ **Better UX**: Users can interact with Poll contracts directly on BaseScan
✅ **Transparency**: All contract code is visible and verifiable
✅ **Trust**: Users can verify the contract logic before interacting
✅ **No Manual Work**: Never need to verify individual Polls again

## Troubleshooting

### "Contract already verified"
- Great! The factory is already verified
- All Polls deployed by it should be auto-verified

### "Compiler version mismatch"
- Ensure you select exactly: v0.8.24+commit.e11b9ed9
- Check optimization is set to 200 runs

### "Source code doesn't match"
- Use the provided `PollFactory-Flattened.sol`
- Ensure no extra spaces or modifications

## Direct Link

**Verify PollFactory**: https://sepolia.basescan.org/verifyContract?a=0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6