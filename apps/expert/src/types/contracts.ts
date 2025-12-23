export interface Contract {
  contractId?: string | null;
  project?: string | null;
  client?: string | null;
  status?: string | null;
}

export interface AdminContract {
  contractId?: string | null;
  prohectId?: string | null;
  project?: string | null;
  expert?: string | null;
  template?: string | null;
  status?: string | null;
}

export interface AdminContractTemplate {
  id: number;
  name?: string | null;
  version?: string | null;
  language?: string | null;
  updateAt?: string | null;
  default?: boolean | null;
}
