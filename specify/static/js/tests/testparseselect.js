define(['parseselect'], function(parseselect) {
    "use strict";

    return function() {
        module('parseselect.parse');

        test('Collecting event', function() {
            var str = 'SELECT %s1 FROM CollectingEvent ce LEFT JOIN ce.locality loc LEFT JOIN loc.geography geo JOIN ce.discipline as dsp WHERE dsp.disciplineId = DSPLNID AND %s2 ORDER BY stationFieldNumber';
            var colMap = parseselect.parse(str);
            equal(colMap.ce, 'CollectingEvent', 'FROM clause');
            equal(colMap.loc, 'CollectingEvent.locality', 'first JOIN');
            equal(colMap.geo, 'CollectingEvent.locality.geography', 'second JOIN');
            equal(colMap.dsp, 'CollectingEvent.discipline', 'final JOIN');
        });

        test('Field notebook page', function() {
            var str = 'SELECT %s1 FROM FieldNotebookPage fnbp JOIN fnbp.pageSet as fnbps JOIN fnbps.fieldNotebook as fnb JOIN fnb.discipline as dsp WHERE dsp.disciplineId = DSPLNID AND %s2 ORDER BY fnb.name, fnbp.pageNumber';
            var colMap = parseselect.parse(str);
            equal(colMap.fnbp, "FieldNotebookPage");
            equal(colMap.fnbps, "FieldNotebookPage.pageSet");
            equal(colMap.fnb, "FieldNotebookPage.pageSet.fieldNotebook");
            equal(colMap.dsp, "FieldNotebookPage.pageSet.fieldNotebook.discipline");
        });

        module('parseselect.colToField');

        test('Collecting event', function() {
            var str = 'SELECT %s1 FROM CollectingEvent ce LEFT JOIN ce.locality loc LEFT JOIN loc.geography geo JOIN ce.discipline as dsp WHERE dsp.disciplineId = DSPLNID AND %s2 ORDER BY stationFieldNumber';
            var colMap = parseselect.parse(str);
            equal(parseselect.colToField(colMap, 'loc.localityName'), 'locality.localityName');
            equal(parseselect.colToField(colMap, 'geo.fullName'), 'locality.geography.fullName');
        });

        test('Field notebook page', function() {
            var str = 'SELECT %s1 FROM FieldNotebookPage fnbp JOIN fnbp.pageSet as fnbps JOIN fnbps.fieldNotebook as fnb JOIN fnb.discipline as dsp WHERE dsp.disciplineId = DSPLNID AND %s2 ORDER BY fnb.name, fnbp.pageNumber';
            var colMap = parseselect.parse(str);
            equal(parseselect.colToField(colMap, 'fnbp.pageNumber'), 'pageNumber');
            equal(parseselect.colToField(colMap, 'fnb.name'), 'pageSet.fieldNotebook.name');
        });
    };
});