//CONFIG

function fillLaunchControlRange(min, max, index_start){
   var rangedArray = [];
   var index= ((index_start==undefined) ? 0 : index_start);
   for(i=min;i<=max;i++){
      rangedArray[index] = i;
      index++;
   }
   return rangedArray;
}

//Controller Map index starts with 1 for easy mapping;
LAUNCH_CONTROL_FADERS = fillLaunchControlRange(77, 84, 1);
LAUNCH_CONTROL_KNOBS_1 = fillLaunchControlRange(13, 20, 1);
LAUNCH_CONTROL_KNOBS_2 = fillLaunchControlRange(29, 36, 1);
LAUNCH_CONTROL_KNOBS_3 = fillLaunchControlRange(49, 56, 1);
LAUNCH_CONTROL_BTNS_1 = fillLaunchControlRange(41, 44, 1).concat(fillLaunchControlRange(57,60,0));
LAUNCH_CONTROL_BTNS_2 = fillLaunchControlRange(73, 76, 1).concat(fillLaunchControlRange(89,92,0));

LAUNCH_CONTROL_TRACK1_FADER = LAUNCH_CONTROL_FADERS[6];
LAUNCH_CONTROL_TRACK1_KNOB_1 = LAUNCH_CONTROL_KNOBS_1[6];
LAUNCH_CONTROL_TRACK1_KNOB_2 = LAUNCH_CONTROL_KNOBS_2[6];
LAUNCH_CONTROL_TRACK1_KNOB_3 = LAUNCH_CONTROL_KNOBS_3[6];
LAUNCH_CONTROL_TRACK1_TURNADO = LAUNCH_CONTROL_FADERS[3];
LAUNCH_CONTROL_TRACK1_CONTROLS = [LAUNCH_CONTROL_TRACK1_FADER, LAUNCH_CONTROL_TRACK1_KNOB_3, LAUNCH_CONTROL_TRACK1_KNOB_2, LAUNCH_CONTROL_TRACK1_KNOB_1, LAUNCH_CONTROL_TRACK1_TURNADO];

LAUNCH_CONTROL_TRACK2_FADER = LAUNCH_CONTROL_FADERS[7];
LAUNCH_CONTROL_TRACK2_KNOB_1 = LAUNCH_CONTROL_KNOBS_1[7];
LAUNCH_CONTROL_TRACK2_KNOB_2 = LAUNCH_CONTROL_KNOBS_2[7];
LAUNCH_CONTROL_TRACK2_KNOB_3 = LAUNCH_CONTROL_KNOBS_3[7];
LAUNCH_CONTROL_TRACK2_TURNADO = LAUNCH_CONTROL_FADERS[4];
LAUNCH_CONTROL_TRACK2_CONTROLS = [LAUNCH_CONTROL_TRACK2_FADER, LAUNCH_CONTROL_TRACK2_KNOB_3, LAUNCH_CONTROL_TRACK2_KNOB_2, LAUNCH_CONTROL_TRACK2_KNOB_1, LAUNCH_CONTROL_TRACK2_TURNADO];

LAUNCH_CONTROL_TRACK3_FADER = LAUNCH_CONTROL_FADERS[8];
LAUNCH_CONTROL_TRACK3_KNOB_1 = LAUNCH_CONTROL_KNOBS_1[8];
LAUNCH_CONTROL_TRACK3_KNOB_2 = LAUNCH_CONTROL_KNOBS_2[8];
LAUNCH_CONTROL_TRACK3_KNOB_3 = LAUNCH_CONTROL_KNOBS_3[8];
LAUNCH_CONTROL_TRACK3_TURNADO = LAUNCH_CONTROL_FADERS[5];
LAUNCH_CONTROL_TRACK3_CONTROLS = [LAUNCH_CONTROL_TRACK3_FADER, LAUNCH_CONTROL_TRACK3_KNOB_3, LAUNCH_CONTROL_TRACK3_KNOB_2, LAUNCH_CONTROL_TRACK3_KNOB_1, LAUNCH_CONTROL_TRACK3_TURNADO];

