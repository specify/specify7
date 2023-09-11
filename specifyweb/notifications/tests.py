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
        'file' : 'query_results_2023-08-25T21:20.14.156542.csv',
    })
 )

  c = Client()
  c.force_login(self.specifyuser)

  response = c.get('/notifications/messages/?since=2023-07-25T21:20:14.177591')

  mockResponse = [json.loads(testMessage.content)]
  mockResponse[0]['message_id'] = 1
  mockResponse[0]['read'] = False
  mockResponse[0]['timestamp'] = currentTime.strftime('%Y-%m-%dT%H:%M:%S')

  responseReturned = json.loads(response.content)
  logger.warn('mockResponse', mockResponse, 'responseReturned', responseReturned)

  self.assertEqual(mockResponse, responseReturned)

