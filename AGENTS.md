# AI Coding Agent Instructions: Web3 Quest Reward System

This document provides comprehensive guidance for AI coding agents to build a Web3 quest reward system similar to the analyzed codebase. The instructions are implementation-agnostic and focus on high-level architecture patterns and Thirdweb API integration.

## Project Overview

This is a Web3 quest reward platform that allows users to:
- Connect their crypto wallets
- Complete various quests to earn token rewards
- Claim daily rewards with cooldown periods
- Track quest progress and completion status
- Manage token balances and transactions

## Core Architecture Principles

### 1. Frontend-Backend Separation
- **Frontend**: User interface, wallet connection, quest display, real-time updates
- **Backend**: Quest validation, reward distribution, smart contract interactions
- **Smart Contracts**: Quest tracking, user progress, daily claim management

### 2. Wallet-First Design
- All user interactions require wallet connection
- No traditional user accounts or passwords
- Wallet address serves as unique user identifier
- Session management based on wallet connection state

### 3. Token-Based Rewards
- Custom ERC-20 token for quest rewards
- Native blockchain token for gas and balance requirements
- Automated reward distribution through smart contracts
- Real-time balance tracking and updates

## Project Structure Guidelines

### Frontend Structure
```
frontend/
├── components/
│   ├── WalletConnect/          # Wallet connection UI
│   ├── QuestManager/           # Quest display and interaction
│   ├── ThirdwebProvider/       # Thirdweb SDK integration
│   └── UI/                     # Reusable UI components
├── pages/ (or app/ for Next.js)
│   ├── index/                  # Main dashboard
│   ├── profile/                # User profile and stats
│   └── api/                    # Backend API routes
├── lib/
│   ├── thirdweb.ts            # Thirdweb API utilities
│   ├── quest-api.ts           # Quest management functions
│   ├── types.ts               # TypeScript type definitions
│   ├── validation.ts          # Input validation utilities
│   └── env.ts                 # Environment configuration
└── styles/                    # Global styles and themes
```

### Backend Structure
```
backend/
├── api/
│   ├── quests/                # Quest completion endpoints
│   ├── rewards/               # Reward distribution endpoints
│   ├── daily-claims/          # Daily reward endpoints
│   └── validation/            # Quest verification endpoints
├── services/
│   ├── thirdweb-service.ts    # Thirdweb API integration
│   ├── quest-service.ts       # Quest business logic
│   └── reward-service.ts      # Reward distribution logic
├── contracts/                 # Smart contract files
└── utils/
    ├── validation.ts          # Server-side validation
    └── constants.ts           # Configuration constants
```

### Smart Contract Structure
```
contracts/
├── QuestTracker.sol           # Main quest tracking contract
├── RewardToken.sol            # ERC-20 reward token contract
├── migrations/                # Deployment scripts
└── test/                     # Contract tests
```

## Thirdweb API Integration Guide

**Important**: Always include the Thirdweb API reference in your context: https://api.thirdweb.com/llms.txt

### 1. User Authentication & Session Management

#### Wallet Connection
- Use `ConnectButton` component for wallet connection UI
- Implement `ThirdwebProvider` wrapper for app-wide wallet state
- Handle wallet connection/disconnection events
- Store wallet address as primary user identifier

#### Session Management
```typescript
// Key patterns for wallet-based sessions
- Track active wallet address across app
- Implement auto-logout on wallet disconnection
- Cache user data based on wallet address
- Handle wallet switching gracefully
```

#### Thirdweb APIs Used:
- `thirdweb/react` - React hooks and components
- `useActiveAccount()` - Get current connected wallet
- `ConnectButton` - Wallet connection UI
- `ThirdwebProvider` - App-wide wallet context

### 2. Reward System

#### Token Management
- Deploy custom ERC-20 token for quest rewards
- Implement token minting for reward distribution
- Track token balances in real-time
- Handle token decimals and precision

#### Reward Distribution
```typescript
// Key patterns for reward distribution
- Validate quest completion before rewarding
- Use admin wallet for token minting
- Implement reward amount validation
- Log all reward transactions
```

#### Thirdweb APIs Used:
- `/v1/contracts/write` - Execute smart contract functions
- `/v1/contracts/read` - Read contract state
- `mintTo()` function - Distribute reward tokens
- `balanceOf()` function - Check token balances

### 3. Digital Asset Purchasing

#### Token Balance Requirements
- Check user token balances before quest completion
- Implement minimum balance requirements for certain quests
- Display balance information in UI
- Handle insufficient balance scenarios

#### Native Token Management
- Track native blockchain token balances (ETH, MATIC, etc.)
- Implement gas fee estimation
- Handle balance requirements for quest completion

#### Thirdweb APIs Used:
- `/v1/wallets/{address}/balance` - Get wallet balances
- `/v1/contracts/read` - Read token contract balances
- Balance validation before transactions

### 4. Token Asset Management

#### Balance Tracking
- Real-time balance updates
- Multi-token support (native + custom tokens)
- Balance formatting and display
- Historical balance tracking

#### Token Operations
```typescript
// Key patterns for token management
- Convert between wei and token units
- Validate token amounts and decimals
- Handle token transfer operations
- Implement token approval workflows
```

