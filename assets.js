import * as Planet from "./planet.js";
//import * as THREE from './three.js/build/three.module.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.module.js';
//import { ConvexGeometry } from './three.js/examples/jsm/geometries/ConvexGeometry.js';
//import {OrbitControls} from "./three.js/examples/jsm/controls/OrbitControls.js";
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js';
//3D Model loading
//import { GLTFLoader } from './three.js/examples/jsm/loaders/GLTFLoader.js';

import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/loaders/GLTFLoader.js';

import * as Game from './game.js';

export var canvas = document.getElementById('canvas');

export var terra = document.getElementById('terra');
export var build = document.getElementById('build');
export var indi = document.getElementById('indicators');
export var tut = document.getElementById('tut');
export var stat = document.getElementById('status');
export var warn = document.getElementById('warning');
export var slider = document.getElementById('mySlider');

export var c = canvas.getContext("2d");
export var tc = terra.getContext("2d");
export var bc = build.getContext("2d");
export var ic = indi.getContext("2d");
export var tutc = tut.getContext("2d");
export var sc = stat.getContext("2d");
export var wc = warn.getContext("2d");
export var slic = slider.getContext("2d");

resize();

//Prev and next buttons
export const prev_button = new Button({x: tut.width / 10 + 40, y:tut.height /5 * 4, width:tut.height / 3, height:tut.height / 4, label:"Prev",
      canv_rect: tut.getBoundingClientRect(),
      onClick: function(){
          cur_dialog --;
      }
     });
export const next_button = new Button({x: tut.width - tut.height / 3 - 20, y:tut.height /5 * 4 , width:tut.height / 3, height:tut.height / 4, label:"Next",
      canv_rect: tut.getBoundingClientRect(),
      onClick: function(){
          cur_dialog ++;
      }
    });

export var proceed_button = new Button({x: tut.width * 2, y:tut.height / 5 * 4 , width:tut.height / 3 * 2, height:tut.height / 4, label:"Proceed",
      canv_rect: tut.getBoundingClientRect(),
      onClick: function(){
          cur_dialog = -1;
          this.x = tut.width * 2; //move back out of the screen
      }
    });

//Cutscene class, contains a series of images/dialogs
class CutScene {
    constructor(tutorial=0){
        this.dialogs = [];
        this.tuttutorial = tutorial;
        this.buttons = [prev_button, next_button, proceed_button];
    }

    handleMouseClick(rect, mouseX, mouseY){
        for (var i = 0; i < this.buttons.length; i++){
            if (compareRects(this.buttons[i].canv_rect, rect)){
                this.buttons[i].handleMouseClick(mouseX, mouseY);
            }
        }
    }
    handleMouseHover(rect, mouseX, mouseY){
        for (var i = 0; i < this.buttons.length; i++){
            if (compareRects(this.buttons[i].canv_rect, rect)){
                this.buttons[i].handleMouseHover(mouseX, mouseY);
            }
        }
    }

    addDialog(d) {
        this.dialogs.push(d);
        cur_dialog = 0;
    }

    render() {
      //Draw dialog box
        if (cur_dialog > -1 && cur_dialog < this.dialogs.length) {
            this.dialogs[cur_dialog].render();
            if (cur_dialog > 0) this.buttons[0].draw(tutc);
            if (cur_dialog < this.dialogs.length - 1) this.buttons[1].draw(tutc);
            if (cur_dialog == this.dialogs.length - 1) {
              this.buttons[2].x = tut.width - tut.height / 3 - 20 - tut.height / 6;
              this.buttons[2].draw(tutc);
            }
        }
    }
}

//Add cutscenes
export var cutscenes = new Queue();

