define(['remoteprefs'], function(remoteprefs) {
	return typeof remoteprefs['ui.formatting.scrdateformat'] === 'string' 
		? remoteprefs['ui.formatting.scrdateformat'].toUpperCase() 
		: 'YYYY-MM-DD';
});
