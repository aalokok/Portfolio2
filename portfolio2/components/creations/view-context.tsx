"use client";

import { createContext, useContext, useState } from "react";

export type CreationsView = "scroll" | "grid";

type ViewContextValue = {
  view: CreationsView;
  setView: (v: CreationsView) => void;
};

const ViewContext = createContext<ViewContextValue>({
  view: "scroll",
  setView: () => {},
});

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<CreationsView>("scroll");
  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useCreationsView() {
  return useContext(ViewContext);
}