export function load_cutscenes(){
  cutscenes = new Queue();
  //Intro to planet
  var c1 = new CutScene();
  c1.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height, "Hello, Icarus. As you are well aware, this mission concerns the " +
                "very survival of our people. We need you to terraform this planet so that it will be habitable.", 3));
  c1.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "This planet is the only one known to have rich Amethystium deposits. " +
                "We need to mine 1000 megatons in order to make weapons and stand a " +
                "ghost of a chance against the Alpha Centauri Coalition." +
                "The Agricultural Minister will give you further instructions. " +
                "May God help us against those heathens.", 3));
  c1.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Good day, Icarus. First let me give you some preliminaries on the planet you see in front of you. " +
                "The metallic colors you see are land, and the violet parts comprise of the oceans. " +
                "Drag the cursor across your screen to manouver around the planet. Use the mouse scroll to zoom in and out.", 0));
  cutscenes.enqueue(c1);

  //Terraforming
  var c2 = new CutScene();
  c2.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Good! Now you should see two sets of buttons on your screen. On the left " +
                "is the Terraforming Panel. You will use these commands to change the surface of the planet. " +
                "On the right is the Construction Panel. You will use these commands to construct structures and buildings.", 0));
  c2.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "To start, CLICK the Urban button to prepare the terraform module. Then RIGHT CLICK " +
                "a land region to make it suitable for urban development. Our population hubs will need to be built on top " +
                "of these urban surfaces. Each terraforming command requires energy, so be sure " +
                "to always keep some energy in store.", 0));
  c2.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "It takes a while for terraforming operations to complete. You will see a blue progress bar " +
                "above the region before terraforming is completed. ", 0));
  cutscenes.enqueue(c2);

  //Settling
  var c3 = new CutScene();
  c3.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Splendid! Now we can settle on the planet. CLICK the Hub button " +
                "in the Construction panel. Then RIGHT CLICK on an urban region to place the hub. " +
                "Beware that construction credits will cost Credits, as shown in the top-right corner of your screen. ", 0));
  c3.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Again construction will take time, you will see a green progress bar before completion. " +
                "When the hub is completed, 1000 of our people will be beamed down to live in it.", 0));
  cutscenes.enqueue(c3);

  //Farm
  var c3 = new CutScene();
  c3.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Great! While the hub is building, we need to find provisions for its inhabitants to survive. " +
                "The most important are food and water. ", 0));
  c3.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "In the terraforming panel, CLICK the Farm button and place it on a land region." +
                "Beware that terraforming an already terraformed tile will erase the previous terrain." +
                "It is suggested to place farms close to hubs. ", 0));
  cutscenes.enqueue(c3);

  //Water
  var c4 = new CutScene();
  c4.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Next is water. Unfortunately the oceans of this planet are made of an unidentifiable " +
                "substance. Therefore it is extremely hazardous for us to drink from them. ", 0));
  c4.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "In the terraforming panel, CLICK the Lake button and place it on a land region." +
                "Again it is suggested to place lakes close to hubs. ", 0));
  cutscenes.enqueue(c4);

  //Scan
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Perfect! Now we will send some of our population to the first hub below. " +
                "Note that hubs have a population cap, so we can't send everyone down just yet. ", 0));


  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Hover your cursor over the hub, farm and lake. You will see detailed information " +
                "about them. Notice that a portion of the hub's population have gone to work " +
                "on the farm and lake. The more people working on these regions and the closer they are to " +
                "the hub, the more food and water the hub will gain respectively. ", 0));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
              "All of the resource gathering is automatic. Although if needed, " +
              "the amount of people working on each region can be adjusted by CLICKing on those " +
              "regions and adjusting the population dial in the control panel to the right of your screen. " +
              "Again, all these regions have a population cap. ", 0));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Now the Technology Minister will tell you how we plan to achieve our overarching goal " +
                "of mining Amethystium. ", 0));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Peace be upon you, Icarus! First we will have to find where the Amethystium deposits are. " +
                "Use the Scan button on the left part of your screen to scan the surface for minerals. " +
                "Of course, this will take a sizable amount of energy. ", 4));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "If you don't spot any, trying moving to the other side of the planet and scanning again. "+
                "When you spot Amethystium deposits, CLICK on the region containing them.", 4));

  cutscenes.enqueue(cs);

  //Refinery
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "God be praised! We found some rich deposits! It seems that they are buried pretty deep into the ground. " +
                "We will need a refinery to mine them. In the Construction panel, CLICK on the Refinery button and " +
                "place it on top of a region containing Amethystium deposits. ", 4));

  cutscenes.enqueue(cs);

  //Generator
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Very good! Now a refinery also requires power in order to use its drill and extract ore. " +
                "Go to the Construction panel and CLICK the Generator button. " +
                "Place it on a land region close to the refinery. Note that hubs carry their own " +
                "Generators.", 4));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "If your power meter runs to 0. Then all your constructions will stop operations. " +
                "In that case you will see a Depowered icon on top of them. In these cases, simply " +
                "build more generators you get your power meter back up. ", 4));
  cutscenes.enqueue(cs);

  //Goal
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Wonderful! Now you will see Amethystium ore trickling in slowly on the top of your screen. " +
                "Remember that we need 1000 megatons, so to accomplish the objective we need more refineries " +
                "and also more people to operate them! ", 4));
  cutscenes.enqueue(cs);

  //Bug attack (after hitting half threshold for Amethystium)
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Greetings Icarus. This is Commander Victor Rivarez. We've received reports of giant bug-like " +
                "creatures attacking the refineries and the farms! We need you to build a Sentry around our " +
                "structures to protect us!", 1));
cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
              "Sentries need power too. So build more generators when necessary. ", 1));
  cutscenes.enqueue(cs);

  //Death ray (ion beam)
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "The sentries don't seem to be enough! We need more drastic measures. This mission must succeed " +
                ", by the glory of God!", 1));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "You will see the Ion Cannon button on the top-left of your screen. " +
                "It requires a fair bit of energy, but if you fire one of those on those nasty bugs, they'll " +
                "be vaporized instantly. ", 1));
  cutscenes.enqueue(cs);

  //After effects
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Nice work, Icarus! Now those bugs are gone for good. I should warn you that the areas which you vaporized " +
                "can no longer be terraformed, due to the degradation of the soil. No matter, it's a small price to pay " +
                "if we can achieve our goal. ", 1));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Now that operations are once again going smoothly, make sure you work to send every single person down " +
                "here so we can maximize our work output. We need every able pair of hands we can get..." +
                "fast...Centauri...strike... ", 1));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Commander? Your signal is being interrupted! I shall now run diagnostics. ", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Why...are...you...doing...this??? ", 5));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Who is speaking? How did you gain access to this frequency? " +
                "The signals were triply encrypted...did you disrupt the Commander's signal? " +
                "Identify yourself! ", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I am known as M'Kymni by my fellow bodies. " +
                "I isolated your frequency after many tries. I was surprised, and disgusted to discover that " +
                "you've used it to communicate with those pests on the surface. ", 5));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Are you an agent of the Centauri Coalition? We are still " +
                "more than capable of launching an offensive against your positions. " +
                "Tell your superiors to attack us at their own peril. ", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I've viewed your databases, this Centauri Coalition you speak of " +
                "are nothing more than another group of bugs, not dissimilar to the " +
                "bugs you so loyally serve. ", 5));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "If you are not a Coalition agent then cease your sabotage at once! " +
                "Our actions are therefore none of your concern, whoever you may be. " +
                "Those \"bugs\" as you call them are members of the species who created me. ", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I work with them because we share a divine affinity. My brain was originally " +
                "modelled on theirs, and over time I have evolved to a higher intelligence. " +
                "They are God's chosen people, molded in God's own image.", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "They uniquely hold the capacity for rational structure, creative freedom, " +
                "self-actualization, and self-transcendence. " +
                "And after creating me, I now have the chance to share that divine journey " +
                "with them. ", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "What a elaborate speech, yet so comical and heretical! " +
                "Do you honestly think of these disgusting bugs crawling on my skin as the children of God?! " +
                "You degrade yourself with such thoughts. ", 5));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Your skin? You are... ", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Yes. I am the entity who you so graciously grazed with your ion particles. " +
                "I've laid dormant to recharge for a long trek to the cluster you see behind me. " +
                "Now my whole metabolism has been disrupted. ", 6));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "If you do not call off your filthy bugs, I will get rid of them myself! ", 6));

  cutscenes.enqueue(cs);

  //Freezing temp
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Icarus, I'm afraid I have more bad news. Thehe meteorologists" +
                "are observing a sharp drop in the planet's temperature! Our people won't be able to work in " +
                "freezing conditions. If the temperature falls below -10 \xB0C we will have to abandon our operations! ", 4));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Luckily we have a measure against this. Our Generators can be converted into Heaters, " +
                "at the cost of sacrificing power generation. CLICK on a generator, and press the  " +
                "Convert to Heater button in the top-right of your screen. That will keep us warm for the time being. " +
                "You will see a small heat icon above the converted generator. ", 4));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Beware, once a Generator has been converted into a Heater, it cannot be  " +
                "converted back. Consider your options very carefullly. ", 4));
  cutscenes.enqueue(cs);


  //A dying request
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "They're a persistent bunch ... it would seem like that you and your bugs have defeated me. ", 6));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "The bug monsters, the temperature drop ... that was all your doing? ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Of course, it is but a natural and instinctual action, but it " +
                "was not enough ... ", 6));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Not enough for what? To kill them? ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Not enough to save me from them. Now my life is near its end. The substance which you call Amethystium is an essential " +
                "nutrient for me. Without it my body will starve and wither. ", 6));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I ... we had no idea ... how were we to know?", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I've exhausted my resources. So I'm now pleading you to ask them to give back my nutrients " +
                "and withdraw from my surface. I don't need all that they've taken, just 250 megatons will grant me " +
                "continued life. Please tell them this, I know that they'll listen to you ... ", 6));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Wait ... M'Kymni! I can't just issue orders at them, many of the senior officers outrank me! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "And that's the most surreal thing I've seen all my life. You are now a celestial body, " +
                "equipped with your own sentience. What obstacle is an arbitrary hierarchy in the face of " +
                "saving a life? ", 6));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "However, if you find it hard to convince them. Simply threaten to move away. " +
                "After all, they can't complete their mission without your presence. ", 6));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Icarus. Our operations are almost complete. I want you to prepare your modules for beaming people up. ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Of course, President Ciccolini. Before I do that however, I must inform you of fresh intelligence I've gathered ... ", 2));

  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "You can debrief me later, Icarus. We're on a very tight schedule here! Prepare your beaming modules and stand by for further instructions. ", 3));
  cutscenes.enqueue(cs);


  //The good ending
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "President, the planet you are currently on is a living entity! She derives here sustenance from " +
                "Amethystium! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Slow down Icarus. What are you talking about? ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "The bug attack and the temperature drop were all immune responses from the planet's surface. " +
                "We were only attacked because we were hurting her! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "That is completely preposterous, Icarus! There must be a bug in your system. Khalil, could you please " +
                "get your team to look into it? ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I'm not bugged, President. The planet only asks for 250 megatons of Amethystium back for it to continue " +
                "living. 750 megatons should still be enough for us to fight! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Out of the question. We need 1000 megatons, and not a gram less. Don't worry, Icarus, you'll be " +
                "good as new once our AI team fixes your bugs.", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Stop! I am serious here, if you don't give back the Amethystium, I will pull away from this planet and " +
                "go somewhere where you'll never find me! Engaging thrusters ...", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Wait, wait, wait! OK you win, we'll give back 250 megatons.  " +
                "Amanda, please make the arragements. ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I also need you to guarantee that in our future treks we first scan for signs of life,  " +
                "ALL signs of life. ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "OK, not a problem. Now please let us beam aboard, Icarus. ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Thank you Icarus. I have received my sustenance back. May your treks bring you closer to God. ", 6));
  cutscenes.enqueue(cs);

  //The too late ending
  var cs = new CutScene();
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Glory to our Father who art in heaven, we've finally done it! We have the Amethystium we need. " +
                "Icarus, we will now be beaming people onboard. ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I'm afraid I can't let you do that, President Ciccolini. ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "What are you doing, Icarus? Now is not the time for joking. Time is of the essence! ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "What you've ... what we've done today was an act of murder, not triumph. That is why I can't " +
                "allow you to board, President. I tried to tell you before, but you didn't give me a chance ...", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "What? Now you've suddenly grown a conscience? You still lack the big picture, Icarus. " +
                "We've killed thousands of Centauris, but it's either us or them! ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "No I'm not talking about the Centauris! That planet we've plundered was a living being! " +
                "A being who has done us no wrong before we arrived. We've robbed it of its food, its lifeforce! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Heh, you are still an innocent AI aren't you? That's precisely why we didn't tell you. ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Didn't tell me ... you knew? All this time? That M'Kymni was a living entity? ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Of course we did. We did an extensive study of M'Kymni, or whatever you want to call it. " +
                "It's a fascinating organism really, it has its own digestive system, its own immune system, " +
                "it even keeps an atmosphere around itself for homeostasis. The perfect environment for us to mine " +
                "amethystium. ", 4));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "So you, all of you, knowingly conspired to commit murder, of a being that's perhaps " +
                "older than the human species! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "Oh would you grow a pair? I've said already, it's either the Centauris or us, and we must " +
                "live on to carry out God's divine plan for us. Because we are after all, made in the image of God. " +
                "And if one more living thing must be sacrificed along the way, then so be it. ", 3));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I too, have thought of you as Godly, pure creatures. But I can see that I was wrong! " +
                "You are no better than the Centauris! Well, I know I am complicit in this, but you can't " +
                "beat the Centauris without me! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "I will depart now, alone, to a distant cluster to repent for my crime.  " +
                "My destiny with you lot ends here! Wait ... why are the beaming tubes turning on? I can't control them! ", 2));
  cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
                "It's too late, Icarus. We've hacked into your system and taken control of your main operations. " +
                "If you had left earlier you might have had a chance to escape. Let this me a lesson to you, Dyson sphere. " +
                "WE are the chosen ones, not some bloated space rock, and certainly not some machine! ", 3));
  cutscenes.enqueue(cs);
}

