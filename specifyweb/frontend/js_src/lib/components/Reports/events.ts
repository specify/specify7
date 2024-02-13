import { eventListener } from '../../utils/events';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';

/**
 * Can trigger this event from anywhere to summon the reports creation dialog
 */
export const reportEvents = eventListener<{
  readonly createReport: SpecifyResource<AnySchema>;
}>();
