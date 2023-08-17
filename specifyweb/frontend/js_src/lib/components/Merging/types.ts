export type MergeStatus = 'FAILED' | 'MERGING' | 'PENDING' | 'SUCCESS';
export type StatusState = {
  readonly status: MergeStatus;
  readonly total: number;
  readonly current: number;
};

export const initialStatusState: StatusState = {
  status: 'PENDING',
  total: 0,
  current: 0,
};
