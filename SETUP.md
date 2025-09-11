# 🚀 Chain Reward System Setup Guide

## Quick Start

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

## 🔐 Authentication Setup

The platform uses secure wallet-based authentication:

1. **Frontend**: User connects wallet via thirdweb ConnectButton
2. **Backend**: Server calls thirdweb API with `x-secret-key` header
3. **Security**: Secret key is never exposed to the client
4. **No Registration**: Users connect existing wallets, no account creation needed

### API Routes Created:
- `/api/claim-daily` - Handles daily reward claims
- `/api/complete-quest` - Handles quest completion and verification

## 🎯 How to Use

1. **Connect Wallet**: Click "Connect Wallet" to connect your existing wallet
2. **View Quests**: Browse available quests and their requirements
3. **Complete Quests**: Complete quests to earn rewards (free, tweet, balance requirements)
4. **Daily Claims**: Claim daily rewards when available
5. **View Balances**: See your native ETH and QUEST token balances
6. **Disconnect**: Disconnect wallet when done

## 🛠️ Troubleshooting

### Build Errors
If you get Tailwind CSS errors:
```bash
npm install tailwindcss autoprefixer
```

### Authentication Errors
- Check your `THIRDWEB_SECRET_KEY` in `.env.local`
- Ensure your thirdweb account has API access
- Verify wallet connection is working
- Check that you're on the correct network (Base Sepolia)

### General Issues
- Clear browser cache
- Check console for JavaScript errors
- Ensure all dependencies are installed

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

**Your Chain Reward System is now properly configured! 🎉**