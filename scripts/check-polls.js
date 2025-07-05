const hre = require("hardhat");

async function main() {
  const provider = new hre.ethers.JsonRpcProvider("https://sepolia.base.org");
  const factory = await hre.ethers.getContractAt(
    "PollFactory",
    "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6",
    provider
  );

  try {
    const polls = await factory.getDeployedPolls();
    console.log("Total polls deployed:", polls.length);
    console.log("Poll addresses:", polls);
  } catch (error) {
    console.error("Error fetching polls:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });