const hre = require("hardhat");

async function main() {
  console.log("Starting contract verification...");

  const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";

  // Verify PollFactory
  console.log("\nVerifying PollFactory...");
  try {
    await hre.run("verify:verify", {
      address: POLL_FACTORY_ADDRESS,
      constructorArguments: [],
      contract: "contracts/PollFactory.sol:PollFactory"
    });
    console.log("✅ PollFactory verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ PollFactory already verified!");
    } else {
      console.error("❌ PollFactory verification failed:", error.message);
    }
  }

  // Also prepare the ABI for easy access
  console.log("\n=== Contract ABIs ===");
  console.log("You can find the full ABIs in:");
  console.log("- PollFactory: artifacts/contracts/PollFactory.sol/PollFactory.json");
  console.log("- Poll: artifacts/contracts/Poll.sol/Poll.json");
  
  console.log("\n=== Read Methods (PollFactory) ===");
  console.log("- admin(): Returns admin address");
  console.log("- rescueWallet(): Returns rescue wallet address");
  console.log("- feeWallet(): Returns fee wallet address");
  console.log("- feePercentage(): Returns fee percentage (default 500 = 5%)");
  console.log("- deployedPolls(index): Get poll address by index");
  console.log("- getDeployedPolls(): Get all deployed poll addresses");
  console.log("- getDeployedPollsCount(): Get total number of polls");

  console.log("\n=== Write Methods (PollFactory) ===");
  console.log("- deployPoll(startTime, endTime, tokensPerVote, winningOptionsCount, totalOptionsCount, tokenAddress)");
  console.log("- setAdmin(newAdmin): Change admin (only current admin)");
  console.log("- setRescueWallet(newRescueWallet): Change rescue wallet (only admin)");
  console.log("- setFeeWallet(newFeeWallet): Change fee wallet (only admin)");
  console.log("- setFeePercentage(newFeePercentage): Change fee % (only admin, max 1000 = 10%)");

  console.log("\n=== Events (PollFactory) ===");
  console.log("- PollDeployed(pollAddress, creator, startTime, endTime)");
  console.log("- AdminChanged(oldAdmin, newAdmin)");
  console.log("- RescueWalletChanged(oldWallet, newWallet)");
  console.log("- FeeWalletChanged(oldWallet, newWallet)");
  console.log("- FeePercentageChanged(oldFee, newFee)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });