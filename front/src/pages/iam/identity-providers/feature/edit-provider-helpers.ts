import type { CreateProviderValues } from '../ui/page-create-provider'

/**
 * Pure helpers used by the identity-provider edit feature. Keeping them out of
 * the React container makes them testable with plain `node:test`.
 */

export interface ProviderLike {
  alias: string
  display_name?: string | null
  config?: Record<string, unknown> | null
}

/**
 * Coerces the raw `scopes` config value (string with spaces, array, or any
 * other shape) into a clean string list.
 */
export const parseScopes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    )
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.split(/\s+/).filter((scope) => scope.trim().length > 0)
  }
  return []
}

/**
 * Builds the pristine edit form values from a provider API response. The
 * `key` field is the alias so the container can detect when the provider
 * changes mid-render and reset the draft (same pattern as create/detail).
 */
export const buildPristineDraft = (
  provider: ProviderLike
): CreateProviderValues & { key: string } => {
  const config = provider.config ?? {}
  return {
    key: provider.alias,
    alias: provider.alias,
    displayName: provider.display_name ?? '',
    clientId: (config.client_id as string) ?? '',
    clientSecret: (config.client_secret as string) ?? '',
    authorizationUrl: (config.authorization_url as string) ?? '',
    tokenUrl: (config.token_url as string) ?? '',
    userinfoUrl: (config.userinfo_url as string) ?? '',
    scopes: parseScopes(config.scopes),
    usePkce: Boolean(config.use_pkce ?? true),
  }
}

/**
 * Maps the flat form values to the broker `config` record expected by the
 * update endpoint. `userinfo_url` is omitted when the field is left blank,
 * matching what the create flow produces.
 */
export const buildUpdateConfig = (
  values: CreateProviderValues
): Record<string, unknown> => {
  const config: Record<string, unknown> = {
    client_id: values.clientId,
    client_secret: values.clientSecret,
    authorization_url: values.authorizationUrl,
    token_url: values.tokenUrl,
    scopes: values.scopes.join(' '),
    use_pkce: values.usePkce,
  }
  if (values.userinfoUrl) {
    config.userinfo_url = values.userinfoUrl
  }
  return config
}
