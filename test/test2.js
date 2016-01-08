var zigbeeDevice = require('../index.js');
var config = require('../config.json');

var zigbee = new zigbeeDevice(config);

setInterval(function() {

        zigbee.setColor(zigbee.colorCluster_HueLivingRoom, '#0F00FF');
            
}, 3000);


