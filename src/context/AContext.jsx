"use client";

import { createContext, useContext, useState } from "react";

const AContext = createContext();

export function AProvider({ children }) {
  const [activeA, setActiveA] = useState(null);
  const [isS, setIsS] = useState(false);
  const [des, setDes] = useState(null);

  return (
    <AContext.Provider
      value={{
        activeA,
        setActiveA,
        isS,
        setIsS,
        des,
        setDes
      }}
    >
      {children}
    </AContext.Provider>
  );
}

export function useA() {
  return useContext(AContext);
}