LAUNCH_CONTROL_TRACK1_SENDS = [LAUNCH_CONTROL_KNOBS_1[3],LAUNCH_CONTROL_KNOBS_2[3], LAUNCH_CONTROL_KNOBS_3[3]];
LAUNCH_CONTROL_TRACK2_SENDS = [LAUNCH_CONTROL_KNOBS_1[4],LAUNCH_CONTROL_KNOBS_2[4], LAUNCH_CONTROL_KNOBS_3[4]];
LAUNCH_CONTROL_TRACK3_SENDS = [LAUNCH_CONTROL_KNOBS_1[5],LAUNCH_CONTROL_KNOBS_2[5], LAUNCH_CONTROL_KNOBS_3[5]];

LAUNCH_CONTROL_RESAMPLER1_BTN = LAUNCH_CONTROL_BTNS_1[7];
LAUNCH_CONTROL_RESAMPLER2_BTN = LAUNCH_CONTROL_BTNS_1[8];


LAUNCH_CONTROL_PSP42_CONTROLS = [LAUNCH_CONTROL_KNOBS_1[1], LAUNCH_CONTROL_KNOBS_2[1], LAUNCH_CONTROL_KNOBS_3[1]];
LAUNCH_CONTROL_PSP42_INF = LAUNCH_CONTROL_BTNS_1[1];
LAUNCH_CONTROL_PSP42_DENS = LAUNCH_CONTROL_BTNS_2[1];

//LED SYSEX MESSAGES

//System style messsages
LAUNCH_CTRL_SYSEX_TEMPLATE_ID = 9;
LAUNCH_CTRL_SELECT_TEMPLATE = wrapSysexMessage([240, 0, 32, 41, 2, 17, 119, LAUNCH_CTRL_SYSEX_TEMPLATE_ID, 247]);
LAUNCH_CTRL_LED_SYSEX_START = wrapSysexMessage([240, 0, 32, 41, 2, 17, 120, LAUNCH_CTRL_SYSEX_TEMPLATE_ID]);
LAUNCH_CTRL_LED_SYSEX_END = wrapSysexMessage([247]);


//Simple way to create led syntax stuff.
function launch_ctrl_led_sysex(array){
   sysex = joinSysexMessage(LAUNCH_CTRL_LED_SYSEX_START, wrapSysexMessage(array), LAUNCH_CTRL_LED_SYSEX_END);
   return sysex;
}
//Set button color to red




//LED COLORS
LED_OFF = 12;
LED_RED_LOW = 13;
LED_RED_HIGH = 15;
LED_AMBER_LOW = 29;
LED_AMBER_HIGH = 63;
LED_YELLOW_HIGH = 62;
LED_GREEN_LOW = 28;
LED_GREEN_HIGH = 60;

LED_RED_FLASH = 11;
LED_AMBER_FLASH = 59;
LED_YELLOW_FLASH = 58;
LED_GREEN_FLASH = 56;

