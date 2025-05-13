// @ts-nocheck

import BackboneBase from 'backbone';
import $ from 'jquery';
import _ from 'underscore';

// REFACTOR: remove @ts-nocheck

// https://stackoverflow.com/questions/14866014/debugging-javascript-backbone-and-marionette

function createNamedConstructor(name, constructor) {
  const function_ = new Function(
    'constructor',
    `return function ${name} () {\n` +
      `    // wrapper function created dynamically for "${name}"\n` +
      `    // constructor to allow instances to be identified in the debugger\n` +
      `    constructor.apply(this, arguments);\n` +
      `};`
  );
  return function_(constructor);
}

const originalExtend = BackboneBase.View.extend;
const nameProperty = '__name__';
const newExtend = function (protoProps, classProps) {
  if (protoProps && protoProps.hasOwnProperty(nameProperty)) {
    // BUG: check that name is a valid identifier
    const name = protoProps[nameProperty];
    // Wrap constructor from protoProps if supplied or 'this' (thi function we are extending)
    const constructor = protoProps.hasOwnProperty('constructor')
      ? protoProps.constructor
      : this;
    protoProps = _.extend(protoProps, {
      constructor: createNamedConstructor(name, constructor),
    });
  } else {
    console.warn('Creating backbone subclass without __name__ property.');
  }
  return originalExtend.call(this, protoProps, classProps);
};

BackboneBase.Model.extend =
  BackboneBase.Collection.extend =
  BackboneBase.Router.extend =
  BackboneBase.View.extend =
    newExtend;

BackboneBase.$ = $;

export { default as Backbone } from 'backbone';
