import api from "./api";

export interface CreditCard {
  _id: string;
  userId: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  creditLimit: number;
  billingCycleStart: number;
  paymentDueDate: number;
  currentBalance?: number;
  availableCredit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UtilizationOverview {
  totalLimit: number;
  totalUsed: number;
  utilizationPercentage: number;
  cards: Array<{
    cardId: string;
    cardName: string;
    used: number;
    limit: number;
    utilization: number;
  }>;
}

export interface CreditAlert {
  _id: string;
  cardId: string;
  type: "high_utilization" | "due_date_approaching" | "overlimit";
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: Date;
}

export const getUserCreditCards = async (): Promise<CreditCard[]> => {
  const response = await api.get("/finance/credit-cards");
  return response.data;
};

export const createCreditCard = async (cardData: Partial<CreditCard>): Promise<CreditCard> => {
  const response = await api.post("/finance/credit-cards", cardData);
  return response.data;
};

export const updateCreditCard = async (cardId: string, updates: Partial<CreditCard>): Promise<CreditCard> => {
  const response = await api.put(`/finance/credit-cards/${cardId}`, updates);
  return response.data;
};

export const deleteCreditCard = async (cardId: string): Promise<void> => {
  await api.delete(`/finance/credit-cards/${cardId}`);
};

export const getUtilizationOverview = async (): Promise<UtilizationOverview> => {
  const response = await api.get("/finance/credit-cards/utilization");
  return response.data;
};

export const getCreditAlerts = async (): Promise<CreditAlert[]> => {
  const response = await api.get("/finance/credit-cards/alerts");
  return response.data;
};
