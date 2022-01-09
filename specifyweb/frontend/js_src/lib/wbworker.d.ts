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

declare global {
  // Fix Array.isArray() narrowing RA<T> to any[]
  interface ArrayConstructor {
    isArray(argument: ReadonlyArray<any> | any): argument is ReadonlyArray<any>;
  }
}
