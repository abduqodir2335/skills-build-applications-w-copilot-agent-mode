import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

function activityError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw activityError('Activity input must be an object', 400);
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const objectIdPattern = /^[a-f\d]{24}$/i;
  if (typeof userId !== 'string' || !objectIdPattern.test(userId)) {
    throw activityError('A valid userId is required', 400);
  }
  if (typeof teamId !== 'string' || !objectIdPattern.test(teamId)) {
    throw activityError('A valid teamId is required', 400);
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw activityError('A valid activity type is required', 400);
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw activityError('Activity minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw activityError('The referenced user or team does not exist', 404);
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

function teamError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw teamError('Team input must be an object', 400);
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw teamError('A valid team name is required', 400);
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw teamError('A valid team mascot is required', 400);
  }
  if (members !== undefined && !Array.isArray(members)) {
    throw teamError('Team members must be an array of valid user IDs', 400);
  }

  const objectIdPattern = /^[a-f\d]{24}$/i;
  const normalizedMembers = Array.isArray(members)
    ? members.map((member) => {
        if (typeof member !== 'string' || !objectIdPattern.test(member)) {
          throw teamError('Team members must be valid user IDs', 400);
        }
        return member;
      })
    : [];

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