#### Thirdweb APIs Used:
- `/v1/contracts/read` - Read token balances and metadata
- `/v1/contracts/write` - Execute token operations
- Token contract ABI integration

### 5. Transaction Management

#### Smart Contract Interactions
- Execute quest completion transactions
- Handle daily claim transactions
- Manage quest creation and updates
- Implement transaction status tracking

#### Error Handling
```typescript
// Key patterns for transaction management
- Validate transaction parameters
- Handle transaction failures gracefully
- Implement retry mechanisms
- Provide user-friendly error messages
```

#### Thirdweb APIs Used:
- `/v1/contracts/write` - Execute contract functions
- Transaction status monitoring
- Gas estimation and optimization

### 6. Quest System

#### Quest Data Management
- Store quest definitions in smart contracts
- Track user quest completion status
- Implement quest validation logic
- Handle quest expiration and updates

#### Quest Types
```typescript
// Common quest patterns
- Free quests (no verification)
- Social media quests (tweet verification)
- Balance requirement quests
- Time-based quests with expiration
- Daily recurring quests
```

#### Thirdweb APIs Used:
- `/v1/contracts/read` - Read quest data and user progress
- `/v1/contracts/write` - Update quest completion status
- Quest validation and verification

## Implementation Guidelines

### Technology Stack Flexibility

#### Frontend Options
- **React/Next.js**: Use `thirdweb/react` SDK
- **Vue.js**: Use `thirdweb/js` SDK with Vue integration
- **Angular**: Use `thirdweb/js` SDK with Angular services
- **Vanilla JS**: Use `thirdweb/js` SDK directly

#### Backend Options
- **Node.js/Express**: Use `thirdweb/node` SDK
- **Python/Django**: Use `thirdweb/python` SDK
- **PHP/Laravel**: Use `thirdweb/php` SDK
- **Serverless**: Use `thirdweb/js` in serverless functions

#### Database Options
- **PostgreSQL**: For complex relational data
- **MongoDB**: For flexible document storage
- **Redis**: For caching and session management
- **Smart Contracts**: For immutable quest and user data

### Smart Contract Patterns

#### Quest Tracking Contract
```solidity
// Key contract functions
- createQuest() - Admin creates new quests
- completeQuestForUser() - Backend completes quests
- getUserDetails() - Get user progress
- setDailyClaimed() - Handle daily rewards
```

#### Reward Token Contract
```solidity
// Key token functions
- mintTo() - Distribute rewards
- balanceOf() - Check balances
- transfer() - User token transfers
- approve() - Token approvals
```

### Security Considerations

#### Input Validation
- Validate all user inputs on both frontend and backend
- Sanitize wallet addresses and quest data
- Implement rate limiting for API endpoints
- Validate quest completion requirements

#### Access Control
- Implement admin-only functions for quest creation
- Use backend wallet for quest completion
- Validate quest completion before rewards
- Implement cooldown periods for daily claims

#### Error Handling
- Graceful degradation on API failures
- User-friendly error messages
- Comprehensive logging for debugging
- Fallback mechanisms for critical functions

### Performance Optimization

#### Caching Strategies
- Cache quest data and user progress
- Implement real-time balance updates
- Use optimistic UI updates
- Cache smart contract responses

#### API Optimization
- Batch multiple contract calls
- Implement request deduplication
- Use efficient data structures
- Minimize blockchain interactions

## Environment Configuration

### Required Environment Variables
```bash
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key

# Contract Addresses
TOKEN_CONTRACT_ADDRESS=0x...
QUEST_CONTRACT_ADDRESS=0x...
CHAIN_ID=84532

# Admin Configuration
ADMIN_ADDRESS=0x...
QUEST_TRACKER_BACKEND_WALLET=0x...

# External APIs
TWITTER_BEARER_TOKEN=your_twitter_token
```

### Deployment Considerations
- Deploy smart contracts to testnet first
- Verify contract addresses in environment
- Set up proper admin wallet permissions
- Configure backend wallet for quest completion

## Testing Strategy

### Unit Testing
- Test individual quest validation functions
- Test reward distribution logic
- Test wallet connection flows
- Test error handling scenarios

### Integration Testing
- Test complete quest completion flows
- Test daily claim functionality
- Test balance tracking accuracy
- Test smart contract interactions

### End-to-End Testing
- Test user journey from wallet connection to reward claim
- Test quest completion with different requirements
- Test error scenarios and recovery
- Test performance under load

## Monitoring and Analytics

### Key Metrics to Track
- Quest completion rates
- Daily claim frequency
- Token distribution amounts
- User engagement metrics
- Error rates and types

### Logging Requirements
- Log all quest completions
- Log reward distributions
- Log API errors and failures
- Log user interactions
- Log smart contract events

## Future Enhancements

### Scalability Considerations
- Implement quest categories and filtering
- Add quest difficulty levels
- Support for multiple reward tokens
- Implement quest leaderboards
- Add social features and sharing

### Advanced Features
- NFT rewards for special quests
- Staking mechanisms for token holders
- Governance features for quest creation
- Cross-chain quest support
- Mobile app integration

---

**Note**: This document provides high-level guidance for building a Web3 quest reward system. Always refer to the official Thirdweb documentation and API reference (https://api.thirdweb.com/llms.txt) for the most up-to-date implementation details and best practices.
