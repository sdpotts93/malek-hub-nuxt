/**
 * POST /api/shopify/cart/add
 * Add lines to an existing Shopify cart
 */

import { shopifyStorefrontQuery } from '../../../utils/shopify'

interface CartLinesAddResponse {
  cartLinesAdd: {
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
    userErrors: Array<{ field: string[]; message: string }>
  }
}

const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
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
      userErrors {
        field
        message
      }
    }
  }
`

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { cartId, lines } = body

  if (!cartId || !lines || !Array.isArray(lines)) {
    throw createError({
      statusCode: 400,
      message: 'cartId and lines are required',
    })
  }

  const data = await shopifyStorefrontQuery<CartLinesAddResponse>(
    event,
    CART_LINES_ADD_MUTATION,
    { cartId, lines }
  )

  if (data.cartLinesAdd.userErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: data.cartLinesAdd.userErrors[0].message,
    })
  }

  if (!data.cartLinesAdd.cart) {
    throw createError({ statusCode: 500, message: 'Failed to add to cart' })
  }

  const cart = data.cartLinesAdd.cart
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
