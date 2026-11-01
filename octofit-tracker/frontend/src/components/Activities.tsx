import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      try {
        const payload = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (!cancelled) {
          setActivities(payload.activities ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load activities.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadActivities();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." statusText="Loading activities..." />;
  }

  if (error) {
    return (
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  if (activities.length === 0) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p>No activities.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      <ul>
        {activities.map((activity, index) => (
          <li key={`${activity.type}-${index}`}>
            {activity.type} · {activity.minutes} minutes · {activity.points} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
