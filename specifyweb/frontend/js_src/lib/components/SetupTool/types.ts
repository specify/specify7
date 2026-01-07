export type ResourceFormData = Record<string, any>;

export type SetupResources = {
  readonly institution: boolean;
  readonly storageTreeDef: boolean;
  readonly division: boolean;
  readonly discipline: boolean;
  readonly geographyTreeDef: boolean;
  readonly taxonTreeDef: boolean;
  readonly collection: boolean;
  readonly specifyUser: boolean;
};

export type SetupProgress = {
  readonly resources: SetupResources;
  readonly busy: boolean;
  readonly last_error?: string;
};

export type SetupResponse = {
  readonly success: boolean;
  readonly setup_progress: SetupProgress;
  readonly task_id: string;
};
