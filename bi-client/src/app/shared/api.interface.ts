export interface GetBiReports {
  report: Report;
  filters: BiFilter[];
  subpages: BiSubpage[];
  expanded: boolean;
}

export interface Resp<T> {
  response: T[];
}

export interface GetBiReport {
  token: string;
  azureValidation: number;
  filters: BiFilter[];
  report: Report;
}

interface Report {
  id: number;
  report_name: string;
  report_title: string;
  report_description: string;
  report_id: string;
  dataset_id: string;
  group_id: string;
  is_active: number;
  has_rls_security: number;
  report_order: number;
  has_full_screen: number;
  embed_url: string;
  mainPage: string;
}

export interface BiFilter {
  id: number;
  variablename: string;
  scope: string;
  table: string;
  column: string;
  operator: string;
  param_type: string;
  report_id: number;
}

interface BiSubpage {
  id: number;
  page_name: string;
  report_id: number;
  section_number: string;
  page_displayName: string;
}
