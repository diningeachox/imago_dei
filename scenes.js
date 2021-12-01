
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.module.js';
import * as SkeletonUtils from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/utils/SkeletonUtils.js';
import * as Assets from './assets.js';
import * as Game from "./game.js";


var mouse_clicked = false;
var left_clicked = false;
var initial_mat;

function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    //mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    //mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    var rect = Assets.renderer.domElement.getBoundingClientRect();
    Assets.mouse.x = ( ( event.clientX - rect.left ) / ( rect.width - rect.left ) ) * 2 - 1;
    Assets.mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;

}

function onMouseClick( event ) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    if (event.button == 2) mouse_clicked = true; //Only count right clicks
    if (event.button == 0) left_clicked = true;

}
function onMouseUp( event ) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    //mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    //mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse_clicked = false;
    left_clicked = false;

}

var incomp = {"water_terra": "This terraforming operation must be performed on land!",
              "water_build": "This construction must be done on land!",
              "settle": "A Settlement must be built on an Urban area!",
              "ore": "A Refinery must be built on an Amethystium ore deposit!",
              "construct": "This region is currently being terraformed or under construction!",
              "land_terra": "This terraforming operation must be performed on the ocean!",
              "energy": "Not enough energy!",
              "unbuild": "The ground has degraded beyond terraformability!"
}

//Lookup tables for entities
var hp = [500, 500, 500, 500,
          1200, 800, 300, 600];

//var bt = [300, 300, 300, 300, 700, 500, 400, 500];
//Debug only
var bt = [30, 30, 30, 30, 50, 30, 30, 30];

var maxpop = [200, 100, 0, 0,
        1000, 500, 400, 500];

var minpower = [0, 0, 0, 0,
        0, 100, 0, 50];

