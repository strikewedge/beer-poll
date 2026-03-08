import "./globals.css";

export const metadata = {
  title: "Beer Poll",
  description: "Vote for your favorite beer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
