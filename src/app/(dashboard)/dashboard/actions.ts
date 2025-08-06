// Dashboard actions are now centralized in /lib/actions/
// This file is kept for backward compatibility and re-exports

export {
  updateCycleStatus,
  createCycleFromObject as createCycle
} from '@/lib/actions/cycles'