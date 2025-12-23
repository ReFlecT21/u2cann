export type Project = {
  id: number;
  pid: string;
  project: string;
  // projectTargetCountry: string[];
  // industry: string;
  hubType: string;
  deadline: string;
  status: string;
  contractId: string; // For DropdownMenu
};

export type PublicProject = {
  pid: string;
  project: string;
  hubType: string;
  projectTargetCountry: string[];
  industry: string;
  deadline: string;
};

export type ExpertProject = {
  projectId: string;
  projectName: string;
  status: string;
  adhPic: { user_id: string }[];
}


