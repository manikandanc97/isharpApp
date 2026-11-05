import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "I-Sharp Academy | Premier NEET, IIT-JEE, MAT, CAT & TANCET Coaching Coimbatore",
  description:
    "Top Rated NEET & IIT-JEE Coaching Centre in Coimbatore. Dedicated batches for Tamil Medium students, calibrated NTA pattern test series, one-on-one doubt clearing, and hostel facilities.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
