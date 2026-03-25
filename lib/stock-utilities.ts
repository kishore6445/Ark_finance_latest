import { Product, StockRecord, StockMovement, StockValuation } from '@/context/app-state';

/**
 * Stock Management Utilities and Helper Functions
 * Common calculations and validations for stock operations
 */

/**
 * Calculate current quantity for a product (FIFO method)
 */
export function calculateFIFOQuantity(
  product: Product,
  movements: StockMovement[]
): { quantity: number; value: number; unitCost: number } {
  let quantity = 0;
  let totalValue = 0;
  const fifoStack: { qty: number; cost: number }[] = [];

  // Build FIFO stack from movements
  movements.forEach((movement) => {
    if (movement.productId !== product.id) return;

    if (movement.movementType === 'Purchase') {
      fifoStack.push({ qty: movement.quantity, cost: movement.unitPrice });
    } else if (movement.movementType === 'Sale') {
      let remainingQty = movement.quantity;

      // FIFO: Remove from beginning of stack
      while (remainingQty > 0 && fifoStack.length > 0) {
        const first = fifoStack[0];
        const removed = Math.min(remainingQty, first.qty);
        first.qty -= removed;
        remainingQty -= removed;

        if (first.qty === 0) {
          fifoStack.shift();
        }
      }
    }
  });

  // Calculate remaining quantity and value
  fifoStack.forEach((item) => {
    quantity += item.qty;
    totalValue += item.qty * item.cost;
  });

  return {
    quantity,
    value: totalValue,
    unitCost: quantity > 0 ? totalValue / quantity : 0,
  };
}

/**
 * Calculate current quantity for a product (Weighted Average method)
 */
export function calculateWeightedAverageQuantity(
  product: Product,
  movements: StockMovement[]
): { quantity: number; value: number; unitCost: number } {
  let totalQuantity = 0;
  let totalValue = 0;

  movements.forEach((movement) => {
    if (movement.productId !== product.id) return;

    if (movement.movementType === 'Purchase') {
      totalQuantity += movement.quantity;
      totalValue += movement.totalValue;
    } else if (movement.movementType === 'Sale') {
      totalQuantity -= movement.quantity;
      totalValue -= (movement.quantity * totalValue) / (totalQuantity + movement.quantity);
    }
  });

  return {
    quantity: Math.max(0, totalQuantity),
    value: Math.max(0, totalValue),
    unitCost: totalQuantity > 0 ? totalValue / totalQuantity : 0,
  };
}

/**
 * Calculate current quantity for a product (LIFO method)
 */
export function calculateLIFOQuantity(
  product: Product,
  movements: StockMovement[]
): { quantity: number; value: number; unitCost: number } {
  let quantity = 0;
  let totalValue = 0;
  const lifoStack: { qty: number; cost: number }[] = [];

  // Build LIFO stack from movements
  movements.forEach((movement) => {
    if (movement.productId !== product.id) return;

    if (movement.movementType === 'Purchase') {
      lifoStack.push({ qty: movement.quantity, cost: movement.unitPrice });
    } else if (movement.movementType === 'Sale') {
      let remainingQty = movement.quantity;

      // LIFO: Remove from end of stack
      while (remainingQty > 0 && lifoStack.length > 0) {
        const last = lifoStack[lifoStack.length - 1];
        const removed = Math.min(remainingQty, last.qty);
        last.qty -= removed;
        remainingQty -= removed;

        if (last.qty === 0) {
          lifoStack.pop();
        }
      }
    }
  });

  // Calculate remaining quantity and value
  lifoStack.forEach((item) => {
    quantity += item.qty;
    totalValue += item.qty * item.cost;
  });

  return {
    quantity,
    value: totalValue,
    unitCost: quantity > 0 ? totalValue / quantity : 0,
  };
}

/**
 * Determine optimal valuation method for stock
 */
export function getRecommendedValuationMethod(
  movements: StockMovement[]
): 'FIFO' | 'WEIGHTED_AVG' | 'LIFO' {
  const priceVariation = calculatePriceVariation(movements);

  if (priceVariation > 20) {
    // High price variation: use WEIGHTED_AVG for stability
    return 'WEIGHTED_AVG';
  } else if (priceVariation > 10) {
    // Moderate variation: use FIFO (most common)
    return 'FIFO';
  } else {
    // Low variation: any method works, use FIFO
    return 'FIFO';
  }
}

/**
 * Calculate price variation in stock movements
 */
function calculatePriceVariation(movements: StockMovement[]): number {
  const purchases = movements.filter((m) => m.movementType === 'Purchase');
  if (purchases.length < 2) return 0;

  const prices = purchases.map((p) => p.unitPrice);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / avgPrice) * 100; // Coefficient of variation as percentage
}

