function RemoteControlHandler (remoteControlsBank, hardwareSurfaceKnobs) {

   this.remoteControlsBank = remoteControlsBank;
   this.hardwareSurfaceKnobs = hardwareSurfaceKnobs;

   var i;
   for (i = 0; i < this.remoteControlsBank.getParameterCount(); i++) {
      this.hardwareSurfaceKnobs[i].setBinding(this.remoteControlsBank.getParameter(i));
   }
}