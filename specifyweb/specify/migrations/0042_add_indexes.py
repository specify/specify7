# -*- coding: utf-8 -*-
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0041_add_missing_schema_after_reorganization'),
    ]

    operations = [
        # AgentIdentifier
        migrations.AddIndex(
            model_name='agentidentifier',
            index=models.Index(
                fields=['identifier'],
                name='agentidentifier_identifier_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='agentidentifier',
            index=models.Index(
                fields=['identifierType'],
                name='agentidentifier_identifiertype_idx',
            ),
        ),

        # AgentSpecialty
        migrations.AddIndex(
            model_name='agentspecialty',
            index=models.Index(
                fields=['orderNumber'],
                name='agentspecialty_ordernumber_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='agentspecialty',
            index=models.Index(
                fields=['specialtyName'],
                name='agentspecialty_specialtyname_idx',
            ),
        ),

        # AgentVariant
        migrations.AddIndex(
            model_name='agentvariant',
            index=models.Index(
                fields=['name'],
                name='agentvariant_name_idx',
            ),
        ),

        # Attachment
        migrations.AddIndex(
            model_name='attachment',
            index=models.Index(
                fields=['origFilename'],
                name='attachment_origfilename_idx',
            ),
        ),

        # Spdataset (attachmentdataset)
        migrations.AddIndex(
            model_name='spdataset',
            index=models.Index(
                fields=['name'],
                name='spdataset_name_idx',
            ),
        ),

        # AttachmentMetadata
        migrations.AddIndex(
            model_name='attachmentmetadata',
            index=models.Index(
                fields=['name'],
                name='attachmentmetadata_name_idx',
            ),
        ),

        # Author
        migrations.AddIndex(
            model_name='author',
            index=models.Index(
                fields=['orderNumber'],
                name='author_ordernumber_idx',
            ),
        ),

        # CollectionObject
        migrations.AddIndex(
            model_name='collectionobject',
            index=models.Index(
                fields=['name'],
                name='collectionobject_name_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='collectionobject',
            index=models.Index(
                fields=['projectNumber'],
                name='collectionobject_projectnumber_idx',
            ),
        ),

        # CollectionObjectGroup
        migrations.AddIndex(
            model_name='collectionobjectgroup',
            index=models.Index(
                fields=['guid'],
                name='collectionobjectgroup_guid_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='collectionobjectgroup',
            index=models.Index(
                fields=['name'],
                name='collectionobjectgroup_name_idx',
            ),
        ),

        # CollectionObjectGroupType
        migrations.AddIndex(
            model_name='collectionobjectgrouptype',
            index=models.Index(
                fields=['name'],
                name='collectionobjectgroupt_name_idx',
            ),
        ),

        # CollectionObjectProperty
        migrations.AddIndex(
            model_name='collectionobjectproperty',
            index=models.Index(
                fields=['guid'],
                name='collectionobjectprop_guid_idx',
            ),
        ),

        # CollectionObjectType
        migrations.AddIndex(
            model_name='collectionobjecttype',
            index=models.Index(
                fields=['name'],
                name='collectionobjecttype_name_idx',
            ),
        ),

        # CollectionRelType
        migrations.AddIndex(
            model_name='collectionreltype',
            index=models.Index(
                fields=['name'],
                name='collectionreltype_name_idx',
            ),
        ),

        # ExchangeIn
        migrations.AddIndex(
            model_name='exchangein',
            index=models.Index(
                fields=['exchangeInNumber'],
                name='exchangein_exchangeinnumber_idx',
            ),
        ),

        # ExsiccataItem
        migrations.AddIndex(
            model_name='exsiccataitem',
            index=models.Index(
                fields=['number'],
                name='exsiccataitem_number_idx',
            ),
        ),

        # Geography
        migrations.AddIndex(
            model_name='geography',
            index=models.Index(
                fields=['commonName'],
                name='geography_commonname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='geography',
            index=models.Index(
                fields=['guid'],
                name='geography_guid_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='geography',
            index=models.Index(
                fields=['highestChildNodeNumber'],
                name='geography_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='geography',
            index=models.Index(
                fields=['nodeNumber'],
                name='geography_nodenumber_idx',
            ),
        ),

        # GeographyTreeDef
        migrations.AddIndex(
            model_name='geographytreedef',
            index=models.Index(
                fields=['name'],
                name='geographytreedef_name_idx',
            ),
        ),

        # GeographyTreeDefItem
        migrations.AddIndex(
            model_name='geographytreedefitem',
            index=models.Index(
                fields=['name'],
                name='geogtreedefitem_name_idx',
            ),
        ),

        # GeologicTimePeriod
        migrations.AddIndex(
            model_name='geologictimeperiod',
            index=models.Index(
                fields=['highestChildNodeNumber'],
                name='geotime_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='geologictimeperiod',
            index=models.Index(
                fields=['nodeNumber'],
                name='geotime_nodenumber_idx',
            ),
        ),

        # GeologicTimePeriodTreeDef
        migrations.AddIndex(
            model_name='geologictimeperiodtreedef',
            index=models.Index(
                fields=['name'],
                name='geotimetreedef_name_idx',
            ),
        ),

        # GeologicTimePeriodTreeDefItem
        migrations.AddIndex(
            model_name='geologictimeperiodtreedefitem',
            index=models.Index(
                fields=['name'],
                name='geotimetreedefitem_name_idx',
            ),
        ),

        # InstitutionNetwork
        migrations.AddIndex(
            model_name='institutionnetwork',
            index=models.Index(
                fields=['altName'],
                name='institutionnetwork_altname_idx',
            ),
        ),

        # LatLonPolygon
        migrations.AddIndex(
            model_name='latlonpolygon',
            index=models.Index(
                fields=['name'],
                name='latlonpolygon_name_idx',
            ),
        ),

        # LithoStrat
        migrations.AddIndex(
            model_name='lithostrat',
            index=models.Index(
                fields=['highestChildNodeNumber'],
                name='lithostrat_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='lithostrat',
            index=models.Index(
                fields=['nodeNumber'],
                name='lithostrat_nodenumber_idx',
            ),
        ),

        # LithoStratTreeDef
        migrations.AddIndex(
            model_name='lithostrattreedef',
            index=models.Index(
                fields=['name'],
                name='lithostratdef_name_idx',
            ),
        ),

        # LithoStratTreeDefItem
        migrations.AddIndex(
            model_name='lithostrattreedefitem',
            index=models.Index(
                fields=['name'],
                name='lithostratdefitem_name_idx',
            ),
        ),

        # Locality
        migrations.AddIndex(
            model_name='locality',
            index=models.Index(
                fields=['guid'],
                name='locality_guid_idx',
            ),
        ),

        # LocalityUpdateRowResult
        migrations.AddIndex(
            model_name='localityupdaterowresult',
            index=models.Index(
                fields=['rownumber'],
                name='locupdaterow_rownumber_idx',
            ),
        ),

        # MaterialSample
        migrations.AddIndex(
            model_name='materialsample',
            index=models.Index(
                fields=['guid'],
                name='materialsample_guid_idx',
            ),
        ),

        # MorphBankView
        migrations.AddIndex(
            model_name='morphbankview',
            index=models.Index(
                fields=['viewName'],
                name='morphbankview_viewname_idx',
            ),
        ),

        # OtherIdentifier
        migrations.AddIndex(
            model_name='otheridentifier',
            index=models.Index(
                fields=['identifier'],
                name='otheridentifier_identifier_idx',
            ),
        ),

        # PickList
        migrations.AddIndex(
            model_name='picklist',
            index=models.Index(
                fields=['fieldName'],
                name='picklist_fieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='picklist',
            index=models.Index(
                fields=['filterFieldName'],
                name='picklist_filterfieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='picklist',
            index=models.Index(
                fields=['tableName'],
                name='picklist_tablename_idx',
            ),
        ),

        # PreparationProperty
        migrations.AddIndex(
            model_name='preparationproperty',
            index=models.Index(
                fields=['guid'],
                name='preparationprop_guid_idx',
            ),
        ),

        # PrepType
        migrations.AddIndex(
            model_name='preptype',
            index=models.Index(
                fields=['name'],
                name='preptype_name_idx',
            ),
        ),

        # ReferenceWork
        migrations.AddIndex(
            model_name='referencework',
            index=models.Index(
                fields=['libraryNumber'],
                name='referencework_librarynumber_idx',
            ),
        ),

        # RelativeAge
        migrations.AddIndex(
            model_name='relativeage',
            index=models.Index(
                fields=['verbatimName'],
                name='relativeage_verbatimname_idx',
            ),
        ),

        # SpAuditLogField
        migrations.AddIndex(
            model_name='spauditlogfield',
            index=models.Index(
                fields=['fieldName'],
                name='spauditlogfield_fieldname_idx',
            ),
        ),

        # Spdataset (again; same as above, safe but redundant if both kept)
        # (Kept single index definition above.)

        # SpecifyUser
        migrations.AddIndex(
            model_name='specifyuser',
            index=models.Index(
                fields=['name'],
                name='specifyuser_name_idx',
            ),
        ),

        # SpExportSchema
        migrations.AddIndex(
            model_name='spexportschema',
            index=models.Index(
                fields=['schemaName'],
                name='spexportschema_schemaname_idx',
            ),
        ),

        # SpExportSchemaItem
        migrations.AddIndex(
            model_name='spexportschemaitem',
            index=models.Index(
                fields=['fieldName'],
                name='spexpschemaitem_fieldname_idx',
            ),
        ),

        # SpExportSchemaItemMapping
        migrations.AddIndex(
            model_name='spexportschemaitemmapping',
            index=models.Index(
                fields=['exportedFieldName'],
                name='spexpschemaitemmap_expfield_idx',
            ),
        ),

        # SpExportSchemaMapping
        migrations.AddIndex(
            model_name='spexportschemamapping',
            index=models.Index(
                fields=['mappingName'],
                name='spexpschemamap_mappingname_idx',
            ),
        ),

        # SpFieldValueDefault
        migrations.AddIndex(
            model_name='spfieldvaluedefault',
            index=models.Index(
                fields=['fieldName'],
                name='spfieldvaluedef_fieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='spfieldvaluedefault',
            index=models.Index(
                fields=['tableName'],
                name='spfieldvaluedef_tablename_idx',
            ),
        ),

        # LibraryRole (splibraryrole)
        migrations.AddIndex(
            model_name='libraryrole',
            index=models.Index(
                fields=['name'],
                name='libraryrole_name_idx',
            ),
        ),

        # SpLocaleContainer
        migrations.AddIndex(
            model_name='splocalecontainer',
            index=models.Index(
                fields=['pickListName'],
                name='splocalecont_picklistname_idx',
            ),
        ),

        # SpLocaleContainerItem
        migrations.AddIndex(
            model_name='splocalecontaineritem',
            index=models.Index(
                fields=['pickListName'],
                name='splocalecontitem_picklist_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='splocalecontaineritem',
            index=models.Index(
                fields=['webLinkName'],
                name='splocalecontitem_weblink_idx',
            ),
        ),

        # SpMerging
        migrations.AddIndex(
            model_name='spmerging',
            index=models.Index(
                fields=['name'],
                name='spmerging_name_idx',
            ),
        ),

        # SpPermission
        migrations.AddIndex(
            model_name='sppermission',
            index=models.Index(
                fields=['name'],
                name='sppermission_name_idx',
            ),
        ),

        # SpPrincipal
        migrations.AddIndex(
            model_name='spprincipal',
            index=models.Index(
                fields=['name'],
                name='spprincipal_name_idx',
            ),
        ),

        # SpQuery
        migrations.AddIndex(
            model_name='spquery',
            index=models.Index(
                fields=['contextName'],
                name='spquery_contextname_idx',
            ),
        ),

        # SpQueryField
        migrations.AddIndex(
            model_name='spqueryfield',
            index=models.Index(
                fields=['fieldName'],
                name='spqueryfield_fieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='spqueryfield',
            index=models.Index(
                fields=['formatName'],
                name='spqueryfield_formatname_idx',
            ),
        ),

        # Role (sprole)
        migrations.AddIndex(
            model_name='role',
            index=models.Index(
                fields=['name'],
                name='role_name_idx',
            ),
        ),

        # SpViewSetObj
        migrations.AddIndex(
            model_name='spviewsetobj',
            index=models.Index(
                fields=['fileName'],
                name='spviewsetobj_filename_idx',
            ),
        ),

        # Storage
        migrations.AddIndex(
            model_name='storage',
            index=models.Index(
                fields=['highestChildNodeNumber'],
                name='storage_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='storage',
            index=models.Index(
                fields=['nodeNumber'],
                name='storage_nodenumber_idx',
            ),
        ),

        # StorageTreeDef
        migrations.AddIndex(
            model_name='storagetreedef',
            index=models.Index(
                fields=['name'],
                name='storagetreedef_name_idx',
            ),
        ),

        # StorageTreeDefItem
        migrations.AddIndex(
            model_name='storagetreedefitem',
            index=models.Index(
                fields=['name'],
                name='storagetreedefitem_name_idx',
            ),
        ),

        # Taxon
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(
                fields=['cultivarName'],
                name='taxon_cultivarname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(
                fields=['groupNumber'],
                name='taxon_groupnumber_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(
                fields=['highestChildNodeNumber'],
                name='taxon_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(
                fields=['nodeNumber'],
                name='taxon_nodenumber_idx',
            ),
        ),

        # TaxonTreeDef
        migrations.AddIndex(
            model_name='taxontreedef',
            index=models.Index(
                fields=['name'],
                name='taxontreedef_name_idx',
            ),
        ),

        # TaxonTreeDefItem
        migrations.AddIndex(
            model_name='taxontreedefitem',
            index=models.Index(
                fields=['name'],
                name='taxontreedefitem_name_idx',
            ),
        ),

        # TectonicUnit
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(
                fields=['fullName'],
                name='tectonicunit_fullname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(
                fields=['guid'],
                name='tectonicunit_guid_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(
                fields=['highestChildNodeNumber'],
                name='tectonicunit_highchildnumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(
                fields=['name'],
                name='tectonicunit_name_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(
                fields=['nodeNumber'],
                name='tectonicunit_nodenumber_idx',
            ),
        ),

        # TectonicUnitTreeDef
        migrations.AddIndex(
            model_name='tectonicunittreedef',
            index=models.Index(
                fields=['name'],
                name='tectunitdef_name_idx',
            ),
        ),

        # TectonicUnitTreeDefItem
        migrations.AddIndex(
            model_name='tectonicunittreedefitem',
            index=models.Index(
                fields=['name'],
                name='tectunitdefitem_name_idx',
            ),
        ),

        # VoucherRelationship
        migrations.AddIndex(
            model_name='voucherrelationship',
            index=models.Index(
                fields=['voucherNumber'],
                name='voucherrel_vouchernumber_idx',
            ),
        ),
    ]