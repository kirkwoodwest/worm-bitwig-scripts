load('ChannelFinder.js')
loadAPI(12);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Kirkwood West", "Channel Finder ", "0.1", "9077497e-f617-4275-b286-15d68cfb5b03", "kirkwoodwest");
DocFindTrackSetting = null;
DocFindTrackName = null;
RescanSettings = null;
ChannelFinderInstance = null

function init() {
   //Sertup Document Preferences
   docstate = host.getDocumentState();
   DocFindTrackSetting = docstate.getStringSetting('Name', "Target Track Name",8, 'Inst 11');
   DocFindTrackSetting.addValueObserver(settingMainTrackNameChanged);
   DocFindTrackName = DocFindTrackSetting.get();  

   RescanSettings = docstate.getSignalSetting('Rescan','Rescan Tracks', "Rescan Tracks")
   RescanSettings.addSignalObserver(channelFinderRescan);

   bank = host.createTrackBank(1,0,0,true);
   cursor_track = host.createCursorTrack("CURSOR_TRACK_2", "CURSOR TRACK", 0,0, false);
   ChannelFinderInstance = new ChannelFinder(cursor_track, bank, DocFindTrackName);

   // TODO: Perform further initialization here.
   println("Channel Finder  initialized!");
}


function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}

function settingMainTrackNameChanged(value){
   ChannelFinderInstance.find(value);
}