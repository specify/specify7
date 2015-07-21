define([
    'jquery', 'underscore', 'backbone',
    'require', 'icons', 'specifyapi', 'schema',
    'text!resources/specify_workbench_upload_def.xml!noinline',
    'jquery-ui'
], function($, _, Backbone, require, icons, api, schema, wbupdef) {
    "use strict";

    var wbUpDef = $.parseXML(wbupdef.toLowerCase());

    return Backbone.View.extend({
        __name__: "WbForm",
        className: "wbs-form table-list-dialog",
        events: {
            'click select.sp-wb-cell-input': 'unListItem',
            'click .sp-wb-cell-input': 'cellEditClk',
            'keydown .sp-wb-cell-input': 'cellEditKeyDown',
            'click td.sp-wb-cell': 'cellClk'
        },

        getMappings: function() {
            var app = require('specifyapp');
            var maps = new schema.models.WorkbenchTemplateMappingItem.LazyCollection({
                filters: { workbenchtemplate: this.options.wbid, orderby: 'vieworder' }
            });
            var done = _.bind(function(){ 
                this.mappings = maps.models;
                this.setColHdrs(this);
                this.getFldInfo();
            }, this);
            maps.fetch({ limit: 5000 }) // That's a lot of mappings
                .done(done);
        },

        getFldInfo: function() {
            _.map(this.mappings, function(mapping) {
                var tbl = mapping.get('tablename').toLowerCase();
                var fld = mapping.get('fieldname').toLowerCase();
                var updef = $('field[table="' + tbl + '"][name="' + fld + '"]', wbUpDef);
                if (updef.length == 1) {
                    tbl = updef.attr('actualtable') || tbl;
                    fld = updef.attr('actualname') || fld;
                }
                var model = schema.getModel(tbl);
                var fldInfo = model.getField(fld);
                if (fldInfo && fldInfo._localization.picklistname) {
                    api.getPickListByName(fldInfo._localization.picklistname).pipe(function(pl) {
                        if (pl.get('type') == 0) {
                            pl.rget('picklistitems').pipe(function(plItemCollection) {
                                mapping.picklistitems = plItemCollection.isComplete ? plItemCollection.models :
                                    plItemCollection.fetch().pipe(function() {return plItemCollection.models;});
                            });
                        }
                    });
                }
                mapping.fldInfo = fldInfo;
            });
        },

        setColHdrs: function(self) {
            _.each(this.mappings, function(mapping) {
                var col = new Number(mapping.get('vieworder')) + 1;
                self.$('th[vieworder="' + col + '"]').text(mapping.get('caption'));
            });
        },

        getRows: function(rows, start, blksize) {
            var trs = '';
            var stop = start + blksize; 
            if (stop > rows.length) {
                stop = rows.length;
            }
            for (var r=start; r < stop; r++) {
                var tr = _.reduce(rows[r], function(memo, col, idx) {
                    if (idx == 0) {
                        return memo + ' wbrid="' + col + '">';
                    } else {
                        //return memo + '<td><input type="text" value="' + col + '"></td>';
                        var mapidx = idx - 1;
                        return memo + '<td class="sp-wb-cell" map-idx="' + mapidx + '">' + (col || '') + '</td>';
                    }
                }, '<tr') + '</tr>';
                trs += tr;
            }
            return trs;
        },

        loadRows: function(tbl, rows, start, blksize, loader) {
            var trs = loader(rows, start, blksize);
            tbl.append(trs);
            var next = start + blksize;
            if (next < rows.length) {
                var rowloader = _.bind(this.loadRows, this);
                _.delay(rowloader, 200, tbl, rows, next, blksize, loader);
            }
        },

        cellEditClk: function(evt) {
            evt.stopPropagation(); //keep it away from the td element
        },

        cellEditKeyDown: function(evt) {
            //special behavior for 
            //enter-13,tab-9, esc-27[, dwn-40, up-38, right-39, left-37]
            if (/^(9|13|27)$/.test("" + evt.keyCode)) {
                evt.stopPropagation();
                this.cellEditEnd($(evt.currentTarget), evt.keyCode == 27);
            }
        },

        cellEditEnd: function(cell, cancel) {
            var td = cell.parent();
            var tr = cell.parent().parent();
            if (cancel) {
                td.text(td.attr('prev-val'));
            } else {
                td.attr('dirty', true);
                td.text(cell.attr('value'));
                tr.attr('dirty', true);
            }
            cell.remove();
        },

        unListItem: function(evt) {
            var sel = $(evt.currentTarget);
            if (sel.attr('value') == '+') {
                var td = sel.parent();
                sel.remove();
                td.append($('<input type="text" class="sp-wb-cell-input">'));
            }
        },

        cellClk: function(evt) {
            //console.info(evt);
            var td = $(evt.currentTarget);
            var mapping = this.mappings[td.index()];
            var edt;
            if (mapping && mapping.picklistitems) {
                edt = $('<select class="sp-wb-cell-input">');
                _.each(mapping.picklistitems, function(item) {
                    //edt.append('<option value="' + item.get('value') + '">' + item.get('title') + '</option>');
                    edt.append('<option title="' + item.get('title') + '">' + item.get('title') + '</option>');
                });
                if ($('option[title="' + td.text() + '"]', edt).length == 0) {
                    edt.append('<option>' + td.text() + '</option>');
                }
                edt.append('<option class="sp-wb-cell-input-pl-add">+</option>');
                edt.attr('value', td.text());
            } else { 
                edt = $('<input type="text" class="sp-wb-cell-input">');
                edt.attr('value', td.text());
            }
            td.attr('prev-val', td.text());
            td.text('');
            td.append(edt);
        },

        saveWb: function() {
            /*
            //dirty up a row for testing
            var r  = $(this.$('tr')[5]);
            r.attr('dirty', true);
            //dirty up one of its cells
            var c = $($('td',r)[4]);
            c.attr('dirty', true);
            c.text(c.text() + ' dirty');
             */

            //save...
            var toSave = this.$('tr[dirty=true]');
            var self = this;
            var rowdata = _.reduce(toSave, function(memo, row){
                var celldata = _.reduce($('td[dirty=true]', row), function(memo, cell){
                    memo.push({
                        workbenchtemplatemappingitemid: self.mappings[$(cell).attr('map-idx')].get('id'),
                        celldata: $(cell).text()
                    });
                    return memo;
                }, []);
                memo.push({
                    workbenchrowid: $(row).attr('wbrid'),
                    rownumber: self.$('tr').index(row),
                    cells: celldata
                });
                return memo;
            }, []);
            console.info(rowdata);
            api.updateWb(this.options.wbid, rowdata).done(function(back) {
                console.info(back);
            });
        },

        render: function() {
            console.info('rendering');

            var hdrs = _.reduce(this.options.data[0], function(memo, value, idx) {
                if (idx > 0) {
                    return memo + '<th vieworder="' + idx + '">' + idx + '</th>';
                } else {
                    return memo;
                }
            }, '<tr>') + '</tr>';
            
            var tbl = $('<table border="1">');
            tbl.append(hdrs);
            this.loadRows(tbl, this.options.data, 0, 100, this.getRows);
            tbl.appendTo(this.el);
            this.getMappings();
            
            var saver = _.bind(this.saveWb, this);
            this.$el.dialog({
                title: "Workbench",
                maxHeight: 800,
                width: 1000,
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{text: 'Save', click: saver }, { text: 'Cancel', click: function() { $(this).dialog('close'); } }]
            });
            /*var wbid = 656;
            var rowdata = [{
                workbenchrowid: 490399,
                rownumber: 5327,
                cells: [{
                    workbenchtemplatemappingitemid: 10464,
                    celldata: 'Clearly'
                }]
            }];
            api.updateWb(wbid, rowdata).done(function(back) {
                console.info(back);
            });*/
            return this;
        }
    });
});
