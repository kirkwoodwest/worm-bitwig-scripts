// Written by Kirkwood West - kirkwoodwest.com
// (c) 2020
// Licensed under LGPLv3 - http://www.gnu.org/licenses/lgpl-3.0.txt

//-----------------------------------------------------------------------------
//TWISTER DATA
TWISTER_TRACK_SETTINGS_NAMES   =   ["KICK1"   ,  "DRUM2"          ,  "TRACK3"  ,  "TRACK4"  ,  "TRACK5"  ,  "TRACK6"  ,  "TRACK7"  , "TRACK8"      ];
TWISTER_CONTROLLER_ID          =   ["TWIST1_A",  "TWIST1B_TWIST3" ,  "TWIST4_AXXX",  "TWIST4_B",  "TWIST5_A",  "TWIST5_B",  "TWIST5_C",  "TWIST5_D"   ];
TWISTER_CC                     =   [[16,19]   ,  [20,63]          ,  [64,71]   ,  [72,79]   ,  [80,83]   ,  [84,87]  ,  [88,91]    , [92,95]        ];
TWISTER_PAGE_COUNT             =   [1         ,  6                ,  1         ,  1         ,  1         ,  1         ,  1         ,  1             ];
TWISTER_CC_MIN                 = 16;
TWISTER_CC_MAX                 = 95;
TWISTER_COLOR_MIDI_CHANNEL     = 1;


//-----------------------------------------------------------------------------
//XTOUCH MINI

//MACKIE MODE VALUES
const XTOUCH_MIDI_CHANNEL = 1;
const XTOUCH_MAIN_CC = [16,23];  //MIN - MAX VECTOR...
const XTOUCH_MAIN_CC_LIST = [16,17,18,19,20,21,22,23];

const XTOUCH_LED_KNOBS = [48,55];
const XTOUCH_LED_KNOBS_LIST = [48,49,50,51,52,53,54,55];
const XTOUCH_RESET_FADER_NOTE = 89;

const XTOUCH_BTN_A = 84;
const XTOUCH_BTN_B = 85;
const XTOUCH_BTN_KNOBS  = [32,33,34,35,36,37,38,39];
const XTOUCH_BTN_ROW_1 = [89,90,40,41,42,43,44,45];
const XTOUCH_BTN_ROW_2 = [87,88,91,92,86,93,94,95];

const XTOUCH_LED_ROW_1 = [0,1,2,3,4,5,6,7];
const XTOUCH_LED_ROW_2 = [8,9,10,11,12,13,14,15];

const VOLUME_MAX_CC = 100; // Limit for volume fader cc.

//TODO: FIX the names on all these its all sorts of fucked.