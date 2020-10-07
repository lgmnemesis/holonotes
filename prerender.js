"use strict";
exports.__esModule = true;
require("zone.js/dist/zone-node");
require("reflect-metadata");
var platform_server_1 = require("@angular/platform-server");
var fs_1 = require("fs");
var AppServerModuleNgFactory = require('./dist-server/bundle').AppServerModuleNgFactory;
platform_server_1.renderModuleFactory(AppServerModuleNgFactory, { document: '<app-root></app-root>', url: '/' })
    .then(function (html) {
    console.log('Pre-rendering successful, saving prerender.html');
    fs_1.writeFileSync('./prerender.html', html);
})["catch"](function (error) {
    console.error('Error occurred:', error);
});
