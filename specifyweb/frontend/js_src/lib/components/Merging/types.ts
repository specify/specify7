export type MergeStatus = 'FAILED' | 'MERGING' | 'ABORTED' | 'SUCCEEDED';
export type StatusState = {
  readonly status: MergeStatus;
  readonly total: number;
  readonly current: number;
};

export const initialStatusState: StatusState = {
  status: 'MERGING',
  total: 0,
  current: 0,
};
