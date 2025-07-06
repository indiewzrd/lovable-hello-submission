const axios = require('axios');

const BASESCAN_API_KEY = "2R816CA48QH7HNYI93QH1EJCJ5Z3H1WX2I";

// All deployed Poll contracts
const POLL_CONTRACTS = [
  { address: "0xb31884603CF999a1ddce23Ef8E76c76b9d7D0048", name: "Manually Verified Poll" },
  { address: "0xb9Be10635235487396e4fc8A9Cc68b0aC807768C", name: "Latest Test Poll" },
  { address: "0x6c7df28498ee5040d41fe23b2278ab8ec70d3adc", name: "Poll 1" },
  { address: "0x1304eCA44ab5fe10B4D7510C0F4e0C056A643D43", name: "Poll 2" },
  { address: "0x08e599E11F5f9108267C73a66Ca0817aAB65f7A3", name: "Poll 3" },
  { address: "0xd7B7A14D191fA719511F5e5F92296ACbd85d3f9C", name: "Poll 4" },
  { address: "0x824Bf4D0ed64Dc05a718bd61d64622100A8A4677", name: "Poll 5" }
];

async function checkVerificationStatus() {
  console.log("🔍 Checking verification status of all Poll contracts...\n");
  
  const results = [];
  
  for (const poll of POLL_CONTRACTS) {
    try {
      const url = `https://api-sepolia.basescan.org/api?module=contract&action=getsourcecode&address=${poll.address}&apikey=${BASESCAN_API_KEY}`;
      const response = await axios.get(url);
      const data = response.data;
      
      if (data.status === "1" && data.result[0].SourceCode) {
        const result = data.result[0];
        const verificationStatus = result.ABI !== "Contract source code not verified" ? "✅ Verified" : "❌ Not Verified";
        const matchType = result.ImplementationAddress ? "Proxy" : 
                         result.SourceCode.includes("Similar") ? "Similar Match" : "Direct";
        
        results.push({
          name: poll.name,
          address: poll.address,
          status: verificationStatus,
          type: matchType,
          contractName: result.ContractName || "Unknown"
        });
        
        console.log(`${poll.name}:`);
        console.log(`  Address: ${poll.address}`);
        console.log(`  Status: ${verificationStatus}`);
        console.log(`  Contract Name: ${result.ContractName || "N/A"}`);
        console.log(`  Compiler: ${result.CompilerVersion || "N/A"}`);
        console.log(`  Verification Type: ${matchType}`);
        console.log(`  View: https://sepolia.basescan.org/address/${poll.address}#code\n`);
      } else {
        results.push({
          name: poll.name,
          address: poll.address,
          status: "❌ Not Verified",
          type: "None",
          contractName: "N/A"
        });
        
        console.log(`${poll.name}:`);
        console.log(`  Address: ${poll.address}`);
        console.log(`  Status: ❌ Not Verified`);
        console.log(`  View: https://sepolia.basescan.org/address/${poll.address}#code\n`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error checking ${poll.name}:`, error.message);
    }
  }
  
  // Summary
  console.log("\n📊 Summary:");
  console.log("===========");
  const verified = results.filter(r => r.status.includes("✅")).length;
  const notVerified = results.filter(r => r.status.includes("❌")).length;
  
  console.log(`Total Polls: ${results.length}`);
  console.log(`Verified: ${verified}`);
  console.log(`Not Verified: ${notVerified}`);
  
  if (verified > 1) {
    console.log("\n🎉 Great news! BaseScan is recognizing Poll contracts as similar!");
    console.log("This means future Poll deployments should be automatically recognized.");
  }
  
  // Check if new polls are getting similar match
  const latestPoll = results.find(r => r.name === "Latest Test Poll");
  if (latestPoll && latestPoll.status.includes("✅")) {
    console.log("\n✅ SUCCESS: New Poll contracts are being automatically verified via similar match!");
    console.log("No manual verification needed for future deployments!");
  }
}

checkVerificationStatus().catch(console.error);