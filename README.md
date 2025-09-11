# ⛓️ Chain Reward System

A corporate-grade blockchain reward management platform built with Next.js and thirdweb API integration.

## 🚀 Features

- **Wallet Authentication**: Secure wallet-based authentication via thirdweb ConnectButton
- **Quest System**: Complete quests to earn blockchain rewards
- **Token Management**: Real-time token balance tracking and management
- **Daily Claims**: Daily reward claiming system with cooldown periods
- **Corporate UI**: Clean, professional interface designed for enterprise use
- **Web3 Integration**: Seamless blockchain integration via thirdweb API

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: thirdweb API v1
- **Authentication**: Wallet-based via thirdweb ConnectButton
- **Blockchain**: Base Sepolia testnet

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `env.template` to `.env.local` and fill in your values:
```bash
cp env.template .env.local
```

Edit `.env.local` with your actual thirdweb credentials:
```env
THIRDWEB_SECRET_KEY=your_actual_secret_key_here
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_actual_client_id_here
TOKEN_CONTRACT_ADDRESS=0x...your_actual_contract_address
QUEST_CONTRACT_ADDRESS=0x...your_actual_quest_contract_address
CHAIN_ID=84532
ADMIN_ADDRESS=0x...your_actual_admin_wallet
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_for_tweet_verification
GAME_REWARD_BASE=100
GAME_REWARD_MAX=500
GAME_VERIFICATION_WINDOW=86400000
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

The platform uses secure wallet-based authentication:

1. **Wallet Connection**: Users connect their existing wallet via thirdweb ConnectButton
2. **Automatic Detection**: Wallet address and balance are automatically detected
3. **Session Management**: Secure sessions with automatic reconnection
4. **No Registration**: No email or account creation required

### API Routes
- `/api/claim-daily` - Handles daily reward claims
- `/api/complete-quest` - Handles quest completion and verification

## 🎯 Quest System

- **Multiple Quest Types**: Free quests, tweet verification, balance requirements
- **Real-time Verification**: Automatic verification of quest requirements
- **Reward Distribution**: Instant token rewards upon quest completion
- **Daily Claims**: Daily reward system with cooldown periods

## 💰 Token Management

- **Real-time Balance**: Live token balance tracking for both native and custom tokens
- **Secure Transactions**: Server-side validation for all operations
- **Balance Refresh**: Manual and automatic balance updates
- **Multi-token Support**: Native ETH and custom QUEST token balances

## 🎨 Corporate Design

The platform features a clean, professional design suitable for enterprise environments:

- **Modern UI**: Clean, minimalist interface
- **Responsive Design**: Works on all device sizes
- **Professional Colors**: Corporate blue and gray color scheme
- **Accessibility**: WCAG compliant design patterns

## 🔧 Development

### Project Structure
```
chain-reward-system/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (quests, daily claims)
│   │   ├── claim-daily/   # Daily reward claiming
│   │   └── complete-quest/ # Quest completion
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/             # React components
│   ├── QuestManager.tsx   # Main quest management component
│   ├── WalletConnect.tsx  # Wallet connection component
│   └── ThirdwebProvider.tsx # thirdweb provider wrapper
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── cookies.ts        # Cookie management
│   ├── env.ts            # Environment configuration
│   ├── quest-api.ts      # Quest API functions
│   ├── thirdweb.ts       # thirdweb API client
│   ├── types.ts          # TypeScript types
│   └── validation.ts     # Input validation
└── contracts/             # Smart contract files
```

### Key Features
- ✅ Wallet-based authentication via thirdweb ConnectButton
- ✅ Quest system with multiple verification types
- ✅ Daily reward claiming with cooldown periods
- ✅ Real-time token balance tracking (native + custom tokens)
- ✅ Tweet verification for social quests
- ✅ Balance requirement verification
- ✅ Server-side API calls with secret key headers
- ✅ Corporate-grade UI design
- ✅ Input validation and security measures

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository in Vercel
3. Set environment variables
4. Deploy automatically

### Other Platforms
1. Build: `npm run build`
2. Set environment variables
3. Deploy the `out` directory

## 📞 Support

- Check the console for error messages
- Verify all environment variables are set
- Ensure thirdweb API access is configured
- Check network tab for API call failures

---

**Built with ❤️ for enterprise blockchain applications**