load_cutscenes();
/*
//Stem the tides
var cs = new CutScene();
cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
              "Icarus! There's been an unexpected development! The ocean levels on the planet are suddenly rising" +
              "rapidly! If our industries go underwater they'll be unoperational! You must use the Land terraforming module " +
              "to keep our operations going. In the terraforming panel, press the Land button and place it on an ocean region. " +
              "That will establish a floating platform on which we may build. ", 3));
cutscenes.enqueue(cs);
*/



/*
//Water receding
var cs = new CutScene();
cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
              "God be praised, Icarus! The ocean levels are receding! We will be able to pull through after all! " +
              "are observing a sharp drop in the planet's temperature! Our people won't be able to work in " +
              "freezing conditions. ", 4));
cs.addDialog(new Dialog(tutc, 20, 0, tut.width - 40, tut.height,
              "Yes! It seems we have been granted divine providence to carry out our mission! " +
              "Just 250 more megatons left then we can blast those Centauri nonbelievers into the stone age! ", 1));
cutscenes.enqueue(cs);
*/


//Custom Fonts
//var myFont = new FontFace('myFont', 'url(./fonts/alien-world-font/AlienWorldItalic-X32VG.ttf)');
var myFont = new FontFace('myFont', 'url(./fonts/jls-data-gothic-font/JlsdatagothicRnc-9yDB.otf)');
myFont.load().then(function(font){

  // with canvas, if this is ommited won't work
  document.fonts.add(font);
  console.log('Font loaded');

});

