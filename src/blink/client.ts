import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'ai-web-agency-nx855fb8',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_AmyQzqFL3JBjT_GNYOSZo5PH4eUAJokf',
  authRequired: false,
})
