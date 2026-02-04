import type { Handler } from '@netlify/functions'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
  'Access-Control-Allow-Methods': '*',
}

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || ''
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || ''
const API_VERSION = '2024-10'

function normalizeBoolean(value?: string | null): boolean {
  if (!value) return true
  return value.toLowerCase() !== 'false'
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      headers,
      statusCode: 200,
    }
  }

  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    return {
      headers,
      statusCode: 500,
      body: JSON.stringify({ message: 'Shopify storefront config missing' }),
    }
  }

  try {
    const response = await fetch(`https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `
          {
            metaobjects(type: "malek_creaciones_banner", first: 1) {
              nodes {
                fields { key value }
              }
            }
          }
        `,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        headers,
        statusCode: response.status,
        body: JSON.stringify({ message: errorText }),
      }
    }

    const json = await response.json()
    const node = json?.data?.metaobjects?.nodes?.[0]

    if (!node?.fields?.length) {
      return {
        headers,
        statusCode: 200,
        body: JSON.stringify({ banner: null }),
      }
    }

    const fields = node.fields.reduce((acc: Record<string, string>, field: { key: string; value: string }) => {
      acc[field.key] = field.value
      return acc
    }, {})

    const banner = {
      text: fields.text || fields.message || '',
      link: fields.link || fields.url || '',
      background: fields.background || fields.bg || '',
      textColor: fields.text_color || fields.color || '',
      enabled: normalizeBoolean(fields.enabled || fields.active),
    }

    if (!banner.enabled || !banner.text) {
      return {
        headers,
        statusCode: 200,
        body: JSON.stringify({ banner: null }),
      }
    }

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify({ banner }),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      headers,
      statusCode: 500,
      body: JSON.stringify({ message }),
    }
  }
}
