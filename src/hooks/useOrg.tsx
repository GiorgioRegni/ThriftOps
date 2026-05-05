import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Org } from "../types/domain";
import { useAuth } from "./useAuth";
import { findOrgsForUser } from "../services/orgService";

interface OrgContextValue {
  org: Org | null;
  orgs: Org[];
  loading: boolean;
  refreshOrgs: () => Promise<void>;
  setActiveOrgId: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextValue>({
  org: null,
  orgs: [],
  loading: true,
  refreshOrgs: async () => undefined,
  setActiveOrgId: () => undefined
});

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgIdState] = useState<string>(() => localStorage.getItem("thriftops.activeOrgId") ?? "");
  const [loading, setLoading] = useState(true);

  const refreshOrgs = useCallback(async () => {
    if (!user) {
      setOrgs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const nextOrgs = await findOrgsForUser(user.uid);
    setOrgs(nextOrgs);
    if (!activeOrgId && nextOrgs[0]) {
      setActiveOrgIdState(nextOrgs[0].id);
      localStorage.setItem("thriftops.activeOrgId", nextOrgs[0].id);
    }
    setLoading(false);
  }, [activeOrgId, user]);

  useEffect(() => {
    void refreshOrgs();
  }, [refreshOrgs]);

  const setActiveOrgId = (orgId: string) => {
    setActiveOrgIdState(orgId);
    localStorage.setItem("thriftops.activeOrgId", orgId);
  };

  const org = orgs.find((candidate) => candidate.id === activeOrgId) ?? orgs[0] ?? null;
  const value = useMemo(() => ({ org, orgs, loading, refreshOrgs, setActiveOrgId }), [org, orgs, loading, refreshOrgs]);
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrg = (): OrgContextValue => useContext(OrgContext);
