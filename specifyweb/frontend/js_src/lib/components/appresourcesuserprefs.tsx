export function AppResourcesUserPrefs({
  data,
  isReadOnly,
  onChange: handleChange,
}: {
  readonly data: string;
  readonly isReadOnly: boolean;
  readonly onChange: (data: string) => void;
}): JSX.Element {}