function place(game, region, sel, lookat){
    var planet = game.planet;
    //Check placement compatibility
    if (sel == 2 && planet.heights[region] >= 0) return incomp["land_terra"];
    if (sel != 2 && sel < 4 && planet.heights[region] < 0) return incomp["water_terra"];
    if (sel >= 4 && sel != 8 && planet.heights[region] < 0) return incomp["water_build"];
    if (sel == 4 && game.terrain[region] != 3) return incomp["settle"];
    if (sel == 5 && Assets.vars.ores.indexOf(region) == -1) return incomp["ore"];
    if (game.constructing[region] == 1 && sel != 8) return incomp["construct"];
    if (game.unbuildable[region] == 1 && sel != 8) return incomp["unbuild"];

    if (sel != -1 && sel != 8 && planet.heights[region] > 0){

        game.constructing[region] = 1;
        //Add entity
        var building = new ECS.Entity();
        building.addComponent( new ECS.Components.Type(sel));
        building.addComponent( new ECS.Components.Status("building"));
        building.addComponent( new ECS.Components.Tile(region));
        building.addComponent( new ECS.Components.HP(hp[sel]));
        building.addComponent( new ECS.Components.Pop(0));

        building.addComponent( new ECS.Components.Connections({}));
        building.addComponent( new ECS.Components.MaxPop(maxpop[sel]));
        building.addComponent( new ECS.Components.BuildTime(bt[sel]));
        building.addComponent( new ECS.Components.TotalTime(bt[sel]));
        building.addComponent( new ECS.Components.Cooldown(0));
        building.addComponent( new ECS.Components.Sprite(null));

        if (sel == 4){ //hub
            building.components.pop.value = 1000; //1000 population
        } else if (sel == 5 || sel == 7){
            //copy depower sprite
            var sprite_copy = Assets.depower_sprite.clone();
            building.components.sprite.value = sprite_copy;
            Assets.scene.add(sprite_copy);
        }

        //Clone mesh for selected object
        //var model_copy = Assets.models[sel].clone();
        var model_copy = SkeletonUtils.clone(Assets.models[sel]);
        var center = Assets.planet.centers[region];
        model_copy.position.set(center[0], center[1], center[2]);

        model_copy.lookAt( new THREE.Vector3(center[0], center[1], center[2]).add(lookat));
        model_copy.up.set(center[0], center[1], center[2]);

        //Transparent in build phase
        model_copy.traverse((node) => {
            if (node.isMesh) {
                node.material = node.material.clone(); //create copy of meshes
                node.material.transparent = true;
                node.material.opacity = 0.3;
            }
        });
        Assets.scene.add(model_copy);

        building.addComponent( new ECS.Components.Model(model_copy));

        //Progress bar model copy
        var model_copy = SkeletonUtils.clone(Assets.bar_mesh);
        model_copy.position.set(center[0] * 1.03, center[1] * 1.03, center[2] * 1.03);

        model_copy.lookAt( new THREE.Vector3(center[0] * 1.03, center[1] * 1.03, center[2] * 1.03).add(lookat));
        model_copy.up.set(center[0] * 1.03, center[1] * 1.03, center[2] * 1.03);
        //Transparent in build phase
        model_copy.geometry = model_copy.geometry.clone();
        model_copy.material = model_copy.material.clone();
        Assets.scene.add(model_copy);

        building.addComponent( new ECS.Components.Bar(model_copy));

        ECS.entities[building.id] = building;

    } else if (sel == 8) { //Ion Beam
        //Reset everything on tile
        game.terrain[region] = -1;
        game.buildings[region] = 0;
        game.unbuildable[region] = 1;
        //Delete models on that tile
        for (var entityId in ECS.entities){
            var entity = ECS.entities[entityId];
            if (entity.components.tile.value == region){
                var model = entity.components.model.value;
                Assets.scene.remove(model);
                //Delete meshes
                model.traverse((node) => {
                    if (node.isMesh) {
                        node.material.dispose();
                    }
                });
            }
        }
        //Delete bugs on the tile
        for (var entityId in Assets.planet.bugs){
            var entity = Assets.planet.bugs[entityId];
            if (entity.components.tile.value == region){
                var model = entity.components.model.value;
                Assets.scene.remove(model);
                delete Assets.planet.bugs[entityId];
            }
        }
        //place lava model
        var model_copy = SkeletonUtils.clone(Assets.lava_model);
        var center = Assets.planet.centers[region];
        model_copy.position.set(center[0], center[1], center[2]);

        model_copy.lookAt( new THREE.Vector3(center[0], center[1], center[2]).add(lookat));
        model_copy.up.set(center[0], center[1], center[2]);

        //Transparent in build phase
        model_copy.traverse((node) => {
            if (node.isMesh) {
                node.material = node.material.clone(); //create copy of meshes
            }
        });
        Assets.scene.add(model_copy);
    }

    Assets.ui.setSelection(-1); //Reset selection
    return 1;

}

var cur_region = -1;


export class SceneManager {
    constructor(){
        this.cur_scene = null;
    }
    update(delta){
        this.cur_scene.update(delta);
    }
    render(delta){
        this.cur_scene.render(delta);
    }
}

//Abstract scene class
export class Scene {
  constructor() {
    if (this.constructor == Scene) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.buttons = [];
  }

  update(delta) {
    throw new Error("Method 'update()' must be implemented.");
  }

  render(delta) {
    throw new Error("Method 'render()' must be implemented.");
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

  load() {
    for (var i = 0; i < this.buttons.length; i++){
        this.buttons[i].hover = 0;
    }
  }

  unload() {
    throw new Error("Method 'unload()' must be implemented.");
  }
}

/**
 * Menu class, extends Scene class
 */
export class Menu extends Scene {
    constructor(){
      super();
      this.name = "menu";
      //Clicking play will change scene from "menu" to "game"
      var play_button = new Button({x: canvas.width / 2, y:Assets.canvas.height / 2, width:150, height:50, label:"Play",
            canv_rect: Assets.canvas.getBoundingClientRect(),
            onClick: function(){
                changeScene(Game.story_scene);
            }
           });
      var ins_button = new Button({x: canvas.width / 2, y:Assets.canvas.height / 8 * 5, width:150, height:50, label:"Credits",
            canv_rect: Assets.canvas.getBoundingClientRect(),
            onClick: function(){
                changeScene(Game.end_scene);
            }
          });
      this.buttons = [play_button, ins_button];
    }
    update(delta) {}
    render(delta){
        Assets.canvas.style.zIndex = "1001";
        Assets.c.clearRect(0, 0, canvas.width, canvas.height);
        Assets.c.drawImage(images[7], 0, 0, canvas.width, canvas.height);

        //Draw shadow
        var grd = Assets.c.createLinearGradient(0, 0, canvas.width, 0);
        grd.addColorStop(0, "rgba(0, 0, 0, 0.7)");
        grd.addColorStop(0.5, "rgba(0, 0, 0, 0)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0.7)");

        // Fill with gradient
        Assets.c.fillStyle = grd;
        Assets.c.fillRect(0, 0, canvas.width, canvas.height);

        //Assets.c.fillStyle = "beige";
        //Assets.c.fillRect(0, 0, canvas.width, canvas.height);
        //title
        Assets.c.font="100px titleFont";
        Assets.c.fillStyle = "white";
        Assets.c.textAlign = "center";
        Assets.c.shadowColor = "black" // string
        Assets.c.shadowOffsetX = Assets.c.measureText("Imago Dei").width + blur * 2; // integer
        Assets.c.shadowOffsetY = Assets.c.measureText("Imago Dei").height + blur * 2; // integer
        Assets.c.shadowBlur = 20; // integer
        Assets.c.fillText("Imago Dei", canvas.width/2, 100);

        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(Assets.c);
        }
    }
    unload(){
    }
}

