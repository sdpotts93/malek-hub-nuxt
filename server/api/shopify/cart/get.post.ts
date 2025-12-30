/**
 * POST /api/shopify/cart/get
 * Fetch an existing Shopify cart (using POST to avoid URL encoding issues with cart IDs)
 */

import { shopifyStorefrontQuery } from '../../../utils/shopify'

interface CartResponse {
  cart: {
    id: string
    checkoutUrl: string
    totalQuantity: number
    cost: {
      subtotalAmount: { amount: string; currencyCode: string }
      totalAmount: { amount: string; currencyCode: string }
    }
    lines: {
      edges: Array<{
        node: {
          id: string
          quantity: number
          merchandise: {
            id: string
            title: string
            price: { amount: string }
            product: { title: string }
            image: { url: string; altText: string | null } | null
          }
          attributes: Array<{ key: string; value: string }>
        }
      }>
    }
  } | null
}

const CART_QUERY = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                }
                product {
                  title
                }
                image {
                  url
                  altText
                }
              }
            }
            attributes {
              key
              value
            }
          }
        }
      }
    }
  }
`

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { cartId } = body

  if (!cartId) {
    throw createError({ statusCode: 400, message: 'Cart ID required' })
  }

  const data = await shopifyStorefrontQuery<CartResponse>(
    event,
    CART_QUERY,
    { cartId }
  )

  if (!data.cart) {
    throw createError({ statusCode: 404, message: 'Cart not found' })
  }

  const cart = data.cart
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotal: parseFloat(cart.cost.subtotalAmount.amount),
    total: parseFloat(cart.cost.totalAmount.amount),
    lines: cart.lines.edges.map(e => ({
      id: e.node.id,
      quantity: e.node.quantity,
      variantId: e.node.merchandise.id,
      variantTitle: e.node.merchandise.title,
      productTitle: e.node.merchandise.product.title,
      price: parseFloat(e.node.merchandise.price.amount),
      image: e.node.merchandise.image?.url || null,
      attributes: e.node.attributes,
    })),
  }
})
