import { NextRequest, NextResponse } from 'next/server';
import { makeThirdwebRequest, distributeReward, isValidAddress } from '@/lib/thirdweb';
import { QUEST_CONTRACT_ADDRESS, CHAIN_ID } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json();

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

    // Check if daily claim is actually available from contract
    const userDetailsResponse = await makeThirdwebRequest("/v1/contracts/read", {
      method: "POST",
      data: {
        calls: [
          {
            contractAddress: QUEST_CONTRACT_ADDRESS,
            method: "function getUserDetails(address) view returns (tuple(uint256[],uint256,tuple(uint256,bool),bool,uint256))",
            params: [userAddress],
          },
        ],
        chainId: parseInt(CHAIN_ID),
      },
    });

    // Parse the user details from contract
    const contractData = userDetailsResponse.data.result?.[0]?.data;
    if (!contractData || !Array.isArray(contractData)) {
      return NextResponse.json(
        { error: 'Unable to retrieve user details from contract' },
        { status: 400 }
      );
    }

    // Extract daily claim info: [completedQuestIds, totalQuestsCompleted, dailyClaimInfo, canClaimDaily, timeUntilNextClaim]
    const canClaimDaily = contractData[3];
    const timeUntilNextClaim = parseInt(contractData[4]) || 0;
    const lastClaimTime = parseInt(contractData[2][0]) || 0;

    if (!canClaimDaily) {
      return NextResponse.json(
        { 
          error: 'Daily claim is not available', 
          details: {
            canClaimDaily,
            timeUntilNextClaim,
            lastClaimTime
          }
        },
        { status: 400 }
      );
    }

    // First, update the daily claim status in the contract
    const response = await makeThirdwebRequest("/v1/contracts/write", {
      method: "POST",
      data: {
        calls: [
          {
            contractAddress: QUEST_CONTRACT_ADDRESS,
            method: "function setDailyClaimed(address _user)",
            params: [userAddress],
          },
        ],
        chainId: parseInt(CHAIN_ID),
        from: process.env.ADMIN_ADDRESS!,
      },
    });

    // Then distribute the daily reward tokens
    const dailyRewardAmount = 1; // 1 token for daily claim
    const rewardResult = await distributeReward(userAddress, dailyRewardAmount);

    return NextResponse.json({ 
      success: true, 
      data: {
        contractUpdate: response.data,
        rewardDistribution: rewardResult.data,
        rewardAmount: dailyRewardAmount
      }
    });
  } catch (error) {
    console.error('Error claiming daily balance:', error);
    
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
      { error: 'Failed to claim daily reward. Please try again.' },
      { status: 500 }
    );
  }
}

