function TwisterTrackSetting (settings_id, target_channel_name, twister_id, channel_finder) {

   DocTopTrackNameSetting = docstate.getStringSetting('Name', settings_id ,8, target_channel_name);
   DocTopTrackNameSetting.addValueObserver(this.trackNameChanged);
   topTrackName = DocTopTrackNameSetting.get();  
   this.twister_id = twister_id;
   this.settings_id = settings_id;
   this.target_channel_name = target_channel_name;
   this.channel_finder = channel_finder;
}

TwisterTrackSetting.prototype.getTargetChannelName = function(){
   return this.target_channel_name;
}

TwisterTrackSetting.prototype.getTwisterID = function(){
   return this.twister_id;
}
TwisterTrackSetting.prototype.trackNameChanged = function(){
   if (this.channel_finder != null) {
      this.channel_finder.find(value);
   }
}