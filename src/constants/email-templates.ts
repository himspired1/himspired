export const PAYMENT_ISSUE_TEMPLATES = [
  {
    label: "Payment not confirmed",
    value: "payment_not_confirmed",
    template: `Dear Customer,\n\nWe were unable to confirm your payment for your recent order. Please check your payment details or contact support for assistance.\n\nThank you.`,
  },
  {
    label: "Missing receipt",
    value: "missing_receipt",
    template: `Dear Customer,\n\nWe did not receive a payment receipt for your order. Please upload your receipt or contact support.\n\nThank you.`,
  },
  {
    label: "Bank transfer delay",
    value: "bank_transfer_delay",
    template: `Dear Customer,\n\nYour payment is being processed, but there may be a delay due to bank transfer times. We will notify you once confirmed.\n\nThank you for your patience.`,
  },
];
