export interface ModelReport {
  modelName: string;
  version: string;
  trainedOn: 'synthetic';
  nTrain: number;
  nTest: number;
  rocAuc: number;
  precision: number;
  recall: number;
  f1: number;
  brierScore: number;
  featureImportance: { feature: string; weight: number; description?: string }[];
  trainedAt: string;
}

export const modelReport: ModelReport | null = null;
