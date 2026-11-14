"use client";

import { createContext, useContext, useState } from "react";

const BContext = createContext();

export function BProvider({ children }) {
  const [activeB, setActiveB] = useState(null);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  return (
    <BContext.Provider
      value={{
        activeB,
        setActiveB,
        isOpen2,
        setIsOpen2,
        isHidden,
        setIsHidden
      }}
    >
      {children}
    </BContext.Provider>
  );
}

export function useB() {
  return useContext(BContext);
}
