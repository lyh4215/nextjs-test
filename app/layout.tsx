// app/layout.tsx
import { ZustandIpcProvider } from "@/providers/ZustandIpcProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ZustandIpcProvider />
        {children}
      </body>
    </html>
  );
}
