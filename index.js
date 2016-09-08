"use strict";
var tar = require('tar');
var zlib = require('zlib');
var semver = require('semver');
var RegClient = require('npm-registry-client');
var client = new RegClient();
function latestVersion(list) {
  return list.reduce(function (biggest, cur) {
    if (semver.gt(cur, biggest)) {
      return cur;
    } else {
      return biggest;
    }
  }, '0.0.0');
}
var REGISTRY = 'https://registry.npmjs.org/';
module.exports = function (name, cb) {
  var extractOpts = { type: 'Directory', path: name, strip: 1 };
  client.get(REGISTRY + name, {}, function (err, obj) {
    if (err) {
      return cb(err);
    }
    var versions = obj.versions;
    var keys = Object.keys(versions);
    var key = latestVersion(keys);
    var tarball = versions[key].dist.tarball;
    client.fetch(tarball, {}, function (err, res) {
      res
        .on('error', cb)
        .pipe(zlib.Unzip())
        .on('error', cb)
        .pipe(tar.Extract(extractOpts))
        .on('error', cb)
        .on('close', cb);
    });
  });
};

if (require.main === module) {
  module.exports(process.argv[2], function (err) {
    if (err) {
      console.error('Error:', err);
      return process.exit(1);
    }
    console.log('Finished');
    process.exit(0);
  });
}
