export type IncomeType = "business" | "freelance";

export type CommonDeductions = {
  nationalPension?: number;
  healthInsurance?: number;
  medical?: number;
  education?: number;
  donation?: number;
};

export type TaxInput = {
  incomeType: IncomeType;
  taxYear: number;
  dependents: number;
  deductions: CommonDeductions;
  totalIncome: number;
  expenses?: number;
};

export type TaxResult = {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxRate: number;
  taxBracket: string;
  calculatedTax: number;
  localIncomeTax: number;
  finalTax: number;
};

export type LawChunk = {
  article: string;
  content: string;
  similarity: number;
};
