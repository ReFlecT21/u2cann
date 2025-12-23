import { z } from "zod";

export const PAYMENT_METHODS = ["wise", "paypal", "bank_transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_DETAIL_KEYS = [
  "label",
  "icon",
  "description",
] as const;

export type PaymentMethodDetailKeys =
  (typeof PAYMENT_METHOD_DETAIL_KEYS)[number];

export type PaymentMethodDetail = Record<PaymentMethodDetailKeys, string>;

export const PAYMENT_METHOD_DETAILS: Record<
  PaymentMethod,
  PaymentMethodDetail
> = {
  wise: {
    label: "Wise",
    icon: "https://www.wise.com/public-resources/images/logos/wise.svg",
    description:
      "Wise is a global payment service that allows you to send and receive money internationally.",
  },
  paypal: {
    label: "PayPal",
    icon: "https://www.paypal.com/public-resources/images/logos/paypal.svg",
    description:
      "PayPal is a global payment service that allows you to send and receive money internationally.",
  },
  bank_transfer: {
    label: "Bank Transfer",
    icon: "https://www.banktransfer.com/public-resources/images/logos/banktransfer.svg",
    description:
      "Bank Transfer is a global payment service that allows you to send and receive money internationally.",
  },
};

export const BANK_TRANSFER_SCHEMA = z.object({
  bank_name: z.string(),
  account_number: z.string(),
  account_holder_name: z.string(),
  account_holder_address: z.string(),
});

export type BankTransferForm = z.infer<typeof BANK_TRANSFER_SCHEMA>;

export const PAYPAL_SCHEMA = z.object({
  email: z.string().email(),
  username: z.string(),
});

export type PaypalForm = z.infer<typeof PAYPAL_SCHEMA>;

export const WISE_SCHEMA = z.object({
  email: z.string().email(),
  username: z.string(),
});

export type WiseForm = z.infer<typeof WISE_SCHEMA>;

export type PaymentMethodForm = BankTransferForm | PaypalForm | WiseForm;

export const PAYMENT_METHOD_FORMS = {
  bank_transfer: BANK_TRANSFER_SCHEMA,
  paypal: PAYPAL_SCHEMA,
  wise: WISE_SCHEMA,
};
