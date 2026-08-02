# -*- coding: utf-8 -*-
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('specify', '0044_alter_deletion_cascade'),
    ]

    operations = [
        # Agentidentifier
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
                fields=['identifiertype'],
                name='agid_identifiertype_idx',
            ),
        ),

        # Agentspecialty
        migrations.AddIndex(
            model_name='agentspecialty',
            index=models.Index(
                fields=['ordernumber'],
                name='agentspecialty_ordernumber_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='agentspecialty',
            index=models.Index(
                fields=['specialtyname'],
                name='agsp_specialtyname_idx',
            ),
        ),

        # Agentvariant
        migrations.AddIndex(
            model_name='agentvariant',
            index=models.Index(
                fields=['name'],
                name='agentvariant_name_idx',
            ),
        ),

        # Attachmentmetadata
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
                fields=['ordernumber'],
                name='author_ordernumber_idx',
            ),
        ),

        # Collectionobject
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
                fields=['projectnumber'],
                name='colobj_projectnumber_idx',
            ),
        ),

        # Collectionobjectproperty
        migrations.AddIndex(
            model_name='collectionobjectproperty',
            index=models.Index(
                fields=['guid'],
                name='collectionobjectprop_guid_idx',
            ),
        ),

        # Collectionreltype
        migrations.AddIndex(
            model_name='collectionreltype',
            index=models.Index(
                fields=['name'],
                name='collectionreltype_name_idx',
            ),
        ),

        # Exchangein
        migrations.AddIndex(
            model_name='exchangein',
            index=models.Index(
                fields=['exchangeinnumber'],
                name='exchin_exchinnum_idx',
            ),
        ),

        # Exsiccataitem
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
                fields=['commonname'],
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
                fields=['highestchildnodenumber'],
                name='geography_hchnodenum_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='geography',
            index=models.Index(
                fields=['nodenumber'],
                name='geography_nodenumber_idx',
            ),
        ),

        # Geographytreedef
        migrations.AddIndex(
            model_name='geographytreedef',
            index=models.Index(
                fields=['name'],
                name='geographytreedef_name_idx',
            ),
        ),

        # Geographytreedefitem
        migrations.AddIndex(
            model_name='geographytreedefitem',
            index=models.Index(
                fields=['name'],
                name='geogtreedefitem_name_idx',
            ),
        ),

        # Geologictimeperiod
        migrations.AddIndex(
            model_name='geologictimeperiod',
            index=models.Index(
                fields=['highestchildnodenumber'],
                name='geotime_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='geologictimeperiod',
            index=models.Index(
                fields=['nodenumber'],
                name='geotime_nodenumber_idx',
            ),
        ),

        # Geologictimeperiodtreedef
        migrations.AddIndex(
            model_name='geologictimeperiodtreedef',
            index=models.Index(
                fields=['name'],
                name='geotimetreedef_name_idx',
            ),
        ),

        # Geologictimeperiodtreedefitem
        migrations.AddIndex(
            model_name='geologictimeperiodtreedefitem',
            index=models.Index(
                fields=['name'],
                name='geotimetreedefitem_name_idx',
            ),
        ),

        # Institutionnetwork
        migrations.AddIndex(
            model_name='institutionnetwork',
            index=models.Index(
                fields=['altname'],
                name='institutionnetwork_altname_idx',
            ),
        ),

        # Latlonpolygon
        migrations.AddIndex(
            model_name='latlonpolygon',
            index=models.Index(
                fields=['name'],
                name='latlonpolygon_name_idx',
            ),
        ),

        # Lithostrat
        migrations.AddIndex(
            model_name='lithostrat',
            index=models.Index(
                fields=['highestchildnodenumber'],
                name='lithostrat_hchnode_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='lithostrat',
            index=models.Index(
                fields=['nodenumber'],
                name='lithostrat_nodenumber_idx',
            ),
        ),

        # Lithostrattreedef
        migrations.AddIndex(
            model_name='lithostrattreedef',
            index=models.Index(
                fields=['name'],
                name='lithostratdef_name_idx',
            ),
        ),

        # Lithostrattreedefitem
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

        # Materialsample
        migrations.AddIndex(
            model_name='materialsample',
            index=models.Index(
                fields=['guid'],
                name='materialsample_guid_idx',
            ),
        ),

        # Morphbankview
        migrations.AddIndex(
            model_name='morphbankview',
            index=models.Index(
                fields=['viewname'],
                name='morphbankview_viewname_idx',
            ),
        ),

        # Otheridentifier
        migrations.AddIndex(
            model_name='otheridentifier',
            index=models.Index(
                fields=['identifier'],
                name='otheridentifier_identifier_idx',
            ),
        ),

        # Picklist
        migrations.AddIndex(
            model_name='picklist',
            index=models.Index(
                fields=['fieldname'],
                name='picklist_fieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='picklist',
            index=models.Index(
                fields=['filterfieldname'],
                name='picklist_filterfieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='picklist',
            index=models.Index(
                fields=['tablename'],
                name='picklist_tablename_idx',
            ),
        ),

        # Preptype
        migrations.AddIndex(
            model_name='preptype',
            index=models.Index(
                fields=['name'],
                name='preptype_name_idx',
            ),
        ),

        # Preparationproperty
        migrations.AddIndex(
            model_name='preparationproperty',
            index=models.Index(
                fields=['guid'],
                name='preparationprop_guid_idx',
            ),
        ),

        # Referencework
        migrations.AddIndex(
            model_name='referencework',
            index=models.Index(
                fields=['librarynumber'],
                name='refwork_librarynum_idx',
            ),
        ),

        # Spauditlogfield
        migrations.AddIndex(
            model_name='spauditlogfield',
            index=models.Index(
                fields=['fieldname'],
                name='spauditlogfield_fieldname_idx',
            ),
        ),

        # Spexportschema
        migrations.AddIndex(
            model_name='spexportschema',
            index=models.Index(
                fields=['schemaname'],
                name='spexportschema_schemaname_idx',
            ),
        ),

        # Spexportschemaitem
        migrations.AddIndex(
            model_name='spexportschemaitem',
            index=models.Index(
                fields=['fieldname'],
                name='spexpschemaitem_fieldname_idx',
            ),
        ),

        # Spexportschemaitemmapping
        migrations.AddIndex(
            model_name='spexportschemaitemmapping',
            index=models.Index(
                fields=['exportedfieldname'],
                name='spexpitemmap_expfld_idx',
            ),
        ),

        # Spexportschemamapping
        migrations.AddIndex(
            model_name='spexportschemamapping',
            index=models.Index(
                fields=['mappingname'],
                name='spexpschemamap_mappingname_idx',
            ),
        ),

        # Spfieldvaluedefault
        migrations.AddIndex(
            model_name='spfieldvaluedefault',
            index=models.Index(
                fields=['fieldname'],
                name='spfieldvaluedef_fieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='spfieldvaluedefault',
            index=models.Index(
                fields=['tablename'],
                name='spfieldvaluedef_tablename_idx',
            ),
        ),

        # Splocalecontainer
        migrations.AddIndex(
            model_name='splocalecontainer',
            index=models.Index(
                fields=['picklistname'],
                name='splocalecont_picklistname_idx',
            ),
        ),

        # Splocalecontaineritem
        migrations.AddIndex(
            model_name='splocalecontaineritem',
            index=models.Index(
                fields=['picklistname'],
                name='splocalecontitem_picklist_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='splocalecontaineritem',
            index=models.Index(
                fields=['weblinkname'],
                name='splocalecontitem_weblink_idx',
            ),
        ),

        # Sppermission
        migrations.AddIndex(
            model_name='sppermission',
            index=models.Index(
                fields=['name'],
                name='sppermission_name_idx',
            ),
        ),

        # Spprincipal
        migrations.AddIndex(
            model_name='spprincipal',
            index=models.Index(
                fields=['name'],
                name='spprincipal_name_idx',
            ),
        ),

        # Spquery
        migrations.AddIndex(
            model_name='spquery',
            index=models.Index(
                fields=['contextname'],
                name='spquery_contextname_idx',
            ),
        ),

        # Spqueryfield
        migrations.AddIndex(
            model_name='spqueryfield',
            index=models.Index(
                fields=['fieldname'],
                name='spqueryfield_fieldname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='spqueryfield',
            index=models.Index(
                fields=['formatname'],
                name='spqueryfield_formatname_idx',
            ),
        ),

        # Spviewsetobj
        migrations.AddIndex(
            model_name='spviewsetobj',
            index=models.Index(
                fields=['filename'],
                name='spviewsetobj_filename_idx',
            ),
        ),

        # Specifyuser
        migrations.AddIndex(
            model_name='specifyuser',
            index=models.Index(
                fields=['name'],
                name='specifyuser_name_idx',
            ),
        ),

        # Storage
        migrations.AddIndex(
            model_name='storage',
            index=models.Index(
                fields=['highestchildnodenumber'],
                name='storage_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='storage',
            index=models.Index(
                fields=['nodenumber'],
                name='storage_nodenumber_idx',
            ),
        ),

        # Storagetreedef
        migrations.AddIndex(
            model_name='storagetreedef',
            index=models.Index(
                fields=['name'],
                name='storagetreedef_name_idx',
            ),
        ),

        # Storagetreedefitem
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
                fields=['cultivarname'],
                name='taxon_cultivarname_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(
                fields=['groupnumber'],
                name='taxon_groupnumber_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(
                fields=['highestchildnodenumber'],
                name='taxon_highchildnodenumb_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='taxon',
            index=models.Index(
                fields=['nodenumber'],
                name='taxon_nodenumber_idx',
            ),
        ),

        # Taxontreedef
        migrations.AddIndex(
            model_name='taxontreedef',
            index=models.Index(
                fields=['name'],
                name='taxontreedef_name_idx',
            ),
        ),

        # Taxontreedefitem
        migrations.AddIndex(
            model_name='taxontreedefitem',
            index=models.Index(
                fields=['name'],
                name='taxontreedefitem_name_idx',
            ),
        ),

        # Voucherrelationship
        migrations.AddIndex(
            model_name='voucherrelationship',
            index=models.Index(
                fields=['vouchernumber'],
                name='voucherrel_vouchernumber_idx',
            ),
        ),

        # Collectionobjecttype
        migrations.AddIndex(
            model_name='collectionobjecttype',
            index=models.Index(
                fields=['name'],
                name='collectionobjecttype_name_idx',
            ),
        ),

        # Collectionobjectgrouptype
        migrations.AddIndex(
            model_name='collectionobjectgrouptype',
            index=models.Index(
                fields=['name'],
                name='colobjgrouptype_name_idx',
            ),
        ),

        # Collectionobjectgroup
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

        # Tectonicunittreedef
        migrations.AddIndex(
            model_name='tectonicunittreedef',
            index=models.Index(
                fields=['name'],
                name='tectunitdef_name_idx',
            ),
        ),

        # Tectonicunittreedefitem
        migrations.AddIndex(
            model_name='tectonicunittreedefitem',
            index=models.Index(
                fields=['name'],
                name='tectunitdefitem_name_idx',
            ),
        ),

        # Tectonicunit
        migrations.AddIndex(
            model_name='tectonicunit',
            index=models.Index(
                fields=['fullname'],
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
                fields=['highestchildnodenumber'],
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
                fields=['nodenumber'],
                name='tectonicunit_nodenumber_idx',
            ),
        ),
    ]
