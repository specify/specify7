"use strict";

// This module provides base structure for the description of the
// Specify datamodel and schema. It is supplemented by the definitions
// in specifymodel.js and specifyfield.js in the module schema.js
// which actually loads and generates the schema model objects.

// This module also contains scoping information indicating the
// current collection, ..., institution information. This probably
// belongs in a separate module because it's not really related to the
// schema, but it's here for now.

import _ from 'underscore';
import * as initialContext from './initialcontext';

const schemaBase = {

    // Maps levels in the Specify scoping hierarchy to
    // the database ids of those records for the currently
    // logged in session.
    domainLevelIds: undefined, // populated later

    // Whether collectingEvent is embedded for the
    // currently logged in collection.
    embeddedCollectingEvent: undefined, // populated later

    // Whether PaleoContext is embedded for the
    // currently logged in collection.
    embeddedPaleoContext: undefined, // populated later

    // Returns a schema model object describing the named Specify model.
    getModel(name) {
        name = name.toLowerCase();
        return _(this.models).find(model => model.name.toLowerCase() === name);
    },

    // Looks up a schema model object describing Specify model using the Specify tableId integer.
    getModelById(tableId) {
        return _(this.models).find(model => model.tableId === tableId);
    },

    // Convenience function for unescaping strings from schema localization information.
    unescape(str) {
        return str && str.replace(/([^\\])\\n/g, '$1\n');
    },

    // The scoping hierarchy of Specify objects.
    orgHierarchy: ['collectionobject', 'collection', 'discipline', 'division', 'institution']
};

// Scoping information is loaded and poplated here.
initialContext.load('domain.json', data => {
    schemaBase.domainLevelIds =  _.object(['collection', 'discipline', 'division', 'institution'].map(
        level => [level, data[level]]
    ));
    schemaBase.embeddedCollectingEvent = data.embeddedCollectingEvent;
    schemaBase.embeddedPaleoContext = data.embeddedPaleoContext;
    schemaBase.paleoContextChildTable = data.paleoContextChildTable;
    schemaBase.catalogNumFormatName = data.catalogNumFormatName;
});

export default schemaBase;