/**
 * Game class, extends Scene class
 */
export class GameScene extends Scene {
    constructor(game){
      super();
      this.name = "game";
      //Current Game
      this.game = game;
      //Buttons
      this.buttons = [];

    }
    update(delta) {
        // calculate objects intersecting the picking ray
        Assets.camera.updateMatrixWorld();
        //Assets.camera.updateProjectionMatrix();
        Assets.raycaster.setFromCamera( Assets.mouse, Assets.camera );
        //Make sure to only check intersections with the sphere (to save memory)
        const intersects = Assets.raycaster.intersectObjects([Assets.sphere], true);

        //New "north pole" from perspective of camera - i.e. the topmost point of intersection of camera view with sphere
        var transformation = Assets.camera.matrixWorld.multiply(Assets.initial_trans);
        //var transformation = Assets.initial_mat.multiply(Assets.camera.matrixWorld);
        var new_north_pole = new THREE.Vector3(0, 1, 0).applyMatrix4(transformation);

        if (intersects.length == 0){
            for (var i = 0; i < Assets.models.length; i++){

                Assets.models[i].position.set(0, 0, 0);
            }
            //Assets.ui.setSelection(-1); //Reset selection
        }
        for ( var i = 0; i < intersects.length; i++ ) {
            /*
                An intersection has the following properties :
                    - object : intersected object (THREE.Mesh)
                    - distance : distance from camera to intersection (number)
                    - face : intersected face (THREE.Face3)
                    - faceIndex : intersected face index (number)
                    - point : intersection point (THREE.Vector3)
                    - uv : intersection point in the object's UV coordinates (THREE.Vector2)
            */
            if (intersects[i].object.type == 'Mesh' && intersects[i].object.name == ""){ //If it intersects sphere
                var sel = Assets.ui.selection;
                //Place model during setSelection

                var point = intersects[i].point;

                var s_point = sphericalCoords(point.x, point.y, point.z);

                var polygon = Assets.planet.find(s_point[0], s_point[1]);
                var region = Assets.planet.find_site(s_point[0], s_point[1]);
                var geom = Assets.planetrender.setSelector(polygon);

                if (left_clicked){
                    Assets.vars.left_clicked_region = region;
                    //Select structure
                    for (var entityId in ECS.entities){
                        var entity = ECS.entities[entityId];
                        //if selecte tile has something on it that's not urban tile
                        var unchange = [3, 4];
                        if (region == entity.components.tile.value && unchange.indexOf(entity.components.type.value) == -1){
                            this.game.status_shown = true;
                            this.game.current_ent = entity;

                            var max_pop = entity.components.maxpop.value;
                            var pop = entity.components.pop.value;
                            Game.setNewSlider(pop, max_pop);
                        }
                    }
                }

                //Replace geometry with the new selector polygon
                Assets.mesh.geometry.dispose();
                Assets.mesh.geometry = geom;

                if (sel != -1 && Assets.ui.build == -1){
                    //Calculate the tangent vector at point of intersection which points to the new "north pole" (i.e. up from camera's POV)
                    var tangent = greatCircleTangents([point.x, point.y, point.z],
                      [new_north_pole.x, new_north_pole.y, new_north_pole.z]);


                    //Reposition and reorient model
                    var add = 0.01 * (sel == 8);
                    Assets.models[sel].position.set(point.x + add, point.y + add, point.z + add);
                    Assets.models[sel].up.set(point.x + add, point.y + add, point.z + add);
                    Assets.models[sel].lookAt(point.x + add + tangent[0][0], point.y  + add+ tangent[0][1], point.z + add + tangent[0][2]);

                    if (mouse_clicked){
                        Assets.models[sel].position.set(0, 0, 0);
                        var placement = place(this.game, region, sel, new THREE.Vector3(tangent[0][0], tangent[0][1], tangent[0][2]), Assets.planet);
                        mouse_clicked = false;

                        if (placement != 1) {
                          this.game.warning(placement); //Render warning to player
                        }
                        //Assets.ui.build = sel;
                    } else if (left_clicked){
                        //clear selection on left click
                        Assets.models[sel].position.set(0, 0, 0);

                        //Assets.ui.setSelection(-1); //Reset selection
                    }

                }
            }

        }
        //Render bugs after the generator tasks
        if (this.game.targeted) Assets.planet.render_bugs(new_north_pole);

        //Calculate intersections from middle of camera
        Assets.camera.updateMatrixWorld();
        Assets.raycaster.setFromCamera( new THREE.Vector2(0, 0), Assets.camera );
        //Make sure to only check intersections with the sphere (to save memory)
        const center_intersects = Assets.raycaster.intersectObjects([Assets.sphere], true);
        if (center_intersects.length > 0) {
            var point = center_intersects[0].point;
            var s_point = sphericalCoords(point.x, point.y, point.z);
            Assets.vars.center_region = Assets.planet.find_site(s_point[0], s_point[1]);

        }
        this.game.update(delta);
    }
    render(delta){

        Assets.controls.update();
        Assets.renderer.render( Assets.scene, Assets.camera );
        Assets.dir_light.position.copy( Assets.camera.position );
        //Clear canvases
        Assets.tc.clearRect(0, 0, Assets.terra.width, Assets.terra.height);
        Assets.bc.clearRect(0, 0, Assets.build.width, Assets.build.height);
        Assets.ic.clearRect(0, 0, Assets.indi.width, Assets.indi.height);
        Assets.tutc.clearRect(0, 0, Assets.tut.width, Assets.tut.height);
        Assets.sc.clearRect(0, 0, Assets.stat.width, Assets.stat.height);
        Assets.wc.clearRect(0, 0, Assets.warn.width, Assets.warn.height);

        //backgrounds
        Assets.wc.fillStyle = "rgba(255, 200, 200, 0.3)";
        Assets.wc.fillRect(0, 0, Assets.warn.width, Assets.warn.height);

        Assets.sc.fillStyle = "rgba(200, 255, 255, 0.3)";
        Assets.sc.fillRect(0, 0, Assets.stat.width, Assets.stat.height);
        //Control interface (with buttons)

        //Draw buttons
        for (var i = 0; i < 4; i++) {
            this.buttons[i].draw(Assets.tc);
        }
        for (var i = 4; i < 8; i++) {
            this.buttons[i].draw(Assets.bc);
        }
        this.buttons[8].draw(Assets.ic); //Scan
        this.buttons[9].draw(Assets.ic); //Ion Beam

        if (this.game.progression == 12){

            this.buttons[10].draw(Assets.tutc); //Leave
            this.buttons[11].draw(Assets.tutc); //Stay
        }


        this.game.render(delta);
    }
    load(){
      //Load new game, plus all assets
        super.load();


        Assets.vars.ore_visibility = new Array(15).fill(0); //Whether a given deposit is visible or not
        if (!Assets.vars.first){
            Assets.vars.ores = Assets.planet.generate_ore(15); //Generate 15 ore deposits
            Assets.planet.generate_bugs(15, Assets.bug_sprite, Assets.scene); //generate bugs
        }
        for (var i = 0; i < 15; i++){
            Assets.ore_meshes[i].visible = false;
        }

        //reposition camera
        Assets.camera.position.set( 2, 0, 0 );
        Assets.camera.updateMatrixWorld();

        //Add mouse listeners for the three js scene
        window.addEventListener( 'mousemove', onMouseMove, false );
        window.addEventListener( 'mousedown', onMouseClick, false );
        window.addEventListener( 'mouseup', onMouseUp, false );
        //Clear and reorder canvases
        Assets.c.clearRect(0, 0, canvas.width, canvas.height);
        Assets.renderer.domElement.style.position = 'relative'; //necessary to use z-index
        Assets.renderer.domElement.style.zIndex = '1000';

        Assets.canvas.style.zIndex = '1';
        Assets.terra.style.zIndex = "1001";
        Assets.build.style.zIndex = "1002";
        Assets.indi.style.zIndex = "1003";
        Assets.slider.style.zIndex = "7";

        Assets.load_cutscenes();

        this.game = new Game.Game(Assets.planet);
        //Start game with cutscene
        //console.log(this.game.progression);
        this.game.cutscene = 1;


        console.log("New game");

        var button_width = Assets.terra.width / 5;
        var button_names = ["Farm", "Lake", "Land", "Urban",
                    "Hub", "Refinery", "Generator", "Sentry"];
        //Terraforming buttons
        for (var k = 0; k < 4; k++) {
            var button = new Button({x: (k + 0.5) * button_width + 10 * k + 20,
              y: 20, width:button_width,
              height: button_width / 3, label: button_names[k], font: button_width / 4 + "px myFont",
              canv_rect: Assets.terra.getBoundingClientRect(), ind:k,
              onClick: function(){
                    Assets.ui.setSelection(this.ind);
                }
              });
            this.buttons.push(button);
        }
        //Building buttons
        for (var i = 4; i < 8; i++) {
            var button = new Button({x: ((i - 4) + 0.5) * button_width + 20 * (i - 4),
              y: 20, width:button_width + 10,
              height: button_width / 3, label: button_names[i], font: button_width / 4 + "px myFont",
              canv_rect: Assets.build.getBoundingClientRect(), ind:i,
              onClick: function(){
                    Assets.ui.setSelection(this.ind);
                }
              });
            this.buttons.push(button);
        }

        //Scan button
        var g = this.game;
        var scan_button = new Button({x: Assets.indi.width - button_width * 2,
          y: 20, width: button_width,
          height: 25, label: "Scan", font: button_width / 4 + "px myFont",
          canv_rect: Assets.indi.getBoundingClientRect(),
          onClick: function(){
                g.scan(Assets.vars.center_region, 12); //Scan part of the planet facing the camera
            }
          });
        this.buttons.push(scan_button);

        var ion_button = new Button({x: Assets.indi.width - button_width + 10,
          y: 20, width: button_width,
          height: 25, label: "Ion Beam", font: button_width / 4 + "px myFont",
          canv_rect: Assets.indi.getBoundingClientRect(), ind: 8,
          onClick: function(){
                Assets.ui.setSelection(8); //ion beam option
            }
          });
        this.buttons.push(ion_button);

        //Ending Buttons
        var leave_button = new Button({x: button_width * 2 - 10,
          y: Assets.tut.height / 2, width: button_width * 2,
          height: 40, label: "Threaten to Leave", font: button_width / 4 + "px myFont",
          canv_rect: Assets.tut.getBoundingClientRect(),
          onClick: function(){
                g.good_end = 1;
            }
          });
        this.buttons.push(leave_button);

        var stay_button = new Button({x: Assets.tut.width - button_width * 2 + 10,
          y: Assets.tut.height / 2, width: button_width * 2,
          height: 40, label: "Ignore M'Kymni", font: button_width / 4 + "px myFont",
          canv_rect: Assets.tut.getBoundingClientRect(),
          onClick: function(){
                g.good_end = 0;
            }
          });
        this.buttons.push(stay_button);
        console.log(this.buttons);
    }
    unload(){
        this.game = null;
        //Delete all entities and their Models
        for (var entityId in ECS.entities){
            var entity = ECS.entities[entityId];
            var model = entity.components.model.value;
            Assets.scene.remove(model);
            //Delete meshes
            model.traverse((node) => {
                if (node.isMesh) {
                    node.material.dispose();
                }
            });

            delete ECS.entities[entityId];
        }
        //Delete bugs on the tile
        for (var entityId in Assets.planet.bugs){
            var entity = Assets.planet.bugs[entityId];
            var model = entity.components.model.value;
            Assets.scene.remove(model);
            delete Assets.planet.bugs[entityId];
        }
        //Make all ore invisibile again
        for (var i = 0; i < Assets.vars.ore_visibility.length; i++){
            Assets.vars.ore_visibility[i] = 0;
        }
        Assets.vars.first = false;
    }
}

