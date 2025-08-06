from specifyweb.specify.models import Locality
from specifyweb.stored_queries.execution import createPlacemark, getCoordinateColumns
from specifyweb.stored_queries.tests.test_execution.test_kml_context import (
	TestKMLContext,
)

from specifyweb.stored_queries.tests.utils import make_query_fields_test
from xml.dom.minidom import Document

fields_value_value_null_null_null = [
	["localityName"],
	["text1"],
	["latitude1"],
	["longitude1"],
]


captions = [
	"Locality Name",
	"Locality Text1",
	"Locality Latitude1",
	"Locality Longitude1",
]


# Warning:
# If modifying these tests, make sure you are using "Indent by Tabs" (rather than "Indent By Space")
class TestCreatePlacemark(TestKMLContext):

	@classmethod
	def setUpClass(cls):
		cls._use_blank_nulls = True
		super().setUpClass()

	# In this test suite, we have groups of rows that have geocoord.
	# From each group, we take a single row.
	# For that row, we take 1 field definition (3 in total)

	def noop(self):
		# Basic test to investigate things.
		rows_with_geocoords = [
			self._locality_value_value_null_null_null_0,
			self._locality_value_value_value_value_value_l_0,
			self._locality_value_value_value_value_value_r_0,
		]

	def _get_kml_doc(self, locality_attr, fields_to_use_idx=0):
		(
			*_,
			fields_value_value_value_value_null,
			fields_value_value_value_value_value,
		) = self.direct_locality_fields(add_extras=True)

		all_fields = [
			fields_value_value_null_null_null,
			fields_value_value_value_value_null,
			fields_value_value_value_value_value,
		]

		locality = getattr(self, locality_attr)

		# Delete all other localities to make things simpler
		Locality.objects.exclude(id=locality.id).delete()
		self._update_name_text1()

		fields_to_use = all_fields[fields_to_use_idx]

		table, query_fields = make_query_fields_test("Locality", fields_to_use)
		cols = getCoordinateColumns(query_fields, True)
		kmlDoc = Document()
		rows = self._get_results(table, query_fields)
		element = createPlacemark(
			kmlDoc,
			rows[0],
			cols,
			"locality",
			captions,
			"http://localhost:5050",
		)
		kmlDoc.appendChild(element)
		return kmlDoc, locality


