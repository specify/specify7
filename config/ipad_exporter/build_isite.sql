
DROP TABLE IF EXISTS `colobj`;
DROP TABLE IF EXISTS `locality`;
DROP TABLE IF EXISTS `taxon`;
DROP TABLE IF EXISTS `geo`;
DROP TABLE IF EXISTS `agent`;
DROP TABLE IF EXISTS `img`;
DROP TABLE IF EXISTS `stats`;
DROP TABLE IF EXISTS `litho`;
DROP TABLE IF EXISTS `paleo`;
DROP TABLE IF EXISTS `gtp`;


CREATE TABLE `taxon` (
`_id` INTEGER PRIMARY KEY, 
`FullName` TEXT,
`RankID` INTEGER,
`ParentID` INTEGER,
`FamilyID` INTEGER,
`GenusID` INTEGER,
`TotalCOCnt` INTEGER,
`NumObjs` INTEGER,
`NodeNum` INTEGER,
`HighNodeNum` INTEGER
);

CREATE TABLE `geo` (
`_id` INTEGER PRIMARY KEY, 
`FullName` TEXT,
`Name` TEXT,
`ISOCode` TEXT,
`RankID` INTEGER,
`ParentID` INTEGER,
`TotalCOCnt` INTEGER,
`NumObjs` INTEGER,
`NodeNum` INTEGER,
`HighNodeNum` INTEGER,
`ContinentId` INTEGER,
`CountryId` INTEGER,
`Latitude` REAL,
`Longitude` REAL
);

CREATE TABLE `litho` (
`_id` INTEGER PRIMARY KEY, 
`FullName` TEXT,
`RankID` INTEGER,
`ParentID` INTEGER,
`TotalCOCnt` INTEGER,
`NumObjs` INTEGER,
`NodeNum` INTEGER,
`HighNodeNum` INTEGER
);

CREATE TABLE `gtp` (
`_id` INTEGER PRIMARY KEY, 
`FullName` TEXT,
`RankID` INTEGER,
`ParentID` INTEGER,
`TotalCOCnt` INTEGER,
`NumObjs` INTEGER,
`NodeNum` INTEGER,
`HighNodeNum` INTEGER
);

CREATE TABLE `agent` (
`_id` INTEGER PRIMARY KEY,
`Name` TEXT,
`NumObjs` INTEGER
);

CREATE TABLE `img` (
`_id` INTEGER PRIMARY KEY, 
`OwnerID` INTEGER,
`TableID` INTEGER,
`ImgName` TEXT
);

CREATE TABLE `stats` (
`_id` INTEGER PRIMARY KEY, 
`Tbl` INTEGER,
`Grp` INTEGER,
`Name` TEXT,
`Descr` TEXT,
`NumObjs` INTEGER,
`RecID` INTEGER
);

CREATE TABLE `locality` (
`_id` INTEGER PRIMARY KEY,
`LocalityName` TEXT, 
`Latitude` REAL,
`Longitude` REAL,
`NumObjs` INTEGER,
`GeoID` INTEGER
);

CREATE TABLE `colobj` (
`_id` INTEGER PRIMARY KEY, 
`CatalogNumber` TEXT,
`CollectorNumber` TEXT,
`CollectedDate` DATETIME,
`CountAmt` INTEGER,
`IsMappable` INTEGER,
`HasImage` INTEGER,
`TypeStatus` INTEGER,
`TaxonID` INTEGER,
`LocID` INTEGER,
`CollectorID` INTEGER,
`CountryID` INTEGER,
`ContinentID` INTEGER,
`FamilyID` INTEGER,
`GenusID` INTEGER,
`GeoID` INTEGER,
`StateID` INTEGER
);

CREATE TABLE `paleo` (
`_id` INTEGER PRIMARY KEY,
`LithoID` INTEGER,
`ChronosID` INTEGER,
`BioStratID` INTEGER
);


CREATE TABLE "android_metadata" ("locale" TEXT DEFAULT 'en_US');
INSERT INTO "android_metadata" VALUES('en_US');
