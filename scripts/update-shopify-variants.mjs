#!/usr/bin/env node

/**
 * Script to update Shopify Birth Poster variants with prices and inventory
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx SHOPIFY_STORE=your-store node scripts/update-shopify-variants.mjs
 */

const PRODUCT_ID = "9209688719595";
const GRAPHQL_PRODUCT_GID = `gid://shopify/Product/${PRODUCT_ID}`;
const INVENTORY_QUANTITY = 1000;

// Price map: size -> { sinMarco, conMarco }
const PRICE_MAP = {
  // Vertical (1-2 babies)
  "30x40":  { sinMarco: "1000.00", conMarco: "2015.00" },
  "40x50":  { sinMarco: "1215.00", conMarco: "2585.00" },
  "50x70":  { sinMarco: "1525.00", conMarco: "3165.00" },
  "70x100": { sinMarco: "2895.00", conMarco: "5425.00" },
  // Horizontal (3-4 babies)
  "40x30":  { sinMarco: "1000.00", conMarco: "2015.00" },
  "50x40":  { sinMarco: "1215.00", conMarco: "2585.00" },
  "70x50":  { sinMarco: "1525.00", conMarco: "3165.00" },
  "100x70": { sinMarco: "2895.00", conMarco: "5425.00" },
};

// Frame options that count as "con marco" (all same price)
const FRAME_OPTIONS = ["negro", "blanco", "roble", "nogal"];

// Config
const SHOPIFY_ADMIN_TOKEN = 'process.env.SHOPIFY_STOREFRONT_TOKEN';
const SHOPIFY_STORE = 'casabravo';

if (!SHOPIFY_ADMIN_TOKEN || !SHOPIFY_STORE) {
  console.error("Missing environment variables!");
  console.error("Usage:");
  console.error("  SHOPIFY_ADMIN_TOKEN=shpat_xxx SHOPIFY_STORE=your-store node scripts/update-shopify-variants.mjs");
  process.exit(1);
}