/**
 * Game class, extends Scene class
 */
export class Ins extends Scene {
    constructor(){
      super();
      this.name = "ins";
      //Buttons
      var menu_button = new Button({x: canvas.width / 2, y:canvas.height - 100, width:150, height:50, label:"Back",
            canv_rect: Assets.canvas.getBoundingClientRect(),
            onClick: function(){
                changeScene(Game.menu);
            }
           });

     var play_button = new Button({x: canvas.width / 2, y:200, width:150, height:50, label:"Play",
          canv_rect: Assets.canvas.getBoundingClientRect(),
           onClick: function(){
               var t = Date.now();
               changeScene(Game.game_scene);
               var s = Date.now();
               console.log("Time taken to start game:" + (s - t) + "ms.");
           }
          });
      this.buttons = [menu_button, play_button];
    }
    update(delta) {
    }
    render(delta){

        Assets.c.clearRect(0, 0, canvas.width, canvas.height);
        Assets.c.drawImage(images[7], 0, 0, canvas.width, canvas.height);

        //Draw shadow
        var grd = Assets.c.createLinearGradient(0, 0, canvas.width, 0);
        grd.addColorStop(0, "rgba(0, 0, 0, 0.7)");
        grd.addColorStop(0.5, "rgba(0, 0, 0, 0)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0.7)");

        // Fill with gradient
        Assets.c.fillStyle = grd;
        Assets.c.fillRect(0, 0, canvas.width, canvas.height);

        Assets.c.font="80px titleFont";
        Assets.c.fillStyle = "white";
        Assets.c.textAlign = "center";
        Assets.c.fillText("Credits", canvas.width/2, 90);
        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(Assets.c);
        }