tests = [
	dict(
		attr="_locality_value_value_null_null_null_0",
		fields=0,
		expected=lambda locality: f"""<?xml version="1.0" ?>
		<Placemark>
			<ExtendedData>
				<Data name="Locality Name">
					<value>Locality-12.3-40.67</value>
				</Data>
				<Data name="Locality Text1">
					<value>LocalityText-12.3-40.67</value>
				</Data>
				<Data name="coordinates">
					<value>12.3, 40.67</value>
				</Data>
				<Data name="go to">
					<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
				</Data>
			</ExtendedData>
			<name>Locality-12.3-40.67</name>
			<Point>
				<coordinates>40.67,12.3</coordinates>
			</Point>
		</Placemark>
		""",
    ),
	dict(
		attr="_locality_value_value_null_null_null_0",
		fields=1,
		expected=lambda locality: f"""<?xml version="1.0" ?>
		<Placemark>
			<ExtendedData>
				<Data name="Locality Name">
					<value>Locality-12.3-40.67</value>
				</Data>
				<Data name="Locality Text1">
					<value>LocalityText-12.3-40.67</value>
				</Data>
				<Data name="coordinates">
					<value>12.3, 40.67 : , </value>
				</Data>
				<Data name="go to">
					<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
				</Data>
			</ExtendedData>
			<name>Locality-12.3-40.67</name>
			<MultiGeometry>
				<Point>
					<coordinates>40.67,12.3</coordinates>
				</Point>
				<LineString>
					<tessellate>1</tessellate>
					<coordinates>40.67,12.3 ,</coordinates>
				</LineString>
			</MultiGeometry>
		</Placemark>
		""",
	),
	dict(
		attr="_locality_value_value_null_null_null_0",
		fields=2,
		expected=lambda locality: f"""<?xml version="1.0" ?>
		<Placemark>
			<ExtendedData>
				<Data name="Locality Name">
					<value>Locality-12.3-40.67</value>
				</Data>
				<Data name="Locality Text1">
					<value>LocalityText-12.3-40.67</value>
				</Data>
				<Data name="coordinates">
					<value>12.3, 40.67 : ,  ()</value>
				</Data>
				<Data name="go to">
					<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
				</Data>
			</ExtendedData>
			<name>Locality-12.3-40.67</name>
			<MultiGeometry>
				<Point>
					<coordinates>40.67,12.3</coordinates>
				</Point>
				<LinearRing>
					<tessellate>1</tessellate>
					<coordinates>40.67,12.3 ,12.3 , 40.67, 40.67,12.3</coordinates>
				</LinearRing>
			</MultiGeometry>
		</Placemark>
		""",
	),
	dict(
		attr="_locality_value_value_value_value_value_l_0",
		fields=0,
		expected=lambda locality: f"""<?xml version="1.0" ?>
			<Placemark>
				<ExtendedData>
					<Data name="Locality Name">
						<value>Locality-23.12-16.90</value>
					</Data>
					<Data name="Locality Text1">
						<value>LocalityText-23.12-16.90</value>
					</Data>
					<Data name="coordinates">
						<value>23.12, 16.9</value>
					</Data>
					<Data name="go to">
						<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
					</Data>
				</ExtendedData>
				<name>Locality-23.12-16.90</name>
				<Point>
					<coordinates>16.9,23.12</coordinates>
				</Point>
			</Placemark>
			""",
	),
	dict(
		attr="_locality_value_value_value_value_value_l_0",
		fields=1,
		expected=lambda locality: f"""<?xml version="1.0" ?>
			<Placemark>
				<ExtendedData>
					<Data name="Locality Name">
						<value>Locality-23.12-16.90</value>
					</Data>
					<Data name="Locality Text1">
						<value>LocalityText-23.12-16.90</value>
					</Data>
					<Data name="coordinates">
						<value>23.12, 16.9 : 67.87, 12.42</value>
					</Data>
					<Data name="go to">
						<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
					</Data>
				</ExtendedData>
				<name>Locality-23.12-16.90</name>
				<MultiGeometry>
					<Point>
						<coordinates>16.9,23.12</coordinates>
					</Point>
					<LineString>
						<tessellate>1</tessellate>
						<coordinates>16.9,23.12 12.42,67.87</coordinates>
					</LineString>
				</MultiGeometry>
			</Placemark>
			""",
	),
	dict(
		attr="_locality_value_value_value_value_value_l_0",
		fields=2,
		expected=lambda locality: f"""<?xml version="1.0" ?>
			<Placemark>
				<ExtendedData>
					<Data name="Locality Name">
						<value>Locality-23.12-16.90</value>
					</Data>
					<Data name="Locality Text1">
						<value>LocalityText-23.12-16.90</value>
					</Data>
					<Data name="coordinates">
						<value>23.12, 16.9 : 67.87, 12.42 (Line)</value>
					</Data>
					<Data name="go to">
						<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
					</Data>
				</ExtendedData>
				<name>Locality-23.12-16.90</name>
				<MultiGeometry>
					<Point>
						<coordinates>16.9,23.12</coordinates>
					</Point>
					<LineString>
						<tessellate>1</tessellate>
						<coordinates>16.9,23.12 12.42,67.87</coordinates>
					</LineString>
				</MultiGeometry>
			</Placemark>
			""",
	),
	dict(
		attr="_locality_value_value_value_value_value_r_0",
		fields=0,
		expected=lambda locality: f"""<?xml version="1.0" ?>
			<Placemark>
				<ExtendedData>
					<Data name="Locality Name">
						<value>Locality-59.78-15.35</value>
					</Data>
					<Data name="Locality Text1">
						<value>LocalityText-59.78-15.35</value>
					</Data>
					<Data name="coordinates">
						<value>59.78, 15.35</value>
					</Data>
					<Data name="go to">
						<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
					</Data>
				</ExtendedData>
				<name>Locality-59.78-15.35</name>
				<Point>
					<coordinates>15.35,59.78</coordinates>
				</Point>
			</Placemark>
			""",
	),
	dict(
		attr="_locality_value_value_value_value_value_r_0",
		fields=1,
		expected=lambda locality: f"""<?xml version="1.0" ?>
			<Placemark>
				<ExtendedData>
					<Data name="Locality Name">
						<value>Locality-59.78-15.35</value>
					</Data>
					<Data name="Locality Text1">
						<value>LocalityText-59.78-15.35</value>
					</Data>
					<Data name="coordinates">
						<value>59.78, 15.35 : 15.78, 18.53</value>
					</Data>
					<Data name="go to">
						<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
					</Data>
				</ExtendedData>
				<name>Locality-59.78-15.35</name>
				<MultiGeometry>
					<Point>
						<coordinates>15.35,59.78</coordinates>
					</Point>
					<LineString>
						<tessellate>1</tessellate>
						<coordinates>15.35,59.78 18.53,15.78</coordinates>
					</LineString>
				</MultiGeometry>
			</Placemark>
			""",
	),
	dict(
		attr="_locality_value_value_value_value_value_r_0",
		fields=2,
		expected=lambda locality: f"""<?xml version="1.0" ?>
			<Placemark>
				<ExtendedData>
					<Data name="Locality Name">
						<value>Locality-59.78-15.35</value>
					</Data>
					<Data name="Locality Text1">
						<value>LocalityText-59.78-15.35</value>
					</Data>
					<Data name="coordinates">
						<value>59.78, 15.35 : 15.78, 18.53 (Rectangle)</value>
					</Data>
					<Data name="go to">
						<value>http://localhost:5050/specify/view/locality/{locality.id}/</value>
					</Data>
				</ExtendedData>
				<name>Locality-59.78-15.35</name>
				<MultiGeometry>
					<Point>
					<coordinates>15.35,59.78</coordinates>
					</Point>
					<LinearRing>
					<tessellate>1</tessellate>
					<coordinates>15.35,59.78 18.53,59.78 18.53,15.78 15.35,15.78 15.35,59.78</coordinates>
					</LinearRing>
				</MultiGeometry>
			</Placemark>
			""",
	),
]


def make_test(test_spec):

	def test(self: TestCreatePlacemark):
		kmlDoc, locality = self._get_kml_doc(
			test_spec['attr'], test_spec['fields']
		)
		expected = test_spec['expected'](locality)
		self.assert_xml_equal(kmlDoc, expected)

	attr = f"test{test_spec['attr']}_{test_spec['fields']}"
	return [attr, test]

for test in tests:
	setattr(TestCreatePlacemark, *make_test(test))
	...