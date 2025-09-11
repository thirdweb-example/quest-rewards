"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { WalletConnect } from "@/components/WalletConnect";
import QuestManager from "@/components/QuestManager";
import { THIRDWEB_API_BASE_URL, THIRDWEB_CLIENT_ID, TOKEN_CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/env";
import { getUserDetails } from "../lib/quest-api";



interface Reward {
	id: string;
	questId: string;
	amount: number;
	claimedAt: Date;
	status: 'pending' | 'claimed';
}


export default function Home() {
	const activeAccount = useActiveAccount();
	const [isLoading, setIsLoading] = useState(false);
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState({
		title: "",
		subtitle: "",
		isAutoLogin: false,
	});
	const [loginTimestamp, setLoginTimestamp] = useState<number | null>(null);
	const [tokenBalance, setTokenBalance] = useState<string>("0");
	const [activeTab, setActiveTab] = useState<'quests' | 'profile'>('quests');
	const [rewards, setRewards] = useState<Reward[]>([]);
	const [dailyClaimInfo, setDailyClaimInfo] = useState<any>(null);
	const [canClaimDaily, setCanClaimDaily] = useState(false);
	const [nativeBalance, setNativeBalance] = useState<{
		symbol: string;
		displayValue: string;
		value: string;
	} | null>(null);


	// Function to fetch native token balance
	const fetchNativeBalance = async (userAddress: string) => {
		try {
			const response = await fetch(`https://api.thirdweb.com/v1/wallets/${userAddress}/balance?chainId=84532`, {
				headers: {
					'x-client-id': THIRDWEB_CLIENT_ID,
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

	// Function to fetch token balance
	const fetchTokenBalance = async (userAddress: string): Promise<string> => {
		try {
			const response = await fetch(
				`${THIRDWEB_API_BASE_URL}/v1/contracts/read`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-client-id": THIRDWEB_CLIENT_ID,
					},
					body: JSON.stringify({
						calls: [
							{
								contractAddress: TOKEN_CONTRACT_ADDRESS,
								method: "function balanceOf(address account) view returns (uint256)",
								params: [userAddress],
							},
						],
						chainId: parseInt(CHAIN_ID),
					}),
				},
			);

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			const data = await response.json();

			if (
				data.result &&
				Array.isArray(data.result) &&
				data.result[0] &&
				data.result[0].success &&
				data.result[0].data
			) {
				const rawBalance = data.result[0].data;
				const balance = (BigInt(rawBalance) / BigInt(10 ** 18)).toString();
				return balance;
			} else {
				throw new Error("Invalid API response format");
			}
		} catch (error) {
			return "0";
		}
	};

	// Function to check daily claim status
	const checkDailyClaimStatus = async (userAddress: string) => {
		try {
			const userDetails = await getUserDetails(userAddress);
			
			if (userDetails) {
				setDailyClaimInfo({
					currentStreak: 0, // This would need to be calculated from contract data
					totalClaims: 0, // This would need to be calculated from contract data
					lastClaimTime: userDetails.dailyClaimInfo.lastClaimTime
				});
				setCanClaimDaily(userDetails.canClaimDaily);
			} else {
				setDailyClaimInfo(null);
				setCanClaimDaily(false);
			}
		} catch (error) {
			console.error('Failed to check daily claim status:', error);
			setDailyClaimInfo(null);
			setCanClaimDaily(false);
		}
	};

	// Handle wallet connection changes
	useEffect(() => {
		if (activeAccount?.address) {
			const now = Date.now();
			setLoginTimestamp(now);

			// Load user data when wallet connects
			const loadUserData = async () => {
				setIsLoading(true);
				try {
					const [balance] = await Promise.all([
						fetchTokenBalance(activeAccount.address),
						checkDailyClaimStatus(activeAccount.address),
						fetchNativeBalance(activeAccount.address)
					]);
					setTokenBalance(balance);

					setToastMessage({
						title: "Wallet Connected!",
						subtitle: `Welcome to Quest Rewards`,
						isAutoLogin: false,
					});
					setShowToast(true);
					setTimeout(() => setShowToast(false), 3000);
				} catch (error) {
					console.error('Failed to load user data:', error);
				} finally {
					setIsLoading(false);
				}
			};

			loadUserData();
		} else {
			// Reset state when wallet disconnects
			setTokenBalance("0");
			setRewards([]);
			setDailyClaimInfo(null);
			setCanClaimDaily(false);
			setLoginTimestamp(null);
		}
	}, [activeAccount?.address]);




	return (
		<div className="min-h-screen bg-black text-white">
			{/* Toast Notifications */}
			{showToast && (
				<div className="fixed top-6 right-6 z-50 animate-slide-in">
					<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-2xl">
						<div className="flex items-center space-x-3">
							<span className="text-xl">🎉</span>
							<div>
								<p className="font-semibold text-sm text-white">{toastMessage.title}</p>
								<p className="text-xs text-gray-400">{toastMessage.subtitle}</p>
						</div>
						<button
							onClick={() => setShowToast(false)}
								className="text-gray-400 hover:text-white ml-4 p-1 hover:bg-gray-700 rounded transition-all"
						>
							✕
						</button>
								</div>
							</div>
						</div>
					)}

				{!activeAccount ? (
				<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
					<div className="max-w-md w-full">
						{isLoading ? (
							<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 shadow-2xl text-center backdrop-blur-sm">
								<div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
								<h3 className="text-2xl font-bold text-white mb-3">
									Loading...
								</h3>
								<p className="text-gray-300">
									Preparing your experience
								</p>
							</div>
						) : (
							<WalletConnect />
						)}
					</div>
					</div>
				) : (
				<div className="flex min-h-screen bg-black">
					{/* Sidebar */}
					<div className="w-64 bg-black border-r border-gray-800 flex flex-col">
						{/* Logo */}
						<div className="p-6 border-b border-gray-800">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
									<span className="text-white font-bold text-sm">QR</span>
								</div>
								<div>
									<h1 className="text-white font-bold text-lg">Quest Rewards</h1>
									<p className="text-gray-400 text-xs">Blockchain Platform</p>
								</div>
							</div>
						</div>

						{/* Navigation */}
						<nav className="flex-1 p-4 space-y-2">
							<button
								onClick={() => setActiveTab('quests')}
								className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
									activeTab === 'quests' 
										? 'bg-gray-900 text-white' 
										: 'text-gray-400 hover:text-white hover:bg-gray-900'
								}`}
							>
								<span className="text-lg">🎯</span>
								<span>Quests</span>
							</button>
							<button
								onClick={() => setActiveTab('profile')}
								className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
									activeTab === 'profile' 
										? 'bg-gray-900 text-white' 
										: 'text-gray-400 hover:text-white hover:bg-gray-900'
								}`}
							>
								<span className="text-lg">👤</span>
								<span>Profile</span>
							</button>
						</nav>

						{/* User Info */}
						<div className="p-4 border-t border-gray-800">
							<div className="flex items-center space-x-3 mb-3">
								<div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
									<span className="text-white text-sm font-bold">
										{activeAccount?.address?.charAt(2).toUpperCase()}
									</span>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-white text-sm font-medium truncate">
										{activeAccount?.address?.slice(0, 6)}...{activeAccount?.address?.slice(-4)}
									</p>
									<p className="text-gray-400 text-xs">Connected Wallet</p>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-400 text-xs">Balance</span>
								<span className="text-white text-sm font-semibold">
									{parseInt(tokenBalance).toLocaleString()} tokens
								</span>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="flex-1 flex flex-col bg-black">
						{/* Header */}
						<div className="bg-black border-b border-gray-800 px-6 py-6">
								<div className="flex items-center justify-between">
									<div>
									<h2 className="text-2xl font-bold text-white">
										{activeTab === 'quests' && 'Quest Dashboard'}
										{activeTab === 'profile' && 'Profile Settings'}
									</h2>
									<p className="text-gray-400 mt-1">
										{activeTab === 'quests' && 'Complete quests to earn rewards'}
										{activeTab === 'profile' && 'Manage your account and preferences'}
									</p>
								</div>
								<div className="flex items-center space-x-4">
									<div className="bg-gray-800 rounded-lg px-4 py-2">
										<span className="text-gray-400 text-sm">$QUEST Balance</span>
										<p className="text-white font-bold text-lg">
											{parseInt(tokenBalance).toLocaleString()}
										</p>
									</div>
									<div className="bg-gray-800 rounded-lg px-4 py-2">
										<span className="text-gray-400 text-sm">Native Balance</span>
										<p className="text-white font-bold text-lg">
											{nativeBalance ? `${parseFloat(nativeBalance.displayValue).toFixed(4)}` : '0.0000'} {nativeBalance?.symbol || 'ETH'}
										</p>
									</div>
								</div>
								</div>
							</div>

						{/* Content Area */}
						<div className="flex-1 p-6 bg-black">
							{activeTab === 'quests' && activeAccount?.address && (
								<QuestManager 
									userAddress={activeAccount.address}
									onQuestComplete={async (questId) => {
										// Refresh token balance and daily claim status after quest completion
										const [balance] = await Promise.all([
											fetchTokenBalance(activeAccount.address),
											checkDailyClaimStatus(activeAccount.address),
											fetchNativeBalance(activeAccount.address)
										]);
										setTokenBalance(balance);
									}}
									onDailyClaim={async () => {
										// Refresh token balance and daily claim status after daily claim
										const [balance] = await Promise.all([
											fetchTokenBalance(activeAccount.address),
											checkDailyClaimStatus(activeAccount.address),
											fetchNativeBalance(activeAccount.address)
										]);
										setTokenBalance(balance);
									}}
								/>
							)}


							{activeTab === 'profile' && (
								<div className="space-y-6">
									{/* Profile Info */}
									<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
										<h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
										<div className="space-y-4">
											<div className="flex justify-between items-center py-2 border-b border-gray-700">
												<span className="text-gray-400">Wallet Address</span>
												<span className="text-white font-mono text-sm">
													{activeAccount?.address?.slice(0, 10)}...{activeAccount?.address?.slice(-8)}
												</span>
											</div>
											<div className="flex justify-between items-center py-2 border-b border-gray-700">
												<span className="text-gray-400">Network</span>
												<span className="text-white">Base Sepolia</span>
											</div>
											<div className="flex justify-between items-center py-2 border-b border-gray-700">
												<span className="text-gray-400">Connected Since</span>
												<span className="text-white">
													{loginTimestamp ? new Date(loginTimestamp).toLocaleDateString() : 'N/A'}
												</span>
											</div>
											<div className="flex justify-between items-center py-2">
												<span className="text-gray-400">Total Balance</span>
												<span className="text-white font-semibold">
													{parseInt(tokenBalance).toLocaleString()} tokens
												</span>
											</div>
										</div>
									</div>


								</div>
							)}
						</div>
					</div>
					</div>
				)}
			</div>
	);
}