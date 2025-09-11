'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAllQuests,
  getUserDetails,
  formatTimeUntilNextClaim,
  formatTimestamp,
  formatEstimatedTime,
  type QuestData,
  type UserDetails
} from '../lib/quest-api';
import { QUEST_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from '../lib/env';

// No longer needed - using ConnectButton authentication

// Helper function to format seconds into readable time
function formatTimeFromSeconds(seconds: number): string {
  if (seconds <= 0) return "Available now";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

// Skeleton loading component for quest cards
const QuestSkeleton = () => (
  <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-neutral-700 rounded-xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-neutral-700 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-700 rounded w-1/3"></div>
      </div>
    </div>
    <div className="mt-4 flex justify-between items-center">
      <div className="h-8 bg-neutral-700 rounded w-24"></div>
      <div className="h-8 bg-neutral-700 rounded w-20"></div>
    </div>
  </div>
);

interface QuestManagerProps {
  userAddress: string;
  onQuestComplete?: (questId: number) => void;
  onDailyClaim?: () => void;
}

export default function QuestManager({ userAddress, onQuestComplete, onDailyClaim }: QuestManagerProps) {
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingQuest, setCompletingQuest] = useState<number | null>(null);
  const [tweetUrl, setTweetUrl] = useState<string>('');
  const [showTweetModal, setShowTweetModal] = useState<boolean>(false);
  const [currentQuestId, setCurrentQuestId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState<{
    symbol: string;
    displayValue: string;
    value: string;
  } | null>(null);
  const [tokenBalance, setTokenBalance] = useState<{
    symbol: string;
    displayValue: string;
    value: string;
  } | null>(null);

  // Complete a quest
  const completeQuest = async (questId: number, tweetUrl?: string) => {
    try {
      setCompletingQuest(questId);
      
      // Handle daily quest completion
      if (questId === 999) {
        const response = await fetch('/api/claim-daily', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userAddress }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to claim daily reward');
        }

        const data = await response.json();
        
        // Refresh data to sync with contract
        await loadQuestData();
        
        if (onDailyClaim) {
          onDailyClaim();
        }
        
        return data;
      } else {
        // Handle regular quest completion
        const response = await fetch('/api/complete-quest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questId, tweetUrl, userAddress }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to complete quest');
        }

        const data = await response.json();
        
        // Update user details immediately to reflect completion
        setUserDetails(prev => {
          if (!prev) return prev;
          const currentCompleted = prev.completedQuestIds || [];
          // Only add questId if it's not already in the array
          const updatedCompleted = currentCompleted.includes(questId) 
            ? currentCompleted 
            : [...currentCompleted, questId];
          
          return {
            ...prev,
            completedQuestIds: updatedCompleted
          };
        });
        
        // Refresh data to sync with contract
        await loadQuestData();
        
        if (onQuestComplete) {
          onQuestComplete(questId);
        }
        
        return data;
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
      throw error;
    } finally {
      setCompletingQuest(null);
    }
  };

  // Handle quest completion with tweet URL modal for Quest 2
  const handleQuestComplete = (questId: number) => {
    if (questId === 2) {
      // Show tweet URL modal for Quest 2
      setCurrentQuestId(questId);
      setShowTweetModal(true);
    } else {
      // Complete quest directly for other quests
      completeQuest(questId);
    }
  };

  // Handle tweet URL submission
  const handleTweetSubmit = async () => {
    if (!tweetUrl.trim()) {
      setError('Please enter a tweet URL');
      return;
    }

    try {
      await completeQuest(currentQuestId!, tweetUrl);
      setShowTweetModal(false);
      setTweetUrl('');
      setCurrentQuestId(null);
    } catch (error) {
      console.error('Failed to complete quest with tweet:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete quest');
    }
  };

  // Create a direct link to compose a tweet mentioning @thirdweb
  const createTweetLink = () => {
    const tweetText = encodeURIComponent("I just completed a quest on a platform built using @thirdweb in 48 hours! 🚀 The future of Web3 is here! #thirdweb #Web3 #Blockchain #Quest");
    return `https://x.com/intent/tweet?text=${tweetText}`;
  };


  // Claim daily reward
  const claimDailyReward = async () => {
    try {
      setIsClaimingDaily(true);
      
      const response = await fetch('/api/claim-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to claim daily reward');
      }

        const result = await response.json();
        
        // Update user details immediately to reflect daily claim
        setUserDetails(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            canClaimDaily: false,
            timeUntilNextClaim: 24 * 60 * 60, // 24 hours
            // Don't add 999 to completedQuestIds since contract doesn't know about it
          };
        });
        
        // Refresh data after claiming to get latest state
        await loadQuestData();
      
      if (onDailyClaim) {
        onDailyClaim();
      }
      
      
    } catch (err) {
      console.error('Failed to claim daily reward:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim daily reward. Please try again.');
    } finally {
      setIsClaimingDaily(false);
    }
  };

  // Load quest data using the quest-api functions
  const loadQuestData = async () => {
    try {
      setLoading(true);
      setError(null);


      // Use the quest-api functions directly
      const [questsData, userDetailsData] = await Promise.all([
        getAllQuests(),
        getUserDetails(userAddress)
      ]);


      setQuests(Array.isArray(questsData) ? questsData : []);
      setUserDetails(userDetailsData);
      
    } catch (err) {
      console.error('Failed to load quest data:', err);
      setError('Failed to load quest data. Please try again.');
      // Set empty arrays on error to prevent crashes
      setQuests([]);
      setUserDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch native token balance
  const fetchNativeBalance = async () => {
    try {
      const response = await fetch(`https://api.thirdweb.com/v1/wallets/${userAddress}/balance?chainId=84532`, {
        headers: {
          'x-client-id': process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.length > 0) {
          const nativeToken = data.result[0]; // First result is usually the native token
          setNativeBalance({
            symbol: nativeToken.symbol,
            displayValue: nativeToken.displayValue,
            value: nativeToken.value,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch native balance:', error);
    }
  };

  // Fetch token balance from smart contract
  const fetchTokenBalance = async () => {
    try {
      const response = await fetch('https://api.thirdweb.com/v1/contracts/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
        },
        body: JSON.stringify({
          calls: [
            {
              contractAddress: TOKEN_CONTRACT_ADDRESS,
              method: 'function balanceOf(address account) view returns (uint256)',
              params: [userAddress],
            },
          ],
          chainId: 84532,
        }),
      });

        if (response.ok) {
          const data = await response.json();
          if (data.result && data.result.length > 0 && data.result[0].data) {
            const balance = data.result[0].data;
            const balanceInTokens = parseInt(balance) / Math.pow(10, 18);
            setTokenBalance({
              symbol: '$QUEST',
              displayValue: balanceInTokens.toString(),
              value: balance,
            });
          } else {
            setTokenBalance({
              symbol: '$QUEST',
              displayValue: '0',
              value: '0',
            });
          }
        } else {
          console.error('Token balance fetch failed:', response.status, response.statusText);
          setTokenBalance({
            symbol: '$QUEST',
            displayValue: '0',
            value: '0',
          });
        }
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
    }
  };

  // Manual refresh with success message
  const refreshData = async () => {
    await loadQuestData();
    await fetchNativeBalance();
    await fetchTokenBalance();
    setRefreshMessage('Data refreshed successfully!');
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  useEffect(() => {
    if (userAddress) {
      loadQuestData();
      fetchNativeBalance();
      fetchTokenBalance();
    }
  }, [userAddress]);

  // Periodic refresh to keep data fresh
  useEffect(() => {
    if (userAddress) {
      const interval = setInterval(() => {
        loadQuestData();
        fetchNativeBalance();
        fetchTokenBalance();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [userAddress]);

  // Auto-refresh time until next claim
  useEffect(() => {
    if (userDetails && !userDetails.canClaimDaily && userDetails.timeUntilNextClaim > 0) {
      const interval = setInterval(() => {
        setUserDetails(prev => {
          if (!prev) return prev;
          const newTime = prev.timeUntilNextClaim - 1;
          return {
            ...prev,
            timeUntilNextClaim: newTime,
            canClaimDaily: newTime <= 0
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [userDetails?.canClaimDaily, userDetails?.timeUntilNextClaim]);

  const isQuestCompleted = (questId: number) => {
    // Special handling for daily quest - it's completed if user has claimed today (canClaimDaily is false)
    if (questId === 999) {
      return userDetails ? !userDetails.canClaimDaily : false;
    }
    return userDetails?.completedQuestIds?.includes(questId) || false;
  };

  const canCompleteQuest = (questId: number) => {
    // Quest 3 requires minimum 0.001 native token balance
    if (questId === 3) {
      if (!nativeBalance) return false;
      const balance = parseFloat(nativeBalance.displayValue);
      return !isNaN(balance) && balance >= 0.001;
    }
    // Quest 4 requires minimum 50 $QUEST
    if (questId === 4) {
      if (!tokenBalance) return false;
      const balance = parseFloat(tokenBalance.displayValue);
      return !isNaN(balance) && balance >= 50;
    }
    return true; // Other quests have no special requirements
  };

  const isQuestExpired = (quest: QuestData) => {
    return Date.now() / 1000 > quest.endDate;
  };


  if (loading) {
    return (
      <div className="w-full space-y-6">
        {/* Quest Progress Skeleton */}
        <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-neutral-700 rounded w-48"></div>
            <div className="h-8 bg-neutral-700 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-12 bg-neutral-700 rounded w-16 mx-auto mb-2"></div>
              <div className="h-4 bg-neutral-700 rounded w-20 mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-12 bg-neutral-700 rounded w-16 mx-auto mb-2"></div>
              <div className="h-4 bg-neutral-700 rounded w-24 mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-12 bg-neutral-700 rounded w-16 mx-auto mb-2"></div>
              <div className="h-4 bg-neutral-700 rounded w-20 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex space-x-4">
          <div className="h-10 bg-neutral-700 rounded-lg w-32 animate-pulse"></div>
          <div className="h-10 bg-neutral-700 rounded-lg w-32 animate-pulse"></div>
        </div>

        {/* Quest Cards Skeleton */}
        <div className="space-y-4">
          <QuestSkeleton />
          <QuestSkeleton />
          <QuestSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400 mr-2">⚠️</div>
          <div>
            <h3 className="text-red-300 font-medium">Error</h3>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={loadQuestData}
              className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeQuests = Array.isArray(quests) ? quests.filter(quest => quest.isActive) : [];
  
  // Create a daily claim quest
  const dailyQuest: QuestData = {
    id: 999, // Special ID for daily quest
    title: "Daily Reward Claim",
    description: "Claim your daily reward to maintain your streak and earn tokens!",
    reward: 1, // 1 token for daily claim
    requirements: ["Connect your wallet", "Claim daily reward"],
    estimatedTimeMinutes: 1,
    isActive: true,
    createdAt: Math.floor(Date.now() / 1000),
    endDate: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
  };

  // Add daily quest to the beginning of the quest list
  const allQuests = [dailyQuest, ...activeQuests];
  
  // Calculate completed count including daily quest
  const completedCount = allQuests.filter(quest => isQuestCompleted(quest.id)).length;
  
  // For daily quest, we need to add it to the count if it's completed but not in completedQuestIds
  const dailyQuestCompleted = isQuestCompleted(999);
  const contractCompletedCount = userDetails?.completedQuestIds?.length || 0;
  const finalCompletedCount = dailyQuestCompleted && !userDetails?.completedQuestIds?.includes(999) 
    ? contractCompletedCount + 1 
    : completedCount;
  

  // Filter quests based on active tab
  const filteredQuests = allQuests.filter(quest => {
    const completed = isQuestCompleted(quest.id);
    
    // Daily quest (ID 999) always shows in active tab
    if (quest.id === 999) {
      return activeTab === 'active';
    }
    
    // Other quests follow normal filtering
    return activeTab === 'completed' ? completed : !completed;
  });

  return (
    <div className="w-full space-y-6">
      {/* Success Message */}
      {refreshMessage && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm font-medium">
          {refreshMessage}
        </div>
      )}
      
      {/* Quest Progress Summary */}
      <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Quest Progress</h2>
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{allQuests.length}</div>
            <div className="text-gray-400 text-sm">Total Quests</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{finalCompletedCount}</div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {allQuests.length > 0 ? Math.round((finalCompletedCount / allQuests.length) * 100) : 0}%
            </div>
            <div className="text-gray-400 text-sm">Complete</div>
          </div>
        </div>
        
        {/* Show message if no quests exist yet */}
        {allQuests.length === 0 && !loading && !error && (
          <div className="mt-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center space-x-3">
              <span className="text-blue-400 text-xl">ℹ️</span>
              <div className="text-sm text-blue-300">
                <p className="font-medium">No quests have been created yet.</p>
                <p>Contact the administrator to set up quests for this platform.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quest Tabs */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-neutral-800/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'active'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-neutral-700/50'
            }`}
          >
            Active Quests ({allQuests.filter(quest => !isQuestCompleted(quest.id)).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'completed'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-neutral-700/50'
            }`}
          >
            Completed Quests ({finalCompletedCount})
          </button>
        </div>
        
        {filteredQuests.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">
              {activeTab === 'active' ? '🎯' : '✅'}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeTab === 'active' ? 'No Active Quests' : 'No Completed Quests'}
            </h3>
            <div className="text-gray-400 mb-4">
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span>Loading...</span>
                </div>
              ) : error ? (
                <div>
                  <p className="mb-3">Unable to load quests.</p>
                  <button
                    onClick={loadQuestData}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <p>
                  {activeTab === 'active' 
                    ? 'Check back later for new challenges.' 
                    : 'Complete some quests to see them here!'
                  }
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredQuests.map((quest) => {
              const completed = isQuestCompleted(quest.id);
              const expired = isQuestExpired(quest);
              const isCompleting = completingQuest === quest.id;
              
              return (
                  <div
                    key={quest.id}
                    className="bg-neutral-800/50 backdrop-blur-md border border-neutral-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl animate-fade-in-up"
                  >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">
                          {quest.id === 999 ? '⭐' : '🎯'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{quest.title}</h3>
                        <p className="text-gray-400 text-sm">
                          {formatEstimatedTime(quest.estimatedTimeMinutes)} • {quest.reward} $QUEST
                          {quest.id === 999 && userDetails && !userDetails.canClaimDaily && (
                            <span className="ml-2 text-amber-400">
                              • Next available in {formatTimeFromSeconds(userDetails.timeUntilNextClaim || 0)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {completed && (
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          ✓ Completed
                        </span>
                      )}
                      {expired && !completed && (
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          ⏰ Expired
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4">{quest.description.replace('40 $QUEST', '50 $QUEST')}</p>
                  
                  {/* Special requirement for quest 3 */}
                  {quest.id === 3 && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-amber-400 text-sm font-medium">
                          Requires minimum 0.001 {nativeBalance?.symbol || 'ETH'} balance
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-amber-300">
                        Current balance: {nativeBalance ? `${parseFloat(nativeBalance.displayValue).toFixed(4)} ${nativeBalance.symbol}` : 'Loading...'}
                      </div>
                    </div>
                  )}

                  {/* Special requirement for quest 4 */}
                  {quest.id === 4 && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-400 text-sm font-medium">
                          Requires minimum 50 $QUEST balance
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-blue-300">
                        Current balance: {tokenBalance && !isNaN(parseFloat(tokenBalance.displayValue)) ? `${parseFloat(tokenBalance.displayValue).toFixed(2)} ${tokenBalance.symbol}` : 'Loading...'} • Need 50 $QUEST
                      </div>
                    </div>
                  )}
                      
                  {/* Quest Requirements */}
                  {quest.requirements && quest.requirements.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {quest.requirements.map((req, index) => (
                          <li key={index} className="flex items-center space-x-3">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-sm text-gray-300">{req.replace('@thirdwebbin', '@thirdweb').replace('40 $QUEST', '50 $QUEST')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                      
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Ends: {formatTimestamp(quest.endDate)}
                    </div>
                      <div className="flex space-x-2">
                        {/* Daily Quest Logic */}
                        {quest.id === 999 && (
                          <>
                            {userDetails?.canClaimDaily && !completed && (
                              <button
                                onClick={() => claimDailyReward()}
                                disabled={isClaimingDaily}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                              >
                                {isClaimingDaily ? (
                                  <>
                                    <LoadingSpinner />
                                    <span className="ml-2">Claiming...</span>
                                  </>
                                ) : 'Claim Daily'}
                              </button>
                            )}
                            
                            {!userDetails?.canClaimDaily && !completed && (
                              <div className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg text-sm">
                                Next claim in {formatTimeFromSeconds(userDetails?.timeUntilNextClaim || 0)}
                              </div>
                            )}
                            
                            {completed && (
                              <div className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">
                                ✓ Claimed Today
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Regular Quest Logic */}
                        {quest.id !== 999 && (
                          <>
                            {!completed && !expired && (
                              <button
                                onClick={() => handleQuestComplete(quest.id)}
                                disabled={completingQuest === quest.id || !canCompleteQuest(quest.id)}
                                className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                                  canCompleteQuest(quest.id) 
                                    ? 'bg-blue-500 hover:bg-blue-600' 
                                    : 'bg-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {completingQuest === quest.id ? (
                                  <>
                                    <LoadingSpinner />
                                    <span className="ml-2">Completing...</span>
                                  </>
                                ) : quest.id === 3 && !canCompleteQuest(quest.id) ? (
                                  'Need 0.001 ETH'
                                ) : quest.id === 4 && !canCompleteQuest(quest.id) ? (
                                  'Need 50 $QUEST'
                                ) : 'Complete'}
                              </button>
                            )}
                            
                            {completed && (
                              <div className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">
                                ✓ Completed
                              </div>
                            )}
                          </>
                        )}
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tweet URL Modal for Quest 2 */}
      {showTweetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Tweet Verification</h3>
              <button
                onClick={() => {
                  setShowTweetModal(false);
                  setTweetUrl('');
                  setCurrentQuestId(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-4">
                Please share a tweet mentioning @thirdweb and paste the URL below to complete this quest.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tweet URL
                </label>
                <input
                  type="url"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="https://x.com/username/status/1234567890"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 text-sm">💡</span>
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Need help?</p>
                    <p>Make sure your tweet mentions @thirdweb to be eligible for this quest.</p>
                    <a
                      href={createTweetLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      🐦 Compose Tweet
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTweetModal(false);
                  setTweetUrl('');
                  setCurrentQuestId(null);
                }}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTweetSubmit}
                disabled={!tweetUrl.trim() || completingQuest === currentQuestId}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completingQuest === currentQuestId ? 'Verifying...' : 'Submit Tweet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}