from specifyweb.backend.stored_queries.execution import query_to_kml
from specifyweb.backend.stored_queries.tests.test_execution.test_kml_context import TestKMLContext
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test

from unittest.mock import patch, Mock
from lxml import etree

fields_value_value_null_null_null = [
	["localityName"],
	["text1"],
	["latitude1"],
	["longitude1"],
]

captions = [
	# ['Locality Name', "Locality Text1", "Locality Latitude1", "Locality Longitude1"],
	# ['Locality Name', "Locality Text1", "Locality Latitude1"],
	# ['Locality Name', "Locality Text1", "Locality Longitude1"],
	# ['Locality Name', "Locality Text1", "Locality Latitude1", "Locality Latitude2"],
	# ['Locality Name', "Locality Text1", "Locality Longitude1", "Locality Longitude2"],
	# ['Locality Name', "Locality Text1", "Locality Latitude1", "Locality Longitude1", "Locality Latitude2", "Locality Longitude2"],
	['Locality Name', "Locality Text1", "Locality Latitude1", "Locality Longitude1", "Locality Latitude2", "Locality Longitude2", "Locality Type"],
]

def noop(*args, **kwargs): ...

class MockFile:

	def __init__(self):
		self._contents = None

	def __enter__(self):
		return self

	def __exit__(self, *args, **kwargs): ...

	def write(self, value: bytes):
		self._contents = value

