/**
 * GET /api/shopify/product/:id
 * Fetch a product with all its variants from Shopify Storefront API
 */

import { shopifyStorefrontQuery } from '../../../utils/shopify'

interface ShopifyProductResponse {
  product: {
    id: string
    title: string
    handle: string
    description: string
    variants: {
      edges: Array<{
        node: {
          id: string
          title: string
          price: { amount: string; currencyCode: string }
          compareAtPrice: { amount: string; currencyCode: string } | null
          availableForSale: boolean
          selectedOptions: Array<{ name: string; value: string }>
        }
      }>
    }
    images: {
      edges: Array<{
        node: { url: string; altText: string | null }
      }>
    }
  } | null
}

const PRODUCT_QUERY = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      description
      variants(first: 100) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      images(first: 5) {
        edges {
          node {
            url
            altText
          }
        }
      }
    }
  }
`

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Product ID required' })
  }

  // Convert numeric ID to GID format if needed
  const gid = id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`

  const data = await shopifyStorefrontQuery<ShopifyProductResponse>(
    event,
    PRODUCT_QUERY,
    { id: gid }
  )

  if (!data.product) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }

  // Transform to simpler format
  const product = data.product
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    images: product.images.edges.map(e => ({
      url: e.node.url,
      alt: e.node.altText,
    })),
    variants: product.variants.edges.map(e => ({
      id: e.node.id,
      title: e.node.title,
      price: parseFloat(e.node.price.amount),
      compareAtPrice: e.node.compareAtPrice ? parseFloat(e.node.compareAtPrice.amount) : null,
      available: e.node.availableForSale,
      options: e.node.selectedOptions,
    })),
  }
})
