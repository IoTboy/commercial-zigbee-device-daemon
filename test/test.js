var zigbeeDevice = require('../index.js');
var config = require('../config.json');

var zigbee = new zigbeeDevice(config);
zigbee.init();
setInterval(function() {

        zigbee.setColor(zigbee.colorCluster_HueLivingRoom, '#0000FF');

}, 10000);

setInterval(function() {

	zigbee.setColor(zigbee.colorCluster_HueLivingRoom, '#FF0000');
}, 15000);

