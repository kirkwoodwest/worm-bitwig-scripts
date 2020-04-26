
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