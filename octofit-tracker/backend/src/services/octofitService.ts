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
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = typeof userEmail === 'string' ? userEmail.trim() : '';
  if (!email) {
    throw Object.assign(new Error('A valid user email is required'), { status: 400 });
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(3).lean();
  const focusSignals = [user.fitnessGoal, ...recentActivities.map((activity) => activity.type)]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());

  const candidates = await Workout.find({ focus: { $in: focusSignals } }).lean();
  const fallback = await Workout.find().lean();
  const ordered = candidates.length > 0 ? candidates : fallback;

  const recentType = recentActivities[0]?.type;
  return ordered
    .map((workout) => ({
      ...workout,
      reason: workout.focus === user.fitnessGoal
        ? `Matches your ${user.fitnessGoal} goal and recent activity pattern.`
        : recentType && workout.focus.toLowerCase() === recentType.toLowerCase()
          ? `Builds on your recent ${recentType} activity pattern.`
          : `Recommended based on your recent activity pattern.`,
    }))
    .sort((left, right) => {
      const leftScore = Number(left.focus.toLowerCase() === user.fitnessGoal?.toLowerCase()) + Number(left.reason.toLowerCase().includes('recent'));
      const rightScore = Number(right.focus.toLowerCase() === user.fitnessGoal?.toLowerCase()) + Number(right.reason.toLowerCase().includes('recent'));
      return rightScore - leftScore;
    });
}

export { User };
