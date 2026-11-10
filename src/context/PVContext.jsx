"use client";

import { createContext, useContext, useState } from "react";

const PVContext = createContext();

export function PVProvider({ children }) {
  const [activePV, setActivePV] = useState(null);

  return (
    <PVContext.Provider
      value={{
        activePV,
        setActivePV,
      }}
    >
      {children}
    </PVContext.Provider>
  );
}

export function usePV() {
  return useContext(PVContext);
}
