/**
 * POST /api/shopify/cart/remove
 * Remove lines from a Shopify cart
 */

import { shopifyStorefrontQuery } from '../../../utils/shopify'

interface CartDiscountAllocation {
  discountedAmount: { amount: string; currencyCode: string }
  title?: string  // From CartAutomaticDiscountAllocation or CartCustomDiscountAllocation
  code?: string   // From CartCodeDiscountAllocation
}

interface CartLineCost {
  amountPerQuantity: { amount: string; currencyCode: string }
  totalAmount: { amount: string; currencyCode: string }
  compareAtAmountPerQuantity: { amount: string; currencyCode: string } | null
}

interface CartLinesRemoveResponse {
  cartLinesRemove: {
    cart: {
      id: string
      checkoutUrl: string
      totalQuantity: number
      cost: {
        subtotalAmount: { amount: string; currencyCode: string }
        totalAmount: { amount: string; currencyCode: string }
      }
      discountCodes: Array<{
        code: string
        applicable: boolean
      }>
      discountAllocations: CartDiscountAllocation[]
      lines: {
        edges: Array<{
          node: {
            id: string
            quantity: number
            cost: CartLineCost
            merchandise: {
              id: string
              title: string
              price: { amount: string }
              product: { title: string }
              image: { url: string; altText: string | null } | null
            }
            discountAllocations: Array<{
              discountedAmount: { amount: string; currencyCode: string }
              title?: string
              code?: string
            }>
            attributes: Array<{ key: string; value: string }>
          }
        }>
      }
    } | null
    userErrors: Array<{ field: string[]; message: string }>
  }
}

const CART_LINES_REMOVE_MUTATION = `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
              cost {
                amountPerQuantity {
                  amount
                  currencyCode
                }
                totalAmount {
                  amount
                  currencyCode
                }
                compareAtAmountPerQuantity {
                  amount
                  currencyCode
                }
              }
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
  const { cartId, lineIds } = body

  if (!cartId || !lineIds || !Array.isArray(lineIds)) {
    throw createError({
      statusCode: 400,
      message: 'cartId and lineIds are required',
    })
  }

  const data = await shopifyStorefrontQuery<CartLinesRemoveResponse>(
    event,
    CART_LINES_REMOVE_MUTATION,
    { cartId, lineIds }
  )

  if (data.cartLinesRemove.userErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: data.cartLinesRemove.userErrors[0].message,
    })
  }

  if (!data.cartLinesRemove.cart) {
    throw createError({ statusCode: 500, message: 'Failed to remove from cart' })
  }

  const cart = data.cartLinesRemove.cart

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
      // Line-level cost (actual amount being charged)
      lineCost: {
        amountPerQuantity: parseFloat(e.node.cost.amountPerQuantity.amount),
        totalAmount: parseFloat(e.node.cost.totalAmount.amount),
        compareAtAmountPerQuantity: e.node.cost.compareAtAmountPerQuantity
          ? parseFloat(e.node.cost.compareAtAmountPerQuantity.amount)
          : null,
      },
      // Line-level discounts
      lineDiscounts: e.node.discountAllocations.map(d => ({
        amount: parseFloat(d.discountedAmount.amount),
        title: d.title || d.code || 'Unknown discount',
      })),
      image: e.node.merchandise.image?.url || null,
      attributes: e.node.attributes,
    })),
  }
})
