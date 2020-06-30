function TrackHandler(trackBank, cursorTrack, track_name) {
   this.track_name = track_name;
   this.trackBank = trackBank;
   this.cursorTrack = cursorTrack;

   this.channelFinder = new ChannelFinder(trackbank, cursorTrack);
   this.channelFinder.find(track_name);
}

TrackHandler.prototype.handleMidi = function(status, data1, data2) {
}
