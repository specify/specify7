import { commonText } from '../../../localization/common';
import { snapshot } from '../../../tests/reactUtils';
import { Submit } from '../Submit';

snapshot(Submit.Small, { children: commonText.close() });
snapshot(Submit.Fancy, { children: commonText.close() });
snapshot(Submit.Gray, { children: commonText.close() });
snapshot(Submit.Red, { children: commonText.close() });
snapshot(Submit.Blue, { children: commonText.close() });
snapshot(Submit.Orange, { children: commonText.close() });
snapshot(Submit.Green, { children: commonText.close() });
