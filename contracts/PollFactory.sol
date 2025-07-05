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