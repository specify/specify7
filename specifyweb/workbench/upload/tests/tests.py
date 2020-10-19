
import io
import csv
from unittest import skip
from datetime import datetime
from decimal import Decimal

from specifyweb.specify.tree_extras import validate_tree_numbering

from ..data import Uploaded, UploadResult, Matched, Exclude, FailedBusinessRule, ReportInfo
from ..upload_table import UploadTable, to_many_filters_and_excludes, BoundUploadTable
from ..treerecord import TreeRecord, TreeDefItemWithValue, TreeMatchResult
from ..upload import do_upload_csv

from .base import UploadTestsBase, get_table


class UploadTests(UploadTestsBase):

    def test_filter_to_many_single(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date,Country,Date Collected,Start Date Collected,End Date Collected,Collection Method,Prep Type 1,Accession No.,Remarks,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Site
59583,Gastropoda,Siphonarioidea,Siphonariidae,Williamia,,krebsii,,"(Mörch, 1877)",,,Colin,,Redfern,00/09/2014,Bahamas,01 FEB 1977,01 FEB 1977,,,Dry,720,"BS1 fig. 763A, BS2 fig. 896A",CR,21/09/2014,26° 00' N,,77° 24' W,,Point,CR99,,Colin,,Redfern,,,,,
'''))
        row = next(reader)
        assert isinstance(self.example_plan.toOne['collectingevent'], UploadTable)
        uploadable = self.example_plan.toOne['collectingevent'].bind(self.collection, row)
        assert isinstance(uploadable, BoundUploadTable)
        filters, excludes = to_many_filters_and_excludes(uploadable.toMany)
        self.assertEqual(filters, [{
            'collectors__agent__agenttype': 1,
            'collectors__agent__firstname': 'Colin',
            'collectors__agent__lastname': 'Redfern',
            'collectors__agent__middleinitial': None,
            'collectors__agent__title': None,
            'collectors__agent__division_id': self.division.id,
            'collectors__division_id': self.division.id,
            'collectors__isprimary': True,
            'collectors__ordernumber': 0}])

        self.assertEqual(
            excludes,
            [Exclude(lookup='collectors__in', table='Collector', filter={'isprimary': False, 'ordernumber': 1, 'division_id': self.division.id})])

    def test_filter_multiple_to_many(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1378,Gastropoda,Rissooidea,Rissoinidae,Rissoina,,delicatissima,,"Raines, 2002",,B. Raines,,B.,,Raines,Nov 2003,00/11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakena",,SE Pacific O.,Apr 1998,00/04/1998,,,,2,0,0,Dry; shell,Dry,,,In sand at base of cliffs,10,20,0,,,Paratype,512,," PARATYPES.  In pouch no. 1, paratypes 4 & 5.  Raines, B.K. 2002.  La Conchiglia 34 ( no. 304) : 16 (holotype LACM 2934, Fig. 9).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,109° 19' 45' W,,Point,,JSG,23/12/2014,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
'''))
        row = next(reader)
        assert isinstance(self.example_plan.toOne['collectingevent'], UploadTable)
        uploadable = self.example_plan.toOne['collectingevent'].bind(self.collection, row)
        assert isinstance(uploadable, BoundUploadTable)
        filters, excludes = to_many_filters_and_excludes(uploadable.toMany)
        self.assertEqual(filters, [
            {'collectors__agent__agenttype': 1,
             'collectors__agent__firstname': 'B.',
             'collectors__agent__lastname': 'Raines',
             'collectors__agent__middleinitial': None,
             'collectors__agent__title': None,
             'collectors__agent__division_id': self.division.id,
             'collectors__division_id': self.division.id,
             'collectors__isprimary': True,
             'collectors__ordernumber': 0},
            {'collectors__agent__agenttype': 1,
             'collectors__agent__firstname': 'M.',
             'collectors__agent__lastname': 'Taylor',
             'collectors__agent__middleinitial': None,
             'collectors__agent__title': None,
             'collectors__agent__division_id': self.division.id,
             'collectors__division_id': self.division.id,
             'collectors__isprimary': False,
             'collectors__ordernumber': 1}])

        self.assertEqual(excludes, [])


    def test_1(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1365,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,6,0,0,Dry; shell,Dry,,,,71,74,0,,,,313,,Dredged,JSG,MJP,22/01/2003,28° 03.44' N,,92° 26.98' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1366,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,3,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1367,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1368,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,tuberculosa,,"Libassi, 1859",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,11,0,0,Dry; shell,Dry,,,"Subtidal 65-91 m, in coralline [sand]",65,91,0,,,,313,,Dredged.  Original label no. 23331.,JSG,MJP,22/01/2003,27° 59.14' N,,91° 38.83' W,,Point,D-4(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1373,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,4,0,0,Dry; shell,Dry,,,"Subtidal, offshore",55,65,0,,,,313,,"Taken at night, dredged.  Original label no. 19782",JSG,MJP,22/01/2003,27° 48.7' N,,93° 2.88' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1374,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,2,0,0,Dry; shell,Dry,,,"Subtidal, offshore, in coralline [sand]",,,0,,,,313,,Dredged. Original label no. 23337,JSG,MJP,22/01/2003,27° 59.1' N,,91° 38.8' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1375,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,2,0,0,Dry; shell,Dry,,,"Subtidal, offshore",55,65,0,,,,313,,"Taken at night, dredged. Original label no. 19786.",JSG,MJP,22/01/2003,27° 48.7' N,,93° 2.88' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1378,Gastropoda,Rissooidea,Rissoinidae,Rissoina,,delicatissima,,"Raines, 2002",,B. Raines,,B.,,Raines,Nov 2003,00/11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakena",,SE Pacific O.,Apr 1998,00/04/1998,,,,2,0,0,Dry; shell,Dry,,,In sand at base of cliffs,10,20,0,,,Paratype,512,," PARATYPES.  In pouch no. 1, paratypes 4 & 5.  Raines, B.K. 2002.  La Conchiglia 34 ( no. 304) : 16 (holotype LACM 2934, Fig. 9).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,109° 19' 45' W,,Point,,JSG,23/12/2014,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1380,Gastropoda,Cerithioidea,Pickworthiidae,Clatrosansonia,,circumserrata,,"(Raines, 2002)",,,,,,,,,,CHILE,,Easter Island [= Isla de Pascua],"Off Hanga-Teo, on N. coast",,SE Pacific O.,Dec 2000,00/12/2000,,,,1,0,0,Dry; shell,Dry,,,"Subtidal, in silty mud in a cave",15,,0,,,Paratype,512,,"PARATYPE. In pouch # 3, paratype # 3. Raines, B.K. 2002.  La Conchiglia 34 ( no 304); 18-19 (holotype LACM 2938, fig 13).",JSG,MJP,07/01/2004,27° 03' 37'' S,,109° 21' 58' W,,Point,,JSG,02/02/2017,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1381,Gastropoda,Velutinoidea,Triviidae,Hespererato,,rehderi,,"(Raines, 2002)",,,,,,,,,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakean",,SE Pacific O.,Apr 1998,00/04/1998,,,,1,0,0,Dry; shell,Dry,,,"In sand, along base of cliff",10,20,0,,,Paratype,512,,"PARATYPE. In pouch # 4 paratype # 3.  Dead collected in sand along base of cliffs.  Informally (in litt.. 28 Nov 2003) Raines expressed intent to reclassify species in genus `Hespererato' Raines, B.K. 2002.  La Conchiglia 34 (no. 304); 22-23 (holotype LAC",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,08/03/2017,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1382,Gastropoda,Buccinoidea,Columbellidae,Zafra,,rapanuiensis,,"Raines, 2002",,B. Raines,,B.,,Raines,Nov 2003,00/11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakean",,SE Pacific O.,Apr 1998,00/04/1998,,,,1,0,0,Dry; shell,Dry,,,"In sand, along base of cliff",10,20,0,,,Paratype,512,,"PARATYPE. In pouch # 5, paratype #3. La Conchiglia 34 (no. 304): 24-25 (holotype LACM 2942, fig 23.",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,22/04/2008,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1383,Scaphopoda,,Gadilidae,Dischides,,splendens,,"Raines, 2002",,,,,,, , ,,CHILE,,Atacama region,Near Tahai,,SE Pacific O.,Dec 2000,00/12/2000,,,,2,0,0,Dry; shell,Dry,,,In sandy mud,50,80,0,,,Paratype,512,,"PARATYPE. In pouch # 6, paratypes 4 & 5.  Dredged. La Conchiglia 34 (no. 304): 37-38 (holotype LACM 2949, fig 47).",JSG,MJP,07/01/2004,"27° 07' 20"" S",,"109° 26' 30"" W",,Point,,JSG,16/05/2013,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1384,Gastropoda,Acteonoidea,Acteonidae,Pupa,,pascuana,,"Raines, 2003",,B. Raines,,B.,,Raines,Nov 2003,00/11/2003,,CHILE,,Atacama region,Near Tahai,,SE Pacific O.,Dec 2000,00/12/2000,,,,2,0,0,Dry; shell,Dry,,,In fine sand,30,50,0,,,Paratype,512,,"PARATYPE. In pouch # 7, paratype 1 [ 2 specimens deposited, but letter & paper mention only one paratype for BMSM]. Dredged. La Conchiglia 34 (no. 305: 51-53 (holotype LACM 2954, figs 1,2).",JSG,MJP,07/01/2004,"27° 07' 20"" S",,"109° 26' 30"" W",,Point,,JSG,16/05/2013,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1385,Gastropoda,Vanikoroidea,Eulimidae,Sticteulima,,plenicolora,,"Raines, 2003",,B. Raines,,B.,,Raines,Nov 2003,00/11/2003,,CHILE,,Easter Island [= Isla de Pascua],Hanga Nui,,SE Pacific O.,Apr 1998,00/04/1998,,,,2,0,0,Dry; shell,Dry,,,"In sand, in tidepools",0,,0,,,Paratype,512,,"PARATYPE. In pouch # 8, paratypes 4 & 5.  Taken in sand collected from tidepools. La Conchiglia 34 (no. 305): 43-46 (holotype LACM 2955, fig 3).",JSG,MJP,07/01/2004,"27° 07' 46"" S",,"109° 16' 35"" W",,Point,,JSG,16/05/2013,0,Marine,0,B. Raines and M. Taylor,,B.,,Raines,,M.,,Taylor,,,,,,,,
1386,Gastropoda,Vanikoroidea,Eulimidae,Subniso,,osorioae,,"Raines, 2003",,B. Raines,,B.,,Raines,Nov 2003,00/11/2003,,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E of Anakena",,SE Pacific O.,Apr 1998,00/04/1998,,,,2,0,0,Dry; shell,Dry,,,"In sand & rubble, along base of cliffs",10,20,0,,,Paratype,512,,"PARATYPES. In pouch # 9, paratypes 4 & 5.  La Conchiglia 34 (no. 305): 46-47 (holotype LACM 2957, fig. 5a, b).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,28/05/2013,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1387,Gastropoda,Vanikoroidea,Eulimidae,Hemiliostraca,,clarimaculosa,,"(Raines, 2003)",,B. Raines,,B.,,Raines,Nov 2003,00/11/2003,cf.,CHILE,,Easter Island [= Isla de Pascua],"Off Punta Rosalia, E pf Anakena",,SE Pacific O.,Apr 1998,00/04/1998,,,,2,0,0,Dry; shell,Dry,,,"In sand & rubble, along base of cliffs",10,20,0,,,Paratype,512,,"PARATYPES. In pouch # 10, paratypes 4 & 5.  La Conchiglia 34 (no. 305): 47-48 (holotype LACM 2959, fig. 6).",JSG,MJP,07/01/2004,"27° 04' 18"" S",,"109° 19' 45"" W",,Point,,JSG,12/01/2017,0,Marine,0,B. Raines,,B.,,Raines,,,,,,,,,,,,
1906,Gastropoda,Pleurotomarioidea,Pleurotomariidae,Perotrochus,,maureri,,"Harasewych & Askew, 1993",,,,,,, , ,,USA,SOUTH CAROLINA,,90 mi east of Charleston,,NW Atlantic O.,4 May 1987,4 May 1987,,,,1,1,0,Dry; shell,Dry,,,Deep water; water temperature 9.7° C,195,204,0,,,,461,,"Topotype, but no evidence that it is a paratype.  Received in exchange from U.S. Nat'l. Mus (1993) for a specimen from the BMSM that was taken off Jacksonville, FL, in 200 fms (366 m)",HEP,JSG,22/10/1997,"32° 43' 57"" N",,"78° 05' 41"" W",,Point,,,,0,Marine,0,Johnson Sealink (Submersible),,Johnson,,Sealink,,,,,,,,,,,,
5009,Gastropoda,Muricoidea,Volutidae,Scaphella,,floridana,,"(Heilprin, 1886)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1980,1980,,,,2,0,0,Dry; shell,Dry,,,,,,1,,U/Juv,,340,,Spoil banks.,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,JHL,25/05/2016,0,Marine,0,M. Palmer,,M.,,Palmer,,,,,,,,,,,,
5033,Gastropoda,Stromboidea,Strombidae,Lobatus,,leidyi,,"(Heilprin, 1887)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,8 Sep 1973,8 Sep 1973,,,,8,0,0,Dry; shell,Dry,,,,,,1,"Caloosahatchee,Pinecrest Unit #4",U/Juv,,241,,,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
5035,Gastropoda,Stromboidea,Strombidae,Lobatus,,leidyi,,"(Heilprin, 1887)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1971,1971,,,,4,0,0,Dry; shell,Dry,,,,,,1,,U/Ad & Juv,,241,,"3 Adults, 1 Juvenile",LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
5043,Gastropoda,Stromboidea,Strombidae,Lobatus,,mayacensis,,"(Tucker & Wilson, 1933)",,D. Hargreave,,D.,,Hargreave, , ,aff.,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1977,1977,,,,1,0,0,Dry; shell,Dry,,,,,,1,,,,241,,,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
5081,Gastropoda,Stromboidea,Strombidae,Strombus,,evergladesensis,,"Petuch, 1991",,D. Hargreave,,D.,,Hargreave, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,1977,1977,,,,1,0,0,Dry; shell,Dry,,,,,,1,,,,150,,Collected from 1977-1978.,LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,18/06/2016,0,Marine,0,G. Moller,,G.,,Moller,,,,,,,,,,,,
5083,Gastropoda,Stromboidea,Strombidae,Strombus,,evergladesensis,,"Petuch, 1991",,D. Hargreave,,D.,,Hargreave, , ,cf.,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,,,,1,,,,23,,"ID uncertain, either 'evergladesensis' or 'sarasotaensis'",LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,18/06/2016,0,Marine,0,L. Weddle,,L.,,Weddle,,,,,,,,,,,,
5091,Gastropoda,Muricoidea,Marginellidae,Prunum,,donovani,,"(Olsson, 1967)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,Date unk'n,,,,,2,0,0,Dry; shell,Dry,,,,,,1,,,,150,,,LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,25/10/2016,0,Marine,0,G. Moller,,G.,,Moller,,,,,,,,,,,,
5097,Gastropoda,Muricoidea,Marginellidae,Prunum,,onchidella,,"(Dall, 1890)",,,,,,,,,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Route 80, W of LaBelle",,North America,1972,1972,,,,10,0,0,Dry; shell,Dry,,,,,,1,,,,241,,Taken from spoil from 1972-1975.,LWD,MJP,03/12/1997,26° 44.099' N,,81° 29.027' W,,Point,,,16/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
'''))
        upload_results = do_upload_csv(self.collection, reader, self.example_plan)
        uploaded_catnos = []
        for r in upload_results:
            self.assertIsInstance(r.record_result, Uploaded)
            co = get_table('Collectionobject').objects.get(id=r.record_result.get_id())
            uploaded_catnos.append(co.catalognumber)

        # Check that collection objects were uploaded.
        expected_cats = [
            n.zfill(9) for n in
            "1365 1366 1367 1368 1373 1374 1375 1378 1380 1381 1382 1383 1384 1385 1386 1387 1906 5009 5033 5035 5043 5081 5083 5091 5097".split()
        ]
        self.assertEqual(uploaded_catnos, expected_cats)

        cos = get_table('Collectionobject').objects.filter(catalognumber__in=expected_cats)
        self.assertEqual(cos.count(), len(expected_cats))

        # Check that only one copy of a given agent/collectingevent was uploaded.
        self.assertEqual(get_table('Agent').objects.filter(lastname="Garcia").count(), 1)
        self.assertEqual(get_table('Collectingevent').objects.filter(stationfieldnumber="D-7(1)").count(), 1)

        # Check which collectingevents got uploaded for some cases.
        self.assertEqual(get_table('Collectionobject').objects.get(catalognumber="000001365").collectingevent.stationfieldnumber, None)
        self.assertEqual(
            set(ce.stationfieldnumber for ce in get_table('Collectingevent').objects.filter(collectors__agent__lastname="Garcia")),
            set([None, "D-7(1)", "D-4(1)"]))

        # Check the collectors for some collection objects.
        self.assertEqual(
            [c.agent.lastname for c in get_table('Collectionobject').objects.get(catalognumber="000001378").collectingevent.collectors.order_by("ordernumber")],
            ["Raines", "Taylor"])

        self.assertEqual(
            [c.agent.lastname for c in get_table('Collectionobject').objects.get(catalognumber="000001380").collectingevent.collectors.order_by("ordernumber")],
            ["Raines"])

        self.assertEqual(
            set(co.collectingevent.collectors.get(ordernumber=0).agent.lastname for co in cos),
            set(('Raines', 'Palmer', 'Weddle', 'Buffington', 'Garcia', 'Sealink', 'Moller')))

        # Check that localities got uploaded.
        self.assertEqual(
            set((l.localityname, l.latitude1, l.lat1text, l.longitude1, l.long1text)
                for l in [co.collectingevent.locality for co in cos]
            ),
            set([
                ('Off Hanga-Teo, on N. coast', Decimal('-27.0602777778'), "27° 03' 37'' S", Decimal('-109.3661111111'), "109° 21' 58' W"),
                ('[Lat-long site]', Decimal('27.8116666667'), "27° 48.7' N", Decimal('-93.0480000000'), "93° 2.88' W"),
                ('Off Punta Rosalia, E pf Anakena', Decimal('-27.0716666667'), '27° 04\' 18" S', Decimal('-109.3291666667'), '109° 19\' 45" W'),
                ('[Lat-long site]', Decimal('28.1011666667'), "28° 06.07' N", Decimal('-91.0403333333'), "91° 02.42' W"),
                ('Off Punta Rosalia, E of Anakean', Decimal('-27.0716666667'), '27° 04\' 18" S', Decimal('-109.3291666667'), '109° 19\' 45" W'),
                ('Near Tahai', Decimal('-27.1222222222'), '27° 07\' 20" S', Decimal('-109.4416666667'), '109° 26\' 30" W'),
                ('90 mi east of Charleston', Decimal('32.7325000000'), '32° 43\' 57" N', Decimal('-78.0947222222'), '78° 05\' 41" W'),
                ('Hanga Nui', Decimal('-27.1294444444'), '27° 07\' 46" S', Decimal('-109.2763888889'), '109° 16\' 35" W'),
                ('[Lat-long site]', Decimal('27.9850000000'), "27° 59.1' N", Decimal('-91.6466666667'), "91° 38.8' W"),
                ('Cochran Pit, N of Rt. 80, W of LaBelle', Decimal('26.7349833333'), "26° 44.099' N", Decimal('-81.4837833333'), "81° 29.027' W"),
                ('Off Punta Rosalia, E of Anakena', Decimal('-27.0716666667'), '27° 04\' 18" S', Decimal('-109.3291666667'), '109° 19\' 45" W'),
                ('[Lat-long site]', Decimal('27.9856666667'), "27° 59.14' N", Decimal('-91.6471666667'), "91° 38.83' W"),
                ('Off Punta Rosalia, E of Anakena', Decimal('-27.0716666667'), '27° 04\' 18" S', Decimal('-109.3291666667'), "109° 19' 45' W"),
                ('[Lat-long site]', Decimal('28.0573333333'), "28° 03.44' N", Decimal('-92.4496666667'), "92° 26.98' W"),
                ('Cochran Pit, N of Route 80, W of LaBelle', Decimal('26.7349833333'), "26° 44.099' N", Decimal('-81.4837833333'), "81° 29.027' W"),
            ]))

        # Check that taxa got uploaded without dupes.
        self.assertEqual(get_table('Taxon').objects.get(definitionitem__name='Taxonomy Root').name, "Uploaded")

        self.assertEqual(
            sorted(t.name for t in get_table('Taxon').objects.filter(definitionitem__name='Class')),
            'Gastropoda Scaphopoda'.split())

        self.assertEqual(
            sorted(t.name for t in get_table('Taxon').objects.filter(definitionitem__name='Superfamily')),
            '''Acteonoidea Buccinoidea Cerithioidea Fissurelloidea Muricoidea Pleurotomarioidea Rissooidea Stromboidea Vanikoroidea Velutinoidea'''\
            .split())

        # Check the determination of a specific collectionobject.
        det = get_table('Collectionobject').objects.get(catalognumber="000005081").determinations.get()
        self.assertEqual(det.determineddate, None)

        self.assertEqual((det.taxon.name, det.taxon.definitionitem.name), ("evergladesensis", "Species"))
        self.assertEqual((det.taxon.parent.name, det.taxon.parent.definitionitem.name), ("Strombus", "Genus"))
        self.assertEqual((det.taxon.parent.parent.name, det.taxon.parent.parent.definitionitem.name), ("Strombidae", "Family"))
        self.assertEqual((det.taxon.parent.parent.parent.name, det.taxon.parent.parent.parent.definitionitem.name), ("Stromboidea", "Superfamily"))
        self.assertEqual((det.taxon.parent.parent.parent.parent.name, det.taxon.parent.parent.parent.parent.definitionitem.name), ("Gastropoda", "Class"))
        self.assertEqual((det.taxon.parent.parent.parent.parent.parent.name, det.taxon.parent.parent.parent.parent.parent.definitionitem.name), ("Uploaded", "Taxonomy Root"))

        # Check some determination dates.
        self.assertEqual(set(co.determinations.get().determineddate for co in cos), set((None, datetime(2003, 11, 1, 0, 0), datetime(2002, 1, 1, 0, 0))))
        self.assertEqual(set(co.determinations.get().determineddateprecision for co in cos), set((None, 1)))

        # Check some collectingevent dates.
        self.assertEqual(get_table('Collectionobject').objects.get(catalognumber="000001906").collectingevent.startdate, datetime(1987,5,4,0,0))
        self.assertEqual(get_table('Collectionobject').objects.get(catalognumber="000001906").collectingevent.startdateprecision, 0)

        self.assertEqual(get_table('Collectionobject').objects.get(catalognumber="000005009").collectingevent.startdate, datetime(1980,1,1,0,0))
        self.assertEqual(get_table('Collectionobject').objects.get(catalognumber="000005009").collectingevent.startdateprecision, 2)

        self.assertEqual(get_table('Collectionobject').objects.get(catalognumber="000001378").collectingevent.startdate, datetime(1998,4,1,0,0))
        self.assertEqual(get_table('Collectionobject').objects.get(catalognumber="000001378").collectingevent.startdateprecision, 1)

        # Check that trees are valid.
        for tree in ('taxon', 'geography', 'geologictimeperiod', 'lithostrat'):
            validate_tree_numbering(tree)
            self.assertEqual(0, get_table(tree).objects.filter(fullname__isnull=True).count())

    def test_tree_1(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
5033,Gastropoda,Stromboidea,Strombidae,Lobatus,,leidyi,,"(Heilprin, 1887)",,,,,,, , ,,USA,FLORIDA,Hendry Co.,"Cochran Pit, N of Rt. 80, W of LaBelle",,North America,8 Sep 1973,8 Sep 1973,,,,8,0,0,Dry; shell,Dry,,,,,,1,"Caloosahatchee,Pinecrest Unit #4",U/Juv,,241,,,LWD,MJP,12/11/1997,26° 44.099' N,,81° 29.027' W,,Point,,,12/08/2016,0,Marine,0,M. Buffington,,M.,,Buffington,,,,,,,,,,,,
'''))
        tree_record = TreeRecord(
            name = 'Geography',
            treedefname = 'Geographytreedef',
            treedefid = self.geographytreedef.id,
            ranks = {
                'Continent': 'Continent/Ocean',
                'Country': 'Country',
                'State': 'State/Prov/Pref',
                'County': 'Region',
            }
        )
        row = next(reader)
        to_upload, matched = tree_record.bind(self.collection, row)._match()

        self.assertEqual(to_upload, [
            TreeDefItemWithValue(get_table('Geographytreedefitem').objects.get(name="County"), "Hendry Co."),
            TreeDefItemWithValue(get_table('Geographytreedefitem').objects.get(name="State"), "FLORIDA"),
            TreeDefItemWithValue(get_table('Geographytreedefitem').objects.get(name="Country"), "USA"),
            TreeDefItemWithValue(get_table('Geographytreedefitem').objects.get(name="Continent"), "North America"),
            TreeDefItemWithValue(get_table('Geographytreedefitem').objects.get(name="Planet"), "Uploaded"),
        ])

        self.assertEqual(matched, [])

        planet = get_table('Geography').objects.create(
            name="Uploaded",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="Planet"),
            definition=self.geographytreedef,
        )

        continent = get_table('Geography').objects.create(
            name="North America",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="Continent"),
            definition=self.geographytreedef,
            parent=planet,
        )

        country = get_table('Geography').objects.create(
            name="USA",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="Country"),
            definition=self.geographytreedef,
            parent=continent,
        )

        state = get_table('Geography').objects.create(
            name="Florida",
            definitionitem=get_table('Geographytreedefitem').objects.get(name="State"),
            definition=self.geographytreedef,
            parent=country,
        )

        # The following should be created by the upload:
        # county = get_table('Geography').objects.create(
        #     name="Hendry Co.",
        #     definitionitem=get_table('Geographytreedefitem').objects.get(name="County"),
        #     definition=self.geographytreedef,
        #     parent=state,
        # )

        self.assertEqual(
            tree_record.bind(self.collection, row)._match(),
            TreeMatchResult([TreeDefItemWithValue(get_table('Geographytreedefitem').objects.get(name="County"), "Hendry Co.")], [state.id])
        )

        upload_result = tree_record.bind(self.collection, row).process_row()
        self.assertIsInstance(upload_result.record_result, Uploaded)

        uploaded = get_table('Geography').objects.get(id=upload_result.get_id())
        self.assertEqual(uploaded.name, "Hendry Co.")
        self.assertEqual(uploaded.definitionitem.name, "County")
        self.assertEqual(uploaded.parent.id, state.id)

        self.assertEqual(tree_record.bind(self.collection, row)._match(), ([], [uploaded.id]))
        upload_result = tree_record.bind(self.collection, row).process_row()
        expected_info = ReportInfo(tableName='Geography', columns=['Continent/Ocean', 'Country', 'State/Prov/Pref', 'Region'])
        self.assertEqual(upload_result, UploadResult(Matched(id=uploaded.id,info=expected_info), {}, {}))


    def test_rollback_bad_rows(self) -> None:
        reader = csv.DictReader(io.StringIO(
'''BMSM No.,Class,Superfamily,Family,Genus,Subgenus,Species,Subspecies,Species Author,Subspecies Author,Who ID First Name,Determiner 1 Title,Determiner 1 First Name,Determiner 1 Middle Initial,Determiner 1 Last Name,ID Date Verbatim,ID Date,ID Status,Country,State/Prov/Pref,Region,Site,Sea Basin,Continent/Ocean,Date Collected,Start Date Collected,End Date Collected,Collection Method,Verbatim Collecting method,No. of Specimens,Live?,W/Operc,Lot Description,Prep Type 1,- Paired valves,for bivalves - Single valves,Habitat,Min Depth (M),Max Depth (M),Fossil?,Stratum,Sex / Age,Lot Status,Accession No.,Original Label,Remarks,Processed by,Cataloged by,DateCataloged,Latitude1,Latitude2,Longitude1,Longitude2,Lat Long Type,Station No.,Checked by,Label Printed,Not for publication on Web,Realm,Estimated,Collected Verbatim,Collector 1 Title,Collector 1 First Name,Collector 1 Middle Initial,Collector 1 Last Name,Collector 2 Title,Collector 2 First Name,Collector 2 Middle Initial,Collector 2 Last name,Collector 3 Title,Collector 3 First Name,Collector 3 Middle Initial,Collector 3 Last Name,Collector 4 Title,Collector 4 First Name,Collector 4 Middle Initial,Collector 4 Last Name
1365,Gastropoda,Fissurelloidea,Fissurellidae,Diodora,,meta,,"(Ihering, 1927)",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,6,0,0,Dry; shell,Dry,,,,71,74,0,,,,313,,Dredged,JSG,MJP,22/01/2003,28° 03.44' N,,92° 26.98' W,,Point,,JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1366,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,phrixodes,,"Dall, 1927",,,,,,, , ,,USA,LOUISIANA,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,3,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1365,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,sicula,,"J.E. Gray, 1825",,,,,,, , ,,USA,Foobar,,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,1,0,0,Dry; shell,Dry,,,In coral rubble,57,65,0,,,,313,,,JSG,MJP,22/01/2003,28° 06.07' N,,91° 02.42' W,,Point,D-7(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
1368,Gastropoda,Fissurelloidea,Fissurellidae,Emarginula,,tuberculosa,,"Libassi, 1859",,Emilio Garcia,,Emilio,,Garcia,Jan 2002,00/01/2002,,USA,LOUISIANA,off Louisiana coast,[Lat-long site],Gulf of Mexico,NW Atlantic O.,Date unk'n,,,,,11,0,0,Dry; shell,Dry,,,"Subtidal 65-91 m, in coralline [sand]",65,91,0,,,,313,,Dredged.  Original label no. 23331.,JSG,MJP,22/01/2003,27° 59.14' N,,91° 38.83' W,,Point,D-4(1),JSG,19/06/2003,0,Marine,0,Emilio Garcia,,Emilio,,Garcia,,,,,,,,,,,,
'''))
        upload_results = do_upload_csv(self.collection, reader, self.example_plan)
        failed_result = upload_results[2]
        self.assertIsInstance(failed_result.record_result, FailedBusinessRule)
        for result in upload_results:
            if result is not failed_result:
                self.assertIsInstance(result.record_result, Uploaded)
                self.assertEqual(1, get_table('collectionobject').objects.filter(id=result.get_id()).count())

        ce_result = failed_result.toOne['collectingevent']
        self.assertIsInstance(ce_result.record_result, Uploaded)
        self.assertEqual(0, get_table('Collectingevent').objects.filter(id=ce_result.get_id()).count())

        loc_result = ce_result.toOne['locality']
        self.assertIsInstance(loc_result.record_result, Uploaded)
        self.assertEqual(0, get_table('locality').objects.filter(id=loc_result.get_id()).count())

        geo_result = loc_result.toOne['geography']
        self.assertIsInstance(geo_result.record_result, Uploaded)
        self.assertEqual(0, get_table('geography').objects.filter(id=geo_result.get_id()).count())

        collector_result = ce_result.toMany['collectors'][0]
        self.assertIsInstance(collector_result.record_result, Uploaded)
        self.assertEqual(0, get_table('collector').objects.filter(id=collector_result.get_id()).count())

