'use strict';

var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  var app = new EmberAddon(defaults, {
    vendorFiler: { 'jquery.js': null, 'app-shims.js': null }
  });
  return app.toTree();
};
