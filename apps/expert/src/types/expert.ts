export interface Expert {
  id: string;
  about: string | null;
  img_url: string | null;
  country: string | null;
  address: string | null;
  skills: string[];
  languages: any; // Adjust the type based on your actual data structure
  educations: any; // Adjust the type based on your actual data structure
  experiences: any; // Adjust the type based on your actual data structure
  position: string | null;
  created_at: Date;
  updated_at: Date;
  completedProjectCount: number;
  totalProjectCount: number;
  ongoingProjectCount: number;
}