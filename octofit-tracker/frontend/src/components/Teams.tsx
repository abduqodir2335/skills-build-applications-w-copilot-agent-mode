import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      try {
        const payload = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (!cancelled) {
          setTeams(payload.teams ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load teams.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Teams" description="Manage teams and members." statusText="Loading teams..." />;
  }

  if (error) {
    return (
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  if (teams.length === 0) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><p>No teams.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      <ul>
        {teams.map((team) => (
          <li key={team.name}>
            {team.name} ({team.members.length} members)
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
