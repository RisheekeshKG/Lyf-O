import { useCallback, useState } from "react";
import { api } from "../lib/api";
import type { RecommendedItem, UserProfile } from "../types";

export function useRecommendations(profile: UserProfile | null) {
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [cluster, setCluster] = useState<number | string | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setStatus("Fetching recommendations…");
    setItems([]);

    try {
      const data = profile
        ? await api.recommendForProfile(profile)
        : await api.recommendRandom();

      const recommendations = data.recommendations ?? [];
      setItems(recommendations);
      setCluster(data.cluster ?? null);
      setStatus(
        profile
          ? `${recommendations.length} templates matched to your cluster`
          : `${recommendations.length} sample templates — add a profile for tailored results`,
      );
    } catch (error: any) {
      setStatus(`Failed — ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const enhance = useCallback(
    async (item: RecommendedItem) => {
      setStatus(`Enhancing "${item.name}"…`);
      try {
        const { enhanced } = await api.enhanceTemplate(item, profile);
        setItems((current) =>
          current.map((entry) => (entry.name === item.name ? enhanced : entry)),
        );
        setStatus(`Enhanced "${enhanced.name}"`);
      } catch (error: any) {
        setStatus(`Failed — ${error.message}`);
      }
    },
    [profile],
  );

  return { items, cluster, status, loading, fetchRecommendations, enhance, setStatus };
}
