import axios from "axios";

interface ThirdwebResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
}

export async function makeThirdwebRequest<T = any>(
	endpoint: string,
	options: {
		method: string;
		headers?: Record<string, string>;
		data?: any;
	},
): Promise<ThirdwebResponse<T>> {
	const baseUrl = "https://api.thirdweb.com";
	const url = `${baseUrl}${endpoint}`;

	const config = {
		method: options.method,
		url,
		headers: {
			"Content-Type": "application/json",
			"x-secret-key": process.env.THIRDWEB_SECRET_KEY,
			...options.headers,
		},
		...(options.data && { data: options.data }),
	};

	try {
		const response = await axios(config);
		return response;
	} catch (error: any) {
		if (error.response) {
			console.error('Thirdweb API Error Details:', {
				status: error.response.status,
				statusText: error.response.statusText,
				data: error.response.data,
				url: config.url,
				method: config.method,
				headers: config.headers
			});
			throw new Error(
				`Thirdweb API error: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`,
			);
		}
		throw new Error(`Thirdweb request failed: ${error.message}`);
	}
}

export async function getUserDetails(authToken: string) {
	const response = await makeThirdwebRequest("/v1/wallets/me", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response;
}

/**
 * Distributes reward tokens to a user's wallet by minting tokens directly
 * @param userAddress - The recipient's wallet address
 * @param amountInTokens - The amount of tokens to distribute (in human-readable format)
 * @param tokenDecimals - The number of decimals for the token (default: 18)
 * @returns Promise with the transaction result
 */
export async function distributeReward(
	userAddress: string,
	amountInTokens: number,
	tokenDecimals: number = 18
) {
	// Convert tokens to wei (smallest unit)
	const amountInWei = Math.floor(amountInTokens * Math.pow(10, tokenDecimals));
	
	// Validate inputs
	if (!userAddress || userAddress.length !== 42 || !userAddress.startsWith('0x')) {
		throw new Error('Invalid user address provided');
	}
	
	if (amountInTokens <= 0) {
		throw new Error('Reward amount must be greater than 0');
	}
	
	if (!process.env.TOKEN_CONTRACT_ADDRESS) {
		throw new Error('TOKEN_CONTRACT_ADDRESS environment variable is not set');
	}
	
	if (!process.env.ADMIN_ADDRESS) {
		throw new Error('ADMIN_ADDRESS environment variable is not set');
	}
	
	if (!process.env.CHAIN_ID) {
		throw new Error('CHAIN_ID environment variable is not set');
	}


	const response = await makeThirdwebRequest("/v1/contracts/write", {
		method: "POST",
		data: {
			calls: [
				{
					contractAddress: process.env.TOKEN_CONTRACT_ADDRESS,
					method: "function mintTo(address to, uint256 amount)",
					params: [userAddress, amountInWei.toString()],
				},
			],
			chainId: parseInt(process.env.CHAIN_ID),
			from: process.env.ADMIN_ADDRESS,
		},
	});

	return response;
}

/**
 * Utility function to convert wei to tokens
 * @param weiAmount - Amount in wei
 * @param decimals - Number of decimals (default: 18)
 * @returns Amount in tokens
 */
export function weiToTokens(weiAmount: string | number, decimals: number = 18): number {
	const wei = typeof weiAmount === 'string' ? parseInt(weiAmount) : weiAmount;
	return wei / Math.pow(10, decimals);
}

/**
 * Utility function to convert tokens to wei
 * @param tokenAmount - Amount in tokens
 * @param decimals - Number of decimals (default: 18)
 * @returns Amount in wei
 */
export function tokensToWei(tokenAmount: number, decimals: number = 18): string {
	return Math.floor(tokenAmount * Math.pow(10, decimals)).toString();
}

/**
 * Validates if an address is a valid Ethereum address
 * @param address - Address to validate
 * @returns True if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Verifies if a tweet URL contains a mention to Thirdweb X account
 * @param tweetUrl - The tweet URL to verify
 * @returns Promise<boolean> - True if tweet mentions @thirdweb
 */
export async function verifyTweetMention(tweetUrl: string): Promise<boolean> {
	try {
		// Basic URL validation
		if (!tweetUrl || typeof tweetUrl !== 'string') {
			return false;
		}

		// Check if it's a valid Twitter/X URL
		const twitterUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
		if (!twitterUrlPattern.test(tweetUrl)) {
			return false;
		}

		// Extract tweet ID from URL
		const tweetIdMatch = tweetUrl.match(/\/(\d+)$/);
		if (!tweetIdMatch) {
			return false;
		}

		const tweetId = tweetIdMatch[1];

		// Use Twitter API v2 to fetch tweet content
		const twitterApiUrl = `https://api.twitter.com/2/tweets/${tweetId}`;
		
		const response = await fetch(twitterApiUrl, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.error('Twitter API error:', response.status, response.statusText);
			return false;
		}

		const tweetData = await response.json();
		
		if (!tweetData.data || !tweetData.data.text) {
			console.error('No tweet data found');
			return false;
		}

		const tweetText = tweetData.data.text.toLowerCase();
		const hasThirdwebMention = tweetText.includes('@thirdweb') || tweetText.includes('thirdweb');
		
		
		return hasThirdwebMention;
		
	} catch (error) {
		console.error('Error verifying tweet mention:', error);
		return false;
	}
}