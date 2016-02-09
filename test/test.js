var zigbeeDevice = require('../index.js');
var config = require('../config.json');

var m = require('mraa'); //require mraa
var groveSensor = require('jsupm_grove');
var upmBuzzer = require("jsupm_buzzer");// Initialize on GPIO 5
var myBuzzer = new upmBuzzer.Buzzer(5);
var chords = [];
chords.push(upmBuzzer.DO);
chords.push(upmBuzzer.RE);
chords.push(upmBuzzer.MI);
chords.push(upmBuzzer.FA);
chords.push(upmBuzzer.SOL);
chords.push(upmBuzzer.LA);
chords.push(upmBuzzer.SI);
chords.push(upmBuzzer.DO);
chords.push(upmBuzzer.SI);
var chordIndex = 0;

// Print sensor name
console.log(myBuzzer.name());


console.log('MRAA Version: ' + m.getVersion()); //write the mraa version to the

var interval = 0;
var zigbee = new zigbeeDevice(config);
zigbee.init();

var myDigitalPin = new m.Gpio(2); //setup digital read on pin 6
myDigitalPin.dir(m.DIR_IN); //set the gpio direction to input

var light = new groveSensor.GroveLight(1);


function float2int (value) { //This will convert float to integer
    return value | 0;
}

function convert(integer) {
    var str = Number(integer).toString(16);
    return str.length == 1 ? "0" + str : str;
};

function to_rgb(r, g, b) { return "#" + convert(r) + convert(g) + convert(b); }

function getCurrentSystemTime(){
	var currenTimemilliseconds = (new Date).getTime();
	return currenTimemilliseconds;
}

// Load Grove module

// Create the temperature sensor object using AIO pin 0
var temp = new groveSensor.GroveTemp(0);
console.log(temp.name());

// Read the temperature ten times, printing both the Celsius and
// equivalent Fahrenheit temperature, waiting one second between readings
var i = 0;
var waiting = setInterval(function() {
        var celsius = temp.value();
        var fahrenheit = celsius * 9.0/5.0 + 32.0;
        console.log(celsius + " degrees Celsius, or " +
            Math.round(fahrenheit) + " degrees Fahrenheit");
        i++;
	if(fahrenheit > 80) {
	  console.log('Buzzer ON');
	  myBuzzer.playSound(chords[0], 1000000);
	}
//        if (i == 10) clearInterval(waiting);
        }, 100000);

periodicActivity(); //call the periodicActivity function

function periodicActivity() //
{
  var motionDetected =  myDigitalPin.read(); //read the digital value of the pin
  console.log('Gpio is ' + motionDetected); //write the read value out to the co
  var luxValue = light.value() * 10;
//  console.log('Light Raw Value: ' + light.raw_value());
  console.log('Lux Value: ' + luxValue);
  var intensity =  0.254 * ( 1000 - luxValue);
  var reqdBrightness = float2int(intensity);
  console.log('Required Brightness: ' + reqdBrightness);
//  if(luxValue < 25)
    zigbee.changeBrightness(zigbee.levelControlCluster_HueLivingRoom, reqdBrightness);
  if(motionDetected)
    interval = 30000;
  else
    interval = 5000;
  //zigbee.setPower(motionDetected);

  setTimeout(periodicActivity, interval); //call the indicated function after 1 secon
}

// Print message when exiting
process.on('SIGINT', function()
{
	console.log("Exiting...");
	process.exit(0);
});

return;
var zigbee = new zigbeeDevice(config);
zigbee.init();
setInterval(function() {

        zigbee.setColor(zigbee.colorCluster_HueLivingRoom, '#0000FF');

}, 10000);

setInterval(function() {

	zigbee.setColor(zigbee.colorCluster_HueLivingRoom, '#FF0000');
}, 15000);
