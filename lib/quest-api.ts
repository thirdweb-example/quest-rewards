import { QUEST_CONTRACT_ADDRESS, CHAIN_ID } from './env';

// Quest data types
export interface QuestData {
  id: number;
  title: string;
  description: string;
  reward: number;
  requirements: string[];
  estimatedTimeMinutes: number;
  isActive: boolean;
  createdAt: number;
  endDate: number;
}

export interface UserDetails {
  completedQuestIds: number[];
  totalQuestsCompleted: number;
  dailyClaimInfo: {
  lastClaimTime: number;
    claimed: boolean;
  };
  canClaimDaily: boolean;
  timeUntilNextClaim: number;
}

// Get all quests from the smart contract
export async function getAllQuests(): Promise<QuestData[]> {
  try {
  const response = await fetch("https://api.thirdweb.com/v1/contracts/read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
    },
    body: JSON.stringify({
      calls: [
        {
          contractAddress: QUEST_CONTRACT_ADDRESS,
            method:
              "function getAllQuests() view returns (tuple(uint256,string,string,uint256,string[],uint256,bool,uint256,uint256)[])",
            params: [],
        },
      ],
        chainId: parseInt(CHAIN_ID),
    }),
  });

  const data = await response.json();
  
    if (!response.ok) {
      throw new Error(
        `Failed to fetch quests: ${data.message || "Unknown error"}`
      );
    }

    // The data structure is: data.result[0].data
    if (
      data.result &&
      data.result[0] &&
      data.result[0].data &&
      Array.isArray(data.result[0].data)
    ) {
      // Convert the raw array data to proper QuestData objects
      return data.result[0].data.map((quest: any[]) => ({
        id: parseInt(quest[0]),
        title: quest[1],
        description: quest[2],
        reward: parseInt(quest[3]) / Math.pow(10, 18), // Convert from wei to tokens
        requirements: quest[4],
        estimatedTimeMinutes: parseInt(quest[5]),
        isActive: quest[6],
        createdAt: parseInt(quest[7]),
        endDate: parseInt(quest[8]),
      }));
    } else {
      console.warn("Unexpected quest data format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching quests:", error);
    return [];
  }
}

// Get user details from the smart contract
export async function getUserDetails(
  userAddress: string
): Promise<UserDetails | null> {
  try {

    const response = await fetch("https://api.thirdweb.com/v1/contracts/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
      },
      body: JSON.stringify({
        calls: [
          {
            contractAddress: QUEST_CONTRACT_ADDRESS,
            method:
              "function getUserDetails(address) view returns (tuple(uint256[],uint256,tuple(uint256,bool),bool,uint256))",
            params: [userAddress],
          },
        ],
        chainId: parseInt(CHAIN_ID),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      throw new Error(
        `Failed to fetch user details: ${data.message || "Unknown error"}`
      );
    }

    // Parse the data structure: data.result[0].data is an array
    // [completedQuestIds, totalQuestsCompleted, dailyClaimInfo, canClaimDaily, timeUntilNextClaim]
    if (data.result && data.result[0] && data.result[0].data && Array.isArray(data.result[0].data)) {
      const userData = data.result[0].data;
      return {
        completedQuestIds: Array.isArray(userData[0]) ? userData[0].map((id: string) => parseInt(id)) : [],
        totalQuestsCompleted: parseInt(userData[1]) || 0,
        dailyClaimInfo: {
          lastClaimTime: parseInt(userData[2][0]) || 0,
          claimed: userData[2][1] || false
        },
        canClaimDaily: userData[3] || false,
        timeUntilNextClaim: parseInt(userData[4]) || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
}

// Utility functions
export function formatTimeUntilNextClaim(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;

  if (diff <= 0) return "Available now";

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatEstimatedTime(minutes: number): string {
  // Special case: if it's 120 minutes (2 hours), show as 2 minutes for the welcome quest
  if (minutes === 120) {
    return '2m';
  }
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
