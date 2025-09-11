import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProviderWrapper } from "@/components/ThirdwebProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Quest Rewards",
	description: "Complete quests and earn blockchain rewards",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<ThirdwebProviderWrapper>
					{children}
				</ThirdwebProviderWrapper>
			</body>
		</html>
	);
}
