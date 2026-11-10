"use client";

import { createContext, useContext, useState } from "react";

const AContext = createContext();

export function AProvider({ children }) {
  const [activeA, setActiveA] = useState(null);

  return (
    <AContext.Provider
      value={{
        activeA,
        setActiveA,
      }}
    >
      {children}
    </AContext.Provider>
  );
}

export function useA() {
  return useContext(AContext);
}
