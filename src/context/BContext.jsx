"use client";

import { createContext, useContext, useState } from "react";

const BContext = createContext();

export function BProvider({ children }) {
  const [activeB, setActiveB] = useState(null);

  return (
    <BContext.Provider
      value={{
        activeB,
        setActiveB,
      }}
    >
      {children}
    </BContext.Provider>
  );
}

export function useB() {
  return useContext(BContext);
}
