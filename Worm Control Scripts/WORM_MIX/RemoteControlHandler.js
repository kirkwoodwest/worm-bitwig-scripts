function RemoteControlHandler (cursorDevice, remoteControlsBank , cc_list)
{
    this.cursorDevice = cursorDevice;
    this.remoteControlsBank = remoteControlsBank;
    this.cc_list = cc_list;

    var i;
    for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++)
        this.remoteControlsBank.getParameter (i).markInterested ();

    this.cursorDevice.isEnabled ().markInterested ();
    this.cursorDevice.isWindowOpen ().markInterested ();
}

RemoteControlHandler.prototype.setIndication = function (enable)
{
    var i;
    for (i = 0; i < this.remoteControlsBank.getParameterCount (); i++)
        this.remoteControlsBank.getParameter (i).setIndication (enable);
}

RemoteControlHandler.prototype.handleMidi = function (status, data1, data2)
{
   if (isChannelController(status)) {
      // println("CC_LIST: " + uint7ToHex(this.cc_list[0]).toUpperCase() + " : " + uint7ToHex(this.cc_list[1]).toUpperCase());
      // println("CC_LIST: " + this.cc_list[0] + " : " + this.cc_list[1]);
      // debug_midi(status, data1, data2, "RemoteControlHandler.prototype.handleMidi", false)
      // println('CC_LIST: ' +this.cc_list)
      if (this.cc_list[0] == data1){ this.remoteControlsBank.getParameter(0).set(data2, 128); return true;}
      if (this.cc_list[1] == data1){ this.remoteControlsBank.getParameter(1).set(data2, 128); return true;}
   }
   return false;    
}