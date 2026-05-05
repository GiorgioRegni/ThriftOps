import { useCallback, useEffect, useState } from "react";
import type { Event } from "../types/domain";
import { listEvents } from "../services/eventService";
import { useOrg } from "./useOrg";

export const useEvents = () => {
  const { org } = useOrg();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    setEvents(await listEvents(org.id));
    setLoading(false);
  }, [org]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { events, loading, refresh };
};
