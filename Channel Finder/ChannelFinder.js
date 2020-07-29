CHANNEL_FINDER_TRACK_COUNT = 128;
_ChannelFinderInstance = undefined;
function ChannelFinder(){
   if (_ChannelFinderInstance == undefined ){ 
      this.channels = [];
      this.trackBank = bank = host.createTrackBank(CHANNEL_FINDER_TRACK_COUNT,0,0,true);
      
      //Mark names as interested.
      for(i=0;i<CHANNEL_FINDER_TRACK_COUNT-1; i++){
         var channel = this.trackBank.getItemAt(i);
         channel.name().markInterested();
         this.channels[i] = channel;
      }
      
      _ChannelFinderInstance = this;
   } else { 
      return _ChannelFinderInstance;
   }
 }

 
ChannelFinder.prototype.setupCursorTracks = function(){
   for(i=0;i< arguments.length;i++) {
      cursor_track = arguments[i];
      cursor_track.isPinned().markInterested();   
   }
}

//Moves cursor track to target channel;
ChannelFinder.prototype.find = function(cursor_track, name){

   if (name != undefined) {
      this.name = name;
   }

   for(i=0;i<CHANNEL_FINDER_TRACK_COUNT-1; i++){
      channel = this.channels[i];
      channel_name = channel.name().get();

      if ( channel_name == name) {
         name = true;
         cursor_track.selectChannel(channel);
         cursor_track.isPinned().set(true);
         return;
      }
   }
}
