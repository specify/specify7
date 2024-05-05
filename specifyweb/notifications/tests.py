from datetime import datetime
import json
import logging
from urllib import request
from specifyweb.notifications.models import Message
from django.test import Client
logger = logging.getLogger(__name__)

from specifyweb.specify.api_tests import ApiTests

class NotificationsTests(ApiTests): 
    def test_get_notification_with_param_since(self): 
        currentTime = datetime.now()
        testMessage = Message.objects.create(
           user=self.specifyuser,
           timestampcreated = currentTime, 
        content=json.dumps({
           'type': 'quer-export-to-csv-complete',
           'file' : 'query_results_2023-08-25T21:20.14.156542.csv'})
        )

        c = Client()
        c.force_login(self.specifyuser)

        response = c.get('/notifications/messages/?since=2023-07-25T21:20:14.177591')

        mockResponse = [json.loads(testMessage.content)]
        mockResponse[0]['message_id'] = testMessage.id
        mockResponse[0]['read'] = False
        mockResponse[0]['timestamp'] = currentTime.strftime('%Y-%m-%dT%H:%M:%S.%f')

        responseReturned = json.loads(response.content)

        self.assertEqual(mockResponse[0]['message_id'], responseReturned[0]['message_id'])
        self.assertEqual(mockResponse[0]['read'], responseReturned[0]['read'])
        self.assertEqual(mockResponse[0]['timestamp'][:-7], responseReturned[0]['timestamp'][:-7])
        
    def test_delete_all(self):
        # Create some test messages

        messages = [Message.objects.create(
            user=self.specifyuser,
            timestampcreated=datetime.now(),
            content=json.dumps({'type': f'test-type-{num}', 'file': f'test_file_{num}.csv'})
        ) for num in range(5)]

        c = Client()
        c.force_login(self.specifyuser)
        message_ids = [message.id for message in messages]
        # Send a POST request to the delete_all endpoint with the IDs of the test messages
        response = c.post('/notifications/delete_all/', {'message_ids': json.dumps(message_ids)})

        # Check if the response is OK
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content.decode(), 'OK')

        # Check if the messages have been deleted
        self.assertFalse(Message.objects.filter(id__in=message_ids).exists())