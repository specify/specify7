DROP TABLE IF EXISTS `ios_colobjagents`;
CREATE TABLE `ios_colobjagents` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_colobjagents` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_colobjcnts`;
CREATE TABLE `ios_colobjcnts` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_colobjcnts` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_colobjgeo`;
CREATE TABLE `ios_colobjgeo` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_colobjgeos` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_geogeo_cnt`;
CREATE TABLE `ios_geogeo_cnt` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_geogeo_cnt` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_geogeo_cty`;
CREATE TABLE `ios_geogeo_cty` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_geogeo_cty` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_geoloc`;
CREATE TABLE `ios_geoloc` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_geoloc` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_geoloc_cnt`;
CREATE TABLE `ios_geoloc_cnt` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_geoloc_cnt` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_geoloc_cty`;
CREATE TABLE `ios_geoloc_cty` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_geoloc_cty` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_taxon_pid`;
CREATE TABLE `ios_taxon_pid` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_taxon_pid` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_colobjlitho`;
CREATE TABLE `ios_colobjlitho` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_colobjlitho` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_colobjbio`;
CREATE TABLE `ios_colobjbio` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_colobjbio` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `ios_colobjchron`;
CREATE TABLE `ios_colobjchron` (
  `OldID` int(11) NOT NULL DEFAULT '0',
  `NewID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`OldID`),
  KEY `INX_ios_colobjchron` (`NewID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;