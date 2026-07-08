export const formatCurrency = (value: number) => {
  return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'SAR' });
};

export const generateProductionBatchNumber = () => {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PRB-${year}-${randomStr}`;
};

export const PRODUCTION_TYPES = ["Grafting", "Cutting", "Seed", "Layering", "Division", "Other"];
