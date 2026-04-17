import Wreck from '@hapi/wreck'
import { config } from '../config/config.js'

export async function getServiceToken () {
  const tenantId = config.get('entra.tenantId')
  const clientId = config.get('entra.clientId')
  const clientSecret = config.get('entra.clientSecret')

  if (!tenantId || !clientId || !clientSecret) {
    return null
  }

  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: `${clientId}/.default`
  })

  const { payload } = await Wreck.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      payload: form.toString(),
      json: true
    }
  )

  return `${payload.token_type} ${payload.access_token}`
}
