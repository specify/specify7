import Backbone from './backbone';

const Router = Backbone.Router.extend({
  __name__: 'SpecifyRouter',
});

export const router = new Router() as Backbone.Router;
