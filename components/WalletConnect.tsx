"use client";

import { ConnectButton } from "thirdweb/react";
import { polygon } from "thirdweb/chains";
import { client } from "./ThirdwebProvider";

export function WalletConnect() {
  return (
    <div className="bg-gray-900 rounded-lg p-8 shadow-2xl border border-gray-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-2xl">
            🎯
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-2">
            Quest Rewards
          </h2>
          <p className="text-gray-400 text-lg">
            Connect your wallet to start earning rewards
          </p>
        </div>

        <div className="flex justify-center">
          <ConnectButton 
            client={client}
            chain={polygon}
            connectButton={{
              label: "Connect Wallet",
              style: {
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "white",
                fontWeight: "600",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }
            }}
            connectModal={{
              size: "compact",
              title: "Connect to Quest Rewards",
              titleIcon: "🎯",
              showThirdwebBranding: false,
            }}
          />
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-gray-400 text-sm font-medium">
            Secure wallet connection via thirdweb
          </p>
          <p className="text-gray-500 text-xs">
            Your wallet stays in your control
          </p>
        </div>
      </div>
    </div>
  );
}
