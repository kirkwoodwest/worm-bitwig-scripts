
function debug_midi(status, data1, data2, msg, isError){
   var string_dec = status + " : CH: " + (MIDIChannel(status)+1) + " : "+ data1 + " : " + data2;
   var string_hex = uint8ToHex(status).toUpperCase() + " : " + uint7ToHex(data1).toUpperCase() + " : " + uint7ToHex(data2).toUpperCase()
   var string = msg + ": (" + string_dec + ") ("+ string_hex + ")" 
   if (isError) { 
      host.errorln(string);
   } else {
     println(string);
   }
}

function doObject (object, f)
{
    return function ()
    {
        f.apply (object, arguments);
    };
}

function floatToRange(float, range){
  if (range == null) range = 127;
  return Math.round(float*range);
}

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function makeIndexedFunction(index, f)
{
	return function(value)
	{
		f(index, value);
	};
}

function decimalToHex(decimal, chars) {
  return (decimal + Math.pow(16, chars)).toString(16).slice(-chars).toUpperCase();
}

function wrapSysexMessage(sysexArray){
  var sysexString = ""
  for(var i=0;i<sysexArray.length;i++){
    if(i>0) sysexString = sysexString + " ";
    var val = sysexArray[i];
    sysexString = sysexString + decimalToHex(val, 2);
  }
  return sysexString;
}

function joinSysexMessage(){
  var sysexString = ""
  for(var i=0;i<arguments.length;i++){
    if(i>0) sysexString = sysexString + " ";
    var val = arguments[i];
    sysexString = sysexString + val;
  }
  return sysexString;
}