LED_KNOBS_1 = fillLaunchControlRange(0, 7, 1);
LED_KNOBS_2 = fillLaunchControlRange(8, 15, 1);
LED_KNOBS_3 = fillLaunchControlRange(16, 23, 1);
LED_BTNS_1 = fillLaunchControlRange(24, 31, 1);
LED_BTNS_2 = fillLaunchControlRange(32, 49, 1);
/*
00-07h (0-7) : Top row of knobs, left to right
08-0Fh (8-15) : Middle row of knobs, left to right
10-17h (16-23) : Bottom row of knobs, left to right
18-1Fh (24-31) : Top row of ‘channel’ buttons, left to right
20-27h (32-39) : Bottom row of ‘channel’ buttons, left to right 
28-2Bh (40-43) : Buttons Device, Mute, Solo, Record Arm 
2C-2Fh (44-47) : Buttons Up, Down, Left, Right
*/
//
KNOB_LEDS_COL = [];
KNOB_LEDS_COL[1] = 
KNOB_LEDS_COL[1] = [LED_KNOBS_1[1], LED_GREEN_LOW,    LED_KNOBS_2[1], LED_GREEN_LOW,     LED_KNOBS_3[1], LED_GREEN_LOW,     LED_BTNS_1[1], LED_OFF, LED_BTNS_1[1], LED_OFF];
KNOB_LEDS_COL[2] = [LED_KNOBS_1[2], LED_AMBER_LOW,    LED_KNOBS_2[2], LED_AMBER_LOW,     LED_KNOBS_3[2], LED_AMBER_LOW,     LED_BTNS_2[2], LED_OFF, LED_BTNS_2[2], LED_OFF];
KNOB_LEDS_COL[3] = [LED_KNOBS_1[3], LED_RED_LOW,      LED_KNOBS_2[3], LED_RED_LOW,     LED_KNOBS_3[3], LED_RED_LOW,     LED_BTNS_2[3], LED_OFF, LED_BTNS_2[3], LED_OFF];
KNOB_LEDS_COL[4] = [LED_KNOBS_1[4], LED_RED_LOW,      LED_KNOBS_2[4], LED_RED_LOW,     LED_KNOBS_3[4], LED_RED_LOW,     LED_BTNS_2[4], LED_OFF, LED_BTNS_2[4], LED_OFF];
KNOB_LEDS_COL[5] = [LED_KNOBS_1[5], LED_RED_LOW,      LED_KNOBS_2[5], LED_RED_LOW,     LED_KNOBS_3[5], LED_RED_LOW,     LED_BTNS_2[5], LED_OFF, LED_BTNS_2[5], LED_OFF];
KNOB_LEDS_COL[6] = [LED_KNOBS_1[6], LED_GREEN_LOW,    LED_KNOBS_2[6], LED_GREEN_LOW,   LED_KNOBS_3[6], LED_GREEN_LOW,   LED_BTNS_2[6], LED_OFF, LED_BTNS_2[6], LED_OFF];
KNOB_LEDS_COL[7] = [LED_KNOBS_1[7], LED_AMBER_LOW,    LED_KNOBS_2[7], LED_AMBER_LOW,   LED_KNOBS_3[7], LED_AMBER_LOW,   LED_BTNS_2[7], LED_OFF, LED_BTNS_2[7], LED_OFF];
KNOB_LEDS_COL[8] = [LED_KNOBS_1[8], LED_YELLOW_HIGH,  LED_KNOBS_2[8], LED_YELLOW_HIGH, LED_KNOBS_3[8], LED_YELLOW_HIGH, LED_BTNS_2[8], LED_OFF, LED_BTNS_2[8], LED_OFF];

ALL_KNOB_LEDS = []
for(var i=1;i<KNOB_LEDS_COL.length;i++){
   ALL_KNOB_LEDS = ALL_KNOB_LEDS.concat(KNOB_LEDS_COL[i]);
}
LAUNCH_LED_INIT = launch_ctrl_led_sysex(ALL_KNOB_LEDS);


//Builds list for resampler LED Status
function launch_ctrl_resample_led(led){
   var ready         = launch_ctrl_led_sysex([led, LED_YELLOW_HIGH]);
   var queue_record  = launch_ctrl_led_sysex([led, LED_AMBER_FLASH]);
   var record        = launch_ctrl_led_sysex([led, LED_RED_HIGH]);
   var queue_play    = launch_ctrl_led_sysex([led, LED_GREEN_FLASH]);
   var play          = launch_ctrl_led_sysex([led, LED_GREEN_HIGH]);
   var led_list = [ready, queue_record, record, queue_play, play];
   return led_list;
}

LAUNCH_LED_RESAMPLE1 = LED_BTNS_1[7];
LAUNCH_LED_RESAMPLE2 = LED_BTNS_1[8];

LAUNCH_LED_RESAMPLE1_LEDS = launch_ctrl_resample_led(LAUNCH_LED_RESAMPLE1);
LAUNCH_LED_RESAMPLE2_LEDS = launch_ctrl_resample_led(LAUNCH_LED_RESAMPLE2);

//Resampler Length buttons
LAUNCH_BTN_RESAMPLE_1BAR = LAUNCH_CONTROL_BTNS_2[5];
LAUNCH_BTN_RESAMPLE_2BAR = LAUNCH_CONTROL_BTNS_2[6];
LAUNCH_BTN_RESAMPLE_4BAR = LAUNCH_CONTROL_BTNS_2[7];
LAUNCH_BTN_RESAMPLE_8BAR = LAUNCH_CONTROL_BTNS_2[8];