        Assets.c.font="22px myFont";

        Assets.c.fillStyle = "white";
        Assets.c.fillText("Game Design: Radar (Jack Ding)", canvas.width/2, 290);
        Assets.c.fillText("Music: sscheidel (on pixabay.com)", canvas.width/2, 340);
        Assets.c.fillText("3D Assets: sketchfab.com", canvas.width/2, 390);
    }
    unload(){
    }
}

/**
 * Game class, extends Scene class
 */
export class Story extends Scene {
    constructor(){
      super();
      this.name = "story";
      //Buttons

     var play_button = new Button({x: canvas.width - 120, y:40, width:150, height:50, label:"Skip Intro",
          canv_rect: Assets.canvas.getBoundingClientRect(),
           onClick: function(){
               var t = Date.now();
               changeScene(Game.game_scene);
               var s = Date.now();
               console.log("Time taken to start game:" + (s - t) + "ms.");
           }
          });
      this.buttons = [play_button];
    }
    update(delta) {
    }
    render(delta){

        Assets.c.clearRect(0, 0, canvas.width, canvas.height);
        Assets.c.fillStyle = "black";
        Assets.c.fillRect(0, 0, canvas.width, canvas.height);

        //Draw shadow
        var grd = Assets.c.createLinearGradient(0, 0, canvas.width, 0);
        grd.addColorStop(0, "rgba(0, 0, 0, 0.7)");
        grd.addColorStop(0.5, "rgba(0, 0, 0, 0)");
        grd.addColorStop(1, "rgba(0, 0, 0, 0.7)");

        // Fill with gradient
        Assets.c.fillStyle = grd;
        Assets.c.fillRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(Assets.c);
        }

