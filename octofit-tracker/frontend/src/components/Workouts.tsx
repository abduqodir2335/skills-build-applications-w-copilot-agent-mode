import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason?: string;
  focus?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      try {
        const payload = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!cancelled) {
          setSuggestions(payload.suggestions ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load workout suggestions.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." statusText="Loading workout suggestions..." />;
  }

  if (error) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <div role="alert">{error}</div>
      </CapabilityCard>
    );
  }

  if (suggestions.length === 0) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p>No workout suggestions.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`}>
            {suggestion.title}
            {suggestion.reason ? ` — ${suggestion.reason}` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
