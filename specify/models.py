# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#     * Rearrange models' order
#     * Make sure each model has one field with primary_key=True
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.

from django.db import models


class Agent(models.Model):
    agentid = models.IntegerField(primary_key=True, db_column='AgentID')
    firstname = models.CharField(max_length=150, db_column='FirstName', blank=True)
    lastname = models.CharField(max_length=384, db_column='LastName', blank=True)
    middleinitial = models.CharField(max_length=150, db_column='MiddleInitial', blank=True)
    class Meta:
        db_table = u'agent'
        ordering = ['lastname']

    def __unicode__(self):
        name = [n for n in (self.lastname, self.firstname, self.middleinitial)
                if hasattr(n, '__len__') and len(n) > 0]

        if len(name) < 1:
            return "[no name]"

        return ', '.join(name)


class Geography(models.Model):
    geographyid = models.IntegerField(primary_key=True, db_column='GeographyID')
    commonname = models.CharField(max_length=384, db_column='CommonName', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    geographycode = models.CharField(max_length=24, db_column='GeographyCode', blank=True)
    gml = models.TextField(db_column='GML', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    parent = models.ForeignKey('self', related_name='children', null=True, db_column='ParentID', blank=True)
    accepted = models.ForeignKey('self', related_name='alternatives', null=True, db_column='AcceptedID', blank=True)
    class Meta:
        db_table = u'geography'

    def __unicode__(self):
        return "%s (%s)" % (self.fullname, self.commonname)


class Locality(models.Model):
    localityid = models.IntegerField(primary_key=True, db_column='LocalityID')
    datum = models.CharField(max_length=150, db_column='Datum', blank=True)
    elevationaccuracy = models.FloatField(null=True, db_column='ElevationAccuracy', blank=True)
    elevationmethod = models.CharField(max_length=150, db_column='ElevationMethod', blank=True)
    gml = models.TextField(db_column='GML', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    lat1text = models.CharField(max_length=150, db_column='Lat1Text', blank=True)
    lat2text = models.CharField(max_length=150, db_column='Lat2Text', blank=True)
    latlongaccuracy = models.FloatField(null=True, db_column='LatLongAccuracy', blank=True)
    latlongmethod = models.CharField(max_length=150, db_column='LatLongMethod', blank=True)
    latlongtype = models.CharField(max_length=150, db_column='LatLongType', blank=True)
    latitude1 = models.DecimalField(decimal_places=10, null=True, max_digits=14, db_column='Latitude1', blank=True)
    latitude2 = models.DecimalField(decimal_places=10, null=True, max_digits=14, db_column='Latitude2', blank=True)
    localityname = models.CharField(max_length=765, db_column='LocalityName')
    long1text = models.CharField(max_length=150, db_column='Long1Text', blank=True)
    long2text = models.CharField(max_length=150, db_column='Long2Text', blank=True)
    longitude1 = models.DecimalField(decimal_places=10, null=True, max_digits=15, db_column='Longitude1', blank=True)
    longitude2 = models.DecimalField(decimal_places=10, null=True, max_digits=15, db_column='Longitude2', blank=True)
    maxelevation = models.FloatField(null=True, db_column='MaxElevation', blank=True)
    minelevation = models.FloatField(null=True, db_column='MinElevation', blank=True)
    namedplace = models.CharField(max_length=765, db_column='NamedPlace', blank=True)
    originalelevationunit = models.CharField(max_length=150, db_column='OriginalElevationUnit', blank=True)
    originallatlongunit = models.IntegerField(null=True, db_column='OriginalLatLongUnit', blank=True)
    relationtonamedplace = models.CharField(max_length=360, db_column='RelationToNamedPlace', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    shortname = models.CharField(max_length=96, db_column='ShortName', blank=True)
    srclatlongunit = models.IntegerField(db_column='SrcLatLongUnit')
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    verbatimelevation = models.CharField(max_length=150, db_column='VerbatimElevation', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    geography = models.ForeignKey(Geography, null=True, db_column='GeographyID', blank=True)
    class Meta:
        db_table = u'locality'

    def __unicode__(self):
        return self.localityname

class Collectingevent(models.Model):
    collectingeventid = models.IntegerField(primary_key=True, db_column='CollectingEventID')
    enddate = models.DateField(null=True, db_column='EndDate', blank=True)
    enddateprecision = models.IntegerField(null=True, db_column='EndDatePrecision', blank=True)
    enddateverbatim = models.CharField(max_length=150, db_column='EndDateVerbatim', blank=True)
    endtime = models.IntegerField(null=True, db_column='EndTime', blank=True)
    method = models.CharField(max_length=150, db_column='Method', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    startdate = models.DateField(null=True, db_column='StartDate', blank=True)
    startdateprecision = models.IntegerField(null=True, db_column='StartDatePrecision', blank=True)
    startdateverbatim = models.CharField(max_length=150, db_column='StartDateVerbatim', blank=True)
    starttime = models.IntegerField(null=True, db_column='StartTime', blank=True)
    stationfieldnumber = models.CharField(max_length=150, db_column='StationFieldNumber', blank=True)
    verbatimdate = models.CharField(max_length=150, db_column='VerbatimDate', blank=True)
    verbatimlocality = models.TextField(db_column='VerbatimLocality', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    locality = models.ForeignKey(Locality, null=True, db_column='LocalityID', blank=True)
    class Meta:
        db_table = u'collectingevent'

    def __unicode__(self):
        name = []
        if self.locality and len(self.locality.__unicode__()) > 0:
            name.append(self.locality.__unicode__())
        if self.verbatimlocality and len(self.verbatimlocality) > 0:
            if len(name) == 0:
                name.append(self.verbatimlocality)
            else:
                name.append('(%s)' % self.verbatimlocality)

        dates = [d.isoformat() for d in (self.startdate, self.enddate)
                 if d is not None]
        if len(dates) > 0:
            name.append(" - ".join(dates))
        if len(name) > 0:
            return " ".join(name)
        else:
            return "[no name]"

class Collector(models.Model):
    collectorid = models.IntegerField(primary_key=True, db_column='CollectorID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    agent = models.ForeignKey(Agent, db_column='AgentID')
    collectingevent = models.ForeignKey(Collectingevent, db_column='CollectingEventID')
    class Meta:
        db_table = u'collector'
        ordering = ['agent']

    def __unicode__(self):
        return self.agent.__unicode__()

class Collectionobject(models.Model):
    collectionobjectid = models.IntegerField(primary_key=True, db_column='CollectionObjectID')
    altcatalognumber = models.CharField(max_length=96, db_column='AltCatalogNumber', blank=True)
    catalognumber = models.CharField(max_length=96, db_column='CatalogNumber', blank=True)
    catalogeddate = models.DateField(null=True, db_column='CatalogedDate', blank=True)
    catalogeddateprecision = models.IntegerField(null=True, db_column='CatalogedDatePrecision', blank=True)
    catalogeddateverbatim = models.CharField(max_length=96, db_column='CatalogedDateVerbatim', blank=True)
    description = models.CharField(max_length=765, db_column='Description', blank=True)
    fieldnumber = models.CharField(max_length=150, db_column='FieldNumber', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    inventorydate = models.DateField(null=True, db_column='InventoryDate', blank=True)
    modifier = models.CharField(max_length=150, db_column='Modifier', blank=True)
    name = models.CharField(max_length=192, db_column='Name', blank=True)
    notifications = models.CharField(max_length=96, db_column='Notifications', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    objectcondition = models.CharField(max_length=192, db_column='ObjectCondition', blank=True)
    projectnumber = models.CharField(max_length=192, db_column='ProjectNumber', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    restrictions = models.CharField(max_length=96, db_column='Restrictions', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    totalvalue = models.DecimalField(decimal_places=2, null=True, max_digits=14, db_column='TotalValue', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    collectingevent = models.ForeignKey(Collectingevent, null=True, db_column='CollectingEventID', blank=True)
    class Meta:
        db_table = u'collectionobject'
        ordering = ['catalognumber']

    def __unicode__(self):
        return self.catalognumber

class Taxon(models.Model):
    taxonid = models.IntegerField(primary_key=True, db_column='TaxonID')
    author = models.CharField(max_length=384, db_column='Author', blank=True)
    citesstatus = models.CharField(max_length=96, db_column='CitesStatus', blank=True)
    colstatus = models.CharField(max_length=96, db_column='COLStatus', blank=True)
    commonname = models.CharField(max_length=384, db_column='CommonName', blank=True)
    cultivarname = models.CharField(max_length=96, db_column='CultivarName', blank=True)
    environmentalprotectionstatus = models.CharField(max_length=192, db_column='EnvironmentalProtectionStatus', blank=True)
    esastatus = models.CharField(max_length=192, db_column='EsaStatus', blank=True)
    fullname = models.CharField(max_length=765, db_column='FullName', blank=True)
    groupnumber = models.CharField(max_length=60, db_column='GroupNumber', blank=True)
    guid = models.CharField(max_length=384, db_column='GUID', blank=True)
    highestchildnodenumber = models.IntegerField(null=True, db_column='HighestChildNodeNumber', blank=True)
    isisnumber = models.CharField(max_length=48, db_column='IsisNumber', blank=True)
    labelformat = models.CharField(max_length=192, db_column='LabelFormat', blank=True)
    name = models.CharField(max_length=192, db_column='Name')
    ncbitaxonnumber = models.CharField(max_length=24, db_column='NcbiTaxonNumber', blank=True)
    nodenumber = models.IntegerField(null=True, db_column='NodeNumber', blank=True)
    number1 = models.IntegerField(null=True, db_column='Number1', blank=True)
    number2 = models.IntegerField(null=True, db_column='Number2', blank=True)
    rankid = models.IntegerField(db_column='RankID')
    remarks = models.TextField(db_column='Remarks', blank=True)
    source = models.CharField(max_length=192, db_column='Source', blank=True)
    taxonomicserialnumber = models.CharField(max_length=150, db_column='TaxonomicSerialNumber', blank=True)
    text1 = models.CharField(max_length=96, db_column='Text1', blank=True)
    text2 = models.CharField(max_length=96, db_column='Text2', blank=True)
    unitind1 = models.CharField(max_length=150, db_column='UnitInd1', blank=True)
    unitind2 = models.CharField(max_length=150, db_column='UnitInd2', blank=True)
    unitind3 = models.CharField(max_length=150, db_column='UnitInd3', blank=True)
    unitind4 = models.CharField(max_length=150, db_column='UnitInd4', blank=True)
    unitname1 = models.CharField(max_length=150, db_column='UnitName1', blank=True)
    unitname2 = models.CharField(max_length=150, db_column='UnitName2', blank=True)
    unitname3 = models.CharField(max_length=150, db_column='UnitName3', blank=True)
    unitname4 = models.CharField(max_length=150, db_column='UnitName4', blank=True)
    usfwscode = models.CharField(max_length=48, db_column='UsfwsCode', blank=True)
    visibility = models.IntegerField(null=True, db_column='Visibility', blank=True)
    accepted = models.ForeignKey('self', related_name='alternatives', null=True, db_column='AcceptedID', blank=True)
    parent = models.ForeignKey('self', related_name='children', null=True, db_column='ParentID', blank=True)
    class Meta:
        db_table = u'taxon'
        ordering = ['fullname']

    def __unicode__(self):
        name = [self.fullname]
        if self.commonname and len(self.commonname) > 0:
            name.append("(%s)" % self.commonname)
        return " ".join(name)

class Determination(models.Model):
    determinationid = models.IntegerField(primary_key=True, db_column='DeterminationID')
    addendum = models.CharField(max_length=48, db_column='Addendum', blank=True)
    alternatename = models.CharField(max_length=384, db_column='AlternateName', blank=True)
    confidence = models.CharField(max_length=150, db_column='Confidence', blank=True)
    determineddate = models.DateField(null=True, db_column='DeterminedDate', blank=True)
    determineddateprecision = models.IntegerField(null=True, db_column='DeterminedDatePrecision', blank=True)
    featureorbasis = models.CharField(max_length=150, db_column='FeatureOrBasis', blank=True)
    method = models.CharField(max_length=150, db_column='Method', blank=True)
    nameusage = models.CharField(max_length=192, db_column='NameUsage', blank=True)
    number1 = models.FloatField(null=True, db_column='Number1', blank=True)
    number2 = models.FloatField(null=True, db_column='Number2', blank=True)
    qualifier = models.CharField(max_length=48, db_column='Qualifier', blank=True)
    varqualifer = models.CharField(max_length=48, db_column='VarQualifer', blank=True)
    remarks = models.TextField(db_column='Remarks', blank=True)
    subspqualifier = models.CharField(max_length=48, db_column='SubSpQualifier', blank=True)
    text1 = models.TextField(db_column='Text1', blank=True)
    text2 = models.TextField(db_column='Text2', blank=True)
    typestatusname = models.CharField(max_length=150, db_column='TypeStatusName', blank=True)
    varqualifier = models.CharField(max_length=48, db_column='VarQualifier', blank=True)
    taxon = models.ForeignKey(Taxon, null=True, db_column='TaxonID', blank=True)
    preferredtaxon = models.ForeignKey(Taxon, related_name='preferred_taxon_for', null=True, db_column='PreferredTaxonID', blank=True)
    determiner = models.ForeignKey(Agent, null=True, db_column='DeterminerID', blank=True)
    collectionobject = models.ForeignKey(Collectionobject, db_column='CollectionObjectID')
    class Meta:
        db_table = u'determination'
        ordering = ['taxon']

    def __unicode__(self):
        taxon_objs = (self.taxon, self.preferredtaxon)
        if taxon_objs[0] == taxon_objs[1]:
            # preferred is the same as regular
            taxon_objs = (self.taxon, )

        taxons = filter(
            lambda s: len(s) > 0,
            [t.__unicode__() for t in taxon_objs
             if t is not None])

        if len(taxons) == 2:
            return "%s (preferred: %s)" % tuple(taxons)
        if len(taxons) == 1:
            return taxons[0]
        return "[no taxon]"
