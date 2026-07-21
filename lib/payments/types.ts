import type {
  ExamType,
  PaymentCurrency,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";

export interface PaymentAmounts {
  xaf: number;
  xof: number;
  usd: number;
  eur: number;
}

export interface CheckoutQuote {
  examType: ExamType;
  examTab: "tcf" | "tef" | "ielts";
  type: "custom" | "offer";
  days: number;
  label: string;
  amounts: PaymentAmounts;
  offerId?: string;
  offerName?: string;
}

export interface PaymentSessionDetails {
  id: string;
  status: PaymentStatus;
  currency: PaymentCurrency;
  amount: number;
  amounts: PaymentAmounts;
  description: string | null;
  examType: ExamType | null;
  subscriptionDays: number | null;
  method: PaymentMethod | null;
  provider: PaymentProvider | null;
  createdAt: string;
}

export interface InitiatePaymentInput {
  paymentId: string;
  currency: PaymentCurrency;
  method: PaymentMethod;
  phoneNumber?: string;
}

export interface InitiatePaymentResult {
  checkoutUrl: string;
  provider: PaymentProvider;
  providerReference: string;
}

export interface ProviderChargeParams {
  paymentId: string;
  providerReference: string;
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  customerEmail: string;
  customerName: string;
  description: string;
  phoneNumber?: string;
  redirectUrl: string;
}

export interface WebhookResult {
  providerReference: string;
  externalId?: string;
  status: "SUCCEEDED" | "FAILED";
  failureReason?: string;
}
