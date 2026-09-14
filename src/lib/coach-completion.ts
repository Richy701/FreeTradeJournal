import { UserStorage } from '@/utils/user-storage';

export const COACH_COMPLETION_EVENT = 'ftj-coach-completed';
const KEY = 'coachCompleted';

export function hasCompletedCoach(userId: string): boolean {
  return UserStorage.getItem(userId, KEY) === 'true';
}

export function markCoachCompleted(userId: string): void {
  if (hasCompletedCoach(userId)) return;
  UserStorage.setItem(userId, KEY, 'true');
  window.dispatchEvent(new Event(COACH_COMPLETION_EVENT));
}
