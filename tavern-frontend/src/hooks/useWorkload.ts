// src/hooks/useWorkload.ts
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type WorkloadStatus = "OK" | "WARNING" | "BLOCKED";

type WorkloadResponse = {
  success: boolean;
  activeCount: number;
  maxActive: number;
  status: WorkloadStatus;
  message: string;
};

export function useWorkload() {
  const { token } = useAuth();
  const [data, setData] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<WorkloadResponse>(
          "/adventurers/me/workload",
          token
        );
        setData(res);
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load workload");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return { data, loading, error };
}