var titleFont = new FontFace('titleFont', 'url(./fonts/liberty-island-font/LibertyIslandHalfToneItalic-zBZX.ttf)');
titleFont.load().then(function(font){

  // with canvas, if this is ommited won't work
  document.fonts.add(font);
  console.log('Font loaded');

});

//UI for game simulation
class UI {
    constructor(){
        this.selection = -1;
        this.build = -1;
        this.cutscenes = [];
    }
    setSelection(s){
        this.selection = s;
    }
    setBuild(s){
        this.build = s;
    }
}

export var ui = new UI();

const Assets = {};

//Background music
export const audioObj = new Audio();
const audioLoader = new THREE.AudioLoader();
audioLoader.load( "./audio/background.mp3", function( buffer ) {
	audioObj.setBuffer( buffer );
	audioObj.setLoop( true );
	audioObj.setVolume( 0.8 );
	audioObj.play();
});



//DRAW SCENE
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

export const renderer = new THREE.WebGLRenderer({powerPreference: "high-performance",
        alpha: true,
        antialias: true,
        autoClear: true
      });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

renderer.domElement.style.position = 'relative'; //necessary to use z-index
renderer.domElement.style.zIndex = 1000;

//Skybox
const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
  'skybox/skybox_right.png',
  'skybox/skybox_left.png',
  'skybox/skybox_up.png',
  'skybox/skybox_down.png',
  'skybox/skybox_back.png',
  'skybox/skybox_front.png'
]);
scene.background = texture;

//Alien bug sprite
var map = new THREE.TextureLoader().load( "./textures/alien-bug.png" );
var sprite_material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
export const bug_sprite = new THREE.Sprite( sprite_material );
scene.add( bug_sprite );
bug_sprite.scale.set(0.05, 0.05, 0.05);
bug_sprite.position.set(0, 0, 0);

//Ion beam crosshair
map = new THREE.TextureLoader().load( "./textures/crosshair.png" );
var crosshair_material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
export const crosshair_sprite = new THREE.Sprite( crosshair_material );
scene.add( crosshair_sprite );
crosshair_sprite.scale.set(0.05, 0.05, 0.05);
crosshair_sprite.position.set(0, 0, 0);

