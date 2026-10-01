import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/kit/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { ChipInput, FieldRow, PageShell, Section } from '@/components/kit'
import { Switch } from '@/components/ui/switch'
import ProviderIcon from '@/components/provider-icon'
import {
  templateDisplayName,
  type ProviderTemplate,
} from '@/constants/identity-provider-templates'
import { cn } from '@/lib/utils'
import { tokens } from '@/styles/style-tokens'
import type { ProviderProtocol } from '../provider-status'
import ProviderSetupRail from './provider-setup-rail'
import type { CreateProviderErrors, CreateProviderValues } from './page-create-provider'

export interface PageProviderEditProps {
  template: ProviderTemplate | null
  protocol: ProviderProtocol
  values: CreateProviderValues
  errors: CreateProviderErrors
  callbackUrl: string
  canContinue: boolean
  isPending: boolean
  onChange: (patch: Partial<CreateProviderValues>) => void
  onSubmit: () => void
  onBack: () => void
}

const CUSTOM_TEMPLATE_ID = 'custom'

const AUTHORIZATION_URL_PLACEHOLDER = 'https://provider.com/oauth/authorize'
const TOKEN_URL_PLACEHOLDER = 'https://provider.com/oauth/token'
const USERINFO_URL_PLACEHOLDER = 'https://provider.com/api/userinfo'
const SCOPE_PLACEHOLDER = 'openid'

