// This hook is disabled to allow standard session management via NextAuth.
// Sessions now last 24 hours without forced inactivity logout.
export const useSessionTimeout = () => {
  // No-op: Removed aggressive timeout logic for better UX
  return {};
};
