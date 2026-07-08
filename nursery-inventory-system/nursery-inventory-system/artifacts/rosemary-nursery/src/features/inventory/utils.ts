export const formatCurrency = (value: number) => {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "SAR",
  });
};

/** Items at or below this threshold are flagged as low-stock. */
export const LOW_STOCK_THRESHOLD = 10;
