"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Business } from "@/lib/agency-types";

export interface DbHealthStatus {
  configured: boolean;
  ready: boolean;
  keySource?: string;
  missingTables: string[];
  initSql?: string;
  message?: string;
}

interface WorkspaceContextValue {
  businesses: Business[];
  loading: boolean;
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string | null) => void;
  refreshBusinesses: () => Promise<void>;
  addModalOpen: boolean;
  setAddModalOpen: (open: boolean) => void;
  dbHealth: DbHealthStatus | null;
  refreshHealth: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const STORAGE_KEY = "takvim360_active_business_id";

export function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBusinessId, setActiveIdState] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [dbHealth, setDbHealth] = useState<DbHealthStatus | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDbHealth(data);
      }
    } catch {
      // ignore network error during initial boot
    }
  }, []);

  const refreshBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/businesses", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActiveIdState(saved);
    } catch {
      // ignore
    }
    void refreshHealth();
    void refreshBusinesses();
  }, [refreshHealth, refreshBusinesses]);

  const setActiveBusinessId = useCallback((id: string | null) => {
    setActiveIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId],
  );

  // If the stored business ID no longer exists after loading, reset to Agency Overview
  useEffect(() => {
    if (!loading && activeBusinessId && !activeBusiness) {
      setActiveBusinessId(null);
    }
  }, [loading, activeBusinessId, activeBusiness, setActiveBusinessId]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      businesses,
      loading,
      activeBusinessId,
      activeBusiness,
      setActiveBusinessId,
      refreshBusinesses,
      addModalOpen,
      setAddModalOpen,
      dbHealth,
      refreshHealth,
    }),
    [
      businesses,
      loading,
      activeBusinessId,
      activeBusiness,
      setActiveBusinessId,
      refreshBusinesses,
      addModalOpen,
      dbHealth,
      refreshHealth,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return ctx;
}
