# QuestTracker Smart Contract

A simple Solidity smart contract for tracking quest completion in a blockchain rewards system.

## Overview

The QuestTracker contract allows an admin to create quests with expiration dates. Only the backend wallet can complete quests and claim daily rewards for users. This ensures centralized control and prevents direct user interaction with the smart contract.

## Features

- **Quest Creation**: Admin can create quests with titles, descriptions, rewards, and end dates
- **Backend-Only Operations**: Only backend wallet can complete quests and claim rewards for users
- **Expiration Handling**: Quests automatically expire after their end date
- **Completion Tracking**: Prevents users from completing the same quest multiple times
- **Daily Claim System**: Backend can claim daily rewards with streak bonuses for users
- **Streak Mechanics**: Consecutive daily claims increase reward amounts
- **Batch Operations**: Support for batch quest completion and daily claims
- **Statistics**: Track total quests completed per user

## Contract Functions

### Admin Functions (Owner Only)

#### `createQuest(string memory _title, string memory _description, uint256 _reward, uint256 _endDate)`
Creates a new quest with the specified details.
- `_title`: Quest title
- `_description`: Quest description  
- `_reward`: Token reward amount
- `_endDate`: Unix timestamp when quest expires

#### `deactivateQuest(uint256 _questId)`
Deactivates a quest (owner only).

#### `setDailyRewardAmount(uint256 _newAmount)`
Updates the daily reward amount.

#### `setClaimCooldown(uint256 _newCooldown)`
Updates the claim cooldown period (minimum 1 hour).

#### `setMaxStreak(uint256 _newMaxStreak)`
Updates the maximum streak value.

#### `setBackendWallet(address _backendWallet)`
Sets the backend wallet address that can complete quests and claim rewards for users.

### Backend Functions (Backend Wallet Only)

#### `completeQuestForUser(address _user, uint256 _questId)`
Completes a quest for a specific user.
- Only backend wallet can call
- Prevents double completion
- Checks quest is active and not expired
- Updates user statistics

#### `claimDailyRewardForUser(address _user)`
Claims daily reward with streak bonus for a specific user.
- Only backend wallet can call
- 24-hour cooldown between claims
- Streak increases with consecutive daily claims
- Streak bonus: (streak - 1) / 2 additional tokens
- Streak resets if more than 1 day is missed

#### `batchCompleteQuests(address[] _users, uint256[] _questIds)`
Completes quests for multiple users in a single transaction.
- Only backend wallet can call
- Gas-efficient batch processing
- Maximum 50 users per batch

#### `batchClaimDailyRewards(address[] _users)`
Claims daily rewards for multiple users in a single transaction.
- Only backend wallet can call
- Gas-efficient batch processing
- Maximum 50 users per batch

### View Functions

#### `getQuest(uint256 _questId)`
Returns quest details including title, description, reward, status, creation date, and end date.

#### `getUserQuestStatus(address _user, uint256 _questId)`
Returns whether a user has completed a specific quest and when.

#### `getUserStats(address _user)`
Returns total number of quests completed by a user.

#### `isQuestExpired(uint256 _questId)`
Checks if a quest has passed its expiration date.

#### `getActiveQuests()`
Returns array of active quest IDs (not expired and still active).

#### `canClaimDailyReward(address _user)`
Checks if a user can claim daily reward and time until next claim.

#### `getDailyClaimInfo(address _user)`
Returns user's daily claim information including streak and total claims.

#### `getDailyRewardConfig()`
Returns daily reward system configuration.

#### `getBackendWallet()`
Returns the current backend wallet address.

## Events

- `QuestCreated(uint256 indexed questId, string title, uint256 reward, uint256 endDate)`
- `QuestCompleted(address indexed user, uint256 indexed questId)`
- `QuestDeactivated(uint256 indexed questId)`
- `QuestExpired(uint256 indexed questId)`
- `DailyClaimed(address indexed user, uint256 amount, uint256 streak)`
- `DailyRewardUpdated(uint256 newAmount)`
- `ClaimCooldownUpdated(uint256 newCooldown)`

## Deployment

### Using Hardhat (Recommended)

1. Install dependencies:
```bash
cd contracts
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your private key and RPC URLs
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

5. Deploy to local network:
```bash
npm run node
# In another terminal:
npm run deploy
```

6. Deploy to testnet:
```bash
npm run deploy:sepolia
# or
npm run deploy:polygon
```

7. Verify contract:
```bash
CONTRACT_ADDRESS=0x... npm run verify
```

### Using Thirdweb (Alternative)

```bash
npx thirdweb deploy@latest
```

## Environment Variables

Add these to your `.env` file:

```bash
# QuestTracker Contract
QUEST_TRACKER_CONTRACT_ADDRESS=your_deployed_contract_address
QUEST_TRACKER_OWNER_ADDRESS=your_admin_wallet_address
CHAIN_ID=your_target_chain_id
```

## Usage Example

```solidity
// Create a quest that expires in 7 days
uint256 endDate = block.timestamp + 7 days;
questTracker.createQuest(
    "Hold 1 ETH",
    "Hold 1 ETH in your wallet",
    25,
    endDate
);

// Complete a quest
questTracker.completeQuest(1);

// Check if user completed quest
(bool completed, uint256 completedAt) = questTracker.getUserQuestStatus(userAddress, 1);

// Claim daily reward
questTracker.claimDailyReward();

// Check daily claim status
(bool canClaim, uint256 timeUntilNext) = questTracker.canClaimDailyReward(userAddress);

// Get daily claim info
(uint256 lastClaim, uint256 totalClaims, uint256 streak, uint256 nextClaim) = 
    questTracker.getDailyClaimInfo(userAddress);
```

## Daily Claim System

The contract includes a built-in daily claim system with the following features:

- **Base Reward**: 1 token per day (configurable by owner)
- **Streak Bonus**: Additional tokens based on consecutive daily claims
- **Streak Calculation**: (streak - 1) / 2 additional tokens
- **Cooldown**: 24 hours between claims (configurable)
- **Streak Reset**: If more than 1 day is missed, streak resets to 1
- **Maximum Streak**: Capped at 30 days (configurable)

### Example Streak Rewards:
- Day 1: 1 token (base)
- Day 2: 1 + 0 = 1 token (no bonus yet)
- Day 3: 1 + 1 = 2 tokens (1 bonus)
- Day 4: 1 + 1 = 2 tokens (1 bonus)
- Day 5: 1 + 2 = 3 tokens (2 bonus)
- Day 10: 1 + 4 = 5 tokens (4 bonus)

## Security Features

- Only contract owner can create quests
- Prevents double completion of quests
- Automatic expiration handling
- Input validation for end dates

## Gas Optimization

- Uses mappings for efficient lookups
- Minimal storage operations
- Event-based logging for off-chain tracking
