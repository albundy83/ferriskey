import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildPristineDraft,
  buildUpdateConfig,
  parseScopes,
} from './edit-provider-helpers.ts'

test('parseScopes keeps only non-empty strings from an array', () => {
  assert.deepEqual(parseScopes(['openid', 'profile', '', '  ', 'email']), [
    'openid',
    'profile',
    'email',
  ])
})

test('parseScopes splits a space-delimited string', () => {
  assert.deepEqual(parseScopes('openid profile email'), ['openid', 'profile', 'email'])
})

test('parseScopes collapses multiple spaces', () => {
  assert.deepEqual(parseScopes('openid   profile  email'), ['openid', 'profile', 'email'])
})

test('parseScopes ignores non-string non-array values', () => {
  assert.deepEqual(parseScopes(null), [])
  assert.deepEqual(parseScopes(undefined), [])
  assert.deepEqual(parseScopes(123), [])
  assert.deepEqual(parseScopes({}), [])
})

test('parseScopes rejects non-string items inside arrays', () => {
  assert.deepEqual(parseScopes(['openid', 42, null, 'profile']), ['openid', 'profile'])
})

test('buildPristineDraft normalises a full provider response', () => {
  const draft = buildPristineDraft({
    alias: 'google',
    display_name: 'Google',
    config: {
      client_id: 'abc',
      client_secret: 'secret',
      authorization_url: 'https://accounts.google.com/o/oauth2/auth',
      token_url: 'https://oauth2.googleapis.com/token',
      userinfo_url: 'https://openidconnect.googleapis.com/v1/userinfo',
      scopes: 'openid profile email',
      use_pkce: true,
    },
  })

  assert.equal(draft.key, 'google')
  assert.equal(draft.alias, 'google')
  assert.equal(draft.displayName, 'Google')
  assert.equal(draft.clientId, 'abc')
  assert.equal(draft.clientSecret, 'secret')
  assert.equal(draft.authorizationUrl, 'https://accounts.google.com/o/oauth2/auth')
  assert.equal(draft.tokenUrl, 'https://oauth2.googleapis.com/token')
  assert.equal(draft.userinfoUrl, 'https://openidconnect.googleapis.com/v1/userinfo')
  assert.deepEqual(draft.scopes, ['openid', 'profile', 'email'])
  assert.equal(draft.usePkce, true)
})

test('buildPristineDraft defaults missing fields to empty strings and scopes to empty array', () => {
  const draft = buildPristineDraft({
    alias: 'custom',
    display_name: null,
    config: {},
  })

  assert.equal(draft.displayName, '')
  assert.equal(draft.clientId, '')
  assert.equal(draft.clientSecret, '')
  assert.equal(draft.authorizationUrl, '')
  assert.equal(draft.tokenUrl, '')
  assert.equal(draft.userinfoUrl, '')
  assert.deepEqual(draft.scopes, [])
})

test('buildPristineDraft defaults use_pkce to true when missing', () => {
  const draft = buildPristineDraft({ alias: 'github', config: {} })
  assert.equal(draft.usePkce, true)
})

test('buildPristineDraft preserves an explicit false use_pkce', () => {
  const draft = buildPristineDraft({
    alias: 'github',
    config: { use_pkce: false },
  })
  assert.equal(draft.usePkce, false)
})

test('buildPristineDraft handles array-shaped scopes', () => {
  const draft = buildPristineDraft({
    alias: 'google',
    config: { scopes: ['openid', 'email'] },
  })
  assert.deepEqual(draft.scopes, ['openid', 'email'])
})

test('buildUpdateConfig produces the expected broker record', () => {
  const config = buildUpdateConfig({
    alias: 'google',
    displayName: 'Google',
    clientId: 'abc',
    clientSecret: 'secret',
    authorizationUrl: 'https://auth',
    tokenUrl: 'https://token',
    userinfoUrl: 'https://userinfo',
    scopes: ['openid', 'profile'],
    usePkce: true,
  })

  assert.deepEqual(config, {
    client_id: 'abc',
    client_secret: 'secret',
    authorization_url: 'https://auth',
    token_url: 'https://token',
    userinfo_url: 'https://userinfo',
    scopes: 'openid profile',
    use_pkce: true,
  })
})

test('buildUpdateConfig omits userinfo_url when empty', () => {
  const config = buildUpdateConfig({
    alias: 'custom',
    displayName: 'Custom',
    clientId: 'x',
    clientSecret: 'y',
    authorizationUrl: 'https://auth',
    tokenUrl: 'https://token',
    userinfoUrl: '',
    scopes: [],
    usePkce: false,
  })

  assert.equal('userinfo_url' in config, false)
  assert.equal(config.scopes, '')
  assert.equal(config.use_pkce, false)
})

test('buildUpdateConfig joins multiple scopes with single spaces', () => {
  const config = buildUpdateConfig({
    alias: 'a',
    displayName: 'A',
    clientId: '',
    clientSecret: '',
    authorizationUrl: '',
    tokenUrl: '',
    userinfoUrl: '',
    scopes: ['a', 'b', 'c'],
    usePkce: true,
  })

  assert.equal(config.scopes, 'a b c')
})
