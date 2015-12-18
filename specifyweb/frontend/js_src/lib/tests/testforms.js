define([
    'underscore', 'uiformatters', 'specifyformcells', 'processcolumndef'
], function(_, UIFormatter, processCell, processColumnDef) {
    "use strict";
    return function() {
        var uitypes = ['checkbox', 'textarea', 'textareabrief', 'combobox', 'querycbx', 'text',
                       'dsptextfield', 'formattedtext', 'label', 'plugin', 'browse'];
        var formNumber = '<%= formNumber %>';

        function instProcessCell(doingFormTable, node) {
            var cell = $(node);
            var result = processCell(formNumber, doingFormTable, 'edit', node);
            if (cell.attr('colspan')) {
                if (doingFormTable) {
                    ok(_.isUndefined(result.attr('colspan')), 'colspan undefined for formtable');
                } else {
                    equal(result.attr('colspan'), Math.ceil(parseInt(cell.attr('colspan'), 10)/2),
                          'colspan is correct');
                }
            }
            return result;
        }

        module('specifyform label');
        _([true, false]).each(function(doingFormTable) {
            var node ='<cell type="label" labelfor="1"/>';
            test(node + ' doingFormTable: ' + doingFormTable, function() {
                var result = instProcessCell(doingFormTable, node);
                ok(result.hasClass('specify-form-label'), 'specify-form-label class');
                equal(result.children().length, 1);
                var label = result.children().first();
                ok(label.is('label'), 'has label element');
                equal(label.prop('for'), 'specify-field-<%= formNumber %>-1', 'correct for id');
                equal(label.text(), '', 'empty label');
            });
        });

        _([true, false]).each(function(doingFormTable) {
            var node = '<cell type="label" labelfor="1" label="Foobar"/>';
            test(node + ' doingFormTable: ' + doingFormTable, function() {
                var result = instProcessCell(doingFormTable, node);
                ok(result.hasClass('specify-form-label'), 'specify-form-label class');
                equal(result.children().length, 1);
                var label = result.children().first();
                ok(label.is('label'), 'has label element');
                equal(label.prop('for'), 'specify-field-<%= formNumber %>-1', 'correct for id');
                equal(label.text(), 'Foobar', 'label text is correct');
            });
        });

        module('specifyform separator');
        _([true, false]).each(function(useLabel) {
            var node = useLabel ? '<cell type="separator" label="Attachments" colspan="15"/>' :
                '<cell type="separator" colspan="15"/>';

            test(node, function() {
                var result = instProcessCell(false, node);
                equal(result.children().length, 1, 'only one element');
                var separator = result.children().first();
                ok(separator.hasClass('separator'));
                ok(separator.is(useLabel ? 'h3' : 'hr'), 'correct element');
            });
        });

        module('specifyform command');
        (function() {
            var node = '<cell type="command" id="14" name="ReturnLoan" label="Return Loan" commandtype="Interactions" action="ReturnLoan" ignore="true" initialize="vis=false"/>';
            test(node, function() {
                var result = instProcessCell(false, node);
                equal(result.children().length, 1, 'only one element');
                var control = result.children().first();
                ok(control.is('input[type="button"]'), 'control is button input');
                equal(control.attr('name'), 'ReturnLoan');
                equal(control.attr('value'), 'Return Loan');
            });
        })();

        module('specifyform field');
        _(uitypes).each(function(uitype) { _([true, false]).each(function(doingFormTable) {
            var node = '<cell type="field" id="1" name="aField" uitype="'+uitype+'"/>';
            test(node + ' doingFormTable: ' + doingFormTable, function() {
                var result = instProcessCell(doingFormTable, node);
                var control = result.find('.specify-field');
                equal(control.length, 1, 'exactly one specify-field element');
                equal(control.attr('name'), 'aField', 'name is correct');
                equal(control.prop('id'), 'specify-field-'+formNumber+'-1', 'id is correct');
                ok(_.isUndefined(control.data('specify-initialize')), 'no initialize data');
                ok(!control.hasClass('specify-required-field'), 'field is not required');
            });
        });});

        module('specifyform field required and initialized');
        _(uitypes).each(function(uitype) { _([true, false]).each(function(doingFormTable) {
            var node = '<cell type="field" id="1" name="aField" uitype="'+uitype+'" isrequired="true" initialize="somedata"/>';
            test(node + ' doingFormTable: ' + doingFormTable, function() {
                var result = instProcessCell(doingFormTable, node);
                var control = result.find('.specify-field');
                equal(control.length, 1, 'exactly one specify-field element');
                equal(control.attr('name'), 'aField', 'name is correct');
                equal(control.prop('id'), 'specify-field-'+formNumber+'-1', 'id is correct');
                equal(control.data('specify-initialize'), 'somedata', 'initialize data is correct');
                ok(control.hasClass('specify-required-field'), 'field is required');
            });
        });});

        module('specifyform field checkbox');
        _([true, false]).each(function(doingFormTable) {
            _(['', 'someLabel', null]).each(function(labelStr) {
                var node ='<cell type="field" id="3" name="isCurrent" uitype="checkbox"' +
                    (_.isNull(labelStr)? '': (' label="'+labelStr+'"')) +
                    '/>';
                test(node + ' doingFormTable: ' + doingFormTable, function() {
                    var result = instProcessCell(doingFormTable, node);
                    var control = result.children('input').first();
                    var label = result.children('label').first();
                    equal(result.children().length, doingFormTable ? 1 : 2);
                    ok(control.is(':checkbox'), 'is checkbox');
                    equal(control.prop('disabled'), doingFormTable, 'disabled if doingFormTable');
                    !doingFormTable && equal(label.prop('for'), 'specify-field-'+formNumber+'-3', 'for id is correct');
                    var labelOR = control.data('specify-field-label-override');
                    if (_.isNull(labelStr)) {
                        if (doingFormTable)
                            ok(_.isUndefined(labelOR), 'label override is undefined');
                        else
                            equal(label.text(), '', 'empty label text');
                    } else {
                        if (doingFormTable)
                            equal(labelOR, labelStr, 'label override is correct');
                        else
                            equal(label.text(), labelStr, 'label text is correct');
                    }
                });
            });
        });

        test('checkbox without id', function() {
            var result = instProcessCell(false, '<cell type="field" name="foo" uitype="checkbox"/>');
            var label = result.children('label');
            equal(label.length, 1, 'label exists');
            equal(_.isUndefined(label.prop('for')), '', 'label for id is undefined');
        });

        module('specifyform field textarea');
        _([true, false]).each(function(doingFormTable) {
            _(['rows="10"', 'rows="3"', '']).each(function(rowsAttr) {
                var node = '<cell type="field" id="4" name="remarks" uitype="textarea" '+rowsAttr+' colspan="3"/>';
                test(node + ' doingFormTable: ' + doingFormTable, function() {
                    var result = instProcessCell(doingFormTable, node);
                    equal(result.children().length, 1, 'only one element');
                    var control = result.find('.specify-field');
                    if (doingFormTable) {
                        ok(control.is('input[type="text"]'), 'text input for form table');
                        ok(_.isUndefined(control.attr('rows')), 'rows not defined for form table');
                    } else {
                        ok(control.is('textarea'), 'textarea if not doing form table');
                        if (rowsAttr === '') {
                            ok(_.isUndefined(control.attr('rows')), 'rows not defined if not given');
                        } else {
                            equal(control.attr('rows'), rowsAttr.replace('rows="', '').replace('"', ''), 'rows attr is correct');
                        }
                    }
                });
            });
        });

        module('specifyform field textareabrief');
        _([true, false]).each(function(doingFormTable) {
            _(['rows="10"', 'rows="3"', '']).each(function(rowsAttr) {
                var node = '<cell type="field" id="2" name="brieftext" uitype="textareabrief" '+rowsAttr+' colspan="3"/>';
                test(node + ' doingFormTable: ' + doingFormTable, function() {
                    var result = instProcessCell(doingFormTable, node);
                    equal(result.children().length, 1, 'only one element');
                    var control = result.find('.specify-field');
                    if (doingFormTable) {
                        ok(control.is('input[type="text"]'), 'text input for form table');
                        ok(_.isUndefined(control.attr('rows')), 'rows not defined for form table');
                    } else {
                        ok(control.is('textarea'), 'textarea if not doing form table');
                        if (rowsAttr === '') {
                            equal(control.attr('rows'), '1', 'rows defaults to 1');
                        } else {
                            equal(control.attr('rows'), rowsAttr.replace('rows="', '').replace('"', ''), 'rows attr is correct');
                        }
                    }
                });
            });
        });

        module('specifyform field combobox');
        _([true, false]).each(function(doingFormTable) {
            _([true, false]).each(function(givePickList) {
                var node = '<cell type="field" id="7" name="prepType" uitype="combobox" ' +
                    (givePickList ? 'picklist="PrepType"' : '') + ' />';
                test(node + ' doingFormTable: ' + doingFormTable, function() {
                    var result = instProcessCell(doingFormTable, node);
                    equal(result.children().length, 1, 'only one element');
                    var control = result.find('.specify-field');
                    ok(control.is('select'), 'control is <select>');
                    ok(control.hasClass('specify-combobox'), 'control has combobox class');
                    equal(control.prop('disabled'), doingFormTable, 'disabled if doing form table');
                    var pickList = control.data('specify-picklist');
                    if (givePickList) {
                        equal(pickList, 'PrepType', 'picklist data is included');
                    } else {
                        ok(_.isUndefined(pickList), 'picklist is undefinde');
                    }
                });
            });
        });

        module('specifyform field querycbx');
        _([true, false]).each(function(doingFormTable) {
            var node = '<cell type="field" id="3" name="accession" uitype="querycbx" initialize="name=AccessionCO;title=AccessionCO" isrequired="false"/>';
            test(node + ' doingFormTable: ' + doingFormTable, function() {
                var result = instProcessCell(doingFormTable, node);
                equal(result.children().length, 1, 'only one element');
                var control = result.find('.specify-field');
                ok(control.is('input[type="text"]'), 'input is type text');
                ok(control.hasClass('specify-querycbx'), 'control has querycbx class');
                equal(control.prop('readonly'), doingFormTable, 'readonly if doing form table');
            });
        });

        module('specifyform field text/dsptextfield/formattedtext/label');
        _([true, false]).each(function(doingFormTable) {
            _(['text', 'dsptextfield', 'formattedtext', 'label']).each(function(uitype) {
                var node = '<cell type="field" id="2" name="text2" uitype="' + uitype + '"/>';
                test(node + ' doingFormTable: ' + doingFormTable, function() {
                    var result = instProcessCell(doingFormTable, node);
                    equal(result.children().length, 1, 'only one element');
                    var control = result.find('.specify-field');
                    ok(control.is('input[type="text"]'), 'control is text input');
                    if (uitype === 'formattedtext')
                        ok(control.hasClass('specify-formattedtext'), 'has formattedtext class');
                    equal(control.prop('readonly'), doingFormTable || uitype === 'dsptextfield' || uitype === 'label',
                          'readonly if doing form table or dsptextfield or label');
                });
            });
        });

        module('specifyform field plugin');
        _([true, false]).each(function(doingFormTable) {
            var node = '<cell type="field" id="mailto" name="this" uitype="plugin" initialize="name=WebLinkButton;weblink=MailTo;icon=EMail;watch=7"/>'
            test(node + ' doingFormTable: ' + doingFormTable, function() {
                var result = instProcessCell(doingFormTable, node);
                equal(result.children().length, 1, 'only one element');
                var control = result.find('.specify-field');
                ok(control.is('input[type="button"]'), 'control is button');
                ok(control.hasClass('specify-uiplugin'), 'control has plugin class');
                equal(control.prop('disabled'), doingFormTable, 'plugin is disabled iff doingFormTable');
            });
        });

        module('specifyform field browse');
        test('browse', function() {
            var result = processCell(
                formNumber, false, 'edit',
                '<cell type="field" id="2" name="mysql.location" cols="30" uitype="browse" colspan="3"/>');
            equal(result.children().length, 1, 'only one element');
            var control = result.find('.specify-field');
            ok(control.is('input[type="file"]'), 'control is file input');
        });

        module('specifyform subview');
        _([true, false]).each(function(doingButton) {
            _([true, false]).each(function(doingAlign) {
                var init = 'initialize="name=Agent' +
                    (doingButton? ';btn=true' : '') +
                    (doingAlign? ';align=left' : '') + '"';

                var node = '<cell type="subview" viewname="Authors" id="10" name="authors" '+init+' defaulttype="table" colspan="12" rows="3"/>';
                test(node, function() {
                    var result = instProcessCell(false, node);
                    equal(result.children().length, 0, 'is empty td');
                    ok(result.hasClass('specify-subview'), 'has subview class');
                    equal(result.data('specify-field-name'), 'authors', 'field name is correct');
                    equal(result.data('specify-viewname'), 'Authors', 'viewname is correct');
                    equal(result.data('specify-viewtype'), 'table', 'viewtype is correct');
                    equal(result.hasClass('specify-subview-button'), doingButton, 'button class is correct');
                    if (doingButton) {
                        equal(result.attr('id'), 'specify-field-'+formNumber+'-10', 'id is correct');
                        equal(result.data('specify-initialize'), init.replace('initialize="', '').replace('"', ''), 'has correct initialize data');
                        if (doingAlign) {
                            ok(result.hasClass('align-left'), 'has align class');
                        } else {
                            ok(!result.hasClass('align-left') && !result.hasClass('align-right'), 'no align class');
                        }
                    } else {
                        ok(_.isUndefined(result.attr('id')), 'id is undefined if not doing button');
                        ok(_.isUndefined(result.data('initialize')), 'initialize is not defined');
                        ok(!result.hasClass('align-left') && !result.hasClass('align-right'), 'no align class');
                    }
                });
            });
        });

        module('specifyform panel');
        (function() {
            var panelXML = '\
<cell type="panel" id="17" name="srcPanel" coldef="130px,2px,p:g,5px,130px,2px,p:g" rowdef="p" colspan="14">\
   <rows>\
     <row>\
       <cell type="label" label="1"/>\
       <cell type="label" label="2"/>\
     </row>\
     <row>\
       <cell type="label" label="3"/>\
       <cell type="label" label="4"/>\
     </row>\
   </rows>\
</cell>\
';
            test('panel', function() {
                var result = instProcessCell(false, $(panelXML));
                equal(result.children().length, 1, 'only one element');
                var table = result.children().first();
                ok(table.is('table'), 'element is table');
                var vals = _(table.find('tr')).map(function(tr) {
                    return _($(tr).find('td')).map(function(td) {
                        return $(td).find('label').text();
                    });
                });
                deepEqual(vals, [['1', '2'], ['3', '4']], 'panel structure is correct');
            });
        })();

        module('processcolumndef');
        _({
            '115px,2px,137px,5px,135px,2px,130px,5px,133px,2px,81px,15px,155px,p:g':
            ['115px', '137px', '135px', '130px', '133px', '81px', '155px'],
            '130px,2px,p:g,5px,130px,2px,p:g':
            ['130px', undefined, '130px', undefined]
        }).each(function(expected, coldef) {
            test(coldef, function() {
                var result = processColumnDef(coldef);
                ok(result.is('table'), 'result is table');
                equal(result.children().length, 1, 'table only contains colgroup');
                var colgroup = result.children().first();
                ok(colgroup.is('colgroup'), 'is colgroup');
                ok(_(colgroup.children()).all(function(child) { return $(child).is('col'); }), 'colgroup contians cols');
                var widths = _(colgroup.find('col')).map(function(col) { return $(col).attr('width'); });
                deepEqual(widths, expected, 'widths are correct');
            });
        });
    };
});
