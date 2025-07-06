const hre = require("hardhat");

// Poll contract to verify
const POLL_ADDRESS = "0xb31884603CF999a1ddce23Ef8E76c76b9d7D0048";

// Constructor arguments for this specific poll (from blockchain data)
const constructorArgs = [
  "0x8982f9B71640aDf1F491F6Bf0D12CC40d42991E3", // creator
  "1751771502", // startTime (actual from contract)
  "1751771982", // endTime (actual from contract)
  "1000000", // tokensPerVote (1 USDC = 1000000)
  "1", // winningOptionsCount
  "3", // totalOptionsCount
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // votingToken (USDC)
  "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6" // factory
];

async function verifyPoll() {
  console.log("🔍 Verifying Poll Contract on Base Sepolia...\n");
  
  // Check network
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  
  if (network.chainId !== 84532n) {
    throw new Error("Please run on Base Sepolia network (chainId: 84532)");
  }
  
  console.log(`\n📋 Verifying Poll at ${POLL_ADDRESS}...`);
  console.log("\nConstructor arguments:");
  constructorArgs.forEach((arg, i) => {
    console.log(`  [${i}]: ${arg}`);
  });
  
  try {
    await hre.run("verify:verify", {
      address: POLL_ADDRESS,
      constructorArguments: constructorArgs,
      contract: "contracts/Poll.sol:Poll"
    });
    
    console.log(`\n✅ Poll verified successfully!`);
    console.log(`📖 View on BaseScan: https://sepolia.basescan.org/address/${POLL_ADDRESS}#code`);
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`\n✅ Poll is already verified!`);
      console.log(`📖 View on BaseScan: https://sepolia.basescan.org/address/${POLL_ADDRESS}#code`);
    } else {
      console.error(`\n❌ Verification failed:`, error.message);
      
      // Try to extract more specific error info
      if (error.message.includes("Bytecode does not match")) {
        console.log("\n💡 This might be because:");
        console.log("1. Constructor arguments are incorrect");
        console.log("2. Compiler version mismatch");
        console.log("3. Optimization settings differ");
        
        // Encode constructor arguments for manual verification
        const abiCoder = new hre.ethers.AbiCoder();
        const encoded = abiCoder.encode(
          ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "address", "address"],
          constructorArgs
        );
        
        console.log("\n📝 Encoded constructor arguments for manual verification:");
        console.log(encoded.slice(2)); // Remove 0x prefix
      }
    }
  }
}

async function main() {
  await verifyPoll();
  
  console.log("\n💡 Next Steps:");
  console.log("1. If this Poll verifies successfully, we know the setup works");
  console.log("2. We may need to re-deploy and verify PollFactory with standard verification");
  console.log("3. Or use Blockscout's 'similar' contract verification feature");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });