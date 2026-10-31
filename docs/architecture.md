# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route-level screens and rendering in React; load API data through the shared client, and provide accessible loading, empty, and error states for each capability. Do not call `fetch` directly from feature components.
- Logic tier decision: Keep Express routes as HTTP adapters and put validation and capability behavior in the TypeScript service layer. Return deliberate 4xx responses for invalid or unknown input; do not add authentication in this exercise.
- Data tier decision: Define required fields, references, and defaults in the Mongoose models. Seed representative fixtures with idempotent upserts, preserve unrelated records, and maintain the seeded users' team memberships.
- Activity tracking approach: Validate the request shape, ObjectId syntax, and existence of both referenced records before writing. Compute points and `occurredAt` on the server, persist the activity, and return the same stored fields from the list endpoint.
- Team management approach: List and create teams through the service. Require a name, preserve the submitted name and mascot, and default members to an empty array when omitted.
- Leaderboard approach: Aggregate activity points by team, sort teams from highest to lowest total, and return `teamName`, `totalPoints`, and a 1-based rank.
- Workout suggestions approach: Find the user by email, use their fitness goal and recent activity to rank matching workouts, and include a concise reason for the first suggestion. Return a deliberate 4xx when no user matches.

## Test plan

Run the focused checks after each tier change, then run both builds before considering the implementation complete. A failure should first be investigated in the tier covered by that command; do not compensate for a backend contract failure in the presentation layer.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - failures indicate model validation/defaults or seed idempotency, fixture coverage, or preservation problems.
- API command: `npm run test:api --prefix octofit-tracker/backend` - failures indicate route/service behavior, response shape/status, reference validation, aggregation, or recommendation logic problems.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - failures indicate API-client integration, rendered data, or accessible loading/empty/error states in the presentation tier.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - failures indicate backend TypeScript compilation or type-contract problems.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - failures indicate frontend TypeScript or Vite production-build problems.
- Exercise metadata command: `node --test tests/exercise-validation.test.mjs` - failures indicate repository exercise/workflow/README validation, not an OctoFit runtime tier failure; resolve those separately from feature-contract failures.