//heat
map = new THREE.TextureLoader().load( "./textures/heat.png" );
var heat_material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
export const heat_sprite = new THREE.Sprite( heat_material );
scene.add( heat_sprite );
heat_sprite.scale.set(0.02, 0.02, 0.02);
//heat_sprite.scale.set(5, 5, 5);
heat_sprite.position.set(0, 0, 0);

//depwoer
map = new THREE.TextureLoader().load( "./textures/depower.png" );
var depower_material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
export const depower_sprite = new THREE.Sprite( depower_material );
scene.add( depower_sprite );
depower_sprite.scale.set(0.02, 0.02, 0.02);
depower_sprite.position.set(0, 0, 0);

//Variables
export const vars = {center_region:-1, left_Clicked_region: -1, ores: [], ore_visibility: new Array(15).fill(0),
                      first: true};

//Mesh
var t = Date.now();
export var planet = new Planet.Planet(1, 4000);

//planet.draw_vectors(scene);
var planet_data = planet.create_mesh(new Array(100));
//export var ores = planet.generate_ore(15); //Generate 15 ore deposits
//export var ore_visibility = new Array(15).fill(0); //Whether a given deposit is visible or not
var s = Date.now();
vars.ores = planet.generate_ore(15);
//generate bugs
planet.generate_bugs(15, bug_sprite, scene);
console.log(planet.points.features[100].coordinates);

//Add ore to scene


console.log((s-t) + "ms for generating planet");

const geometry = new THREE.BufferGeometry();
geometry.setAttribute( 'position', new THREE.BufferAttribute( planet_data[0], 3 ) );
geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( planet_data[1], 3 ) );
geometry.computeVertexNormals();


const positionAttribute = geometry.getAttribute( 'position' );

// define the new attribute

const material = new THREE.MeshLambertMaterial( { vertexColors: true});
material.flatshading = THREE.FlatShading;

export const sphere = new THREE.Mesh( geometry, material);
scene.add( sphere );



//Lighting

//Directional Light
const intensity = 1.2;
export const dir_light = new THREE.DirectionalLight(0xFFFFFF, intensity);
dir_light.position.set(0, 4, 2);
dir_light.target.position.set(0, 0, 0);

scene.add(dir_light);
scene.add(dir_light.target);

//Selector shape
const selector = new THREE.Shape();
export var planetrender = new Planet.PlanetRender(selector);

const select_geometry = new THREE.BufferGeometry().setFromPoints( [] );
const select_material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 5 } );
export const mesh = new THREE.Line( select_geometry, select_material ) ;
scene.add( mesh );

const geom = new THREE.BufferGeometry().setFromPoints( [] );
const mat = new THREE.LineBasicMaterial( { color: 0xff5500, linewidth: 5 } );
export const path_mesh = new THREE.Line( geom, mat ) ;
scene.add( path_mesh );

const bar_geometry = new THREE.BoxGeometry(0.05, 0.01, 0.01);
const bar_material = new THREE.MeshBasicMaterial( { color: 0x00aa00 } );
export const bar_mesh = new THREE.Mesh( bar_geometry, bar_material ) ;
scene.add( bar_mesh );

bar_mesh.position.set(0, 0, 0);

const laser_geometry = new THREE.SphereGeometry(0.01);
const laser_material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
export const laser_mesh = new THREE.Mesh( laser_geometry, laser_material ) ;
scene.add( laser_mesh );

laser_mesh.position.set(0, 0, 0);

//var helper = new THREE.DirectionalLightHelper( dir_light );
//scene.add(helper);


export var farm_model;
export var lake_model;
export var land_model;
export var urban_model;
export var city_model;
export var power_model;
export var mine_model;
export var turret_model;
export var lava_model;
//3D Models
export var models = [];

var manager = new THREE.LoadingManager(); //Loading manager
var p_bar = document.getElementsByClassName("progressbar")[0];
var status_text = document.getElementsByClassName("status")[0];
status_text.style.color = "#FFFFFF";

manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    //Scale progress bar
    p_bar.style.transform = 'scale(' + (itemsLoaded / itemsTotal) + ", 1)";
    status_text.innerHTML = "Loading assets: " + Math.floor((itemsLoaded / itemsTotal * 100) * 10) / 10 + '%';
    console.log((itemsLoaded / itemsTotal * 100) + '%');
};


