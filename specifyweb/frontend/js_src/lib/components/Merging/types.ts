export type MergingStatus = 'ABORTED' | 'FAILED' | 'MERGING' | 'SUCCEEDED';
export type StatusState = {
  readonly status: MergingStatus;
  readonly total: number;
  readonly current: number;
};

export const initialStatusState: StatusState = {
  status: 'MERGING',
  total: 0,
  current: 0,
};