const SHOPIFY_API_URL = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-10/graphql.json`;

async function shopifyGraphQL(query, variables = {}) {
  const response = await fetch(SHOPIFY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
    throw new Error("GraphQL request failed");
  }

  return json.data;
}

async function fetchProductVariants() {
  console.log("\n📦 Fetching existing variants...\n");

  const query = `
    query GetProductVariants($productId: ID!) {
      product(id: $productId) {
        id
        title
        variants(first: 100) {
          edges {
            node {
              id
              title
              price
              selectedOptions {
                name
                value
              }
              inventoryItem {
                id
                tracked
              }
              inventoryQuantity
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL(query, { productId: GRAPHQL_PRODUCT_GID });

  if (!data.product) {
    throw new Error(`Product ${PRODUCT_ID} not found`);
  }

  console.log(`Found product: ${data.product.title}`);
  console.log(`Variants: ${data.product.variants.edges.length}`);

  return data.product.variants.edges.map(e => e.node);
}

async function updateVariantPrice(variantId, price, productId) {
  const query = `
    mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyGraphQL(query, {
    productId: productId,
    variants: [{ id: variantId, price: price }],
  });

  if (data.productVariantsBulkUpdate.userErrors.length > 0) {
    console.error("Errors:", data.productVariantsBulkUpdate.userErrors);
    return false;
  }
  return true;
}

async function enableInventoryTracking(inventoryItemId) {
  const query = `
    mutation EnableInventoryTracking($id: ID!, $input: InventoryItemInput!) {
      inventoryItemUpdate(id: $id, input: $input) {
        inventoryItem { id tracked }
        userErrors { field message }
      }
    }
  `;

  const data = await shopifyGraphQL(query, {
    id: inventoryItemId,
    input: { tracked: true },
  });

  return data.inventoryItemUpdate.userErrors.length === 0;
}

async function getLocationId() {
  const query = `
    query GetLocations {
      locations(first: 1) {
        edges {
          node { id name }
        }
      }
    }
  `;

  const data = await shopifyGraphQL(query);

  if (data.locations.edges.length === 0) {
    throw new Error("No locations found");
  }

  const location = data.locations.edges[0].node;
  console.log(`Using location: ${location.name}`);
  return location.id;
}

async function setInventoryQuantity(inventoryItemId, locationId, quantity) {
  const query = `
    mutation SetInventoryQuantity($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup { createdAt }
        userErrors { field message code }
      }
    }
  `;

  const data = await shopifyGraphQL(query, {
    input: {
      name: "available",
      reason: "correction",
      ignoreCompareQuantity: true,
      quantities: [{
        inventoryItemId: inventoryItemId,
        locationId: locationId,
        quantity: quantity,
      }],
    },
  });

  if (data.inventorySetQuantities.userErrors.length > 0) {
    console.error("   Inventory errors:", JSON.stringify(data.inventorySetQuantities.userErrors));
    return false;
  }
  return true;
}

function getExpectedPrice(variant) {
  // Find size from title or options (e.g., "40x30 / Negro")
  const title = variant.title;

  // Extract size from title (first part before " / ")
  const sizePart = title.split(" / ")[0].trim();
  const framePart = title.split(" / ")[1]?.trim().toLowerCase();

  const priceData = PRICE_MAP[sizePart];
  if (!priceData) {
    return null;
  }

  // Check if it's "sin marco" or one of the frame options
  if (framePart === "sin marco") {
    return priceData.sinMarco;
  } else if (FRAME_OPTIONS.includes(framePart)) {
    return priceData.conMarco;
  }

  return null;
}

async function main() {
  console.log("🚀 Shopify Variant Updater");
  console.log("=".repeat(50));

  try {
    const variants = await fetchProductVariants();
    const locationId = await getLocationId();

    console.log("\n" + "=".repeat(50));
    console.log("📝 Processing variants...\n");

    let updated = 0, skipped = 0, errors = 0;

    for (const variant of variants) {
      const expectedPrice = getExpectedPrice(variant);

      console.log(`\n🔹 ${variant.title}`);
      console.log(`   Current: $${variant.price} | Expected: $${expectedPrice || "?"}`);
      console.log(`   Inventory: ${variant.inventoryQuantity} | Tracking: ${variant.inventoryItem.tracked}`);

      if (!expectedPrice) {
        console.log(`   ⚠️  Could not determine price - SKIPPING`);
        skipped++;
        continue;
      }

      let changed = false;

      // Update price if needed
      if (variant.price !== expectedPrice) {
        console.log(`   💰 Updating price...`);
        if (await updateVariantPrice(variant.id, expectedPrice, GRAPHQL_PRODUCT_GID)) {
          console.log(`   ✅ Price updated to $${expectedPrice}`);
          changed = true;
        } else {
          console.log(`   ❌ Failed to update price`);
          errors++;
        }
      }

      // Enable tracking if needed
      if (!variant.inventoryItem.tracked) {
        console.log(`   📊 Enabling inventory tracking...`);
        if (await enableInventoryTracking(variant.inventoryItem.id)) {
          console.log(`   ✅ Tracking enabled`);
          changed = true;
        } else {
          console.log(`   ❌ Failed to enable tracking`);
          errors++;
        }
      }

      // Set inventory if needed
      if (variant.inventoryQuantity !== INVENTORY_QUANTITY) {
        console.log(`   📦 Setting inventory to ${INVENTORY_QUANTITY}...`);
        if (await setInventoryQuantity(variant.inventoryItem.id, locationId, INVENTORY_QUANTITY)) {
          console.log(`   ✅ Inventory set`);
          changed = true;
        } else {
          console.log(`   ❌ Failed to set inventory`);
          errors++;
        }
      }

      if (changed) updated++;

      // Rate limit protection
      await new Promise(r => setTimeout(r, 200));
    }

    console.log("\n" + "=".repeat(50));
    console.log(`📊 Done! Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
