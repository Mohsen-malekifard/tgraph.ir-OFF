"use client";

import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [selectedData, setSelectedData] = useState(null);

  return (
    <ChatContext.Provider
      value={{
        selectedData,
        setSelectedData,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
