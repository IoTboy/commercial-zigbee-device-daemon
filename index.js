/*
* Author: Daniel Holmlund <daniel.w.holmlund@Intel.com>
* Copyright (c) 2015 Intel Corporation.
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var ZCLClient = require('zigbee');
var client = new ZCLClient();
var _ = require('lodash');
var concentrate = require('concentrate');
var colorspaces = require('colorspaces');



function zigbeeDevice(json){
  var self = this;
  self.colorCluster_HueLivingRoom = null;
  self.levelControlCluster_HueLivingRoom = null;
  self.onOffCluster_HueLivingRoom = null;
  self.config = json;

  zigbeeDevice.prototype.init = function() {

    console.log("Living Room Device: " + self.config.IEEEHueLivingRoom);

    client.connectToPort('/dev/ttyACM0')
    .then(client.firmwareVersion.bind(client))
    .then(function(version) {
      var versionString = [
        version.specifics.majorRelease,
        version.specifics.minorRelease,
        version.specifics.maintenanceRelease
      ].join('.');
      console.log('Found CC2530/1 firmware version: %s %s', version.type, versionString);
    })
    .then(client.startCoordinator.bind(client))
    .then(function(){
      var seen = {};
      setInterval(function() {
        client.devices().then(function(devices) {
          devices.forEach(function(device) {
            console.log("Device: " + device.IEEEAddress);
            if (seen[device.IEEEAddress]) {
              return;
            }
            //console.log("Living Room Device: " + self.config.IEEEHueLivingRoom);
            console.log('Found', device.toString());
            device.on('endpoint', function(endpoint) {
              console.log('Endpoint: ', endpoint.toString());
              console.log('Endpoint ID: ',endpoint.endpointId);
              endpoint.inClusters().then(function(clusters) {
                clusters.forEach(function(cluster) {
                  console.log('Cluster: ', cluster.toString());
                  seen[device.IEEEAddress] = true;
                  // if(cluster.name == 'Level Control') {
                  //   cluster.attributes.CurrentLevel.read().then(function(level) {
                  //     console.log('Current level', level);
                  //   });
                  // }
                });
                if(( device.IEEEAddress == self.config.IEEEHueLivingRoom) && (endpoint.endpointId == self.config.HueEndPoint)) {
                  console.log('Set Living Room Levels variable');
                  exports.levelControlCluster_HueLivingRoom = self.levelControlCluster_HueLivingRoom = _.findWhere(clusters, {name: 'Level Control'});
                  exports.colorCluster_HueLivingRoom = self.colorCluster_HueLivingRoom = _.findWhere(clusters, {name: 'Color Control'});
                  exports.onOffCluster_HueLivingRoom = self.onOffCluster_HueLivingRoom = _.findWhere(clusters, {name: 'On/Off'});
                  console.log('Set Living Room Color Variable');

                  if(self.colorCluster_HueLivingRoom){
                    setColor(self.colorCluster_HueLivingRoom, '#FF00FF');
                    console.log('Variable NOT NULL Call setColor');
                  }
                }
              });
            });
          }
          device.findActiveEndpoints();
          device.findEndpoints(0x0104, [0x0500], [0x0500]); // HA IAS Zones.
        });
      });
    }, 5000);
  });
};

zigbeeDevice.prototype.setPower = function(value) {
  if(!self.onOffCluster_HueLivingRoom)
  return;
  console.log('In set power: ', value);
  if(value)
  self.onOffCluster_HueLivingRoom.commands.On();
  else
  self.onOffCluster_HueLivingRoom.commands.Off();
};

zigbeeDevice.prototype.changeBrightness = function(value) {
  if(!self.levelControlCluster_HueLivingRoom)
  return;
  var payload = new concentrate();
  payload.uint8(value); // Level
  payload.uint16le(0); // Transition duration (1/10th seconds)
  self.levelControlCluster_HueLivingRoom.commands['Move to Level (with On/Off)'](payload.result()).done();
};

zigbeeDevice.prototype.setColor = function(cluster, hex) {
  console.log('In setColor');
  if(!cluster) return;
  if(!self.colorCluster_HueLivingRoom)
  return;
  console.log('Set Color: ' + hex);
  var color = colorspaces.make_color('hex', hex).as('CIExyY');
  var payload = new concentrate();
  payload.uint16le(Math.floor(color[0] * 0xFFFF)); // Color X
  payload.uint16le(Math.floor(color[1] * 0xFFFF)); // Color Y
  payload.uint16le(0); // Transition duration (1/10th seconds)
  return cluster.commands['Move to Color'](payload.result());
};


}

module.exports = zigbeeDevice;
