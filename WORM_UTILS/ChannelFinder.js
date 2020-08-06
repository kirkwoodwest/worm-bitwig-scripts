CHANNEL_FINDER_TRACK_COUNT = 64;
_ChannelFinderInstance = null;
function ChannelFinder(){
   if (_ChannelFinderInstance == null ){ 
      this.channels = [];
      this.channel_names = [];
      this.trackBank = host.createTrackBank(CHANNEL_FINDER_TRACK_COUNT,0,0, true);
    //  this.trackBank.scrollToChannel().markInterested();

    //  this.trackBank.channelScrollPosition().markInterested();
     // this.trackBank.channelScrollPosition().set(0);
     this.trackBank.scrollPosition().markInterested();
     
      //Mark names as interested.
      for(var i=0;i<CHANNEL_FINDER_TRACK_COUNT-1; i++){
         var channel = this.trackBank.getItemAt(i);
         channel.name().markInterested();
         channel.name().addValueObserver(doObject(this, this._nameUpdate));
         
         var name = channel.name()
         this.channels[i] = channel;
         this.channel_names[name] = channel;
      }
      
      _ChannelFinderInstance = this;
   } else { 
      return _ChannelFinderInstance;
   }
 }

ChannelFinder.prototype._nameUpdate = function(name) {
   /*
   for(var i=0;i<this.channel_names.length; i++) {
      if(this.channel_names[i])
   }
   */
}

 
ChannelFinder.prototype.setupCursorTracks = function(){
   for(var i=0;i< arguments.length;i++) {
      cursor_track = arguments[i];
      cursor_track.isPinned().markInterested();   
   }
}

//Moves cursor track to target channel;
ChannelFinder.prototype.find = function(cursor_track, name){
   println("channel scroll position" + this.trackBank.scrollPosition().get());
   this.trackBank.scrollPosition().set(0);
   
  // this.trackBank.channelScrollPosition().set(0);
   //this.trackBank.scrollToChannel(0);  

   if (name != undefined) {
      this.name = name;
   }
   
   for(var i=0;i<CHANNEL_FINDER_TRACK_COUNT-1; i++){
      var channel = this.trackBank.getItemAt(i);
      var channel_name = channel.name().get();

      println("channel finder all tracks: " + channel.name().get())

      if (channel_name == '') {
         
      }

      
      if (channel_name == name) {
         println('*found: channel: ' + channel_name + "channel index: " + i);
         name = true;
         cursor_track.selectChannel(channel);
         cursor_track.isPinned().set(true);
         return;
      }
   }
}


//Moves cursor track to target channel;
ChannelFinder.prototype.findTrackBank = function(track_bank, name){
   if (name != undefined) this.name = name;

   for(var i=0;i<CHANNEL_FINDER_TRACK_COUNT-1; i++){
      var channel = this.trackBank.getItemAt(i);
      var channel_name = channel.name().get();

      if ( channel_name == name) {
         track_bank.scrollPosition().set(i);
         return;
      }
   }
}