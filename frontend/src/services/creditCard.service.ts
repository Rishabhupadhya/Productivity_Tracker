import { api } from "./api";

// Types matching backend
export interface CreditCard {
  _id: string;
  userId: string;
  teamId?: string;
  ownerId: string;
  cardName: string;
  bankName: string;
  last4Digits: string;
  creditLimit: number;
  outstandingAmount: number;
  billingCycleStartDay: number;
  dueDateDay: number;
  interestRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardUtilization {
  cardId: string;
  cardName: string;
  bankName: string;
  last4Digits: string;
  creditLimit: number;
  outstanding: number;
  utilizationPercent: number;
  status: "healthy" | "caution" | "warning" | "critical";
  currentBillingPeriod: {
    start: string;
    end: string;
  };
  dueDate: string;
  daysUntilDue: number;
}

export interface UtilizationOverview {
  totalCreditLimit: number;
  totalOutstanding: number;
  overallUtilization: number;
  overallStatus: "healthy" | "caution" | "warning" | "critical";
  cardCount: number;
  activeCardCount: number;
  cards: CardUtilization[];
}

export interface CreditAlert {
  id: string;
  type: "HIGH_UTILIZATION" | "NEAR_LIMIT" | "DUE_DATE_APPROACHING" | "SPENDING_SPIKE";
  severity: "info" | "warning" | "critical";
  message: string;
  cardId?: string;
  cardName?: string;
  timestamp: string;
}

// CRUD operations
export const createCreditCard = async (data: {
  teamId?: string;
  cardName: string;
  bankName: string;
  last4Digits: string;
  creditLimit: number;
  outstandingAmount?: number;
  billingCycleStartDay: number;
  dueDateDay: number;
  interestRate?: number;
}): Promise<CreditCard> => {
  const res = await api.post("/finance/credit-cards", data);
  return res.data;
};

export const getCreditCards = async (teamId?: string): Promise<CreditCard[]> => {
  const res = await api.get("/finance/credit-cards", { params: { teamId } });
  return res.data;
};

export const getCreditCardById = async (cardId: string): Promise<CreditCard> => {
  const res = await api.get(`/finance/credit-cards/${cardId}`);
  return res.data;
};

export const updateCreditCard = async (
  cardId: string,
  updates: Partial<CreditCard>
): Promise<CreditCard> => {
  const res = await api.patch(`/finance/credit-cards/${cardId}`, updates);
  return res.data;
};

export const deleteCreditCard = async (cardId: string): Promise<void> => {
  await api.delete(`/finance/credit-cards/${cardId}`);
};

// Analytics & Intelligence
export const getUtilizationOverview = async (teamId?: string): Promise<UtilizationOverview> => {
  const res = await api.get("/finance/credit-cards/analytics/utilization", { params: { teamId } });
  return res.data;
};

export const getCardUtilization = async (cardId: string): Promise<CardUtilization> => {
  const res = await api.get(`/finance/credit-cards/${cardId}/utilization`);
  return res.data;
};

export const getCreditAlerts = async (teamId?: string): Promise<CreditAlert[]> => {
  const res = await api.get("/finance/credit-cards/analytics/alerts", { params: { teamId } });
  return res.data;
};

export const checkSpendingSpike = async (cardId: string): Promise<CreditAlert | null> => {
  const res = await api.get(`/finance/credit-cards/${cardId}/spike`);
  return res.data;
};
