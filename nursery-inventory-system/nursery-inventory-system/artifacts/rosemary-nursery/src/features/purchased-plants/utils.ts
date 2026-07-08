export const formatCurrency = (value: number) => {
  return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'SAR' });
};

export const generateBatchNumber = () => {
  const year = new Date().getFullYear();
  const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PB-${year}-${randomStr}`;
};
