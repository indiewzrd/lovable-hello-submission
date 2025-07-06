const hre = require("hardhat");
const { parseUnits } = require("ethers");

// Contract addresses
const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Private key
const PRIVATE_KEY = "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766";

async function main() {
  console.log("🚀 Deploying new Poll to test auto-verification...\n");
  
  // Setup wallet
  const wallet = new hre.ethers.Wallet(PRIVATE_KEY, hre.ethers.provider);
  console.log("Deployer:", wallet.address);
  
  // Get contract
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, wallet);
  
  // Check factory verification status
  console.log("PollFactory:", POLL_FACTORY_ADDRESS);
  console.log("View Factory: https://sepolia.basescan.org/address/" + POLL_FACTORY_ADDRESS + "#code\n");
  
  // Deploy new poll
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 120; // Start in 2 minutes
  const endTime = now + 600; // End in 10 minutes
  
  console.log("📊 Deploying new Poll with parameters:");
  console.log("- Start time:", new Date(startTime * 1000).toLocaleString());
  console.log("- End time:", new Date(endTime * 1000).toLocaleString());
  console.log("- Tokens per vote: 1 USDC");
  console.log("- Winning options: 1");
  console.log("- Total options: 3");
  console.log("- Token address:", USDC_ADDRESS);
  
  const tx = await pollFactory.deployPoll(
    startTime,
    endTime,
    parseUnits("1", 6), // 1 USDC per vote
    1, // 1 winning option
    3, // 3 total options
    USDC_ADDRESS
  );
  
  console.log("\n⏳ Transaction submitted:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("Gas used:", receipt.gasUsed.toString());
  
  // Extract poll address from events
  let pollAddress;
  for (const log of receipt.logs) {
    try {
      const parsed = pollFactory.interface.parseLog(log);
      if (parsed && parsed.name === "PollCreated") {
        pollAddress = parsed.args[0];
        break;
      }
    } catch (e) {
      // Continue to next log
    }
  }
  
  if (!pollAddress) {
    // Try alternative method
    const deployedPolls = await pollFactory.getDeployedPolls();
    pollAddress = deployedPolls[deployedPolls.length - 1];
  }
  
  console.log("\n🎯 New Poll deployed at:", pollAddress);
  console.log("\n🔍 Checking verification status...");
  console.log("View on BaseScan: https://sepolia.basescan.org/address/" + pollAddress + "#code");
  
  // Wait a bit for indexing
  console.log("\n⏳ Waiting 10 seconds for BaseScan to index...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Check if we can read from the contract
  const poll = await hre.ethers.getContractAt("Poll", pollAddress, wallet);
  try {
    const creator = await poll.pollCreator();
    const startTimeFromContract = await poll.startTime();
    const endTimeFromContract = await poll.endTime();
    
    console.log("\n✅ Successfully read from Poll contract:");
    console.log("- Creator:", creator);
    console.log("- Start time:", new Date(Number(startTimeFromContract) * 1000).toLocaleString());
    console.log("- End time:", new Date(Number(endTimeFromContract) * 1000).toLocaleString());
    
  } catch (error) {
    console.log("\n❌ Could not read from contract:", error.message);
  }
  
  console.log("\n📋 Summary:");
  console.log("- Poll Address:", pollAddress);
  console.log("- Transaction:", "https://sepolia.basescan.org/tx/" + tx.hash);
  console.log("- Contract Page:", "https://sepolia.basescan.org/address/" + pollAddress + "#code");
  console.log("\n💡 If the contract shows as verified on BaseScan, auto-verification is working!");
  console.log("💡 If not, we may need to manually verify the factory with multi-file verification.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });