const webpack = require('webpack');

module.exports = {
  entry: './javascripts/angular/controllers.js',
  output: {
    path: __dirname,
    filename: 'controllers.webpacked.js'
  },
};