export default function PageProviderEdit({
  template,
  values,
  errors,
  callbackUrl,
  canContinue,
  isPending,
  onChange,
  onSubmit,
  onBack,
}: PageProviderEditProps) {
  const { t } = useTranslation('identity-provider')
  const [showSecret, setShowSecret] = useState(false)

  const isCustom = template?.id === CUSTOM_TEMPLATE_ID
  const providerLabel = template ? templateDisplayName(template) : values.displayName || 'Provider'
  const protocol = template?.provider_type ?? 'oidc'

  return (
    <PageShell>
      <Button variant='ghost' size='sm' className='-ml-2 mb-2 text-neutral-500 dark:text-neutral-400' onClick={onBack}>
        <ArrowLeft className='size-3.5' />
        {t('edit.back')}
      </Button>

      <div className={tokens.header.spacing}>
        <h1 className={tokens.header.title}>{t('edit.title')}</h1>
        <p className='mt-0.5 text-sm text-neutral-500 dark:text-neutral-400'>
          {t('edit.description', { protocol: protocol.toUpperCase() })}
        </p>
      </div>

      <div className={cn(tokens.surface.panel, 'mb-4 px-4 py-3 flex items-center gap-3')}>
        <span className='grid size-8 place-items-center rounded-md border border-fk-line bg-white dark:bg-fk-surface'>
          <ProviderIcon icon={template?.icon ?? 'custom'} size='sm' />
        </span>
        <div className='min-w-0'>
          <p className='text-sm font-medium text-neutral-900 dark:text-neutral-100'>
            {providerLabel}
          </p>
          <p className='text-xs text-neutral-500 dark:text-neutral-400'>
            {t('edit.provider_info', { alias: values.alias, protocol: protocol.toUpperCase() })}
          </p>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'>
        <div className={tokens.page.blockGap}>
          <Section
            title={t('edit.credentials.title', { provider: providerLabel })}
            description={t('edit.credentials.description')}
          >
            <FieldRow
              label={t('create.alias.label')}
              description={t('edit.alias.description')}
              htmlFor='edit-provider-alias'
            >
              <Input
                id='edit-provider-alias'
                value={values.alias}
                disabled
                className='max-w-sm'
                aria-invalid={Boolean(errors.alias)}
              />
              <p className='mt-1.5 text-xs text-neutral-500 dark:text-neutral-400'>
                {t('edit.alias.immutable_hint')}
              </p>
            </FieldRow>

            <FieldRow
              label={t('create.display_name.label')}
              description={t('create.display_name.description')}
              htmlFor='edit-provider-display-name'
            >
              <Input
                id='edit-provider-display-name'
                value={values.displayName}
                onChange={(e) => onChange({ displayName: e.target.value })}
                placeholder={providerLabel}
                className='max-w-sm'
                aria-invalid={Boolean(errors.displayName)}
              />
              {errors.displayName && (
                <p className='mt-1.5 text-xs text-fk-danger'>{errors.displayName}</p>
              )}
            </FieldRow>

            <FieldRow
              label={t('create.client_id.label')}
              description={t('create.client_id.description', { provider: providerLabel })}
              htmlFor='edit-provider-client-id'
            >
              <Input
                id='edit-provider-client-id'
                value={values.clientId}
                onChange={(e) => onChange({ clientId: e.target.value })}
                className='max-w-sm'
                aria-invalid={Boolean(errors.clientId)}
              />
              {errors.clientId && (
                <p className='mt-1.5 text-xs text-fk-danger'>{errors.clientId}</p>
              )}
            </FieldRow>

            <FieldRow
              label={t('create.client_secret.label')}
              description={t('create.client_secret.description')}
              htmlFor='edit-provider-client-secret'
            >
              <InputGroup className='max-w-sm'>
                <InputGroupInput
                  id='edit-provider-client-secret'
                  type={showSecret ? 'text' : 'password'}
                  value={values.clientSecret}
                  onChange={(e) => onChange({ clientSecret: e.target.value })}
                  className='font-mono-ui'
                  aria-invalid={Boolean(errors.clientSecret)}
                />
                <InputGroupAddon align='inline-end'>
                  <InputGroupButton
                    size='icon-xs'
                    aria-label={
                      showSecret ? t('create.client_secret.hide') : t('create.client_secret.show')
                    }
                    onClick={() => setShowSecret((value) => !value)}
                  >
                    {showSecret ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {errors.clientSecret && (
                <p className='mt-1.5 text-xs text-fk-danger'>{errors.clientSecret}</p>
              )}
            </FieldRow>
          </Section>

          <Section
            title={t('create.endpoints.title')}
            description={
              isCustom
                ? t('create.endpoints.description_custom')
                : t('create.endpoints.description_template', { provider: providerLabel })
            }
          >
            <FieldRow
              label={t('create.authorization_url.label')}
              description={t('create.authorization_url.description')}
              htmlFor='edit-provider-authorization-url'
            >
              <Input
                id='edit-provider-authorization-url'
                value={values.authorizationUrl}
                onChange={(e) => onChange({ authorizationUrl: e.target.value })}
                placeholder={AUTHORIZATION_URL_PLACEHOLDER}
                className='max-w-lg'
                aria-invalid={Boolean(errors.authorizationUrl)}
              />
              {errors.authorizationUrl && (
                <p className='mt-1.5 text-xs text-fk-danger'>{errors.authorizationUrl}</p>
              )}
            </FieldRow>

            <FieldRow
              label={t('create.token_url.label')}
              description={t('create.token_url.description')}
              htmlFor='edit-provider-token-url'
            >
              <Input
                id='edit-provider-token-url'
                value={values.tokenUrl}
                onChange={(e) => onChange({ tokenUrl: e.target.value })}
                placeholder={TOKEN_URL_PLACEHOLDER}
                className='max-w-lg'
                aria-invalid={Boolean(errors.tokenUrl)}
              />
              {errors.tokenUrl && (
                <p className='mt-1.5 text-xs text-fk-danger'>{errors.tokenUrl}</p>
              )}
            </FieldRow>

            <FieldRow
              label={t('create.userinfo_url.label')}
              description={
                protocol === 'oidc'
                  ? t('create.userinfo_url.description_oidc')
                  : t('create.userinfo_url.description_oauth2')
              }
              htmlFor='edit-provider-userinfo-url'
            >
              <Input
                id='edit-provider-userinfo-url'
                value={values.userinfoUrl}
                onChange={(e) => onChange({ userinfoUrl: e.target.value })}
                placeholder={USERINFO_URL_PLACEHOLDER}
                className='max-w-lg'
                aria-invalid={Boolean(errors.userinfoUrl)}
              />
              {errors.userinfoUrl && (
                <p className='mt-1.5 text-xs text-fk-danger'>{errors.userinfoUrl}</p>
              )}
            </FieldRow>

            <FieldRow
              label={t('create.scopes.label')}
              description={t('create.scopes.description')}
            >
              <ChipInput
                values={values.scopes}
                onChange={(scopes) => onChange({ scopes })}
                placeholder={SCOPE_PLACEHOLDER}
                emptyHint={t('create.scopes.empty_hint')}
              />
            </FieldRow>

            <FieldRow
              label={t('create.pkce.label')}
              description={t('create.pkce.description')}
            >
              <div className='flex items-center gap-2.5'>
                <Switch
                  id='edit-provider-use-pkce'
                  checked={values.usePkce}
                  onCheckedChange={(usePkce) => onChange({ usePkce })}
                />
                <label
                  htmlFor='edit-provider-use-pkce'
                  className='text-xs text-neutral-600 dark:text-neutral-400'
                >
                  {values.usePkce ? t('create.pkce.enabled') : t('create.pkce.disabled')}
                </label>
              </div>
            </FieldRow>
          </Section>
        </div>

        <ProviderSetupRail template={template} callbackUrl={callbackUrl} />
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <Button variant='outline' onClick={onBack}>
          <ArrowLeft /> {t('edit.actions.cancel')}
        </Button>

        <Button onClick={onSubmit} disabled={!canContinue || isPending}>
          {isPending ? t('edit.actions.saving') : t('edit.actions.save')}
        </Button>
      </div>
    </PageShell>
  )
}
