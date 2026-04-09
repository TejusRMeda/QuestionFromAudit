import { ReactNode } from "react";
import { Geist, Roboto_Slab } from "next/font/google";
import { Viewport } from "next";
import { getSEOTags } from "@/lib/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const robotoSlab = Roboto_Slab({ subsets: ["latin"], variable: "--font-roboto-slab" });

export const viewport: Viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			data-theme={config.colors.theme}
			className={cn(geist.className, "font-sans", geist.variable, robotoSlab.variable)}
		>
			<head>
				<meta httpEquiv="Content-Language" content="en" />
				{process.env.NODE_ENV === "development" && (
					<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
				)}
			</head>
			<body>
				<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg">Skip to main content</a>
				{/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
				<ClientLayout><main id="main-content">{children}</main></ClientLayout>
			</body>
		</html>
	);
}
