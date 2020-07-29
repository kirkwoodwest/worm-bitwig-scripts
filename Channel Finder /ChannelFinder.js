const CHANNEL_SEARCH_TIME = 200; //Wait time between channel searches.
ChannelFinderInstances = [];

function ChannelFinder(cursorTrack, trackBank, name){
   this.cursorTrack = cursorTrack;
   this.trackBank = trackBank;

   this.channelFindIndex = -1;
   this.channelFound = false;
   this.name = name;
   
   //Mark what we need interested.
   this.cursorTrack.isPinned().markInterested();
   this.trackBank.scrollPosition().markInterested();
   this.trackBank.itemCount().markInterested();

   channel = this.trackBank.getItemAt(0);
   channel.name().markInterested();
   ChannelFinderInstances.push(this);
 }

 /*
 Rescans all the channels
 */
function channelFinderRescan(){
   for(i=0;i<ChannelFinderInstances.length;i++){
      repeat_time = 3000 + (i*200); //Seems to want an offset of some sort or it tries to do too much.
      host.scheduleTask(doObject(ChannelFinderInstances[i], ChannelFinderInstances[i].find), repeat_time);

   }
}
 
//Just in case you need to clean up...
//Sets the channel to start finding the target.
ChannelFinder.prototype.destroy = function(){
   for(i=0;i<ChannelFinderInstances.length;i++){
      if (ChannelFinderInstances[i] == this) {
         ChannelFinderInstances.pop(i);
         return;
      }
   }
}
 
//Sets the channel to start finding the target.
ChannelFinder.prototype.find = function(name){
   println('find!!' + name);
   this.channelFindIndex = -1;
   this.channelFound = false;
 
   if (name != undefined) {
      this.name = name;
   }

   this.trackBank.scrollPosition().set(0);

   //Do a force refind because we might already be in the channel.
   var force_refind = true;
   this._findChannel(force_refind);
 }

 
 ChannelFinder.prototype._findChannel = function(force_refind){
 
    //Get current channel for the trackbank
    var channel = this.trackBank.getItemAt(0)
    var name = channel.name().get();

    //This will force it to loop thru again by spoofing the name.
    if (force_refind == true) name = '-------';

    //attempt to match with the track name...
    if (name == this.name) {
       //Matched Select the channel and pin it.
       this.cursorTrack.selectChannel(channel);
       this.cursorTrack.isPinned().set(true);
       this.channelFound = true;
    } else {
       //Keep searching, increment index and move the position and attempt to refind.
       this.channelFindIndex++;
       this.trackBank.scrollPosition().set(this.channelFindIndex);
       channel_count = this.trackBank.itemCount().get();
 
       if (this.channelFindIndex <= channel_count) {
          //Only attempt again if our index doesn't exceed the channel count...
          host.scheduleTask(doObject(this,this._findChannel), CHANNEL_SEARCH_TIME + (Math.random()*200));
 
          //TODO: Show error here on screen if we can't find the channel...
       }
    }
 }

 //Utility function from mossgrabber
function doObject (object, f) {
    return function ()
    {
        f.apply (object, arguments);
    };
}
