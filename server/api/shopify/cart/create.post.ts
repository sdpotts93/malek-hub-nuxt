/**
 * POST /api/shopify/cart/create
 * Create a new Shopify cart
 */

import { shopifyStorefrontQuery } from '../../../utils/shopify'

interface CartCreateResponse {
  cartCreate: {
    cart: {
      id: string
      checkoutUrl: string
    } | null
    userErrors: Array<{ field: string[]; message: string }>
  }
}

const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
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
  const { lines } = body || {}

  const input: { lines?: unknown[] } = {}

  // Optionally add initial lines
  if (lines && Array.isArray(lines)) {
    input.lines = lines
  }

  const data = await shopifyStorefrontQuery<CartCreateResponse>(
    event,
    CART_CREATE_MUTATION,
    { input }
  )

  if (data.cartCreate.userErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: data.cartCreate.userErrors[0].message,
    })
  }

  if (!data.cartCreate.cart) {
    throw createError({ statusCode: 500, message: 'Failed to create cart' })
  }

  return {
    cartId: data.cartCreate.cart.id,
    checkoutUrl: data.cartCreate.cart.checkoutUrl,
  }
})
