import * as Scene from './scenes.js';
import * as Assets from './assets.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.module.js';

import * as SkeletonUtils from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/utils/SkeletonUtils.js';

var canvas = document.getElementById('canvas');
var c = canvas.getContext("2d");
var pause = 0;

//Game frames
var frame_rate = 60;
var MS_PER_UPDATE = 1000 / frame_rate;
var lag = 0;
var prev = Date.now();
var elapsed;

//Current game
export var game;
export var game_scene;
export var ins_scene;
export var story_scene;
export var end_scene;
export var fail_scene;

//Scene manager
export var sm;
export var menu;
var t1 = 0;
var t2 = 0;

//Slider for population
var mySlider;

//Special buttons
var heat_button;
var leave_button;
var stay_button;

var convert = false;


export function init(){
    //Resize canvas and overlay to window
    resize();
    //loadObjects();
    //Assets.audioObj.play();

    sm = new Scene.SceneManager();
    menu = new Scene.Menu();

    sm.cur_scene = menu;
    game = new Game(Assets.planet, mySlider);
    game_scene = new Scene.GameScene(game);
    ins_scene = new Scene.Ins();
    story_scene = new Scene.Story();
    end_scene = new Scene.Ending();
    fail_scene = new Scene.Fail();



    //Resize the canvases
    Assets.terra.width = window.innerWidth / 3;
    Assets.terra.height = window.innerHeight / 4;
    Assets.terra.style.left = '0px';
    Assets.terra.style.top = window.innerHeight * 3 / 4 - 30 + 'px';

    Assets.build.width = window.innerWidth / 3;
    Assets.build.height = window.innerHeight / 4;
    Assets.build.style.left = window.innerWidth * 2 / 3 + 'px';
    Assets.build.style.top = window.innerHeight * 3 / 4 - 30 + 'px';

    Assets.indi.width = window.innerWidth;
    Assets.indi.height = window.innerHeight / 15 + 20;
    Assets.indi.style.left = '0px';
    Assets.indi.style.top = '0px';

    //Warning screen on the left
    Assets.warn.width = window.innerWidth / 6;
    Assets.warn.height = window.innerHeight / 4;
    Assets.warn.style.left = '20px';
    Assets.warn.style.top = window.innerHeight / 15 + 40 + 'px';

    //Status screen on the right
    Assets.stat.width = window.innerWidth / 6;
    Assets.stat.height = window.innerHeight / 3;
    Assets.stat.style.left = window.innerWidth - Assets.stat.width - 20 + 'px';
    Assets.stat.style.top = window.innerHeight / 15 + 40 + 'px';

    Assets.slider.width = window.innerWidth / 6;
    Assets.slider.height = window.innerHeight / 6;
    Assets.slider.style.left = window.innerWidth - Assets.slider.width - 20 + 'px';
    Assets.slider.style.top = window.innerHeight / 15 + 60 + 'px';

    mySlider = new CanvasSlider({
         canvas: "mySlider",
         range: {min: 0, max: 50, count: 5},
         start: [25],
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

    heat_button = new Button({x: Assets.stat.width / 2,
      y: Assets.stat.height - Assets.stat.width / 8, width: Assets.stat.width - 10,
      height: Assets.stat.width / 6, label: "Convert to Heater", font: "16px myFont",
      canv_rect: Assets.stat.getBoundingClientRect(),
      onClick: function(){
            //Convert generator to heater
            convert = true;
        }
      });

    //Add Event listeners
    //Mouse down
    function mousedown(e){
        var rect = this.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        //Current scene's Buttons
        sm.cur_scene.handleMouseClick(rect, mouseX, mouseY);
        if (compareRects(Assets.prev_button.canv_rect, rect)){
            Assets.prev_button.handleMouseClick(mouseX, mouseY);
        }
        if (compareRects(Assets.next_button.canv_rect, rect)){
            Assets.next_button.handleMouseClick(mouseX, mouseY);
        }
        if (compareRects(Assets.proceed_button.canv_rect, rect)){
            Assets.proceed_button.handleMouseClick(mouseX, mouseY);
        }
        if (compareRects(heat_button.canv_rect, rect)){
            heat_button.handleMouseClick(mouseX, mouseY);
        }

    }

    function mousemove(e){
        var rect = this.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        //Current scene's Buttons
        sm.cur_scene.handleMouseHover(rect, mouseX, mouseY);
        if (compareRects(Assets.prev_button.canv_rect, rect)){
            Assets.prev_button.handleMouseHover(mouseX, mouseY);
        }
        if (compareRects(Assets.next_button.canv_rect, rect)){
            Assets.next_button.handleMouseHover(mouseX, mouseY);
        }
        if (compareRects(Assets.proceed_button.canv_rect, rect)){
            Assets.proceed_button.handleMouseHover(mouseX, mouseY);
        }
        if (compareRects(heat_button.canv_rect, rect)){
            heat_button.handleMouseHover(mouseX, mouseY);
        }
    }

    Assets.canvas.addEventListener('mousedown', mousedown, false);
    //Assets.canvas.canv = Assets.canvas;
    Assets.terra.addEventListener('mousedown', mousedown, false);
    //Assets.terra.canv = Assets.terra;
    Assets.build.addEventListener('mousedown', mousedown, false);
    //Assets.build.canv = Assets.build;
    Assets.indi.addEventListener('mousedown', mousedown, false);
    Assets.tut.addEventListener('mousedown', mousedown, false);
    Assets.stat.addEventListener('mousedown', mousedown, false);
    //Assets.indi.canv = Assets.indi;

    //Mouse move
    Assets.canvas.addEventListener('mousemove', mousemove, false);
    Assets.terra.addEventListener('mousemove', mousemove, false);
    Assets.build.addEventListener('mousemove', mousemove, false);
    Assets.indi.addEventListener('mousemove', mousemove, false);
    Assets.tut.addEventListener('mousemove', mousemove, false);
    Assets.stat.addEventListener('mousemove', mousemove, false);



    //Key presses
    document.addEventListener('keydown', function(e) {
        if(e.keyCode == 80) { //P key
            if (sm.cur_scene.name === "game") pause = (pause + 1) % 2;
        }
    });


    window.requestAnimationFrame(gameLoop);
}

export function setNewSlider(start, max){
    mySlider = new CanvasSlider({
         canvas: "mySlider",
         range: {min: 0, max: max, count: 5},
         start: [start],
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
}

function check_placement(s){
    for( var entityId in ECS.entities ){
        var entity = ECS.entities[entityId];
        if (entity.components.type.value == s) return true;
    }
    return false;
}

function zero_bugs(s){
    return Object.keys(Assets.planet.bugs).length == 0;
}

function a_levels(s){
    if (game == null) return false;
    return game.res[5] >= s;
}

//The game simulation
export class Game {
    constructor(planet, slider=null){
        this.planet = planet;
        this.planet_heights = planet.getHeights();
        this.tiles = this.planet_heights.length; //Number of tiles on sphere
        //Added data
        this.terrain = new Array(this.tiles).fill(-1); //Terrain type
        this.buildings = new Array(this.tiles).fill(0); //Buildings on tiles
        this.constructing = new Array(this.tiles).fill(0); //currently building
        this.unbuildable = new Array(this.tiles).fill(0); //unbuildable terrain

        this.temperature_centers = new Array(this.tiles).fill(0);
        this.population = new Array(this.tiles).fill(0);

        this.timer = 0;
        this.cutscene = 0; //Whether we are in a cutscene or not

        this.cur_cutscene = null;
        this.progression = 0; //Records how many cutscenes have already be played

        this.task_text = ["Move around the planet.",
                          "Place an Urban terrain on a land region.",
                          "Place a Settlement on an Urban terrain.",
                          "Place a Farm near a Settlement",
                          "Place a Lake near a Settlement",
                          "Scan the planet for ore deposits and click on one.",
                          "Place a Refinery over an Amethystium ore Deposit.",
                          "Place a Generator near your refinery.",
                          "Gather 1000 megatons of Amethystium.",
                          "Place Sentries around your structures to protect them from bugs.",
                          "Use the Ion Beam to eliminate the bugs.",
                          "Gather 1000 megatons of Amethystium.",
                          "Convert generators into heaters to keep the temperature up.",
                          "Mission Complete!"];
        this.res = {0:70, 1:100, 5:700, 6:0, 'e': 1000, 'c': 26.3}; //Resource count
        this.d_res = {0:0, 1:0, 5:0, 6:0, 'e': 5, 'c': 0}; //Change in resources

        this.workables = {4 : [0, 1, 5], 6 : [5, 7]};

        this.paths = [];

        this.tasks = [
            function() {return ((Math.abs(Assets.camera.position.x - 2) > 0.01)
                             && (Math.abs(Assets.camera.position.y) > 0.01)
                             && (Math.abs(Assets.camera.position.z) > 0.01));},
            function() {return check_placement(3);},
            function() {return check_placement(4);},
            function() {return check_placement(0);},
            function() {return check_placement(1);},
            function() {
                var reg = Assets.vars.ores.indexOf(Assets.vars.left_clicked_region);
                console.log(Assets.vars.ores);
                console.log(Assets.vars.left_clicked_region);
                console.log(Assets.vars.ore_visibility[reg]);
                return (Assets.vars.left_clicked_region != -1
                && reg != -1 && Assets.vars.ore_visibility[reg] == 1);
            },
            function() {return check_placement(5);},
            function() {return check_placement(6);},
            function() {return a_levels(100);},
            function() {return check_placement(7);},
            function() { //Check for zero bugs
                      return zero_bugs();
              },
              function() {return a_levels(500);},
              function() {return a_levels(800);},
              function() {return a_levels(1000);}
        ];

        //Game Warnings
        this.warning_time = 0;
        this.warning_message = "";
        this.status_shown = true;
        this.goal = 1000;


        this.total_pop = 0;
        this.targeted = false;
        this.current_ent = null; //Currently selected entity
        this.slider = slider;
        this.balls = [];
        this.good_end = 0; // bad is default
    }

    update_entities(recalc=0){
        this.total_pop = 0;

        this.paths = [];
        for (var entityId in ECS.entities){
            var entity = ECS.entities[entityId];
            if (entity.components.buildtime.value == 0) {
                this.total_pop += entity.components.pop.value; //add pop
                if (recalc == 1) {
                    entity.components.connections.value = {};
                }
                var connections = entity.components.connections.value;
                var type = entity.components.type.value;
                if (type == 4){ //Hub or generator
                    for (var id in ECS.entities){
                        if (!connections.hasOwnProperty(id)){
                            var entity2 = ECS.entities[id];
                            var type2 = entity2.components.type.value;
                            if (entity2.components.buildtime.value == 0 && this.workables[type].includes(type2)){
                                var start = entity.components.tile.value;
                                var goal = entity2.components.tile.value;
                                var path = this.planet.a_star(start, goal);
                                //Ignore impossible paths and paths that are too long
                                if (path[1] != Infinity && path[0].length <= 10){
                                    //Round to two decimal places
                                    //update every half second
                                    connections[id] = {path: path[0], dist: path[1]}; //add key-value pair (id: distance to entity)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    update(delta){
        //Only do updates if we are not currently in a cutscene
        //console.log(Assets.cutscenes);
        if (this.cutscene == 0){
            this.timer++;
            //console.log(this.progression);
            //Update build time
            for (var entityId in ECS.entities){
                var entity = ECS.entities[entityId];
                if (entity.components.buildtime.value > 0) {
                    entity.components.buildtime.value-=delta;
                    var bar = entity.components.bar.value;
                    bar.scale.set(1 - entity.components.buildtime.value / entity.components.totaltime.value, 1, 1)
                    if (entity.components.buildtime.value < delta) {
                        entity.components.buildtime.value = 0;
                        var type = entity.components.type.value;
                        var tile = entity.components.tile.value;

                        this.constructing[tile] = 0; //Not constructing anymore
                        if (type >= 4) { //building
                            this.buildings[tile] = type;
                        } else { //terraforming
                            if (type == 2){ //land terraforming ocean
                                this.planet.heights[tile] = 1;
                            } else {
                                this.terrain[tile] = type;
                            }
                        }
                        var model = entity.components.model.value;
                        model.traverse((node) => {
                            if (node.isMesh) {
                                node.material.opacity = 1.0;
                                node.material.transparent = false;
                            }
                        });

                        //remove bar once construction is finished

                        bar.geometry.dispose();
                        bar.material.dispose();
                        Assets.scene.remove(bar);

                        this.update_entities();
                    }
                }
            }

            //Update resources every half second
            if (this.timer % 30 == 0) {
                this.paths = [];
                //Find paths from settlements to resources
                for (var key of Object.keys(this.d_res)) { //Reset d_resources
                    this.d_res[key] = 0;
                }
                //this.update_entities();
                for (var entityId in ECS.entities){
                    var entity = ECS.entities[entityId];
                    if (entity.components.buildtime.value == 0) {
                        if (entity.components.type.value == 4){ //Settlement
                            //console.log(entity.components.connections.value);
                            for (var x in entity.components.connections.value){
                                var dist = entity.components.connections.value[x].dist;
                                var path = entity.components.connections.value[x].path;
                                this.d_res[ECS.entities[x].components.type.value] += 0.1 / dist;
                                this.paths.push(path);
                            }

                        } else if ( entity.components.type.value == 6){ //Generator
                            if (entity.components.status.value != "heat"){
                                this.d_res[6] += 0.1;
                            } else {
                                this.d_res['c'] += 0.05;
                            }
                            console.log(entity.components.status.value);
                        } else if ( entity.components.type.value == 5){ //Refinery
                            if (this.res[6] >0) this.amethystium += 5;
                            this.d_res[6] -= 0.3;
                        } else if ( entity.components.type.value == 7){ //Sentry
                            this.d_res[6] -= 0.2;
                        }
                    }
                }

                //Food and water
                this.d_res[0] -= this.total_pop / 1000;
                this.d_res[1] -= this.total_pop / 1250;

                Assets.path_mesh.geometry.dispose();
                Assets.path_mesh.geometry = this.paths_geom(this.paths);

                //Update resources
                for (var key of Object.keys(this.res)) { //Reset d_resources
                    this.res[key] = Math.max(this.res[key] + this.d_res[key], 0);
                }
            }
            //After all normal updates, check game progression
            if (this.progression < this.tasks.length && this.tasks[this.progression]()){ //If current task is fulfilled
                this.progression++; //Progress to the next phase of the game
                this.cur_cutscene = Assets.cutscenes.dequeue();
                cur_dialog = 0; //Restart dialogs
                console.log(this.cur_cutscene);
                this.cutscene = 1;
            }

            //Bugs
            if (this.progression == 9 && this.targeted == false) {
                this.set_goals(this.planet.bugs);
            }


            //Cold temp
            if (this.progression == 12) {
                //Shortened version
                Assets.canvas.style.zIndex = '1009';
                Scene.changeScene(end_scene);

                this.d_res['c'] = -0.3;
            }

            if (this.res[6] > 0) this.fight_bugs(this.planet.bugs, delta);
            this.update_bugs(this.planet.bugs);

            //Update laser balls
            for (var i = this.balls.length - 1; i > 0; i--){
                var ball = this.balls[i];
                var cur_coords = ball.components.coords.value;
                var goal_coords = ball.components.goal.value;

                var diff = new THREE.Vector2(goal_coords[0] - cur_coords[0], goal_coords[1] - cur_coords[1]);

                if (diff.length() < 0.7){
                    ball.components.coords.value = [goal_coords[0], goal_coords[1]]; //move to destination

                    //Damage target
                    var target = ball.components.target.value;

                    if (target.components.number.value > 0) target.components.number.value -= 80; //5 hits to kill
                    //Delete model
                    var model = ball.components.model.value;
                    model.geometry.dispose();
                    model.material.dispose();
                    Assets.scene.remove(model);
                    this.balls.splice(i, 1); //remove from balls
                } else {
                    var dir = new THREE.Vector2(goal_coords[0] - cur_coords[0], goal_coords[1] - cur_coords[1]).normalize();
                    dir.multiplyScalar(0.7);
                    var new_pos = new THREE.Vector2(cur_coords[0], cur_coords[1]).add(dir);
                    ball.components.coords.value = [new_pos.x, new_pos.y]; //update position
                }
            }
            if (convert) this.set_heat();
        } else {
            if (!Assets.cutscenes.isEmpty() && this.cur_cutscene == null) {
                if (this.progression == 14 && this.good_end == 1){
                    Assets.cutscenes.dequeue();
                }
                this.cur_cutscene = Assets.cutscenes.dequeue();
            }
        }
        if (cur_dialog == -1) { //End cutscene
            this.cutscene = 0;
            this.cur_cutscene = null;
            if (this.progression == 0){ //When still on camera task, enable orbit controls
                if (!Assets.controls.enabled) {
                  Assets.controls.enabled = true;
                  Assets.controls.enablePan = false; //No right click panning
                }
            }
        }
        if (this.warning_time > 0){
            this.warning_time --;
        } else {
            Assets.warn.style.zIndex = "4"; //move warning screen back
        }

        //Scanning

        //Check ending conditions
        if (this.res[5] >= this.goal){
            //Go to bad ending
        }

        //Fail screen
        if (this.res[0] <= 0 || this.res[1] <= 0 || this.res["c"] <= -10){
            Assets.canvas.style.zIndex = '1009';
            Scene.changeScene(fail_scene);
        }

    }

    render(delta){
        //draw  laser balls
        for (var i = this.balls.length - 1; i > 0; i--){
            var ball = this.balls[i];
            //console.log(ball);
            var cur_pos = ball.components.coords.value;
            var global_coords = ambientCoords(cur_pos[0], cur_pos[1]);
            var model = ball.components.model.value;
            model.position.set(global_coords[0] * 1.05, global_coords[1] * 1.05, global_coords[2] * 1.05);
        }

        //draw depower icons
        for (var entityId in ECS.entities){
            var entity = ECS.entities[entityId];
            if (entity.components.buildtime.value == 0) {
                if ( entity.components.type.value == 5 || entity.components.type.value == 7){ //Generator
                    var icon = entity.components.sprite.value;
                    var model = entity.components.model.value;
                    if (this.res[6] <= 0){

                        icon.position.set(model.position.x * 1.05, model.position.y * 1.05, model.position.z * 1.05);
                    } else {
                        icon.position.set(0, 0, 0);
                    }

                    icon.rotation.copy(model.rotation); //model_copy.rotation is read-only
                }
            }
        }


        if (this.cutscene == 1 && this.cur_cutscene != null) {
            //Move cutscene canvas to the front
            Assets.tut.style.zIndex = "1004";
            Assets.tutc.clearRect(0, 0, Assets.tut.width, Assets.tut.height);
            this.cur_cutscene[0].render();
        }

        //Resource bar
        //Draw indicator bar
        Assets.ic.fillStyle = "rgba(50, 50, 255, 0.5)";
        Assets.ic.fillRect(0, 0, Assets.indi.width, Assets.indi.height - 20);
        if (cur_dialog == -1){
            Assets.ic.fillStyle = "rgba(0, 0, 0, 0.6)";
            Assets.ic.fillRect(0, Assets.indi.height - 20, Assets.indi.width, 20);

            Assets.ic.textAlign = "center";
            Assets.ic.font="bold 16px Arial";
            Assets.ic.fillStyle = "white";
            Assets.ic.fillText(this.task_text[this.progression], Assets.indi.width / 2, Assets.indi.height - 8);
        }
        if (this.warning_time > 0){

            Assets.warn.style.zIndex = "1004";
            Assets.wc.textAlign = "center";

            Assets.wc.font="bold 20px myFont";
            Assets.wc.fillStyle = "red";

            Assets.wc.fillText("WARNING", Assets.warn.width / 2, 20);

            Assets.wc.textAlign = "left";
            Assets.wc.font="16px Verdana";
            Assets.wc.fillStyle = "white";

            wrapText(Assets.wc, this.warning_message, 10, 45, Assets.warn.width - 20, 14);
            //Assets.wc.fillText(this.warning_message, Assets.indi.width / 2, Assets.indi.height + 12);
        }

        if (this.status_shown){
            Assets.stat.style.zIndex = "1005";
            Assets.sc.textAlign = "center";

            Assets.sc.font="bold 20px myFont";
            Assets.sc.fillStyle = "green";

            Assets.sc.fillText("INFORMATION", Assets.stat.width / 2, 20);

            Assets.sc.textAlign = "left";
            Assets.sc.font="16px Verdana";
            Assets.sc.fillStyle = "white";

            //population info
            //draw heater button
            if (this.current_ent != null && this.current_ent.components.type.value == 6) heat_button.draw(Assets.sc);
        }


        Assets.ic.textAlign = "left";
        Assets.ic.font="18px myFont";
        Assets.ic.fillStyle = "white";
        var tab = Assets.indi.width / 6.5;
        Assets.ic.drawImage(images[8], 10, 5, 30, 30);
        Assets.ic.fillText("Food: " + Math.floor(this.res[0] * 100) / 100 + " (" + Math.floor(this.d_res[0] * 100) / 100 + ")", 45, 30);

        Assets.ic.drawImage(images[9], 10 + tab, 5, 30, 30);
        Assets.ic.fillText("Water: " + Math.floor(this.res[1] * 100) / 100 + " (" + Math.floor(this.d_res[1] * 100) / 100 + ")", 45 + tab, 30);

        Assets.ic.drawImage(images[10], 10 + tab * 2, 5, 30, 30);
        Assets.ic.fillText("Power: " + Math.floor(this.res[6] * 100) / 100 + " (" + Math.floor(this.d_res[6] * 100) / 100 + ")", 45 + tab * 2, 30);

        Assets.ic.drawImage(images[11], 10 + tab * 3, 5, 30, 30);
        Assets.ic.fillText("Energy: " + Math.floor(this.res["e"] * 100) / 100 + " (" + Math.floor(this.d_res["e"] * 100) / 100 + ")", 45 + tab * 3, 30);

        Assets.ic.drawImage(images[12], 10 + tab * 4, 5, 30, 30);
        Assets.ic.fillText("Temp: " + Math.floor(this.res["c"] * 100) / 100 + " \xB0C (" + Math.floor(this.d_res["c"] * 100) / 100 + ")", 45 + tab * 4, 30);

        Assets.ic.font="14px myFont";
        Assets.ic.drawImage(images[14], 10, Assets.indi.height - 20, 20, 20);
        Assets.ic.strokeStyle = 'white';
        Assets.ic.strokeRect(40, Assets.indi.height - 15, 80, 15); //border
        Assets.ic.fillRect(40, Assets.indi.height - 15, 80 * (this.res[5] / this.goal), 15); //bar
        Assets.ic.fillText("Amethystium: " + Math.floor(this.res[5] * 100) / 100 + " / " + this.goal +" (" + Math.floor(this.d_res[5] * 100) / 100 + ")", 130, 55);
        Assets.ic.fillText("Total population: " + this.total_pop, Assets.indi.width - 150, 55);

    }


    //Draw lines all from a source, with multiple destinations and paths according to each one
    paths_geom(paths){
        const linesData = [];
        const idx = [];
        //Trace vertices through the paths
        var k = 0;
        for (var i = 0; i < paths.length;i++){
            for (var j = 0; j < paths[i].length; j++){
                var coords = this.planet.centers[paths[i][j]];
                linesData.push(new THREE.Vector3(coords[0] * 1.01, coords[1] * 1.01, coords[2] * 1.01)); //Add vertices
                if (j > 0){
                    idx.push(k-1);
                    idx.push(k);
                }
                k++;
            }
        }

        const bg = new THREE.BufferGeometry().setFromPoints(linesData);
        bg.setIndex(idx);
        return bg;
    }

    warning(placement){
        this.warning_time = 200;
        this.warning_message = placement;
    }

    //Start from region and scan outward for radius of 20
    scan(region, range){
        if (region != -1 && this.res['e'] >= 100) {
            this.res['e'] -= 100;
            var status = new Array(this.planet_heights.length).fill(0);
            var dist = new Array(this.planet_heights.length).fill(0);
            var frontier = new Queue();
            status[region] = 1;
            frontier.enqueue(region);

            while (!frontier.isEmpty()){
                var current = frontier.dequeue();

                //Make tile visible
                var find_ore = Assets.vars.ores.indexOf(current[0]);
                if (find_ore != -1) {
                    Assets.vars.ore_visibility[find_ore] = 1;
                    console.log(Assets.ore_meshes);
                    console.log(find_ore);
                    Assets.ore_meshes[find_ore].visible = true; //reveal ores
                }
                if (dist[current] == range) break;

                var neighbours = this.planet.polygons[current].properties.neighbours;
                for (let neighbour_r of neighbours){
                    if (status[neighbour_r] == 0) {
                        status[neighbour_r] = 1; //label as explored
                        frontier.enqueue(neighbour_r);
                        dist[neighbour_r] = dist[current] + 1;
                    }
                }
            }
            //Assets.vars.center_region = -1;
        } else if (this.res['e'] < 100){
            this.warning("Not enough energy!");
        }
    }

    set_goals(bugs){
      //loop through all entities (these are targets for bugs to attack)
        var targets = [];
        var build_count = 0;
        for (var entityId in ECS.entities){
            var entity = ECS.entities[entityId];
            if (entity.components.type.value >= 0) {
                var tile = entity.components.tile.value;
                if (this.buildings[tile] != 0) build_count++;
                var nei = this.planet.polygons[tile].properties.neighbours;
                var empty_spaces = nei.length;
                for (var i = 0; i < nei.length; i++){
                    var target = nei[i];
                    if (this.buildings[target] == 0 && targets.indexOf(target) == -1){
                        targets.push(target);
                    }
                }
            }
        }
        if (build_count == 0) return 0;

        //Create more goals to match number of bugs
        var i = 0;
        var k = targets.length - 1;
        var l = targets.length;
        while (i < Object.keys(bugs).length - l){
            //randomly pick a target
            var t = targets[k];
            var nei = this.planet.polygons[t].properties.neighbours;
            //Pick a random neighbor
            for (var j = 0; j < nei.length; j++){
                var n = nei[j];
                if (this.buildings[n] == 0 && targets.indexOf(n) == -1){
                    targets.push(n);
                    i++;
                    k++;
                    break;
                }
            }
            //k++;
        }

        for( var bugId in bugs ){
            var bug = bugs[bugId];
            var start = bug.components.tile.value;
            var k = -1;
            for (var i = 0; i < targets.length; i++){
                var goal = targets[i];

                var closest = Infinity;
                var chosen_path = [];
                var path = this.planet.a_star(start, goal, 1);

                if (path[1] < closest){
                    chosen_path = path[0];
                    closest = path[1];
                }
                bug.addComponent( new ECS.Components.Path(chosen_path));
                bug.addComponent( new ECS.Components.Goal(goal));
                k = i;
                //already_set.push(goal);
            }
            targets.splice(k, 1); //take out from targets
        }

        this.targeted = true;

    }

    fight_bugs(bugs, delta){
        if (!this.targeted || Object.keys(bugs).length == 0) return 0;
        //Run A-star on each
        for (var entityId in ECS.entities){
            var entity = ECS.entities[entityId];
            var c = 0;
            if (entity.components.type.value == 7) { // Sentry
                var tile = entity.components.tile.value;
                var tile_coords = this.planet.points.features[tile].coordinates;

                if (entity.components.cooldown.value > 0) {
                    entity.components.cooldown.value-=delta;
                }
                if (entity.components.cooldown.value < delta) {
                    entity.components.cooldown.value = 0;
                    //target bugs
                    for( var bugId in bugs ){ //
                        if (c == 0){
                            var bug = bugs[bugId];
                            var speed = bug.components.speed.value;
                            var bug_tile = bug.components.tile.value;
                            var goal_coords = this.planet.points.features[bug_tile].coordinates;
                            var dist = geoDist(goal_coords[0], goal_coords[1], tile_coords[0], tile_coords[1]);
                            if (dist <= Math.PI / 16 && bug.components.number.value > 0) { //range of 1/6 circumference

                                var model_copy = SkeletonUtils.clone(Assets.laser_mesh);
                                model_copy.geometry = model_copy.geometry.clone();
                                model_copy.material = model_copy.material.clone();
                                Assets.scene.add(model_copy);
                                //model_copy.material = model_copy.material.clone();
                                var ball = new ECS.Entity();
                                //record COORDINATES, not their tiles
                                ball.addComponent( new ECS.Components.Coords([tile_coords[0], tile_coords[1]]));
                                ball.addComponent( new ECS.Components.Goal([goal_coords[0], goal_coords[1]]));
                                ball.addComponent( new ECS.Components.Model(model_copy));
                                ball.addComponent( new ECS.Components.Target(bug));
                                this.balls.push(ball);

                                entity.components.cooldown.value = 40; //Reset cooldown
                                c++;
                            }
                        }
                    }
                }
            }
          }
          //console.log(this.balls);
    }

    update_bugs(bugs) {
        if (!this.targeted || Object.keys(Assets.planet.bugs).length == 0) return 0;
        console.log("Bugs: " + Object.keys(Assets.planet.bugs).length);
        //Run A-star on each
        for( var entityId in bugs ){
            var entity = bugs[entityId];
            var speed = entity.components.speed.value;
            var goal_tile = entity.components.goal.value;
            var goal_pos = this.planet.points.features[goal_tile].coordinates;
            //var cur_tile = entity.components.tile.value;
            var cur_pos = entity.components.coords.value;
            var path = entity.components.path.value;
            //Check for other agents
            /*
            for( var agentId in bugs ){
                var agent = bugs[agentId];
                if (agent.components.tile.value == path[path.length - 1]) entity.components.status.value == "pause";
            }
            */
            if (entity.components.number.value > 0) {
                if (cur_pos[0] != goal_pos[0] || cur_pos[1] != goal_pos[1]){
                    //Keep moving
                    //Recalc current tile
                    if (path.length > 0){
                        entity.components.tile.value = this.planet.find_site(cur_pos[0], cur_pos[1]);

                        //Move toward next tile in path
                        var next_tile = path[path.length - 1];
                        var next_tile_coords = this.planet.points.features[next_tile].coordinates;
                        var diff = new THREE.Vector2(next_tile_coords[0] - cur_pos[0], next_tile_coords[1] - cur_pos[1]);

                        //If already on next tile, delete last entry from path array
                        if (diff.length() < speed) {
                            cur_pos[0] = next_tile_coords[0];
                            cur_pos[1] = next_tile_coords[1];
                            path.pop();
                        }
                        if (path.length > 0){
                            next_tile = path[path.length - 1];
                            next_tile_coords = this.planet.points.features[next_tile].coordinates;
                        }
                        diff = new THREE.Vector2(next_tile_coords[0] - cur_pos[0], next_tile_coords[1] - cur_pos[1]);
                        var dir = diff.normalize();
                        dir.multiplyScalar(speed);
                        var new_pos = new THREE.Vector2(cur_pos[0], cur_pos[1]).add(dir);
                        entity.components.coords.value = [new_pos.x, new_pos.y]; //update position
                    }
                }
            } else {
                Assets.scene.remove(entity.components.model.value); //Delete model from scene
                delete bugs[entityId]; //delete bug entity from bugs object
            }
        }
    }

    set_heat(){
        if (this.current_ent != null && this.current_ent.components.status.value != "heat") {
            this.current_ent.components.status.value = "heat";
            //add heat icon
            var model = this.current_ent.components.model.value;
            var model_copy = Assets.heat_sprite.clone();
            Assets.scene.add(model_copy);
            model_copy.position.set(model.position.x * 1.05, model.position.y * 1.05, model.position.z * 1.05);

            model_copy.rotation.copy(model.rotation); //model_copy.rotation is read-only


        }
        convert = false;
    }

}


function update(delta){

}

function render(){
}

//Game loop
function gameLoop(current){
    current = Date.now();
    elapsed = current - prev;
    prev = current;
    lag += elapsed;

    if (pause == 0){
        while (lag >= MS_PER_UPDATE) {
            //Update
            t1 = Date.now();
            sm.update(1);
            t2 = Date.now();
            //console.log("Time taken to update:" + (t2 - t1) + "ms.");
            lag -= MS_PER_UPDATE;
        }
        //console.log("Lag: " + lag + "ms.");

        //ol.clearRect(0, 0, overlay.width, overlay.height);
    } else {
        drawPause();
    }
    //Render
    sm.render(lag / MS_PER_UPDATE);


    //window.cancelAnimationFrame(req);

    window.requestAnimationFrame(gameLoop);

}
