define(['underscore', 'uiformatters'], function(_, UIFormatter) {
    "use strict";
    return function() {
        module('uiformatters');
        test('UIFormatter', function() {
            var node = $($.parseXML('\
  <format system="true" name="AccessionNumber" class="edu.ku.brc.specify.datamodel.Accession" fieldname="accessionNumber" default="true">\
    <autonumber>edu.ku.brc.specify.dbsupport.AccessionAutoNumberAlphaNum</autonumber>\
    <field type="year" size="4" value="YEAR" byyear="true"/>\
    <field type="separator" size="1" value="-"/>\
    <field type="alphanumeric" size="2" value="AA"/>\
    <field type="separator" size="1" value="-"/>\
    <field type="numeric" size="3" inc="true"/>\
  </format>\
')).find('format');
            var uiformatter = new UIFormatter(node);
            equal(uiformatter.name, 'AccessionNumber');
            equal(uiformatter.system, true);
            equal(uiformatter.modelName, 'Accession');
            equal(uiformatter.fieldName, 'accessionNumber');

            deepEqual(_(uiformatter.fields).pluck('type'),
                      ['year', 'separator', 'alphanumeric', 'separator', 'numeric']);

            deepEqual(_(uiformatter.fields).pluck('size'), [4,1,2,1,3]);
            deepEqual(_(uiformatter.fields).pluck('inc'),
                  [false, false, false, false, true]);
            deepEqual(_(uiformatter.fields).pluck('byYear'),
                  [true, false, false, false, false]);

            equal(uiformatter.value(), 'YEAR-AA-###');
            equal(uiformatter.regExp(), '\\d{4}\\-[a-zA-Z0-9]{2}\\-\\d{3}');
            ok(uiformatter.validate('2012-hi-123'));
            ok(!uiformatter.validate('123-34-oeu'));
        });
    };
});
