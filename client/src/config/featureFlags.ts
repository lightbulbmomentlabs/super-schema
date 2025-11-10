/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for the frontend.
 * These flags should match the backend feature flags to ensure consistency.
 */

export const FEATURE_FLAGS = {
  /**
   * Enable team accounts feature
   * When false, team-related API calls and UI will be disabled
   */
  TEAMS_ENABLED: import.meta.env.VITE_ENABLE_TEAMS === 'true',

  /**
   * Enable team invitations
   * When false, invitation system will be disabled
   */
  TEAM_INVITES_ENABLED: import.meta.env.VITE_ENABLE_TEAM_INVITES === 'true',
} as const

/**
 * Check if a feature is enabled
 * @param feature - The feature flag to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature]
}
