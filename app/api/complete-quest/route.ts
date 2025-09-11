import { NextRequest, NextResponse } from 'next/server';
import { makeThirdwebRequest, distributeReward, verifyTweetMention, isValidAddress } from '@/lib/thirdweb';
import { QUEST_CONTRACT_ADDRESS, CHAIN_ID } from '@/lib/env';

// Helper function to get quest type description
function getQuestTypeDescription(questId: number): string {
  switch (questId) {
    case 1:
      return 'Free Quest - No verification required';
    case 2:
      return 'Tweet Quest - Requires @thirdweb mention';
    case 3:
      return 'ETH Balance Quest - Requires minimum 0.001 ETH';
    case 4:
      return 'Token Balance Quest - Requires minimum 50 tokens';
    default:
      return 'Unknown Quest Type';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { questId, tweetUrl, userAddress } = await request.json();

    // Validate required fields
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User wallet address is required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (questId === undefined) {
      return NextResponse.json(
        { error: 'Quest ID is required' },
        { status: 400 }
      );
    }

    // Handle different quest types with specific business logic
    if (questId === 2) {
      // Quest 2: Tweet verification - check if tweet URL contains mention to Thirdweb X account
      if (!tweetUrl) {
        return NextResponse.json(
          { error: 'Tweet URL is required for this quest' },
          { status: 400 }
        );
      }

      // Verify tweet URL contains mention to Thirdweb X account
      const isValidTweet = await verifyTweetMention(tweetUrl);
      if (!isValidTweet) {
        return NextResponse.json(
          { error: 'Tweet must mention @thirdweb to complete this quest' },
          { status: 400 }
        );
      }
    } else if (questId === 3) {
      // Quest 3: Requires minimum 0.01 ETH balance
      try {
        const balanceResponse = await fetch(`https://api.thirdweb.com/v1/wallets/${userAddress}/balance?chainId=84532`, {
          headers: {
            'x-secret-key': process.env.THIRDWEB_SECRET_KEY || '',
          },
        });

        if (!balanceResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch wallet balance' },
            { status: 500 }
          );
        }

        const balanceData = await balanceResponse.json();
        
        if (!balanceData.result || balanceData.result.length === 0) {
          return NextResponse.json(
            { error: 'Unable to retrieve wallet balance' },
            { status: 400 }
          );
        }

        const nativeToken = balanceData.result[0]; // First result is usually the native token
        const balance = parseFloat(nativeToken.displayValue);
        const minimumRequired = 0.001;

        if (balance < minimumRequired) {
          return NextResponse.json(
            { 
              error: `Insufficient balance. Quest requires minimum ${minimumRequired} ${nativeToken.symbol}. Current balance: ${balance.toFixed(4)} ${nativeToken.symbol}` 
            },
            { status: 400 }
          );
        }

      } catch (balanceError) {
        console.error('Error checking wallet balance for quest 3:', balanceError);
        return NextResponse.json(
          { error: 'Failed to verify wallet balance' },
          { status: 500 }
        );
      }
    } else if (questId === 4) {
      // Quest 4: Requires minimum 50 tokens
      try {
        const tokenBalanceResponse = await makeThirdwebRequest("/v1/contracts/read", {
          method: "POST",
          data: {
            calls: [
              {
                contractAddress: QUEST_CONTRACT_ADDRESS,
                method: "function balanceOf(address account) view returns (uint256)",
                params: [userAddress],
              },
            ],
            chainId: parseInt(CHAIN_ID),
          },
        });

        if (!tokenBalanceResponse.data || !tokenBalanceResponse.data.result) {
          return NextResponse.json(
            { error: 'Failed to fetch token balance' },
            { status: 500 }
          );
        }

        const tokenBalance = parseInt(tokenBalanceResponse.data.result[0]);
        const minimumRequired = 50;

        if (tokenBalance < minimumRequired) {
          return NextResponse.json(
            { 
              error: `Insufficient token balance. Quest requires minimum ${minimumRequired} tokens. Current balance: ${tokenBalance} tokens` 
            },
            { status: 400 }
          );
        }

      } catch (tokenBalanceError) {
        console.error('Error checking token balance for quest 4:', tokenBalanceError);
        return NextResponse.json(
          { error: 'Failed to verify token balance' },
          { status: 500 }
        );
      }
    }
    // Quest 1: Free quest - no additional verification needed

    // Validate required environment variables
    if (!process.env.ADMIN_ADDRESS) {
      return NextResponse.json(
        { error: 'ADMIN_ADDRESS environment variable is not set' },
        { status: 500 }
      );
    }

    if (!process.env.THIRDWEB_SECRET_KEY) {
      return NextResponse.json(
        { error: 'THIRDWEB_SECRET_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const response = await makeThirdwebRequest("/v1/contracts/write", {
      method: "POST",
      data: {
        calls: [
          {
            contractAddress: QUEST_CONTRACT_ADDRESS,
            method:
              "function completeQuestForUser(address _user, uint256 _questId)",
            params: [userAddress, questId],
          },
        ],
        chainId: parseInt(CHAIN_ID),
        from: process.env.ADMIN_ADDRESS!,
      },
    });

    // Distribute the quest reward tokens
    const rewardResult = await distributeReward(userAddress, 1);

    return NextResponse.json({ 
      success: true, 
      data: {
        contractUpdate: response.data,
        rewardDistribution: rewardResult.data,
        rewardAmount: 1,
        questId: questId,
        questType: getQuestTypeDescription(questId),
        verificationPassed: true
      }
    });
  } catch (error) {
    console.error('Error completing quest:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid user address')) {
        return NextResponse.json(
          { error: 'Invalid recipient address' },
          { status: 400 }
        );
      }
      if (error.message.includes('Reward amount must be greater than 0')) {
        return NextResponse.json(
          { error: 'Reward amount must be greater than 0' },
          { status: 400 }
        );
      }
      if (error.message.includes('environment variable is not set')) {
        return NextResponse.json(
          { error: 'Server configuration error. Please contact support.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to complete quest. Please try again.' },
      { status: 500 }
    );
  }
}