        Assets.c.font="24px myFont";

        Assets.c.textAlign = "left";
        Assets.c.fillStyle = "white";
        var text = "After the calamitous events of the 21st century, humanity has rediscovered religion as they continued their expansion into space. The continued successes of planetary colonization and technological development further reinforced the idea that the homo sapiens species was favored by God to master the universe."
        var text2 = "However not all was rosy for humanity. The vast emptiness of space, coupled with ever-growing experiences of humanity's smallness in comparison, drove many in the realm to question the credo of God. The final fuse was the assassination of Archbishop Raymond Flores in 2504, after which the intergalactic human empire cleaved into two: the Cybersectarian Order, who clinged on to their religious teachings, and the Centauri Coalition, who renounced all notions of a higher power."
        var text3 = "War waged relentlessly between the two sides. Little by little, the nonbelievers grew, and the Cybersectarian Order was losing the war of attrition. In a last ditch effort to try to turn the tide of war, the President of the Cybersectarian Order along with important religious figures of the cabinet, set off to a distant and exotic planet in search of a powerful mineral."
        var text4 = "The story of Imago Dei starts with their arrival at the violet planet 45X-7010."

        wrapText(Assets.c, text, 50, 150, canvas.width - 100, 20);
        wrapText(Assets.c, text2, 50, 250, canvas.width - 100, 20);
        wrapText(Assets.c, text3, 50, 400, canvas.width - 100, 20);
        wrapText(Assets.c, text4, 50, 500, canvas.width - 100, 20);
    }
    unload(){
    }
}

