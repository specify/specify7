define(['remoteprefs'], function(remoteprefs) {
    return remoteprefs['ui.formatting.scrdateformat'].toUpperCase() || 'YYYY-MM-DD';
});
