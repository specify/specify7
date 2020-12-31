type ErrorBoundaryState =
	{
		has_error :false,
	} | {
	has_error :true,
	error :{toString :() => string},
	errorInfo :{componentStack :string}
};