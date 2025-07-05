const hre = require("hardhat");
const { parseUnits, formatUnits } = require("ethers");

// Contract addresses
const POLL_ADDRESS = "0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43"; // The poll we deployed earlier
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Private keys
const PRIVATE_KEYS = [
  "90e0abbc2588acc2535b1c8ff3d8b837b9be4d887ddcede1b2e78eb2de002766", // Main deployer
  "8f281b5c8358a53aa016a40eebec7ad62eda86a50a7523f0e1cb21d05ec6d0cc", // Voter 1
  "d186bc8c337f78c3ec9e357e44a05d69851f9490d8460e283695bc6d1651a7c1", // Voter 2
  "3fe69de7f7e48b78a2e8ffe44fce37cfbf90a414f522c0652614816d67d4b42d"  // Voter 3
];

async function main() {
  console.log("=== Testing Existing Poll on Base Sepolia ===\n");

  // Setup wallets
  const wallets = PRIVATE_KEYS.map(pk => new hre.ethers.Wallet(pk, hre.ethers.provider));
  const [deployer, voter1, voter2, voter3] = wallets;

  // Get contracts
  const poll = await hre.ethers.getContractAt("Poll", POLL_ADDRESS, deployer);
  const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS, deployer);

  // Get poll info
  console.log("=== Poll Information ===");
  const pollCreator = await poll.pollCreator();
  const startTime = await poll.startTime();
  const endTime = await poll.endTime();
  const tokensPerVote = await poll.tokensPerVote();
  const winningOptionsCount = await poll.winningOptionsCount();
  const totalOptionsCount = await poll.totalOptionsCount();

  console.log("Poll Address:", POLL_ADDRESS);
  console.log("Poll Creator:", pollCreator);
  console.log("Start Time:", new Date(Number(startTime) * 1000).toLocaleString());
  console.log("End Time:", new Date(Number(endTime) * 1000).toLocaleString());
  console.log("Tokens per Vote:", formatUnits(tokensPerVote, 6), "USDC");
  console.log("Winning Options:", winningOptionsCount.toString());
  console.log("Total Options:", totalOptionsCount.toString());

  // Check poll status
  const now = Math.floor(Date.now() / 1000);
  const isActive = now >= Number(startTime) && now < Number(endTime);
  const hasEnded = now >= Number(endTime);
  
  console.log("\nPoll Status:");
  if (now < Number(startTime)) {
    console.log("⏳ Poll has not started yet");
    const timeToStart = Number(startTime) - now;
    console.log(`   Starts in ${Math.floor(timeToStart / 60)} minutes`);
    return;
  } else if (isActive) {
    console.log("✅ Poll is ACTIVE");
    const timeRemaining = Number(endTime) - now;
    console.log(`   Ends in ${Math.floor(timeRemaining / 60)} minutes`);
  } else {
    console.log("⏰ Poll has ENDED");
  }

  // Check USDC balances
  console.log("\n=== USDC Balances ===");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await usdc.balanceOf(wallets[i].address);
    console.log(`Wallet ${i}: ${formatUnits(balance, 6)} USDC`);
  }

  // Check voting results
  console.log("\n=== Current Voting Results ===");
  const results = await poll.getVotingResults();
  let totalVotes = 0n;
  for (let i = 0; i < results[0].length; i++) {
    const votes = results[1][i];
    totalVotes += votes;
    console.log(`Option ${results[0][i]}: ${formatUnits(votes, 6)} USDC`);
  }
  console.log(`Total: ${formatUnits(totalVotes, 6)} USDC`);

  // Check who has voted
  console.log("\n=== Voting Status ===");
  for (let i = 0; i < wallets.length; i++) {
    const hasVoted = await poll.hasVoted(wallets[i].address);
    if (hasVoted) {
      const choice = await poll.voterChoice(wallets[i].address);
      console.log(`Wallet ${i}: Voted for option ${choice}`);
    } else {
      console.log(`Wallet ${i}: Has not voted`);
    }
  }

  // If poll has ended, check winner status
  if (hasEnded) {
    console.log("\n=== Poll Results ===");
    
    // Check if winners calculated
    const winnersCalculated = await poll.winnersCalculated();
    if (!winnersCalculated) {
      console.log("Winners not calculated yet. Anyone can call calculateWinners()");
      
      // Calculate winners
      console.log("\nCalculating winners...");
      try {
        const tx = await poll.calculateWinners();
        await tx.wait();
        console.log("✅ Winners calculated!");
      } catch (error) {
        console.log("Error calculating winners:", error.message);
      }
    }

    // Get winning options
    try {
      const winners = await poll.getWinningOptions();
      console.log("Winning options:", winners.map(w => w.toString()).join(", "));
      
      // Check claim status
      console.log("\n=== Claim Status ===");
      const creatorClaimed = await poll.creatorClaimed();
      const feeClaimed = await poll.feeClaimed();
      
      console.log("Creator claimed:", creatorClaimed);
      console.log("Fee claimed:", feeClaimed);
      
      // Check individual refund status
      for (let i = 0; i < wallets.length; i++) {
        const hasVoted = await poll.hasVoted(wallets[i].address);
        if (hasVoted) {
          const hasClaimedRefund = await poll.hasClaimedRefund(wallets[i].address);
          console.log(`Wallet ${i} refund claimed:`, hasClaimedRefund);
        }
      }
    } catch (error) {
      console.log("Error getting results:", error.message);
    }
  }

  // Show poll contract balance
  const pollBalance = await usdc.balanceOf(POLL_ADDRESS);
  console.log("\n=== Poll Contract Balance ===");
  console.log("USDC in poll:", formatUnits(pollBalance, 6));

  console.log("\n=== Summary ===");
  console.log("Poll Address:", POLL_ADDRESS);
  console.log("View on Basescan:", `https://sepolia.basescan.org/address/${POLL_ADDRESS}`);
  
  if (isActive) {
    console.log("\nTo participate:");
    console.log("1. Get USDC from a faucet");
    console.log("2. Approve USDC spending for the poll");
    console.log("3. Vote for your preferred option (1-4)");
  } else if (hasEnded) {
    console.log("\nPoll has ended. Claims can be processed.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });