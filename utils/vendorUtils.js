// utils/vendorUtils.js

// Groups products by name and sorts them by year
export function getYearlyProductChanges(products = []) {
  const productMap = {};

  for (const p of products) {
    if (!productMap[p.name]) productMap[p.name] = [];
    productMap[p.name].push(p);
  }

  const grouped = Object.values(productMap).map((entries) =>
    entries.sort((a, b) => a.year - b.year)
  );

  return grouped;
}

// Prepares trend data per product
export function getVendorPriceTrends(products = []) {
  const grouped = getYearlyProductChanges(products);

  const trends = {};
  for (const entries of grouped) {
    const name = entries[entries.length - 1].name;
    const latest = entries[entries.length - 1];
    const previous = entries.length > 1 ? entries[entries.length - 2] : null;
    trends[name] = {
      latest,
      previous,
      change:
        previous && !isNaN(latest.price) && !isNaN(previous.price)
          ? latest.price - previous.price
          : null,
    };
  }

  return trends;
}
