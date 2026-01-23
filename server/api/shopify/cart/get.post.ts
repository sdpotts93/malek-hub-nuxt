/**
 * POST /api/shopify/cart/get
 * Fetch an existing Shopify cart (using POST to avoid URL encoding issues with cart IDs)
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

interface CartResponse {
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
