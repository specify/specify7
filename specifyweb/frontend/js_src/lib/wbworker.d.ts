/**
 * Dummy definition for wbimportxls.worker.ts
 *
 * @module
 */

declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}