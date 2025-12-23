export interface Invoice {
  invoiceId: string;
  contractId?: string | null;
  project?: string | null;
  client?: string | null;
  contractValue?: string | null;
  status?: string | null;
  date?: string | null;
}

export type InvoiceInfo = (
  | {
      type: "en";
      payeeInfo: {
        name: string;
        address: string;
        bankName: string;
        accountNumber: string;
        phoneNumber: string;
      };
      lineItems: {
        no: string;
        description: string;
        currency: string;
        total: string;
      };
    }
  | {
      type: "jp";
      payeeInfo: {
        name: string;

        address: string;
        accountType: string;
        accountNumber: string;
        accountName: string;
        phoneNumber: string;
      };
      lineItems: {
        description: string;
        unitPrice: string;
        volume: string;
        currency: string;
        amount: string;
      };
    }
  | {
      type: "jp2";
      payeeInfo: {
        name: string;
        email?: string;
        address: string;
        accountType: string;
        accountNumber: string;
        accountName: string;
        phoneNumber: string;
      };
      lineItems: {
        description: string;
        unitPrice: string;
        volume: string;
        currency: string;
        amount: string;
      };
    }
) & {
  name: string;

  paymentTerms: string;
  invoiceId: string;
  status: string;
  date: string;
  invoiceNumber: string;
};
