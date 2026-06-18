![Image](Synplant%20User%20Guide_artifacts/image_000000_9c4ff5328b0a8b513e4fe64bf3521a415c8dda0daec3c661925c0b17a3cf13b2.png)

![Image](Synplant%20User%20Guide_artifacts/image_000001_84232c3e0bbfe0d7dcfb7ace85ffb990287666293fc6a3c9651f0c509de2a097.png)

![Image](Synplant%20User%20Guide_artifacts/image_000002_3d50f14d4c09dba643d863802d18e8fa794b74360104f1988bac8ad9b318b551.png)

## Table of Contents

- Synplant Bulb, p. 4
- Surrounding Sliders, p. 6
- Popup Selectors, p. 7
- Bottom Sliders, p. 8
- Toolbar, p. 9
- Main Menu, p. 10
- Patch File Browser, p. 12
- DNA Editor, p. 13
- Genopatch, p. 16
- MIDI Settings, p. 19
- Backwards Compatibility, p. 21
- Requirements, p. 21
- Credits and Contacts, p. 22
- Change History, p. 23
- Copyrights And Trademarks, p. 26

## I N T R O D U C T I O N

Welcome to Synplant 2, the next evolution of the software synthesizer that reimagined sound design with a genetic twist. Rather than the traditional knob-twisting and dial-adjusting, Synplant lets you plant sound seeds that evolve into your very own synth patches. The focus is on exploration and discovery, letting your ears guide you through a forest of organic textures and evolving timbres, all waiting to be discovered.

In this second iteration, we've introduced key enhancements to elevate your sound design experience. A standout feature is Genopatch, which employs machine-learning algorithms to analyze your audio samples and generate new Synplant seeds. The results can range from closely mimicking your original sample to unexpected sonic surprises.

We've also revamped the DNA editor for a more intuitive experience. Unlike its predecessor, which lined up all parameters as identical sliders on a single DNA spiral, the new editor offers a structured layout with graphical representations for various settings like envelopes, oscillator types, and filters. This makes it easier to grasp and manipulate the genetic code of your patches.

Furthermore, the new version introduces additional genes and versatile triggering options, including a layered sound mode. It also features tempo synchronization, monophonic patches, glide, and more. All genes can be automated directly in your DAW, and the audio engine has been updated for better sound quality.

With these advancements, Synplant 2 makes developing your own unique sound easier than ever. Whether you're stumbling upon new sounds through serendipity, drawing inspiration from external samples, or meticulously sculpting parameters with the updated DNA editor, Synplant 2 will have your sonic creations blossom in no time.

![Image](Synplant%20User%20Guide_artifacts/image_000003_54b2f70365650968be268537e55848b0de9203ee301f28c8db8f2c1ad77a11ca.png)

## Seed and Branches

The  seed  is  the  core  of  your  sound  in  Synplant.  Drag  within  the  bulb  to  grow branches from this seed. Each branch has a unique timbre. Closest to the seed, all the branches sound identical to the seed, but the farther out you pull a branch, the more different it will sound.

If  you  find  a  branch  you  like,  you  can  cut  it  off  and  re-plant  it  as  a  new  seed  by clicking the Seed Button in the center of the bulb. If none of the branches appeal to you, you can retract one back to its origin to match the original seed sound. Then, click the Seed Button to plant it as a new seed and generate 12 fresh branches.

TIP An easy way to fully retract a branch to its root is to click the branch with the COMMAND (Mac) or CONTROL (Windows) key held down.

If  it  is  hard  to  pinpoint  the  exact  desired  length,  hold  down  the SHIFT key  while dragging to obtain a finer resolution.

Synplant  automatically  triggers  a  note  to  play  it  whenever  you  click  and  drag  a branch. (If this is undesirable, turn it off using the MIDI Settings window.)

Hold down COMMAND (Mac) or CONTROL (Windows) and  click  the Seed Button to generate a new random seed sound. The Atonality slider (see below) affects  the type of seed being created. If the slider is turned down to 0, the seed will typically produce a melodic and playable sound. If it is turned up to 100, the seed is more likely to become an unpitched sound effect.

Hold down ALT and click the Seed Button to clone the currently selected branch to all 12 branches. This action makes all branches grow identically so that the sound behaves consistently across all keys. You can also ALT -drag a branch around the bulb to clone it to specific positions.

DID YOU KNOW? You can adjust the volumes of individual branches through the Edit Branch Volumes option, accessible by right-clicking on the branches or from the Main Menu . Additionally, you can also auto-normalize all branch levels for equal loudness.

## Key Ring

Normally, clicking the Key Ring around the bulb plays notes without changing the branch  lengths.  The  exception  is  when  the Bulb  Mode is Layered (see  below) , where clicking the Key Ring buttons toggles individual layers on and off.

