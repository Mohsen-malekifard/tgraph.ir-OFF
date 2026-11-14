"use client";

import { createContext, useContext, useState } from "react";

const AContext = createContext();

export function AProvider({ children }) {
  const [activeA, setActiveA] = useState(null);
  const [isS, setIsS] = useState(false);

  return (
    <AContext.Provider
      value={{
        activeA,
        setActiveA,
        isS,
        setIsS
      }}
    >
      {children}
    </AContext.Provider>
  );
}

export function useA() {
  return useContext(AContext);
}
