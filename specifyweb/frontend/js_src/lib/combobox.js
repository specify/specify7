"use strict";

import _ from 'underscore';
import Backbone from './backbone';
import Q from 'q';

import PickListCBX from './picklistcbx';
import ReadOnlyPickListCBX from './readonlypicklistcbx';
import getPickListByName from './getpicklistbyname';
import * as mixins from './picklistmixins';
import AgentTypeCBX from './agenttypecbx';
import UserTypeCBX from './usertypecbx';
import PickListTypeCBX from './picklisttypecbx';
import PickListTableCBX from './picklisttablecbx';
import PickListFieldCBX from './picklistfieldcbx';
import DivisionFieldCBX from './divisionfieldcbx.js';
import TreeLevelCBX from './treelevelcbx';

    function getCBX(options, resource, field) {
        _.extend(options, {
            resource: resource,
            field: field,
            remote: resource !== options.model
        });

        if (resource.specifyModel.name === 'Agent' && field.name === 'agentType') {
            return new AgentTypeCBX(options);
        }

        if (resource.specifyModel.name === 'PickList' && options.fieldName === 'typesCBX') {
            return new PickListTypeCBX(options);
        }

        if (resource.specifyModel.name === 'PickList' && options.fieldName === 'tablesCBX') {
            return new PickListTableCBX(options);
        }

        if (resource.specifyModel.name === 'PickList' && options.fieldName === 'fieldsCBX') {
            return new PickListFieldCBX(options);
        }

        if (resource.specifyModel.name === 'Accession' && options.fieldName === 'divisionCBX') {
            return new DivisionFieldCBX(options);
        }

        if (options.fieldName === 'definitionItem') {
            return new TreeLevelCBX(options);
        }

        if (!field) {
            throw new Error(`can't setup picklist for unknown field ${options.model.specifyModel.name}.${options.fieldName}`);
        }

        options.pickListName || (options.pickListName = field.getPickList());

        if (options.pickListName === 'UserType') {
            return new UserTypeCBX(options);
        }
        if (!options.pickListName)
            throw new Error(`can't determine picklist for field ${resource.specifyModel.name}.${field.name}`);

        return Q(getPickListByName(options.pickListName))
            .then(function(picklist) {
                options.pickList = picklist;

                options.limit = picklist.get('readonly') ? picklist.get('sizelimit') : 0;
                if (options.limit < 1) options.limit = 0;
                var Control = picklist.get('readonly') ? ReadOnlyPickListCBX : PickListCBX;

                switch (picklist.get('type')) {
                case 0: // items in picklistitems table
                    return new (Control.extend(mixins.userDefined))(options);

                case 1: // items are objects from a table
                    // This has to be readonly.
                    return new (ReadOnlyPickListCBX.extend(mixins.fromTable))(options);

                case 2: // items are fields from a table
                    return new (Control.extend(mixins.fromField))(options);

                default:
                    throw new Error('unknown picklist type: ' + picklist.get('type'));
                }
            });
    }

export default Backbone.View.extend({
        __name__: "ComboBoxView",
        initialize: function() {
            var options = {
                el: this.el,
                model: this.model,
                fieldName: this.$el.attr('name'),
                pickListName: this.$el.data('specify-picklist'),
                default: this.$el.data('specify-default')
            };

            this.cbxPromise = Q(this.model.getResourceAndField(options.fieldName))
                .spread(getCBX.bind(null, options));
        },
        render: function() {
            this.cbxPromise.invoke('render').done();
            return this;
        }
    });

