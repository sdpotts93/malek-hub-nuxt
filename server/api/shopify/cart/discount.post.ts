/**
 * POST /api/shopify/cart/discount
 * Apply or remove discount codes from a Shopify cart
 */

import { shopifyStorefrontQuery } from '../../../utils/shopify'

interface DiscountCode {
  code: string
  applicable: boolean
}

interface CartDiscountAllocation {
  discountedAmount: { amount: string; currencyCode: string }
  title?: string  // From CartAutomaticDiscountAllocation or CartCustomDiscountAllocation
  code?: string   // From CartCodeDiscountAllocation
}

interface CartResponse {
  cartDiscountCodesUpdate: {
    cart: {
      id: string
      checkoutUrl: string
      totalQuantity: number
      cost: {
        subtotalAmount: { amount: string; currencyCode: string }
        totalAmount: { amount: string; currencyCode: string }
      }
      discountCodes: DiscountCode[]
      discountAllocations: CartDiscountAllocation[]
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
    userErrors: Array<{
      field: string[]
      message: string
    }>
  }
}

const CART_DISCOUNT_MUTATION = `
  mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
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
        discountCodes {
          code
          applicable
        }
        discountAllocations {
          discountedAmount {
            amount
            currencyCode
          }
          ... on CartAutomaticDiscountAllocation {
            title
          }
          ... on CartCodeDiscountAllocation {
            code
          }
          ... on CartCustomDiscountAllocation {
            title
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
  const { cartId, discountCodes } = body

  if (!cartId) {
    throw createError({ statusCode: 400, message: 'Cart ID required' })
  }

  if (!Array.isArray(discountCodes)) {
    throw createError({ statusCode: 400, message: 'discountCodes must be an array' })
  }

  const data = await shopifyStorefrontQuery<CartResponse>(
    event,
    CART_DISCOUNT_MUTATION,
    { cartId, discountCodes }
  )

  const result = data.cartDiscountCodesUpdate

  if (result.userErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: result.userErrors[0].message,
    })
  }

  if (!result.cart) {
    throw createError({ statusCode: 404, message: 'Cart not found' })
  }

  const cart = result.cart

  // Calculate total discount amount
  const totalDiscount = cart.discountAllocations.reduce(
    (sum, allocation) => sum + parseFloat(allocation.discountedAmount.amount),
    0
  )

  // Extract unique automatic/custom discounts (those with title, not code)
  // Sum amounts for discounts with the same title
  const discountAmountsByTitle = new Map<string, number>()

  for (const allocation of cart.discountAllocations) {
    if (allocation.title) {
      const currentAmount = discountAmountsByTitle.get(allocation.title) || 0
      discountAmountsByTitle.set(
        allocation.title,
        currentAmount + parseFloat(allocation.discountedAmount.amount)
      )
    }
  }

  const automaticDiscounts = Array.from(discountAmountsByTitle.entries()).map(
    ([title, amount]) => ({ title, amount, type: 'automatic' as const })
  )

  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    subtotal: parseFloat(cart.cost.subtotalAmount.amount),
    total: parseFloat(cart.cost.totalAmount.amount),
    discountCodes: cart.discountCodes,
    automaticDiscounts,
    totalDiscount,
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
