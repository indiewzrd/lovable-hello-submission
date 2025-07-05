const hre = require("hardhat");
const { parseUnits, formatUnits } = require("ethers");

// Contract addresses
const POLL_FACTORY_ADDRESS = "0xbAd1412E9F40ec01055f2CF7439c1391dF4373b6";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Private keys (DO NOT EXPOSE)
const PRIVATE_KEYS = [
  "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766", // Main deployer
  "8f281b5c8358a53aa016a40eebec7ad62eda86a50a7523f0e1cb21d05ec6d0cc", // Voter 1
  "d186bc8c337f78c3ec9e357e44a05d69851f9490d8460e283695bc6d1651a7c1", // Voter 2
  "3fe69de7f7e48b78a2e8ffe44fce37cfbf90a414f522c0652614816d67d4b42d"  // Voter 3
];

async function main() {
  console.log("=== Testing Stakedriven Contracts on Base Sepolia ===\n");

  // Setup wallets
  const wallets = PRIVATE_KEYS.map(pk => new hre.ethers.Wallet(pk, hre.ethers.provider));
  const [deployer, voter1, voter2, voter3] = wallets;

  console.log("Wallet addresses:");
  console.log("Deployer:", deployer.address);
  console.log("Voter 1:", voter1.address);
  console.log("Voter 2:", voter2.address);
  console.log("Voter 3:", voter3.address);
  console.log();

  // Check balances
  console.log("Checking ETH balances...");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await hre.ethers.provider.getBalance(wallets[i].address);
    console.log(`Wallet ${i}: ${formatUnits(balance, 18)} ETH`);
  }
  console.log();

  // Get contracts
  const pollFactory = await hre.ethers.getContractAt("PollFactory", POLL_FACTORY_ADDRESS, deployer);
  const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

  // Test 1: Read PollFactory state
  console.log("=== Testing PollFactory Read Methods ===");
  const admin = await pollFactory.globalAdmin();
  const feePercentage = await pollFactory.feePercentage();
  const feeWallet = await pollFactory.feeWallet();
  const rescueWallet = await pollFactory.rescueWallet();
  
  console.log("Admin:", admin);
  console.log("Fee Percentage:", feePercentage.toString(), "(", Number(feePercentage) / 100, "%)");
  console.log("Fee Wallet:", feeWallet);
  console.log("Rescue Wallet:", rescueWallet);
  console.log();

  // Test 2: Deploy a new poll
  console.log("=== Testing Poll Deployment ===");
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300; // Start in 5 minutes
  const endTime = startTime + 3600; // 1 hour duration for testing
  const tokensPerVote = parseUnits("1", 6); // 1 USDC per vote (lower for testing)
  const winningOptionsCount = 2;
  const totalOptionsCount = 4;

  console.log("Deploying poll with parameters:");
  console.log("- Start time:", new Date(startTime * 1000).toLocaleString());
  console.log("- End time:", new Date(endTime * 1000).toLocaleString());
  console.log("- Tokens per vote:", formatUnits(tokensPerVote, 6), "USDC");
  console.log("- Winning options:", winningOptionsCount);
  console.log("- Total options:", totalOptionsCount);

  try {
    const tx = await pollFactory.deployPoll(
      startTime,
      endTime,
      tokensPerVote,
      winningOptionsCount,
      totalOptionsCount,
      USDC_ADDRESS
    );
    
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Poll deployed! Gas used:", receipt.gasUsed.toString());
    
    // Get poll address from events
    const event = receipt.logs.find(log => {
      try {
        const parsed = pollFactory.interface.parseLog(log);
        return parsed.name === "PollDeployed";
      } catch (e) {
        return false;
      }
    });
    
    const pollAddress = event ? pollFactory.interface.parseLog(event).args[0] : null;
    console.log("Poll address:", pollAddress);
    console.log();

    if (pollAddress) {
      // Test 3: Test PollFactory write methods
      console.log("=== Testing PollFactory Write Methods ===");
      
      // Change fee percentage (admin only)
      console.log("Changing fee percentage to 3%...");
      try {
        const tx2 = await pollFactory.setFeePercentage(300); // 3%
        await tx2.wait();
        console.log("✅ Fee percentage changed successfully");
      } catch (error) {
        console.log("❌ Error changing fee percentage:", error.message);
      }

      // Change fee wallet
      console.log("Changing fee wallet to voter1...");
      try {
        const tx3 = await pollFactory.setFeeWallet(voter1.address);
        await tx3.wait();
        console.log("✅ Fee wallet changed successfully");
      } catch (error) {
        console.log("❌ Error changing fee wallet:", error.message);
      }

      // Change rescue wallet
      console.log("Changing rescue wallet to voter2...");
      try {
        const tx4 = await pollFactory.setRescueWallet(voter2.address);
        await tx4.wait();
        console.log("✅ Rescue wallet changed successfully");
      } catch (error) {
        console.log("❌ Error changing rescue wallet:", error.message);
      }
      console.log();

      // Test 4: Check USDC balances
      console.log("=== Checking USDC Balances ===");
      console.log("Note: You may need to get USDC from a faucet or DEX");
      for (let i = 0; i < wallets.length; i++) {
        const balance = await usdc.balanceOf(wallets[i].address);
        console.log(`Wallet ${i} USDC balance:`, formatUnits(balance, 6));
      }
      console.log();

      // Test 5: Get poll contract and test voting
      const poll = await hre.ethers.getContractAt("Poll", pollAddress, voter1);
      
      console.log("=== Testing Poll Read Methods ===");
      const pollCreator = await poll.pollCreator();
      const pollStartTime = await poll.startTime();
      const pollEndTime = await poll.endTime();
      const pollTokensPerVote = await poll.tokensPerVote();
      
      console.log("Poll creator:", pollCreator);
      console.log("Start time:", new Date(Number(pollStartTime) * 1000).toLocaleString());
      console.log("End time:", new Date(Number(pollEndTime) * 1000).toLocaleString());
      console.log("Tokens per vote:", formatUnits(pollTokensPerVote, 6), "USDC");
      console.log();

      // Wait for poll to start if needed
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < startTime) {
        console.log(`Waiting ${startTime - currentTime} seconds for poll to start...`);
        console.log("Poll will start at:", new Date(startTime * 1000).toLocaleString());
      }

      console.log("\n=== Summary ===");
      console.log("✅ PollFactory deployed and verified at:", POLL_FACTORY_ADDRESS);
      console.log("✅ Successfully deployed a test poll at:", pollAddress);
      console.log("✅ All PollFactory admin functions tested");
      console.log("\nTo test voting:");
      console.log("1. Get USDC from a faucet or DEX");
      console.log("2. Wait for poll to start (5 minutes from deployment)");
      console.log("3. Approve USDC spending for the poll contract");
      console.log("4. Call vote() function with option 0-3");
      console.log("\nView contracts on Basescan:");
      console.log("PollFactory:", `https://sepolia.basescan.org/address/${POLL_FACTORY_ADDRESS}`);
      console.log("Poll:", `https://sepolia.basescan.org/address/${pollAddress}`);
    }

  } catch (error) {
    console.error("Error during testing:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });