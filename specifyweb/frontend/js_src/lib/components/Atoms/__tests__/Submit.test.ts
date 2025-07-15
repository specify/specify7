import { commonText } from '../../../localization/common';
import { snapshot } from '../../../tests/reactUtils';
import { Submit } from '../Submit';

snapshot(Submit.Small, { children: commonText.close() });
snapshot(Submit.Fancy, { children: commonText.close() });
snapshot(Submit.Secondary, { children: commonText.close() });
snapshot(Submit.Danger, { children: commonText.close() });
snapshot(Submit.Info, { children: commonText.close() });
snapshot(Submit.Warning, { children: commonText.close() });
snapshot(Submit.Success, { children: commonText.close() });
