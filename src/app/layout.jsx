import "./globals.css";

import { BProvider } from "@/context/BContext";
import { AProvider } from "@/context/AContext";
import { PVProvider } from "@/context/PVContext";
import { DataProvider } from "@/context/DataContext";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import DisableContextMenu from "@/components/DisableContextMenu";

export const metadata = {
  title: {
    default: "تلگراف | پیام‌رسان",
    template: "%s | تلگراف",
  },
  description: "تلگراف؛ پیام‌رسانی سریع و آسان.",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body className="select-none">
        <DisableContextMenu />

        <AuthProvider>
          <ThemeProvider>
            <ChatProvider>
              <DataProvider>
                <PVProvider>
                  <AProvider>
                    <BProvider>{children}</BProvider>
                  </AProvider>
                </PVProvider>
              </DataProvider>
            </ChatProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
