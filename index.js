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
  self.onOffCluster_HueBathRoom = null;
  self.iasCluster_MultiSensor = null;
  self.prev_state = 0;
  self.curr_state = 0;
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
            seen[device.IEEEAddress] = true;
            //console.log("Living Room Device: " + self.config.IEEEHueLivingRoom);
            console.log('Found', device.toString());
            device.on('endpoint', function(endpoint) {
              console.log('Endpoint: ', endpoint.toString());
              console.log('Endpoint ID: ',endpoint.endpointId);
              endpoint.inClusters().then(function(clusters) {
                clusters.forEach(function(cluster) {
                  console.log('Cluster: ', cluster.toString());
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
                    self.setColor(self.colorCluster_HueLivingRoom, '#FFFFFF');
                    console.log('Variable NOT NULL Call setColor');
                  }
                }

                if(( device.IEEEAddress == self.config.IEEEHueBathroom) && (endpoint.endpointId == self.config.CreeEndPoint)) {
                  console.log('Set BathRoom OnOff variable');
                  exports.onOffCluster_HueBathRoom = self.onOffCluster_HueBathRoom = _.findWhere(clusters, {name: 'On/Off'});

                  if(self.onOffCluster_HueBathRoom){
                    self.setPower(self.onOffCluster_HueBathRoom, 0);
                    console.log('Variable NOT NULL Call setPower');
                  }
                }

                if(( device.IEEEAddress == self.config.SmartSenseMulti) && (endpoint.endpointId == self.config.SmartThingsEndPoint)) {
                  console.log('Set MultiSensor IAS variable');
                  exports.iasCluster_MultiSensor = self.iasCluster_MultiSensor = _.findWhere(clusters, {name: 'IAS Zone'});

                  if(self.iasCluster_MultiSensor){
                    self.getIasStatus(self.iasCluster_MultiSensor);
                    console.log('Variable NOT NULL Call getIasStatus');
                  }
                }

              });
            });
            device.findActiveEndpoints();
            device.findEndpoints(0x0104, [0x0500], [0x0500]); // HA IAS Zones.
          });
        });
    }, 15000);
  });
};

zigbeeDevice.prototype.getIasStatus = function(cluster) {
  console.log("In getIasStatus");
	setInterval(function() {
		if(cluster){
			cluster.attributes.ZoneStatus.read().then(function(level) {
        console.log(level);
				self.curr_state = level[0]&1;
				if(self.prev_state != self.curr_state){
					console.log("THERE IS CHANGE IN CLOSED / MOTION / DRY");
          var color_val = to_rgb(255,0,0);
					if(self.curr_state == 1){
						console.log("OPEN");
						self.setColor(self.colorCluster_HueLivingRoom, color_val);
					} else {
						console.log("CLOSED");
						color_val = to_rgb(0,255,0);
						self.setColor(self.colorCluster_HueLivingRoom, color_val);
					}
					self.prev_state = self.curr_state;
				}
			});
		}
	}, 6000);
};

zigbeeDevice.prototype.setPower = function(cluster, value) {
  if(!cluster)
  return;
  console.log('In set power: ', value);
  if(value)
    cluster.commands.On();
  else
    cluster.commands.Off();
};

zigbeeDevice.prototype.changeBrightness = function(cluster, value) {
  console.log('In changeBrightness');
  if(!cluster)
    return;
    console.log('In changeBrightness .... 1');
  var payload = new concentrate();
  console.log('In changeBrightness ... 2');
  payload.uint8(value); // Level
  console.log('In changeBrightness ...3');
  payload.uint16le(0); // Transition duration (1/10th seconds)
  cluster.commands['Move to Level (with On/Off)'](payload.result()).done();
};

zigbeeDevice.prototype.setColor = function(cluster, hex) {
  console.log('In setColor');
  if(!cluster) return;
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
