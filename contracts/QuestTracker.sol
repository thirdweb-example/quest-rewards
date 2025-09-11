// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title QuestTracker
 * @dev Simplified quest tracking contract for blockchain rewards system
 * @author Quest Rewards Platform
 */
contract QuestTracker {
    // Contract owner (only this wallet can create quests and manage settings)
    address public owner;
    
    // Backend wallet (only this wallet can complete quests for users)
    address public immutable backendWallet;
    
    // Quest structure with all needed info
    struct Quest {
        uint256 id;
        string title;
        string description;
        uint256 reward;
        string[] requirements;
        uint256 estimatedTimeMinutes;
        bool isActive;
        uint256 createdAt;
        uint256 endDate;
    }
    
    // User quest completion tracking
    struct UserProgress {
        bool completed;
        uint256 completedAt;
    }
    
    // Daily claim tracking
    struct DailyClaim {
        uint256 lastClaimTime;
        bool claimed;
    }
    
    // User details structure for single call
    struct UserDetails {
        uint256[] completedQuestIds;
        uint256 totalQuestsCompleted;
        DailyClaim dailyClaimInfo;
        bool canClaimDaily;
        uint256 timeUntilNextClaim;
    }
    
    // State variables
    uint256 public questCounter;
    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => UserProgress)) public userQuests;
    mapping(address => uint256) public totalQuestsCompleted;
    
    // Daily claim system
    mapping(address => DailyClaim) public dailyClaims;
    uint256 public immutable dailyRewardAmount;
    uint256 public immutable claimCooldown;
    
    // Events
    event QuestCreated(uint256 indexed questId, string title, uint256 reward, uint256 endDate);
    event QuestCompleted(address indexed user, uint256 indexed questId);
    event DailyClaimed(address indexed user, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyBackend() {
        require(msg.sender == backendWallet, "Only backend wallet can call this function");
        _;
    }
    
    modifier questExists(uint256 _questId) {
        require(_questId > 0 && _questId <= questCounter, "Quest does not exist");
        _;
    }
    
    modifier questIsActive(uint256 _questId) {
        require(quests[_questId].isActive, "Quest is not active");
        require(block.timestamp <= quests[_questId].endDate, "Quest has expired");
        _;
    }
    
    constructor(
        address _backendWallet,
        uint256 _dailyRewardAmount,
        uint256 _claimCooldown
    ) {
        require(_backendWallet != address(0), "Invalid backend wallet address");
        require(_dailyRewardAmount > 0, "Daily reward must be greater than 0");
        require(_claimCooldown >= 1 hours, "Cooldown must be at least 1 hour");
        
        owner = msg.sender;
        backendWallet = _backendWallet;
        dailyRewardAmount = _dailyRewardAmount;
        claimCooldown = _claimCooldown;
        questCounter = 0;
    }
    
    /**
     * @dev Create a new quest (only owner)
     * @param _title Quest title
     * @param _description Quest description
     * @param _reward Token reward amount
     * @param _requirements Array of quest requirements
     * @param _estimatedTimeMinutes Estimated completion time in minutes
     * @param _endDate Unix timestamp when quest expires
     */
    function createQuest(
        string memory _title,
        string memory _description,
        uint256 _reward,
        string[] memory _requirements,
        uint256 _estimatedTimeMinutes,
        uint256 _endDate
    ) external onlyOwner {
        require(_endDate > block.timestamp, "End date must be in the future");
        require(_requirements.length > 0, "Quest must have at least one requirement");
        
        questCounter++;
        
        quests[questCounter] = Quest({
            id: questCounter,
            title: _title,
            description: _description,
            reward: _reward,
            requirements: _requirements,
            estimatedTimeMinutes: _estimatedTimeMinutes,
            isActive: true,
            createdAt: block.timestamp,
            endDate: _endDate
        });
        
        emit QuestCreated(questCounter, _title, _reward, _endDate);
    }
    
    /**
     * @dev Complete a quest for a user (only backend or owner can call)
     * @param _user User address to complete quest for
     * @param _questId Quest ID to complete
     */
    function completeQuestForUser(address _user, uint256 _questId) 
        external 
        questExists(_questId) 
        questIsActive(_questId) 
    {
        require(msg.sender == owner || msg.sender == backendWallet, "Only owner or backend can complete quests");
        require(_user != address(0), "Invalid user address");
        require(!userQuests[_user][_questId].completed, "Quest already completed");
        
        // Mark quest as completed for the user
        userQuests[_user][_questId] = UserProgress({
            completed: true,
            completedAt: block.timestamp
        });
        
        // Update user stats
        totalQuestsCompleted[_user]++;
        
        emit QuestCompleted(_user, _questId);
    }
    
    /**
     * @dev Set daily reward as claimed for a user (only owner or backend)
     * @param _user User address to mark as claimed
     */
    function setDailyClaimed(address _user) external {
        require(msg.sender == owner || msg.sender == backendWallet, "Only owner or backend can set daily claimed");
        require(_user != address(0), "Invalid user address");
        
        DailyClaim storage userClaim = dailyClaims[_user];
        uint256 currentTime = block.timestamp;
        
        // Check if enough time has passed since last claim
        require(
            currentTime >= userClaim.lastClaimTime + claimCooldown,
            "Daily claim cooldown not met"
        );
        
        // Update claim data
        userClaim.lastClaimTime = currentTime;
        userClaim.claimed = true;
        
        emit DailyClaimed(_user, dailyRewardAmount);
    }
    
    /**
     * @dev Get all user details in one call
     * @param _user User address
     * @return UserDetails struct with all user information
     */
    function getUserDetails(address _user) external view returns (UserDetails memory) {
        uint256[] memory completedQuestIds = new uint256[](totalQuestsCompleted[_user]);
        uint256 completedIndex = 0;
        
        // Find all completed quests
        for (uint256 i = 1; i <= questCounter; i++) {
            if (userQuests[_user][i].completed) {
                completedQuestIds[completedIndex] = i;
                completedIndex++;
            }
        }
        
        // Get daily claim info
        DailyClaim memory dailyClaimInfo = dailyClaims[_user];
        uint256 currentTime = block.timestamp;
        
        bool canClaimDaily;
        uint256 timeUntilNextClaim;
        
        if (dailyClaimInfo.lastClaimTime == 0) {
            // First time claiming
            canClaimDaily = true;
            timeUntilNextClaim = 0;
        } else {
            uint256 timeSinceLastClaim = currentTime - dailyClaimInfo.lastClaimTime;
            if (timeSinceLastClaim >= claimCooldown) {
                canClaimDaily = true;
                timeUntilNextClaim = 0;
            } else {
                canClaimDaily = false;
                timeUntilNextClaim = claimCooldown - timeSinceLastClaim;
            }
        }
        
        return UserDetails({
            completedQuestIds: completedQuestIds,
            totalQuestsCompleted: totalQuestsCompleted[_user],
            dailyClaimInfo: dailyClaimInfo,
            canClaimDaily: canClaimDaily,
            timeUntilNextClaim: timeUntilNextClaim
        });
    }
    
    /**
     * @dev Get quest details by ID
     * @param _questId Quest ID
     * @return Quest struct
     */
    function getQuest(uint256 _questId) external view questExists(_questId) returns (Quest memory) {
        return quests[_questId];
    }
    
    /**
     * @dev Get all quests
     * @return Array of all quests
     */
    function getAllQuests() external view returns (Quest[] memory) {
        Quest[] memory allQuests = new Quest[](questCounter);
        
        for (uint256 i = 0; i < questCounter; i++) {
            allQuests[i] = quests[i + 1];
        }
        
        return allQuests;
    }
    
    /**
     * @dev Get total number of quests
     * @return Total quest count
     */
    function getTotalQuests() external view returns (uint256) {
        return questCounter;
    }
}