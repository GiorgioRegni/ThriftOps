import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Org } from "../types/domain";
import { useAuth } from "./useAuth";
import { findOrgsForUser } from "../services/orgService";

interface OrgContextValue {
  org: Org | null;
  orgs: Org[];
  loading: boolean;
  error: string;
  refreshOrgs: () => Promise<void>;
  setActiveOrgId: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextValue>({
  org: null,
  orgs: [],
  loading: true,
  error: "",
  refreshOrgs: async () => undefined,
  setActiveOrgId: () => undefined
});

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgIdState] = useState<string>(() => localStorage.getItem("thriftops.activeOrgId") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshOrgs = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setOrgs([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nextOrgs = await findOrgsForUser(user.uid);
      setOrgs(nextOrgs);
      if (!activeOrgId && nextOrgs[0]) {
        setActiveOrgIdState(nextOrgs[0].id);
        localStorage.setItem("thriftops.activeOrgId", nextOrgs[0].id);
      }
    } catch (err) {
      setOrgs([]);
      setError(err instanceof Error ? err.message : "Unable to load organizations.");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, authLoading, user]);

  useEffect(() => {
    void refreshOrgs();
  }, [refreshOrgs]);

  const setActiveOrgId = (orgId: string) => {
    setActiveOrgIdState(orgId);
    localStorage.setItem("thriftops.activeOrgId", orgId);
  };

  const org = orgs.find((candidate) => candidate.id === activeOrgId) ?? orgs[0] ?? null;
  const value = useMemo(() => ({ org, orgs, loading, error, refreshOrgs, setActiveOrgId }), [org, orgs, loading, error, refreshOrgs]);
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrg = (): OrgContextValue => useContext(OrgContext);
