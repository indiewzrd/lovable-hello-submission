const hre = require("hardhat");
const { parseUnits } = require("ethers");

const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const PRIVATE_KEY = "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766";

async function main() {
  console.log("🧪 Testing auto-verification with new Poll deployment...\n");
  
  const wallet = new hre.ethers.Wallet(PRIVATE_KEY, hre.ethers.provider);
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, wallet);
  
  // Deploy new poll
  const now = Math.floor(Date.now() / 1000);
  const tx = await pollFactory.deployPoll(
    now + 300, // Start in 5 minutes
    now + 900, // End in 15 minutes
    parseUnits("2", 6), // 2 USDC per vote
    2, // 2 winning options
    5, // 5 total options
    USDC_ADDRESS
  );
  
  console.log("⏳ Deploying new Poll...");
  const receipt = await tx.wait();
  
  // Get poll address
  let pollAddress;
  for (const log of receipt.logs) {
    try {
      const parsed = pollFactory.interface.parseLog(log);
      if (parsed && parsed.name === "PollCreated") {
        pollAddress = parsed.args[0];
        break;
      }
    } catch (e) {}
  }
  
  console.log("\n✅ New Poll deployed at:", pollAddress);
  console.log("Transaction:", `https://sepolia.basescan.org/tx/${tx.hash}`);
  console.log("\n🔍 Check verification status:");
  console.log(`https://sepolia.basescan.org/address/${pollAddress}#code`);
  
  // Wait for indexing
  console.log("\n⏳ Waiting 15 seconds for BaseScan indexing...");
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  console.log("\n📋 Summary:");
  console.log("1. First Poll (manually verified):", "https://sepolia.basescan.org/address/0xb31884603CF999a1ddce23Ef8E76c76b9d7D0048#code");
  console.log("2. New Poll (check if auto-verified):", `https://sepolia.basescan.org/address/${pollAddress}#code`);
  console.log("\nIf the new Poll is NOT auto-verified, we need to re-verify the factory with multi-file support.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });