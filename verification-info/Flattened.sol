// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Contracts
// OpenZeppelin imports would be auto-resolved by BaseScan

// ==================== PollFactory.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Poll.sol";

/**
 * @title PollFactory
 * @dev Factory contract for creating and managing polls
 */
contract PollFactory is Ownable {
    // State variables
    address public globalAdmin;
    address public rescueWallet;
    address public feeWallet;
    uint256 public feePercentage; // Fee percentage in basis points (100 = 1%)
    
    // Array to store all deployed polls
    address[] public deployedPolls;
    
    // Mapping to track polls created by each address
    mapping(address => address[]) public pollsByCreator;
    
    // Events
    event PollCreated(
        address indexed pollAddress,
        address indexed creator,
        uint256 startTime,
        uint256 endTime,
        uint256 tokensPerVote,
        uint256 winningOptionsCount,
        uint256 totalOptionsCount
    );
    
    event GlobalAdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event RescueWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event FeeWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);
    
    // Modifiers
    modifier onlyGlobalAdmin() {
        require(msg.sender == globalAdmin, "Only global admin");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        globalAdmin = msg.sender;
        rescueWallet = msg.sender;
        feeWallet = msg.sender;
        feePercentage = 500; // Default 5% fee
    }
    
    /**
     * @dev Deploy a new poll contract
     */
    function deployPoll(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokensPerVote,
        uint256 _winningOptionsCount,
        uint256 _totalOptionsCount,
        address _tokenAddress
    ) external returns (address) {
        require(_startTime > block.timestamp, "Start time must be in future");
        require(_endTime > _startTime, "End time must be after start time");
        require(_tokensPerVote > 0, "Tokens per vote must be greater than 0");
        require(_winningOptionsCount > 0 && _winningOptionsCount <= _totalOptionsCount, "Invalid winning options count");
        require(_totalOptionsCount > 0, "Total options must be greater than 0");
        require(_tokenAddress != address(0), "Invalid token address");
        
        Poll newPoll = new Poll(
            msg.sender,
            _startTime,
            _endTime,
            _tokensPerVote,
            _winningOptionsCount,
            _totalOptionsCount,
            _tokenAddress,
            address(this)
        );
        
        address pollAddress = address(newPoll);
        deployedPolls.push(pollAddress);
        pollsByCreator[msg.sender].push(pollAddress);
        
        emit PollCreated(
            pollAddress,
            msg.sender,
            _startTime,
            _endTime,
            _tokensPerVote,
            _winningOptionsCount,
            _totalOptionsCount
        );
        
        return pollAddress;
    }
    
    /**
     * @dev Set global admin address
     */
    function setGlobalAdmin(address _newAdmin) external onlyGlobalAdmin {
        require(_newAdmin != address(0), "Invalid address");
        address oldAdmin = globalAdmin;
        globalAdmin = _newAdmin;
        emit GlobalAdminUpdated(oldAdmin, _newAdmin);
    }
    
    /**
     * @dev Set rescue wallet address
     */
    function setRescueWallet(address _newWallet) external onlyGlobalAdmin {
        require(_newWallet != address(0), "Invalid address");
        address oldWallet = rescueWallet;
        rescueWallet = _newWallet;
        emit RescueWalletUpdated(oldWallet, _newWallet);
    }
    
    /**
     * @dev Set fee percentage
     */
    function setFeePercentage(uint256 _newFee) external onlyGlobalAdmin {
        require(_newFee <= 10000, "Fee cannot exceed 100%");
        uint256 oldFee = feePercentage;
        feePercentage = _newFee;
        emit FeePercentageUpdated(oldFee, _newFee);
    }
    
    /**
     * @dev Set fee wallet address
     */
    function setFeeWallet(address _newWallet) external onlyGlobalAdmin {
        require(_newWallet != address(0), "Invalid address");
        address oldWallet = feeWallet;
        feeWallet = _newWallet;
        emit FeeWalletUpdated(oldWallet, _newWallet);
    }
    
    /**
     * @dev Get all deployed polls
     */
    function getDeployedPolls() external view returns (address[] memory) {
        return deployedPolls;
    }
    
    /**
     * @dev Get polls created by a specific address
     */
    function getPollsByCreator(address _creator) external view returns (address[] memory) {
        return pollsByCreator[_creator];
    }
    
    /**
     * @dev Get total number of deployed polls
     */
    function getTotalPolls() external view returns (uint256) {
        return deployedPolls.length;
    }
}

// ==================== Poll.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PollFactory.sol";

/**
 * @title Poll
 * @dev Individual poll contract for voting with tokens
 */