//Resampler Length LED Setup
LAUNCH_LED_RESAMPLE_1BAR_ON = [LED_BTNS_2[5], LED_AMBER_HIGH];
LAUNCH_LED_RESAMPLE_2BAR_ON = [LED_BTNS_2[6], LED_AMBER_HIGH];
LAUNCH_LED_RESAMPLE_4BAR_ON = [LED_BTNS_2[7], LED_AMBER_HIGH];
LAUNCH_LED_RESAMPLE_8BAR_ON = [LED_BTNS_2[8], LED_AMBER_HIGH];

LAUNCH_LED_RESAMPLE_1BAR_OFF = [LED_BTNS_2[5], LED_OFF];
LAUNCH_LED_RESAMPLE_2BAR_OFF = [LED_BTNS_2[6], LED_OFF];
LAUNCH_LED_RESAMPLE_4BAR_OFF = [LED_BTNS_2[7], LED_OFF];
LAUNCH_LED_RESAMPLE_8BAR_OFF = [LED_BTNS_2[8], LED_OFF];

//Resampler Length LEDs
LAUNCH_LED_RESAMPLE_1BAR = launch_ctrl_led_sysex([].concat(LAUNCH_LED_RESAMPLE_1BAR_ON).concat(LAUNCH_LED_RESAMPLE_2BAR_OFF).concat(LAUNCH_LED_RESAMPLE_4BAR_OFF).concat(LAUNCH_LED_RESAMPLE_8BAR_OFF));
LAUNCH_LED_RESAMPLE_2BAR = launch_ctrl_led_sysex([].concat(LAUNCH_LED_RESAMPLE_1BAR_OFF).concat(LAUNCH_LED_RESAMPLE_2BAR_ON).concat(LAUNCH_LED_RESAMPLE_4BAR_OFF).concat(LAUNCH_LED_RESAMPLE_8BAR_OFF));
LAUNCH_LED_RESAMPLE_4BAR = launch_ctrl_led_sysex([].concat(LAUNCH_LED_RESAMPLE_1BAR_OFF).concat(LAUNCH_LED_RESAMPLE_2BAR_OFF).concat(LAUNCH_LED_RESAMPLE_4BAR_ON).concat(LAUNCH_LED_RESAMPLE_8BAR_OFF));
LAUNCH_LED_RESAMPLE_8BAR = launch_ctrl_led_sysex([].concat(LAUNCH_LED_RESAMPLE_1BAR_OFF).concat(LAUNCH_LED_RESAMPLE_2BAR_OFF).concat(LAUNCH_LED_RESAMPLE_4BAR_OFF).concat(LAUNCH_LED_RESAMPLE_8BAR_ON));

//PSP42 Buttons
LAUNCH_LED_BTN_DELAY_INF_ON = launch_ctrl_led_sysex([LED_BTNS_1[1], LED_RED_HIGH]);
LAUNCH_LED_BTN_DELAY_INF_OFF = launch_ctrl_led_sysex([LED_BTNS_1[1], LED_OFF]);

LAUNCH_LED_BTN_DELAY_DENS_0 = launch_ctrl_led_sysex([LED_BTNS_2[1], LED_YELLOW_HIGH]);
LAUNCH_LED_BTN_DELAY_DENS_1 = launch_ctrl_led_sysex([LED_BTNS_2[1], LED_AMBER_HIGH]);
LAUNCH_LED_BTN_DELAY_DENS_2 = launch_ctrl_led_sysex([LED_BTNS_2[1], LED_GREEN_HIGH]);
LAUNCH_LED_BTN_DELAY_DENS_3 = launch_ctrl_led_sysex([LED_BTNS_2[1], LED_RED_HIGH]);

LAUNCH_LED_BTN_DELAY_DENS = [LAUNCH_LED_BTN_DELAY_DENS_0, LAUNCH_LED_BTN_DELAY_DENS_1, LAUNCH_LED_BTN_DELAY_DENS_2, LAUNCH_LED_BTN_DELAY_DENS_3];
LAUNCH_LED_BTN_DELAY_INF = [LAUNCH_LED_BTN_DELAY_INF_OFF, LAUNCH_LED_BTN_DELAY_INF_ON];

//LAUNCH_LED_COLOR_DELAY_INF = launch_ctrl_led_sysex(LAUNCH_LED_RESAMPLE1)
