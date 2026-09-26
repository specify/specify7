from unittest import skip
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class CollectorTests(ApiTests):
    def test_create_collector_with_existing_agent(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        collector = collectingevent.collectors.create(
            isprimary=True,
            ordernumber=0,
            division=self.division,
            agent=self.agent)

        fetched_collector = models.Collector.objects.get(id=collector.id)
        self.assertEqual(fetched_collector.agent, self.agent)
        self.assertEqual(fetched_collector.collectingevent, collectingevent)

    def test_create_collector_with_new_agent(self):
        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname="New",
            lastname="Collector",
            division=self.division)
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        collector = collectingevent.collectors.create(
            isprimary=True,
            ordernumber=0,
            division=self.division,
            agent=new_agent)

        fetched_collector = models.Collector.objects.get(id=collector.id)
        self.assertEqual(fetched_collector.agent, new_agent)
        self.assertEqual(fetched_collector.collectingevent, collectingevent)

    def test_agent_unique_in_collecting_event(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        collectingevent.collectors.create(
            isprimary=True,
            ordernumber=0,
            division=self.division,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            collectingevent.collectors.create(
                isprimary=False,
                ordernumber=1,
                division=self.division,
                agent=self.agent)

    def test_add_multiple_collectors_to_event (self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        collector1 = collectingevent.collectors.create(
            isprimary=True,
            ordernumber=0,
            division=self.division,
            agent=self.agent)

        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname="New",
            lastname="Collector",
            division=self.division)

        collector2 = collectingevent.collectors.create(
            isprimary=False,
            ordernumber=1,
            division=self.division,
            agent=new_agent)

        fetched_collectors = models.Collector.objects.filter(collectingevent=collectingevent)
        self.assertEqual(fetched_collectors.count(), 2)
        fetched_collector1 = fetched_collectors.get(id=collector1.id)
        fetched_collector2 = fetched_collectors.get(id=collector2.id)
        self.assertEqual(fetched_collector1.agent, self.agent)
        self.assertTrue(fetched_collector1.isprimary)
        self.assertEqual(fetched_collector1.ordernumber, 0)
        self.assertEqual(fetched_collector2.agent, new_agent)
        self.assertFalse(fetched_collector2.isprimary)
        self.assertEqual(fetched_collector2.ordernumber, 1)

    @skip("business rule removed in https://github.com/specify/specify7/issues/327")
    def test_division_cannot_be_null(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        with self.assertRaises(BusinessRuleException):
            collectingevent.collectors.create(
                isprimary=True,
                ordernumber=0,
                division=None,
                agent=self.agent)