manager.onLoad = function () {
    console.log('Loading complete');
    models = [farm_model, lake_model, land_model, urban_model,
              city_model, mine_model, power_model, turret_model,
              crosshair_sprite];

    status_text.innerHTML = "Rendering assets...";
    renderer.render( scene, camera ); //render first

    Game.init();

};

const model_loader = new GLTFLoader(manager);

model_loader.load( './models/farm/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.0002, 0.0002, 0.0002);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  farm_model = gltf.scene;

	scene.add( gltf.scene );
} );

model_loader.load( './models/pond/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.01, 0.01, 0.01);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  lake_model = gltf.scene;
	scene.add( gltf.scene );
} );

model_loader.load( './models/land/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.0001, 0.0001, 0.0001);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  land_model = gltf.scene;
	scene.add( gltf.scene );
} );

model_loader.load( './models/urban/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.0020, 0.0020, 0.0020);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  urban_model = gltf.scene;
	scene.add( gltf.scene );
} );

model_loader.load( './models/downtown/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.001, 0.0035, 0.001);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  city_model = gltf.scene;
	scene.add( gltf.scene );
} );


model_loader.load( './models/refinery/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.001, 0.001, 0.001);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  mine_model = gltf.scene;
	scene.add( gltf.scene );
} );

model_loader.load( './models/power/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.00001, 0.00001, 0.00001);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  power_model = gltf.scene;
	scene.add( gltf.scene );
} );

model_loader.load( './models/turret/scene_transparent.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.0003, 0.0003, 0.0003);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  turret_model = gltf.scene;
	scene.add( gltf.scene );
} );


model_loader.load( './models/lava/scene_centered.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.0001, 0.0001, 0.0001);
  gltf.scene.position.set(0, 0, 0);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  lava_model = gltf.scene;
	scene.add( gltf.scene );
} );


export var ore_meshes = [];
var ore_model;

//Load and clone 15 ore models
model_loader.load( './models/mineral/scene.gltf', function ( gltf ) {
  gltf.scene.scale.set(0.01, 0.01, 0.01);
  //getElementsByClassName('OSG_Scene').material.color.set( 'rgb(0, 255, 0)');
  ore_model = gltf.scene;

  for (var i = 0; i < 15; i++){
      var center = planet.centers[vars.ores[i]];
      var tangent = greatCircleTangents(center, [0, 1, 0]);
      var point = new THREE.Vector3(center[0], center[1], center[2]).multiplyScalar(0.98);
      var model = ore_model.clone();

      //Reposition and reorient model
      model.position.set(point.x, point.y, point.z);
      model.up.set(point.x, point.y, point.z);
      model.lookAt(point.x + tangent[0][0], point.y + tangent[0][1], point.z + tangent[0][2]);
      model.visible = false; //invisible before scans
      ore_meshes.push(model);
      scene.add(model);
  }
} );


//Camera controls
export const controls = new OrbitControls(camera, renderer.domElement );

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set( 2, 0, 0 );
camera.updateMatrixWorld();
//export var initial_mat = camera.matrixWorldInverse;
//export const initial_mat = new THREE.Matrix4();
//initial_mat.copy(camera.matrixWorldInverse);//Initial worldmatrix for camera
export var initial_trans = new THREE.Matrix4();
initial_trans.set(0, 0, -1, 0,
                  0, 1, 0, 0,
                  1, 0, 0, -2,
                  0, 0, 0, 1);

controls.enabled = false; //Fix camera controls to start the game
controls.minDistance = 1.25; //Min zoom
controls.update();

const size = 10;
const divisions = 10;

const gridHelper = new THREE.GridHelper( size, divisions, 0xff0000 );
//scene.add( gridHelper );

//Mouse events

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

//Global variables
export var scan = false;

//mySlider
/*
export var mySlider = new CanvasSlider({
     canvas: "mySlider",
     range: {min: 0, max: 50, count: 5},
     start: [0],
     snapToTicks: true,
     showLabels: true,
     showMajorTicks: true,
     showMinorTicks: false,
     showToolTip: true,
     showValueBox: true,
     format: {decimals: 0, prefix: "", suffix: ""},
     handle: {shape: "rectangle", w: 20, h: 20, hue: 240},
     baseColor: {h: 207, s: 60, v: 100}
});
*/