class TestQueryToKML(TestKMLContext):


	@patch("specifyweb.backend.stored_queries.execution.open")
	@patch("specifyweb.backend.stored_queries.execution.set_group_concat_max_len", noop)
	def test_query_to_kml(self, open_func: Mock):
		field_groups = self.direct_locality_fields(add_extras=True)

		file = MockFile()
		open_func.return_value = file

		self._update_name_text1()
		
		table, query_fields = make_query_fields_test("Locality", field_groups[-1])

		with TestQueryToKML.test_session_context() as session:
			query_to_kml(
				session, 
				self.collection, 
				self.specifyuser, 
				table.tableId, 
				query_fields, 
				"test", 
				captions[-1], 
				"http://localhost:5050"
			)
		
		parser = etree.XMLParser(remove_blank_text=True)
		xml_stripped = etree.XML(file._contents, parser=parser)
		self.assert_xml_equal(etree.tostring(xml_stripped).decode(), self._expected_result())

	def _expected_result(self):
		return f"""<?xml version="1.0" encoding="utf-8"?>
		<kml xmlns="http://earth.google.com/kml/2.2">
			<Document>
					<Placemark>
							<ExtendedData>
									<Data name="Locality Name">
											<value>Locality-12.3-40.67</value>
									</Data>
									<Data name="Locality Text1">
											<value>LocalityText-12.3-40.67</value>
									</Data>
									<Data name="coordinates">
											<value>12.3000000000, 40.6700000000 : ,  ()</value>
									</Data>
									<Data name="go to">
											<value>http://localhost:5050/specify/view/locality/{self._locality_value_value_null_null_null_0.id}/</value>
									</Data>
							</ExtendedData>
							<name>Locality-12.3-40.67</name>
							<MultiGeometry>
									<Point>
											<coordinates>40.6700000000,12.3000000000</coordinates>
									</Point>
									<LinearRing>
											<tessellate>1</tessellate>
											<coordinates>40.6700000000,12.3000000000 ,12.3000000000 , 40.6700000000, 40.6700000000,12.3000000000</coordinates>
									</LinearRing>
							</MultiGeometry>
					</Placemark>
					<Placemark>
							<ExtendedData>
									<Data name="Locality Name">
											<value>Locality-10.3--32.89</value>
									</Data>
									<Data name="Locality Text1">
											<value>LocalityText-10.3--32.89</value>
									</Data>
									<Data name="coordinates">
											<value>10.3000000000, -32.8900000000 : ,  ()</value>
									</Data>
									<Data name="go to">
											<value>http://localhost:5050/specify/view/locality/{self._locality_value_value_null_null_null_1.id}/</value>
									</Data>
							</ExtendedData>
							<name>Locality-10.3--32.89</name>
							<MultiGeometry>
									<Point>
											<coordinates>-32.8900000000,10.3000000000</coordinates>
									</Point>
									<LinearRing>
											<tessellate>1</tessellate>
											<coordinates>-32.8900000000,10.3000000000 ,10.3000000000 , -32.8900000000, -32.8900000000,10.3000000000</coordinates>
									</LinearRing>
							</MultiGeometry>
					</Placemark>
					<Placemark>
							<ExtendedData>
									<Data name="Locality Name">
											<value>Locality-23.12-16.90</value>
									</Data>
									<Data name="Locality Text1">
											<value>LocalityText-23.12-16.90</value>
									</Data>
									<Data name="coordinates">
											<value>23.1200000000, 16.9000000000 : 67.8700000000, 12.4200000000 (Line)</value>
									</Data>
									<Data name="go to">
											<value>http://localhost:5050/specify/view/locality/{self._locality_value_value_value_value_value_l_0.id}/</value>
									</Data>
							</ExtendedData>
							<name>Locality-23.12-16.90</name>
							<MultiGeometry>
									<Point>
											<coordinates>16.9000000000,23.1200000000</coordinates>
									</Point>
									<LineString>
											<tessellate>1</tessellate>
											<coordinates>16.9000000000,23.1200000000 12.4200000000,67.8700000000</coordinates>
									</LineString>
							</MultiGeometry>
					</Placemark>
					<Placemark>
							<ExtendedData>
									<Data name="Locality Name">
											<value>Locality-76.54-67.23</value>
									</Data>
									<Data name="Locality Text1">
											<value>LocalityText-76.54-67.23</value>
									</Data>
									<Data name="coordinates">
											<value>76.5400000000, 67.2300000000 : 13.3200000000, 23.6700000000 (Line)</value>
									</Data>
									<Data name="go to">
											<value>http://localhost:5050/specify/view/locality/{self._locality_value_value_value_value_value_l_1.id}/</value>
									</Data>
							</ExtendedData>
							<name>Locality-76.54-67.23</name>
							<MultiGeometry>
									<Point>
											<coordinates>67.2300000000,76.5400000000</coordinates>
									</Point>
									<LineString>
											<tessellate>1</tessellate>
											<coordinates>67.2300000000,76.5400000000 23.6700000000,13.3200000000</coordinates>
									</LineString>
							</MultiGeometry>
					</Placemark>
					<Placemark>
							<ExtendedData>
									<Data name="Locality Name">
											<value>Locality-59.78-15.35</value>
									</Data>
									<Data name="Locality Text1">
											<value>LocalityText-59.78-15.35</value>
									</Data>
									<Data name="coordinates">
											<value>59.7800000000, 15.3500000000 : 15.7800000000, 18.5300000000 (Rectangle)</value>
									</Data>
									<Data name="go to">
											<value>http://localhost:5050/specify/view/locality/{self._locality_value_value_value_value_value_r_0.id}/</value>
									</Data>
							</ExtendedData>
							<name>Locality-59.78-15.35</name>
							<MultiGeometry>
									<Point>
											<coordinates>15.3500000000,59.7800000000</coordinates>
									</Point>
									<LinearRing>
											<tessellate>1</tessellate>
											<coordinates>15.3500000000,59.7800000000 18.5300000000,59.7800000000 18.5300000000,15.7800000000 15.3500000000,15.7800000000 15.3500000000,59.7800000000</coordinates>
									</LinearRing>
							</MultiGeometry>
					</Placemark>
					<Placemark>
							<ExtendedData>
									<Data name="Locality Name">
											<value>Locality-84.45-47.83</value>
									</Data>
									<Data name="Locality Text1">
											<value>LocalityText-84.45-47.83</value>
									</Data>
									<Data name="coordinates">
											<value>84.4500000000, 47.8300000000 : 19.5400000000, 83.2100000000 (Rectangle)</value>
									</Data>
									<Data name="go to">
											<value>http://localhost:5050/specify/view/locality/{self._locality_value_value_value_value_value_r_1.id}/</value>
									</Data>
							</ExtendedData>
							<name>Locality-84.45-47.83</name>
							<MultiGeometry>
									<Point>
											<coordinates>47.8300000000,84.4500000000</coordinates>
									</Point>
									<LinearRing>
											<tessellate>1</tessellate>
											<coordinates>47.8300000000,84.4500000000 83.2100000000,84.4500000000 83.2100000000,19.5400000000 47.8300000000,19.5400000000 47.8300000000,84.4500000000</coordinates>
									</LinearRing>
							</MultiGeometry>
					</Placemark>
			</Document>
		</kml>
		"""