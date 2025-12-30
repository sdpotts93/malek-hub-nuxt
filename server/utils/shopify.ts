/**
 * Shopify Storefront API utilities
 */

import type { H3Event } from 'h3'

export function getShopifyConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  return {
    domain: config.public.shopifyStoreDomain,
    storefrontToken: config.shopifyStorefrontToken,
    apiVersion: '2024-10',
  }
}

export async function shopifyStorefrontQuery<T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const { domain, storefrontToken, apiVersion } = getShopifyConfig(event)

  // Debug: log config (remove token for security)
  console.log('[Shopify] Config:', { domain, apiVersion, hasToken: !!storefrontToken, tokenLength: storefrontToken?.length })

  if (!storefrontToken) {
    throw createError({
      statusCode: 500,
      message: 'SHOPIFY_STOREFRONT_TOKEN is not configured in .env',
    })
  }

  const url = `https://${domain}/api/${apiVersion}/graphql.json`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()

  if (json.errors) {
    console.error('[Shopify] GraphQL Errors:', JSON.stringify(json.errors, null, 2))
    throw createError({
      statusCode: 400,
      message: json.errors[0]?.message || 'Shopify GraphQL error',
    })
  }

  return json.data as T
}