Press COMMAND (Mac) or CONTROL (Windows) and click a Key Ring button to grow a  new  random  branch.  Use  this  to  swap  out  branches  you  don't  like.  The  new branch will sound different when pulled out.

## Mod Wheel Ring

By dragging the Mod Wheel Ring in and out, you control the Mod Wheel parameter (typically linked to MIDI Controller 1) . The effect varies based on the Wheel Target (described later) . The default target, Growth + , causes all branches to grow simultaneously.

## Rotation Control

The Rotation Control is the small circle in the periphery of the bulb. By spinning it around, you can change which branches are triggered by which keys on your MIDI keyboard.

## Bulb Modes

The Bulb Mode determines how branches respond to MIDI notes.

| Standard   | Each branch corresponds to a specific note within an octave: C, C#, D, etc., up to B.                                                                                                                                                                                                                 |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Velocity   | Branches are triggered by different velocity ranges. For example, the bottom branch responds to the highest velocities (117-127) .                                                                                                                                                                    |
| Ranges     | Branches are mapped to six-semitone ranges (C to F, F# to B) , from the keyboard's bottom to the top.                                                                                                                                                                                                 |
| Layered    | Enables multiple branches to be triggered simultaneously for rich, layered sounds. The Atonality setting detunes these layers, even when fully contracted. Note that enabling many layers reduces po- lyphony. (You can adjust the maximum polyphony in the MIDI Set- tings window, described later.) |

## Surrounding Sliders

![Image](Synplant%20User%20Guide_artifacts/image_000004_8452810d61fd57b1c179e1422ba9360a3f5c960a660c4b66f7aa1e5b11ebaf23.png)

## Tuning

The Tuning slider  adjusts the pitch within an octave range. To automatically tune the  sound,  right-click  the  slider  or  select Correct  Tuning from  the Main Menu . While  generally  accurate,  it  may  fail  with  complex  sounds.  For  a  broader  pitch range, modify the a\_freq gene in the DNA Editor .  Lower Atonality settings help maintain tuning, particularly with grown-out branches.

## Effect

The Effect slider controls both the reverb and panning amount. Lower settings produce  a  dry,  monophonic  sound,  while  higher  settings  produce  a  wet,  spacious sound. Stereo panning correlates with branch positions in the bulb: branches on the left side pan to the left and those on the right pan to the right.

TIP For more control, adjust the fx\_mix and adj\_pan genes in the DNA Editor .

## Volume

The Volume slider has a built-in soft clipper that adds distortion at high levels. You can modify the adj\_clip gene in the DNA Editor to tame this distortion. To normalize  loudness,  right-click  the  slider  or  choose Normalize  Volume from  the Main Menu .

## Release

The Release slider determines the fade-out time after a key is released. The impact of this slider varies depending on the seed's inherent qualities. The lower Release settings will also fade out the built-in reverb upon key release.

## Atonality

The Atonality slider influences the type of sounds produced when growing branches. Lower settings yield more musical and 'playable' sounds, while higher settings introduce atonality and pitch modulation. The effect is subtle on short branches but becomes more pronounced on longer ones. At settings above 50%, notes also become increasingly and randomly detuned, resembling a poorly tuned instrument.

## Popup Selectors

![Image](Synplant%20User%20Guide_artifacts/image_000005_202f8aecf30cc76f93ebdad29638897353a100bcf124fc01bb9ca60d5d349e8b.png)

## Voice Mode

Multiple voices can be played simultaneously. The maximum number of voices  can  be  changed  in  the  MIDI  Settings,  discussed  in  a  separate

- Poly section of this manual.
- Mono Only one voice can be played at a time. When a new note is played, the previous one is stopped.
- Legato Similar to Mono , only one voice can be active at a time. However, if you play  a  new  note  while  holding  down  the  previous  one,  the  sound  will transition smoothly without retriggering the voice.

## Wheel Target

The Mod Wheel can be assigned to various target parameters, and its effect can be scaled using the Mod Wheel Scaling slider (described in the Bottom Sliders section below) .

These are the available targets:

- Growth + (the classic Mod Wheel action from Synplant

Expands all branches version 1) .

| Growth -   | Contracts the branches when the Mod Wheel is turned up.                                                                                 |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| Filter +   | Opens the filter as the Mod Wheel is turned up, starting from the current patch setting. The related gene for this is flt_freq .        |
| Filter -   | Starts with a closed filter and opens it up to the current patch settings as the Mod Wheel is turned up. The related gene is flt_freq . |
| Env Time + | Slows down the timing of the sound as the Mod Wheel is turned up. The affected genes are env_time and env_loop .                        |
| Env Time - | Speeds up the timing of the sound as the Mod Wheel is turned up. The affected genes are env_time and env_loop .                         |
| FMAmount   | Modulates the frequency modulation amount. The related gene is fm_amt .                                                                 |
| LFO Amount | Modulates the vibrato/tremolo amount. The related gene is lfo_amt .                                                                     |
| Effect     | Increases the effect amount with the Mod Wheel , similar to turning up the Effect slider.                                               |
| Volume     | Increases the volume with the Mod Wheel , similar to turning up the Volume slider.                                                      |

## Tempo Sync

This feature attempts to synchronize any rhythmic components of the sound with the host tempo. Available choices for synchronization are: 1/2 , 1/4 D (dotted) , 1/2 T (triplets) , 1/4 , 1/8 D (dotted) , 1/4 T (triplets) , and 1/8 .

## Bottom Sliders

![Image](Synplant%20User%20Guide_artifacts/image_000006_ad7d63a4f559341e7032b09f505c95a79dfb6045ae60663d7244f31cd928c33d.png)

## Glide Time

This slider controls the time for the pitch to glide from one note to another, ranging from 0 to 10 seconds (where 0 seconds means no glide) . In Poly and Mono Voice Modes, the glide occurs between the last note pressed and the next one. In Legato mode, the glide only happens when you press a new key while holding down another.

## Mod Wheel Scaling

This slider scales the modulation depth of the Mod Wheel , allowing you to control how much the Mod Wheel affects the selected Wheel Target .

## Velocity Sensitivity

This slider controls how much velocity affects the sound, ranging from 0% to 100%. At 0%, it has no effect, resulting in uniform volume and timbre for all notes. As you increase the slider, velocity adjusts the volume and potentially the sound's character depending on the mod\_vel gene.

NOTE This setting does not alter branch selection in Velocity Bulb Mode . A velocity response curve can also be set in the MIDI Settings window for overall control, independent of individual patch settings.

## Toolbar

![Image](Synplant%20User%20Guide_artifacts/image_000007_7bf23f405713d8ce7953e25656ce7943626f448db67e93788bf9a2b50cdfdfdc.png)

## Main Menu

This is the main menu button. See the separate section below for descriptions of all available menu items.

## Save Patch

Saves the current patch as a '.synplant' file on your computer.

## Manipulate Genes

Opens the DNA Editor , described in the DNA Editor section below.

## Genopatch

Opens Genopatch , our revolutionary sample  to patch AI, described in the Genopatch section below.

## Undo/Redo

Reverts or reapplies your recent changes. The undo history is cleared when the editor window is closed.

## Previous/Next Patch

These  buttons  allow  you  to  navigate  through  patches  in  the  current  patch  folder quickly.

## Patch Display

Clicking the patch name unveils a menu listing all available patches in the current folder. This menu includes options to 'Browse Patches…', which opens the Patch File Browser, and Show Current Folder , which reveals the active folder in Windows Explorer or MacOS Finder.

If you hold down COMMAND (Mac) or CONTROL (Windows) and click the display, Synplant will select a random patch from the currently active folder and load it.

## Main Menu

## Undo/Redo

Same  as  the Toolbar buttons,  these  options  let  you  revert  or  reapply  recent changes. The undo history is cleared when the editor window is closed.

## Open Patch

Opens the Patch File Browser, described below.

## Save Patch

Like  the Toolbar button,  this  saves  the  current  patch  as  a '.synplant' file  on your computer.

## Copy/Paste Patch

These options let you copy your current patch to the clipboard and paste a patch from the clipboard into Synplant.

## Genopatch

Opens Genopatch , described in a separate section below.

## Plant Seed

Plants the currently selected branch as a new seed. Same as clicking the Seed Button . See the Seed and Branches section for more information.

## New Random Seed

Generates a new random seed for your patch. Same as holding COMMAND (Mac) or CONTROL (Windows) and  clicking  the Seed  Button .  See  the  Seed  and  Branches section for more information.

## Manipulate Genes

Opens the DNA Editor , described in the DNA Editor section below.

## Clone Selected Branch

Clones the sound of the selected branch to all keys. Same as ALT -clicking the Seed Button . See the Seed and Branches section for more information.

## Grow New Random Branch

Replaces a branch with a new random one. Same as holding COMMAND (Mac) or CONTROL (Windows) and clicking the Key Ring .

## Correct Tuning

Automatically tunes your patch to ensure it's in key. Also available by right-clicking the Tuning slider.

## Normalize Volume

Adjusts the volume of your patch to a standard level. Also available by right-clicking the Volume slider.

## Normalize Branch Volumes

Levels the volume across all branches of your seed. Also available by right-clicking a branch.

## Edit Branch Volumes

Opens a layer that allows you to manually adjust each branch's volume. Also available by right-clicking a branch.

## Edit MIDI Controllers

Opens a layer with MIDI CC boxes, allowing you to map Synplant functions to your MIDI controller. Click a MIDI CC box to activate 'MIDI learn' (if your host application supports it) . Drag or right-click to set a numeric value.

## MIDI Settings

Opens a window to configure MIDI settings. See MIDI Settings section below.

## MIDI Program List

Synplant  offers  16  slots  for  loading  patches,  allowing  quick  transitions  between sounds. You can switch between these patches using MIDI program change commands if your host supports it, and it is enabled in the MIDI Settings window. The program list is persistent; a new instance of Synplant will automatically load with the previously selected 16 patches.

## Register

Opens a dialog that allows you to enter your registration key to unlock the full version of Synplant.

## Read User Guide

You are here!

## Run Introduction

Runs the introductory tutorial shown at the first launch to get you acquainted with Synplant.

## Auto-check for Updates

Toggles the feature that automatically checks for software updates.

## Zoom

Allows you to scale the entire user interface. The zoom levels range between 50% and 200%.

## About

Shows information about the plug-in.

## Patch File Browser

When you choose to open a patch, a familiar MacOS/Windows file browser will appear, but with added functionalities. Firstly, you can preview any patch instantly by clicking it and playing it using your MIDI keyboard without loading it into the plug-in and closing the browser.

Secondly, two buttons at the bottom allow quick navigation between the 'Factory Patches' and 'User Patches' folders. The 'User Patches' folder initially defaults to a location under your 'user folder,' but if you save a patch to a different folder, it will update to that location.

Inside the 'Factory Patches' folder, you'll find sub-folders organized as follows:

All

Contains every available factory patch.

By Category

Patches are sorted into categories like Basses, Pads, etc.

By Creator

Patches are organized by their creators.

By Package

Patches are grouped based on their respective sound packages.

## DNA Editor

The DNA Editor window is where you can fine-tune the genetic makeup of your sound. The DNA spiral contains 48 genes, each represented by a circle on a horizontal line. To adjust a gene, click its circle and drag it left or right. Drag the mouse up or down (or SHIFT -click) for more precise adjustment. Hold COMMAND (Mac) or CONTROL (Windows) to reset the value to its default (0.5 for most genes).

The DNA spiral also visualizes how branches grow from the base seed settings as colorful lines overlaying the spiral. Observe that the genes control the seed settings only; branches grow randomly.

The DNA spiral is segmented into three outlined boxes at the top, middle, and bottom. Clicking inside these boxes switches the view to different sections displayed to the right of the spiral:

- I. Envelope and LFO
- II. Oscillators
- III. Filter and Effect

![Image](Synplant%20User%20Guide_artifacts/image_000008_d2907b9e9afd40e35a64dac20349b63eec08a87ffc30c735b09c6f27bf6fc004.png)

The knobs in the detailed sections on the right-hand side mirror the horizontal controls in the DNA spiral. Information about the gene you're hovering over is displayed at the bottom of the DNA window.

Right-clicking a gene knob gives you a context menu with options to flip its value, input an exact value as text or reset the gene to its default setting. You can automate all knobs in your DAW and map them to MIDI controls.

## Gene List and Descriptions

Synplant's genes are not traditional synthesizer parameters. They have complex relationships  and  have  been  extensively  tuned  to  generate  useful  sounds  through random mutations. All gene settings range from 0.0 to 1.0, and virtually all genes have a default setting of 0.5.

## I. Envelope and LFO

| Gene     | Description                                                                                                                                        |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| env_time | Controls the total duration of the sound. Above 0.9, the envelope will have infinite duration.                                                     |
| env_loop | Controls the looping time of the envelope. A longer loop time than env_time means no looping will occur.                                           |
| env_tilt | Determines the tilt of the envelope. Smaller values mean quicker attack and longer decay, while higher values mean slower attack and faster decay. |
| env_kf   | Controls the key follow of the envelope. Settings above 0.5 make the envelope shorter with high keys and longer with low keys.                     |
| vol_atk  | Shapes the attack phase of the volume envelope. A value of 0.5 gives a linear attack.                                                              |
| vol_dcy  | Shapes the decay phase of the volume envelope. A value of 0.5 gives a linear decay.                                                                |
| vol_sus  | Sets the sustain level of the sound. A value under 0.5 means no sustain.                                                                           |
| vol_fade | Introduces an additional volume fade that begins after the initial attack phase. Settings above 0.75 activate the fade.                            |
| mod_atk  | Shapes the attack phase of the modulation envelope. A value of 0.5 gives a linear attack.                                                          |
| mod_dcy  | Shapes the decay phase of the modulation envelope. A value of 0.5 gives a linear decay.                                                            |
| mod_sh   | Sets the sample-and-hold frequency of the modulation envelope. Only very high values will acti- vate the effect.                                   |
| mod_vel  | Determines how velocity affects the modulation envelope. Lower settings lower the sensitivity; below 0.1, velocity does not affect modulation.     |
| lfo_rate | Controls the LFO frequency.                                                                                                                        |
| lfo_amt  | Adjusts the vibrato/tremolo effect. Below 0.5, Oscillator A and B are modulated in opposite direc- tions.                                          |
| lfo_bal  | Decides the balance between vibrato (0.0) and tremolo (1.0) .                                                                                      |
| lfo_dly  | Settings above 0.5 introduce a delay before the LFO starts modulating the sound.                                                                   |

## II. Oscillators

| Gene    | Description                                                                                                                                     |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| a_form  | Controls the waveform shape and timbre of Oscillator A.                                                                                         |
| a_noise | Adjusts the mix of noise in Oscillator A.                                                                                                       |
| a_mod   | Determines the pitch modulation amount from the modulation envelope.                                                                            |
| a_color | Changes the character of the noise in Oscillator A.                                                                                             |
| a_freq  | Controls the pitch of Oscillator A (also affects Oscillator B and filter cutoff) .                                                              |
| fm_mod  | Affects how the modulation envelope modulates the FM amount.                                                                                    |
| fm_amt  | Controls the frequency modulation amount of Oscillator A by Oscillator B.                                                                       |
| mix_mod | Determines how the modulation envelope modulates the mix between Oscillator A and B.                                                            |
| osc_mix | Changes the mix between Oscillator A and B.                                                                                                     |
| b_form  | Controls the waveform shape and timbre of Oscillator B.                                                                                         |
| b_noise | Adjusts the mix of noise in Oscillator B.                                                                                                       |
| b_mod   | Determines the pitch modulation amount from the modulation envelope.                                                                            |
| sub_am  | Adjusts the sub-oscillator mix.                                                                                                                 |
| b_freq  | Controls the pitch of Oscillator B relative to the pitch of Oscillator A.                                                                       |
| b_sh    | Sets the sample-and-hold rate of Oscillator B. Values above 0.5 set a fixed rate, while values below sync the rate to Oscillator B's frequency. |

## III. Filters and Effects

| Gene     | Description                                                                                                                           |
|----------|---------------------------------------------------------------------------------------------------------------------------------------|
| flt_type | Morphs the filter type from bandpass to dual lowpass (serial and parallel) to notch.                                                  |
| flt_q    | Controls the 'q value' (or 'resonance') of the filters.                                                                               |
| flt_mod  | Determines the cutoff modulation amount from the modulation envelope.                                                                 |
| flt_sep  | Sets the separation between the cutoff frequencies of the two internal filter stages.                                                 |
| flt_freq | Controls the cutoff frequency relative to the frequency of Oscillator A.                                                              |
| flt_kf   | Determines how filter cutoff changes over the keyboard. Below 0.25, the cutoff is fixed; above 0.75, it follows the keyboard exactly. |
| saturate | Adjusts the level of saturation on the voice.                                                                                         |
| rvb_mix  | Sets the dry/wet mix of the built-in effect.                                                                                          |
| rvb_atk  | Applies an envelope to the reverb amount when set above 0.66.                                                                         |
| rvb_len  | Changes the length of the reverberation.                                                                                              |
| rvb_damp | Controls how the reverb dampens higher frequencies when it decays.                                                                    |
| rvb_chor | Adjusts the chorus amount.                                                                                                            |
| rvb_size | Changes the size of the perceived reverberation space.                                                                                |
| adj_bass | Controls the output low-shelf filter that adjusts the bass frequency content of the sound.                                            |
| adj_treb | Controls the output high-shelf filter that adjusts the treble frequency content of the sound.                                         |
| adj_pan  | Adjusts the panning of the branches around the center seed.                                                                           |
| adj_clip | Adjusts the gain of the 'soft clipper', which is applied after the master volume.                                                     |

## Genopatch

Genopatch is a groundbreaking AI that crafts synth patches from audio recordings. It achieves this by making educated guesses about optimal synth settings, listening to the outcomes, and iteratively refining them to match the reference audio better.

![Image](Synplant%20User%20Guide_artifacts/image_000009_ba15859e780480886e619f313da17c8eb326f2fc8f2109b41426fd15a7347a0e.png)

Using Genopatch is straightforward. You start by selecting a source sample, choosing a segment of up to two seconds from that sample, and then hitting start. You'll then see four strands sprouting upwards, each generating patches. The higher they grow, the closer their solutions (represented by circles) will be to your source audio.

To preview a solution, click on one of the circles. The selected patch will load into Synplant, and you can play it on your keyboard. To save your favorite patches, click the Save button in the Toolbar , just as usual. (Hold down the SHIFT key if you want

to select a solution without triggering it.)

Initially, the generated sounds may vary widely and not closely resemble the reference sample. However, as the strands grow, they converge toward more accurate solutions, each with unique characteristics. Once a strand reaches the top, it stops growing, as the solutions tend to become increasingly similar.

While Synplant is highly versatile, it can't replicate every sound perfectly due to its synthetic nature and the limitations of its 48-gene DNA. But that's often the point. Sometimes you get a perfect match with the original sound, and other times you end up with something entirely new and unexpected.

The entire operation runs on your computer's CPU, requiring no internet connection. The speed at which Genopatch produces new results depends on your processor's capabilities.  Although it  utilizes  all  available  CPU  power,  it's  designed  to  minimize system lag. Closing the Genopatch window will pause the process, allowing you to resume later. However, closing the project in your DAW will erase all found solutions, requiring you to start anew.

TIP After you create a patch with Genopatch, you might want to adjust the velocity and keyboard response using the Velocity slider and the env\_kf , mod\_vel , and flt\_kf genes.

![Image](Synplant%20User%20Guide_artifacts/image_000010_895f79cbcba4c7ec912a40ab64097b40a41b4b8899bffe3d2ba880c8c646889f.png)

## Load Reference Sound

Opens a sample browser to load your reference sound. The browser features a Play button and an Auto Play switch for sample previews. It supports WAV and AIFF files of any sample rate and bit resolution. Samples longer than 10 minutes will be truncated. You can also drag and drop a sample file directly into the Synplant window to load it into Genopatch. Some DAWs even allow drag-and-drop from an audio track.

## Play Reference

Previews the selected segment of the reference sound.

## Correct Tuning (On and Off)

When off, Genopatch will tune the patches to match the pitch of the source sample when you press the C3 key. Turning it on will adjust the pitch based on the detected pitch in the reference sample.

## Generate Patches

Click to start the magic. Click again to pause. (Closing the Genopatch window will also pause the process.)

## Reset

Clears all results, allowing you to select a new segment from the reference sample and start over.

## Auto Preview (On and Off)

When on, each new solution will automatically play upon discovery. It turns off when you manually select a solution.

## Waveform Display

Click and drag to scroll horizontally and zoom vertically.

## Selected Range

Adjust the left and right ends to select a new range, or click and drag to move the entire range.

## Info Button

Swaps the waveform display for an info display, showing detected pitch, solution testing rate, and additional details about selected solutions.

## Restart Buttons

Click to discard an individual strand and restart. Holding down the ALT key  while clicking invokes a special mode, using the currently loaded Synplant patch as the search base. The solutions will gradually shift  from  the  source  patch  towards  the reference audio as the strand grows.

The MIDI Settings window in Synplant Version 2 lets you fine-tune how the software interacts with MIDI data. Each Synplant instance has unique settings saved within your project but not in individual patch files. These settings can also be saved and loaded as separate .scmc files.

![Image](Synplant%20User%20Guide_artifacts/image_000011_e16ba81614182c3baa5bd1fafc2a2cea4482b9f274c68dbadc9603b73abaa64c.png)

## Input Channel

Set the MIDI channel that this instance of Synplant will respond to.

## Output Channel

Choose the MIDI channel Synplant will use to send out MIDI notes when you play branches from the user interface. Setting this to Off will disable note playback when editing branches.

## Velocity

Select the velocity curve from options: Low, Normal, High, or Fixed.

## Pressure

Choose the pressure setting: Soft, Normal, Hard, or Off. This routes MIDI pressure to the Mod Wheel and is useful for MPE compatibility.

## Min Polyphony

Set  the  minimum  polyphony  level.  This  setting  is  used  in  all Bulb  Modes except Layered .

## Max Polyphony

Set the maximum polyphony level. In Layered mode, polyphony is multiplied by the number of active layers up to this limit.

## Pitch Wheel

Adjust the range of the pitch wheel in semitones.

## Master Tuning

Tune the master pitch between 340 to 540, accommodating those who prefer nonstandard tuning like 432Hz.

## Pitch Wheel Affects Only Held Notes

When checked, only notes that you hold down will be affected by the pitch wheel. This is useful for MPE compatibility.

## Select Branches with MIDI Notes

If  unchecked,  playing  notes  won't  automatically  select  branches,  allowing  you  to edit while playing a sequence.

## Enable MIDI Program Change

Enable or disable Synplant's response to MIDI program change messages. The Edit button takes you to the MIDI Program List window.

## Reset

Clicking this button resets all MIDI configuration settings to their default values.

## Load

Use this button to load a previously saved MIDI configuration.

## Save

Click this button to save the current MIDI configuration settings.

## Make Default

This button sets the current configuration as the default for new instances of Synplant.

## About MPE Compatibility

While Synplant does not fully support the MPE specification, it does allow for pernote MIDI controllers and expressions. Recommended settings for MPE compatibility are:

| Pressure                            | Normal       |
|-------------------------------------|--------------|
| Pitch Wheel                         | 48 semitones |
| Pitch Wheel Affects Only Held Notes | On           |

## Backwards Compatibility

Synplant 2 has improvements in the audio engine that may result in subtle sound differences compared to version 1. While these changes are often minor, they can be more pronounced under specific settings.

When you load patches and songs saved with Synplant version 1, you will see a warning that Synplant is running in 'compatibility mode'. In this mode, Synplant reproduces the legacy sound of version 1 precisely without the DSP improvements of version 2.

You can choose to either dismiss the warning or upgrade the patch. If you upgrade the patch and it does not sound as expected, you can revert the changes using the Undo button.

## Requirements

The minimum requirements for installing and running Synplant are:

- Microsoft Windows 7

A host that supports 64-bit VST® 2.4, or VST3 plug-ins

- ·
- macOS High Sierra (10.13)

A host that supports 64-bit VST 2.4, VST3, or AudioUnit 2 plug-ins

## Credits and Contacts

Synplant v1.0 - v2.0.2 (2008 - 2024)

## Created by:

## Magnus Lidström

Graphical design and additional development:

## Fredrik Lidström

Additional art and design concepts:

## Andreas Karperyd

## Sound design:

Bru

Bruna Franco

eXode

Daniel Thiel

Flume

Harley Streten

Koshdukai

Marco Correia

LV

Lennart Verhoeff

MNDMTH

Stuart Brown

NEJ

Nils-Erik Johansson

Solar Fields

Magnus Birgersson

Solidtrax

Bastiaan Barth

SC

Magnus Lidström (Sonic Charge)

Teadrinker

Martin Eklund

thook

Agon Resuli

Virtual Riot

Valentin Brunn

## Sonic Charge website:

[https://soniccharge.com](http://soniccharge.com/)

Thanks to all our fabulous beta testers!

## Change History

## Version 2.0.2 (2024-08-29)

- Fixed  a  bug  where  loading  a  wav  file  from  a  directory  with  Unicode  characters caused the file browser to display an error and not open on subsequent attempts.
- General  improvements to Unicode character handling in file  paths,  resolving  issues like those in the "Favorite Button" mod.
- Corrected the Basic PWM patches.

## Version 2.0.1 (2023-10-29)

- Fixed a compatibility bug with slow "mod\_sh" settings in "backwards compatibility mode".
- Fixed broken control-click to load random patch on Windows.
- Mod-wheel (and  other  CC  changes) work  in  the  file  browser  preview  also  in  the VST3 version.
- Genopatch claims slightly less CPU in the Windows version.
- Using more modern file browsers on Windows.
- Improved error handling in Windows installer.
- New drag and drop implementation on Windows for FL Studio compatibility.
- If you update a version 1 patch and save it as a ".synplant" file, Synplant will ask if you want to remove the old ".synp" file.
- Prepared support for "explicit branch morphs" in the audio engine.
- Support for "mods" (scripts that installs modifications on the UI) .
- Bug-fixes and improvements in Javascript back-end.
- Slightly improved the neural net in Genopatch.
+ other minor bug fixes

## Version 2.0 (2023-10-04)

- Introducing Genopatch, our sample to patch AI.
- Rewritten audio engine: new genes and improved DSP algorithms.
- New DNA editor with a structured parameter layout and graphs.
- All genes can be automated and mapped to MIDI CC
- New "bulb modes" give you alternative ways to trigger the different branches.
- Mono/legato/polyphonic "voice modes" with portamento.
- Tempo sync.
- Alternative "mod wheel targets".
- Adjustable branch volumes.
- Individual branches can be randomized.
- Basic MPE support.

- Scalable user interface.
- Skin support.
- Extendible with Javascript.
+ lots more

## Version 1.2.6 (2022-11-07)

- VST3 support.
- (Windows) Deprecated 32-bit support.
- Bug and compatibility fixes.

## Version 1.2.5 (2022-02-16)

- (Mac) Native support for Apple Silicon.
- Bug fixes, 'under the hood' maintenance, and improvements.

## Version 1.2.4 (2020-08-24)

- Added support for time-limited licensing.
- Made a workaround to handle a rare Windows problem with generating a unique machine-id.

## Version 1.2.3 (2020-03-04)

- Got rid of potential audio buffer under-runs (causing clicks and pops) on first playback.
- New algorithm for the 'system unique identifier' used for authorization. Hopefully fixing the problem where the plug-in became unregistered spontaneously.
- Fixed a bug that could leave temporary files behind when saving and replacing files.
- (Mac) Solved a compatibility problem with DAWs that are built with recent Apple SDK's, e.g., Cubase 10.5.
- (Mac) Notarized installer for Catalina.
- (Mac) New 64-bit compatible uninstaller.
- (Mac) 'Go to folder' buttons in browser now work in Catalina.
- (Mac) 64-bit  Audio  Unit  no  longer  depends  on  the  'Component  Manager'.  This means you should not need to restart after installation.
- (Mac) Preferences  and  registration  data  is  now  shared  with  'sandboxed'  DAWs like GarageBand (meaning Authenticator works with these DAWs too) .
- (Mac) Fixed a problem where under certain conditions the preferences data could stay locked if the DAW crashed, requiring a full system restart.
- (Windows) No longer fails showing the file popup if there are more than 1000 files in the directory (file popups are however limited to 500 entries) .
- Lots of other minor bug and compatibility fixes.

## Version 1.2.2 (2015-03-11)

- Fixed: shift-clicking for dragging any of the arced sliders around the plant or any branch on the plant always resulted in dragging the Effect slider.
- Also fixed: If Windows had been running (without restart) for more than 24 days straight, Synplant didn't properly display 'tutorial bubbles' or 'tooltip hints'.

## Version 1.2.1 (2014-12-16)

- Open browsers now feature two buttons to quickly take you to factory and user preset directories.
- Many minor bug-fixes.

## Version 1.2 (2014-03-26)

- 64-bit compatible version.
- Supports Sonic Charge Authenticator for easier registration.
- Compiled  with  latest  compilers,  frameworks  and  libraries  for  improved  stability and compatibility.
- New installers (signed on Mac)
- Moved documentation and factory patch location on Windows from DLL directory to \Program Files\Sonic Charge
- Name of DLL (Windows) and 'bundle' (Mac) changed from SynplantVST/SynplantAU to Synplant.

## Version 1.0.1 (2009-09-24)

- Implemented support for the  'all  notes  off  midi  message'.  We  have  discovered that some hosts (most importantly Cakewalk Sonar) requires this to stop notes from playing.  In  other  words,  the  hanging  note  problems  in  Sonar  should  have  been fixed now.
- Improved  compatibility  with  older  VST  2.3  hosts,  including  FXpansion's  RTAS wrapper. VST 2.4 is still the official requirement, simply because we need to put a limit on the extent of our guarantees. However, we will continue doing our best to provide 'unofficial  support'  for  as  many  hosts  as  we  possibly  can.  In  short,  we expect this version of Synplant to work well with the RTAS wrapper.
- Fixed a rare but serious problem with the GUI freezing up on Mac (never to defrost again, never to come back to life) . Turned out to be a bug in Synplant in combination with some unexpected behavior from OS X.
- Some  minor  updates  to  the  internal  code  libraries  that  will  improve  stability  in general.

## Copyrights And Trademarks

The Synplant software and documentation are owned and copyrighted by NuEdge Development 2012-2024, all rights reserved.

![Image](Synplant%20User%20Guide_artifacts/image_000012_592e6ca6f9691bd334808df81728866bd90639c397be25180cbb6266d16a4bf3.png)

Symbiosis version 1.2 - 2.0, Copyright © 2010-2024, NuEdge Development / Magnus Lidström. All rights reserved.

S Y M B I O S I S

![Image](Synplant%20User%20Guide_artifacts/image_000013_9c0f79f5629cc23ebf059659b6537d023be06ec06a66d713f887913274cd5269.png)

Steinberg  VST  PlugIn  SDK,  Copyright  Steinberg  Soft-  und  Hardware GmbH.

libpng versions 1.2.6 - 1.6.37, Copyright © 2004-2019 Glenn Randers-Pehrson.

zlib version 1.2.3 - 1.2.11, Copyright © 1995-2017 Jean-loup Gailly and Mark Adler.

VST® is a trademark of Steinberg Media Technologies GmbH, registered in Europe and other countries.

Windows is a registered  trademark  of  Microsoft  Corporation  in  the  United  States and/or other countries.

Apple, Mac, OS X, and macOS are trademarks of Apple Inc., registered in the U.S. and other countries and regions.

Synplant software and documentation are protected by Swedish copyright laws and international treaty provisions. You may not remove the copyright notice from any copy of Synplant.

Please, read the end-user license agreement enclosed in the package for a lot more legal mumbo-jumbo.

The contractor/manufacturer for Sonic Charge Synplant is:

NuEdge Development / Magnus Lidström

Sågargatan 1b

S-116 36 Stockholm

Sweden