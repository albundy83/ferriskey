import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useUpdateIdentityProvider, useIdentityProvider } from '@/api/identity-providers.api'
import type { CreateProviderErrors, CreateProviderValues } from '../ui/page-create-provider'
import PageProviderEdit from '../ui/page-provider-edit'
import { apiErrorMessage } from '@/lib/api-error'
import { translate } from '@/lib/i18n'
import { z } from 'zod'
import { createProviderSchema } from '../schemas/create-provider.schema'
import { getTemplateById } from '@/constants/identity-provider-templates'
import { buildPristineDraft, buildUpdateConfig } from './edit-provider-helpers'

const EMPTY_VALUES: CreateProviderValues = {
  alias: '',
  displayName: '',
  clientId: '',
  clientSecret: '',
  authorizationUrl: '',
  tokenUrl: '',
  userinfoUrl: '',
  scopes: [],
  usePkce: true,
}

interface Draft extends CreateProviderValues {
  key: string
}

const EMPTY_DRAFT: Draft = { key: '', ...EMPTY_VALUES }

const invalidUrl = () => translate('identity-provider:validation.url_invalid')

const configSchema = createProviderSchema.extend({
  displayName: z
    .string()
    .min(1, { error: () => translate('identity-provider:validation.display_name_required') })
    .max(50),
  clientId: z
    .string()
    .min(1, { error: () => translate('identity-provider:validation.client_id_required') }),
  clientSecret: z
    .string()
    .min(1, { error: () => translate('identity-provider:validation.client_secret_required') }),
  authorizationUrl: z.string().url({ error: invalidUrl }),
  tokenUrl: z.string().url({ error: invalidUrl }),
  userinfoUrl: z.string().url({ error: invalidUrl }).optional().or(z.literal('')),
})

export default function PageEditProviderFeature() {
  const { realm_name, alias } = useParams<{ realm_name: string; alias: string }>()
  const navigate = useNavigate()
  const realm = realm_name ?? 'master'
  const providerAlias = alias ?? ''

  const { data: provider, isLoading } = useIdentityProvider({
    realm,
    providerId: providerAlias,
  })

  const { mutate: updateProvider, isPending } = useUpdateIdentityProvider()

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  const template = provider ? getTemplateById(provider.provider_id) : null

  const providerKey = provider?.alias ?? ''
  const pristine: Draft = provider ? buildPristineDraft(provider) : EMPTY_DRAFT

  if (provider && draft.key !== providerKey) setDraft(pristine)

  const values: CreateProviderValues = draft.key === providerKey ? draft : pristine

  const parsed = configSchema.safeParse(values)

  const errors: CreateProviderErrors = {}
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && field in EMPTY_VALUES && !(field in errors)) {
        errors[field as keyof CreateProviderValues] = issue.message
      }
    }
  }

  const callbackUrl = `${window.apiUrl}/realms/${realm}/broker/${values.alias || 'provider'}/endpoint`

  const providerLabel = template ? template.displayName : (provider?.display_name || provider?.alias || 'Provider')

  const handleChange = (patch: Partial<CreateProviderValues>) => {
    setDraft((current: Draft) => ({
      ...current,
      ...patch,
    }))
  }

  const handleSubmit = () => {
    if (!provider || !parsed.success) return

    const config = buildUpdateConfig(values)

    updateProvider(
      {
        path: { realm_name: realm, alias: providerAlias },
        body: {
          display_name: values.displayName || providerLabel,
          config,
        },
      },
      {
        onError: (error: Error) => {
          toast.error(
            apiErrorMessage(error, translate('identity-provider:detail.update_error'))
          )
        },
        onSuccess: () => {
          toast.success(translate('identity-provider:detail.update_success'))
          navigate(`/realms/${realm}/identity-providers/${providerAlias}`)
        },
      }
    )
  }

  const handleBack = () => {
    navigate(`/realms/${realm}/identity-providers/${providerAlias}`)
  }

  if (!provider && !isLoading) {
    return null
  }

  const protocol = template?.provider_type ?? 'oidc'

  return (
    <PageProviderEdit
      template={template}
      protocol={protocol}
      values={values}
      errors={errors}
      callbackUrl={callbackUrl}
      canContinue={parsed.success}
      isPending={isPending}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onBack={handleBack}
    />
  )
}
