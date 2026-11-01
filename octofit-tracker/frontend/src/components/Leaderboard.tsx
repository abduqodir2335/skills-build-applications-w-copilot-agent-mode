import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const payload = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!cancelled) {
          setLeaderboard(payload.leaderboard ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load leaderboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals." statusText="Loading leaderboard..." />;
  }

  if (error) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  if (leaderboard.length === 0) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p>No leaderboard rankings.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      <ol>
        {leaderboard.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`}>
            {entry.teamName}: {entry.totalPoints} points (rank {entry.rank})
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