/**
 * Check if product is low in stock
 */
export function isLowStock(product: Product, currentQuantity: number): boolean {
  return currentQuantity <= product.reorderLevel;
}

/**
 * Calculate reorder quantity needed
 */
export function calculateReorderQuantity(
  product: Product,
  currentQuantity: number
): number {
  const deficit = product.reorderLevel - currentQuantity;
  return Math.max(0, deficit + product.reorderQuantity);
}

/**
 * Validate stock movement for consistency
 */
export function validateStockMovement(
  movement: StockMovement,
  product: Product
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate quantity
  if (movement.quantity <= 0) {
    errors.push('Quantity must be greater than zero');
  }

  // Validate unit price
  if (movement.unitPrice <= 0) {
    errors.push('Unit price must be greater than zero');
  }

  // Validate total value
  const expectedTotal = movement.quantity * movement.unitPrice;
  if (Math.abs(movement.totalValue - expectedTotal) > 1) {
    errors.push(`Total value mismatch: Expected ${expectedTotal}, got ${movement.totalValue}`);
  }

  // Validate movement type
  const validTypes = ['Purchase', 'Sale', 'Adjustment', 'Transfer', 'Damage', 'Return'];
  if (!validTypes.includes(movement.movementType)) {
    errors.push(`Invalid movement type: ${movement.movementType}`);
  }

  // Validate product for sales
  if (movement.movementType === 'Sale' && !movement.customer) {
    errors.push('Customer is required for sales');
  }

  // Validate product for purchases
  if (movement.movementType === 'Purchase' && !movement.supplier) {
    errors.push('Supplier is required for purchases');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate aging report for slow-moving stock
 */
export function generateStockAgingReport(
  products: Product[],
  movements: StockMovement[]
): {
  productId: string;
  productName: string;
  daysInStock: number;
  quantity: number;
  value: number;
  status: 'fast_moving' | 'normal' | 'slow_moving' | 'dead_stock';
}[] {
  const today = new Date();

  return products.map((product) => {
    const productMovements = movements.filter((m) => m.productId === product.id);
    const lastSale = productMovements
      .filter((m) => m.movementType === 'Sale')
      .sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime())[0];

    const daysInStock = lastSale
      ? Math.floor((today.getTime() - new Date(lastSale.movementDate).getTime()) / (1000 * 60 * 60 * 24))
      : productMovements.length > 0
        ? Math.floor((today.getTime() - new Date(productMovements[0].movementDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const { quantity, value } = calculateWeightedAverageQuantity(product, productMovements);

    let status: 'fast_moving' | 'normal' | 'slow_moving' | 'dead_stock' = 'normal';
    if (daysInStock > 180 && quantity > 0) {
      status = 'dead_stock';
    } else if (daysInStock > 90) {
      status = 'slow_moving';
    } else if (daysInStock < 30) {
      status = 'fast_moving';
    }

    return {
      productId: product.id,
      productName: product.productName,
      daysInStock,
      quantity,
      value,
      status,
    };
  });
}

/**
 * Calculate stock turnover ratio
 */
export function calculateStockTurnoverRatio(
  product: Product,
  movements: StockMovement[],
  periodDays: number = 30
): number {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const periodSales = movements.filter(
    (m) => m.productId === product.id && m.movementType === 'Sale' && new Date(m.movementDate) >= startDate
  );

  const totalQuantitySold = periodSales.reduce((sum, m) => sum + m.quantity, 0);
  const avgInventory = product.unitCost > 0 ? 100 / product.unitCost : 1; // Simplified

  return totalQuantitySold / avgInventory;
}

/**
 * Format stock report for display
 */
export function formatStockReport(
  quantity: number,
  value: number,
  unit: string
): string {
  return `${quantity.toFixed(2)} ${unit} (₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })})`;
}

/**
 * Generate SKU code automatically
 */
export function generateSKUCode(category: string, sequenceNumber: number): string {
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  const sequence = String(sequenceNumber).padStart(5, '0');
  return `${categoryPrefix}-${sequence}`;
}

/**
 * Validate HSN code format
 */
export function validateHSNCode(hsnCode: string): boolean {
  // HSN code should be 6 or 8 digits
  return /^\d{6}(\d{2})?$/.test(hsnCode);
}

/**
 * Calculate GST amounts
 */
export function calculateGSTAmounts(
  amount: number,
  gstRate: number
): { taxable: number; gst: number; gross: number } {
  const gst = (amount * gstRate) / 100;
  return {
    taxable: amount,
    gst,
    gross: amount + gst,
  };
}
