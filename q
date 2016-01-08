var zigbeeDevice = require('../index.js');
var config = require('../config.json');

var zigbee = new zigbeeDevice(config);
zigbee.init();
setInterval(function() {

        zigbee.setColor(zigbee.colorCluster_HueLivingRoom, '#FF00FF');

}, 10000);