export class Fail extends Scene {
    constructor(){
      super();
      this.name = "story";
      //Buttons

     var play_button = new Button({x: canvas.width - 120, y:canvas.height - 40, width:150, height:50, label:"Play Again",
          canv_rect: Assets.canvas.getBoundingClientRect(),
           onClick: function(){
               var t = Date.now();
               changeScene(Game.game_scene);
               var s = Date.now();
               console.log("Time taken to start game:" + (s - t) + "ms.");
           }
          });
      this.buttons = [play_button];
    }
    update(delta) {
    }
    render(delta){

        Assets.c.clearRect(0, 0, canvas.width, canvas.height);
        Assets.c.fillStyle = "black";
        Assets.c.fillRect(0, 0, canvas.width, canvas.height);

        var dialog = new Dialog(Assets.c, 20, 20, canvas.width - 40, canvas.height / 4, "It was not to be! We can no longer stay on this planet. " +
                      "All personnel withdraw to Icarus. We will execute plan B in 12 hours. ", 3);
        dialog.render();

        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(Assets.c);
        }

    }
    unload(){
    }
}

export class Ending extends Scene {
    constructor(){
      super();
      this.name = "story";
      //Buttons

     var play_button = new Button({x: canvas.width - 120, y:40, width:150, height:50, label:"Play Again",
          canv_rect: Assets.canvas.getBoundingClientRect(),
           onClick: function(){
               var t = Date.now();
               changeScene(Game.game_scene);
               var s = Date.now();
               console.log("Time taken to start game:" + (s - t) + "ms.");
           }
          });
      this.buttons = [play_button];
    }
    update(delta) {
    }
    render(delta){

        Assets.c.clearRect(0, 0, canvas.width, canvas.height);
        Assets.c.fillStyle = "black";
        Assets.c.fillRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(Assets.c);
        }

        Assets.c.font="50px myFont";

        Assets.c.textAlign = "center";
        Assets.c.fillStyle = "white";
        var text = "THE END";
        var text2 = "Thank you for playing!";
        Assets.c.fillText(text, canvas.width / 2, canvas.height / 3);
        Assets.c.fillText(text2, canvas.width / 2, canvas.height / 3 * 2);
    }
    unload(){
    }
}

//Change scenes
export function changeScene(new_scene){
    if (Game.sm.cur_scene != null) Game.sm.cur_scene.unload();
    new_scene.load();
    Game.sm.cur_scene = new_scene;
}


// A pause scene, but more convenient to not put it into a class
export function drawPause(){

    tc.clearRect(0, 0, terra.width, terra.height);
    tc.fillStyle = "rgba(0, 0, 0, 0.5)"; //Transparent black
    tc.fillRect(0, 0, terra.width, terra.height);
    tc.font = "50px arial";
    tc.fillStyle = "black";
    tc.fillText("PAUSED", terra.width / 2 - 100, terra.height / 2);

}
