export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: string;
  paidAt: string;
  paymentId: string;
  providerReference: string | null;
  customerName: string;
  customerEmail: string;
  description: string;
  examTypeLabel: string;
  subscriptionDays: number;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  amountFormatted: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  statusLabel: string;
  downloadUrl: string;
}

export interface PaymentInvoiceMetadata {
  invoiceNumber?: string;
  invoiceSentAt?: string;
  checkoutType?: string;
  examTab?: string;
  offerName?: string;
}