contract Poll is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // State variables
    address public immutable pollCreator;
    uint256 public immutable startTime;
    uint256 public immutable endTime;
    uint256 public immutable tokensPerVote;
    uint256 public immutable winningOptionsCount;
    uint256 public immutable totalOptionsCount;
    address public immutable votingToken;
    address public immutable factory;
    
    // Voting state
    mapping(uint256 => uint256) public optionVotes; // option number => total tokens
    mapping(address => uint256) public voterChoice; // voter => option number (0 means no vote)
    mapping(address => bool) public hasVoted;
    
    // Winning options (determined after poll ends)
    uint256[] public winningOptions;
    bool public winnersCalculated;
    
    // Claim tracking
    mapping(address => bool) public hasClaimedRefund;
    bool public creatorClaimed;
    bool public feeClaimed;
    
    // Total amounts
    uint256 public totalVotes;
    uint256 public winningAmount;
    uint256 public feeAmount;
    
    // Events
    event Voted(address indexed voter, uint256 indexed option, uint256 amount);
    event VoteCancelled(address indexed voter, uint256 indexed option, uint256 amount);
    event WinnersCalculated(uint256[] winners, uint256 totalWinningAmount);
    event CreatorClaimed(address indexed creator, uint256 amount);
    event FeeClaimed(address indexed feeWallet, uint256 amount);
    event RefundClaimed(address indexed voter, uint256 amount);
    event FundsRescued(address indexed rescueWallet, uint256 amount);
    
    // Modifiers
    modifier onlyDuringVoting() {
        require(block.timestamp >= startTime, "Voting not started");
        require(block.timestamp < endTime, "Voting ended");
        _;
    }
    
    modifier onlyAfterVoting() {
        require(block.timestamp >= endTime, "Voting not ended");
        _;
    }
    
    modifier onlyGlobalAdmin() {
        PollFactory factoryContract = PollFactory(factory);
        require(msg.sender == factoryContract.globalAdmin(), "Only global admin");
        _;
    }
    
    constructor(
        address _creator,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokensPerVote,
        uint256 _winningOptionsCount,
        uint256 _totalOptionsCount,
        address _votingToken,
        address _factory
    ) {
        pollCreator = _creator;
        startTime = _startTime;
        endTime = _endTime;
        tokensPerVote = _tokensPerVote;
        winningOptionsCount = _winningOptionsCount;
        totalOptionsCount = _totalOptionsCount;
        votingToken = _votingToken;
        factory = _factory;
    }
    
    /**
     * @dev Vote for an option
     */
    function vote(uint256 _option) external onlyDuringVoting nonReentrant {
        require(_option > 0 && _option <= totalOptionsCount, "Invalid option");
        require(!hasVoted[msg.sender], "Already voted");
        
        IERC20(votingToken).safeTransferFrom(msg.sender, address(this), tokensPerVote);
        
        optionVotes[_option] += tokensPerVote;
        voterChoice[msg.sender] = _option;
        hasVoted[msg.sender] = true;
        totalVotes += tokensPerVote;
        
        emit Voted(msg.sender, _option, tokensPerVote);
    }
    
    /**
     * @dev Cancel vote and get refund
     */
    function cancelVote() external onlyDuringVoting nonReentrant {
        require(hasVoted[msg.sender], "No vote to cancel");
        
        uint256 option = voterChoice[msg.sender];
        optionVotes[option] -= tokensPerVote;
        voterChoice[msg.sender] = 0;
        hasVoted[msg.sender] = false;
        totalVotes -= tokensPerVote;
        
        IERC20(votingToken).safeTransfer(msg.sender, tokensPerVote);
        
        emit VoteCancelled(msg.sender, option, tokensPerVote);
    }
    
    /**
     * @dev Calculate winning options (can be called by anyone after voting ends)
     */
    function calculateWinners() external onlyAfterVoting {
        require(!winnersCalculated, "Winners already calculated");
        
        // Find options with votes and sort by vote count
        uint256[] memory options = new uint256[](totalOptionsCount);
        uint256[] memory votes = new uint256[](totalOptionsCount);
        
        for (uint256 i = 1; i <= totalOptionsCount; i++) {
            options[i - 1] = i;
            votes[i - 1] = optionVotes[i];
        }
        
        // Sort options by votes (descending)
        for (uint256 i = 0; i < totalOptionsCount - 1; i++) {
            for (uint256 j = 0; j < totalOptionsCount - i - 1; j++) {
                if (votes[j] < votes[j + 1]) {
                    // Swap votes
                    uint256 tempVote = votes[j];
                    votes[j] = votes[j + 1];
                    votes[j + 1] = tempVote;
                    
                    // Swap options
                    uint256 tempOption = options[j];
                    options[j] = options[j + 1];
                    options[j + 1] = tempOption;
                }
            }
        }
        
        // Determine winners (handle ties)
        uint256 winnersToSelect = winningOptionsCount;
        if (winnersToSelect > totalOptionsCount) {
            winnersToSelect = totalOptionsCount;
        }
        
        // Count how many options have non-zero votes
        uint256 optionsWithVotes = 0;
        for (uint256 i = 0; i < totalOptionsCount; i++) {
            if (votes[i] > 0) {
                optionsWithVotes++;
            }
        }
        
        if (winnersToSelect > optionsWithVotes) {
            winnersToSelect = optionsWithVotes;
        }
        
        // Select winners
        for (uint256 i = 0; i < winnersToSelect; i++) {
            if (votes[i] > 0) {
                winningOptions.push(options[i]);
                winningAmount += votes[i];
            }
        }
        
        // Calculate fee
        PollFactory factoryContract = PollFactory(factory);
        feeAmount = (winningAmount * factoryContract.feePercentage()) / 10000;
        
        winnersCalculated = true;
        emit WinnersCalculated(winningOptions, winningAmount);
    }
    
    /**
     * @dev Claim winning funds (poll creator only)
     */
    function claimWinningFunds() external onlyAfterVoting nonReentrant {
        require(msg.sender == pollCreator, "Only poll creator");
        require(winnersCalculated, "Winners not calculated");
        require(!creatorClaimed, "Already claimed");
        require(winningAmount > 0, "No winning funds");
        
        creatorClaimed = true;
        uint256 claimAmount = winningAmount - feeAmount;
        
        if (claimAmount > 0) {
            IERC20(votingToken).safeTransfer(pollCreator, claimAmount);
            emit CreatorClaimed(pollCreator, claimAmount);
        }
    }
    
    /**
     * @dev Claim fee (fee wallet only)
     */
    function claimFee() external onlyAfterVoting nonReentrant {
        PollFactory factoryContract = PollFactory(factory);
        require(msg.sender == factoryContract.feeWallet(), "Only fee wallet");
        require(winnersCalculated, "Winners not calculated");
        require(!feeClaimed, "Already claimed");
        require(feeAmount > 0, "No fee to claim");
        
        feeClaimed = true;
        IERC20(votingToken).safeTransfer(factoryContract.feeWallet(), feeAmount);
        emit FeeClaimed(factoryContract.feeWallet(), feeAmount);
    }
    
    /**
     * @dev Claim refund for non-winning vote
     */
    function claimNonWinningRefund() external onlyAfterVoting nonReentrant {
        require(hasVoted[msg.sender], "No vote to refund");
        require(winnersCalculated, "Winners not calculated");
        require(!hasClaimedRefund[msg.sender], "Already claimed refund");
        
        uint256 voterOption = voterChoice[msg.sender];
        bool isWinner = false;
        
        for (uint256 i = 0; i < winningOptions.length; i++) {
            if (winningOptions[i] == voterOption) {
                isWinner = true;
                break;
            }
        }
        
        require(!isWinner, "Cannot refund winning vote");
        
        hasClaimedRefund[msg.sender] = true;
        IERC20(votingToken).safeTransfer(msg.sender, tokensPerVote);
        emit RefundClaimed(msg.sender, tokensPerVote);
    }
    
    /**
     * @dev Rescue funds (global admin only)
     */
    function rescueFunds() external onlyGlobalAdmin nonReentrant {
        require(block.timestamp >= startTime, "Cannot rescue before start");
        
        PollFactory factoryContract = PollFactory(factory);
        address rescueWallet = factoryContract.rescueWallet();
        
        uint256 balance = IERC20(votingToken).balanceOf(address(this));
        require(balance > 0, "No funds to rescue");
        
        IERC20(votingToken).safeTransfer(rescueWallet, balance);
        emit FundsRescued(rescueWallet, balance);
    }
    
    /**
     * @dev Get current voting results
     */
    function getVotingResults() external view returns (uint256[] memory options, uint256[] memory votes) {
        options = new uint256[](totalOptionsCount);
        votes = new uint256[](totalOptionsCount);
        
        for (uint256 i = 0; i < totalOptionsCount; i++) {
            options[i] = i + 1;
            votes[i] = optionVotes[i + 1];
        }
        
        return (options, votes);
    }
    
    /**
     * @dev Get winning options
     */
    function getWinningOptions() external view returns (uint256[] memory) {
        return winningOptions;
    }
    
    /**
     * @dev Check if an option is a winning option
     */
    function isWinningOption(uint256 _option) external view returns (bool) {
        for (uint256 i = 0; i < winningOptions.length; i++) {
            if (winningOptions[i] == _option) {
                return true;
            }
        }
        return false;
    }
}
