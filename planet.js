
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.module.js';

//Procedurally generated planet
class Planet {
    constructor(radius, num_regions=5000){

			  var gr = (1 + 5**0.5) / 2;
        this.radius = radius;
        this.num_regions = num_regions;
        //Evenly distribute points on a sphere
        this.points = {
            type: "FeatureCollection",
            features: d3.range(num_regions).map(function(x) {
                return {
                    type: "Point",
                    coordinates: [ (360 * x / gr) % 360, 180 / Math.PI * Math.acos(1 - 2 * (x + 0.5) / num_regions) - 90 ]
                }
            })
        }
        //Calculate Voronoi regions
        this.v = d3.geoVoronoi()(this.points);
        this.polygons = this.v.polygons().features;

        this.centers = [];
        //Centers of voronoi regions
        for (var i = 0; i < this.points.features.length; i++){
            var coords = ambientCoords(this.points.features[i].coordinates[0], this.points.features[i].coordinates[1], radius);
            this.centers.push(coords);
        }
        this.tangent_vectors = [];
        this.heights = [];
        this.plate_height_hash = {};
        this.boundaries = new Array(this.num_regions);
        this.boundaries.fill(0);

        this.mount_dist = new Array(this.num_regions).fill(Infinity);

        this.bound_dist = new Array(this.num_regions).fill(Infinity);

        this.coast_dist = new Array(this.num_regions).fill(Infinity);

        //Constructing the surface of the planet
        this.regions = this.create_plates(); //Create random plates using random fill

        this.assign_plate_heights(); //Assign a random height to each plate

        this.calculate_boundaries(); //Modify heights on the plate boundaries

        this.interpolate_heights(); //Interpolate heights between mountains and coastlines


        this.bugs = {};
    }

    getHeights(){
        return this.heights;
    }
    find_site(lng, lat){
        return this.v.find(lng, lat);
    }

    find(lng, lat){
        return this.polygons[this.v.find(lng, lat)];
    }

    color_tile(ind){
        var poly = this.polygons[ind].geometry.coordinates[0];
        var t = modified_sigmoid(this.heights[ind] / 5);
        var color1 = [128, 128, 173];
        var color2 = [232, 235, 232];
        var w1 = 1 - t;
        var w2 = t;
        var c = [Math.round(color1[0] * w1 + color2[0] * w2),
          Math.round(color1[1] * w1 + color2[1] * w2),
          Math.round(color1[2] * w1 + color2[2] * w2)];
        color.set("rgb(" + c[0] +"," + c[1] + "," + c[2] + ")");
    }

    create_mesh(terrain_colors){
        var terrain = [];
        var vertices = [];
        var colors = [];
  			const color = new THREE.Color();
        //Create meshes for each polygon
        for (var i = 0; i < this.polygons.length; i++){
            var poly = this.polygons[i].geometry.coordinates[0];
            //color.set( Math.random() * 0xffffff );
            var height = this.heights[i];
            if (height >= 0) { //Gradations between white and green
                var t = modified_sigmoid(height / 5);
                var color1 = [128, 128, 173];
                var color2 = [232, 235, 232];
                var w1 = 1 - t;
                var w2 = t;
                var c = [Math.round(color1[0] * w1 + color2[0] * w2),
                  Math.round(color1[1] * w1 + color2[1] * w2),
                  Math.round(color1[2] * w1 + color2[2] * w2)];
                color.set("rgb(" + c[0] +"," + c[1] + "," + c[2] + ")");
            } else { //Gradations between blue and black
                var t = modified_sigmoid(-1 * height / 5);
                var color1 = [89, 36, 100];
                var color2 = [0, 0, 0];
                var w1 = 1 - t;
                var w2 = t;
                var c = [Math.round(color1[0] * w1 + color2[0] * w2),
                  Math.round(color1[1] * w1 + color2[1] * w2),
                  Math.round(color1[2] * w1 + color2[2] * w2)];
                //color.set("rgb(" + c[0] +"," + c[1] + "," + c[2] + ")");
                color.set("rgb(89, 36, 100)");
            }

            //Add triangles
            for (var j = 0; j < poly.length - 1; j++){
                 var c1 = ambientCoords(poly[j][0], poly[j][1], this.radius);
                 var c2 = ambientCoords(poly[j+1][0], poly[j+1][1], this.radius);
                 vertices.push(this.centers[i][0], this.centers[i][1], this.centers[i][2]);
                 vertices.push(c1[0], c1[1], c1[2]);
                 vertices.push(c2[0], c2[1], c2[2]);
                 //Push the same color 3 times
                 for (var k = 0; k < 3; k++){
                    colors.push( color.r, color.g, color.b );
                 }
            }
            //Last triangle
            var c1 = ambientCoords(poly[poly.length - 1][0], poly[poly.length - 1][1], this.radius);
            var c2 = ambientCoords(poly[0][0], poly[0][1], this.radius);
            vertices.push(this.centers[i][0], this.centers[i][1], this.centers[i][2]);
            vertices.push(c1[0], c1[1], c1[2]);
            vertices.push(c2[0], c2[1], c2[2]);
            //Push the same color 3 times
            for (var k = 0; k < 3; k++){
               colors.push( color.r, color.g, color.b );
            }
        }

        //Convert array to typed array
        var new_vertices = new Float32Array(vertices.length);
        for (var k = 0; k < vertices.length; k++){
           new_vertices[k] = vertices[k];
        }
        return [new_vertices, colors];
    }

    /*
    We use a variant of flood fill use BFS called random fill, in which
    instead of selecting the first neighboring node, we select a random node
    out of all the neighbors in each iteration
    */
    create_plates(num_plates=30){
        var regions = new Int32Array(this.num_regions);
        regions.fill(-1);
        var queue = []; //Plate representatives
        var q = new Queue();
        for (var i = 0; i < num_plates; i++){
            var rand = Math.random();
            var ind = Math.floor(rand*this.num_regions);
            regions[ind] = ind;
            queue.push(ind);
            this.plate_height_hash[ind] = Math.floor(Math.random() * 20) - 10; //Random integer from -10 to 10
        }

        //Random Fill
        for (let queue_out = 0; queue_out < this.num_regions; queue_out++) {
            let pos = queue_out + Math.floor(Math.random()*(queue.length - queue_out));
            let current_r = queue[pos];
            // random swap of queue elements
            queue[pos] = queue[queue_out];
            queue[queue_out] = current_r;
            //mesh.r_circulate_r(out_r, current_r); // neighboring regions
            var neighbors = this.polygons[current_r].properties.neighbours;
            for (let neighbor_r of neighbors) {
                if (regions[neighbor_r] === -1) {
                    regions[neighbor_r] = regions[current_r];
                    queue.push(neighbor_r);
                }
            }
        }
        return regions;
    }

    assign_plate_heights(){
        for (let i = 0; i < this.num_regions; i++) {
            this.heights.push(this.plate_height_hash[this.regions[i]]);
        }
    }

    calculate_boundaries(){
        //First generate random vector fields at the center of  every region
        for (var i = 0; i < this.points.features.length; i++){
            var coords = this.points.features[i].coordinates;
            this.tangent_vectors.push(randomTangentVector(this.points.features[i].coordinates[0], this.points.features[i].coordinates[1]))
        }

        var new_heights = Array.from(this.heights);
        //Check boundaries
        var threshold = 0.75;
        for (let i = 0; i < this.num_regions; i++) {
            let plate = this.regions[i]; //Get the plate
            var neighbors = this.polygons[i].properties.neighbours;
            for (let neighbor_r of neighbors) {
                if (this.regions[neighbor_r] != plate) { //Different plate means region i is on a border
                    this.boundaries[i] = 1; //Add this region to boundaries array
                    //Calculate if the two regions are moving closer together
                    var status = movement(this.centers[i], this.centers[neighbor_r],
                      this.tangent_vectors[i], this.tangent_vectors[neighbor_r]);
                    var x1 = this.heights[i] >= 0; //Check if original is land
                    var x2 = this.heights[neighbor_r] >= 0; //Check if neighbor is land

                    //Change heights on boundaries
                    if (x1 == 1 && x2 == 1) { //Land + land
                        if (status > threshold) new_heights[i] = 10;
                    } else if ((x1 == 1 && x2 == 0) || (x1 == 0 && x2 == 1)){ //Land + ocean
                        if (status > threshold) {
                            new_heights[i] = 10;
                        } else {
                             new_heights[i] = -1; //Coastline
                        }
                    } else { //Ocean + ocean
                        if (status > threshold) new_heights[i] = -1; //Coastline
                    }
                }
            }
        }
        this.heights = Array.from(new_heights); //Copy back to height array
    }

    interpolate_heights(){
        var mount_q = new Queue();
        var bound_q = new Queue();
        var coast_q = new Queue();
        var mount_explored = new Array(this.num_regions).fill(0);
        var bound_explored = new Array(this.num_regions).fill(0);
        var coast_explored = new Array(this.num_regions).fill(0);
        //Add relevant regions to each queue_out
        for (var i = 0; i < this.num_regions; i++){
            var h = this.heights[i];
            if (h >= 5) { //mountain
                mount_explored[i] = 1;
                this.mount_dist[i] = 0;
                mount_q.enqueue(i);
            } else if (h == -1) { //coastline
                coast_explored[i] = 1;
                this.coast_dist[i] = 0;
                coast_q.enqueue(i);
            }
            if (this.boundaries[i] > 0){ //boundary
                bound_explored[i] = 1;
                this.bound_dist[i] = 0;
                bound_q.enqueue(i);
            }
        }
        //Find distance fields for each using BFS

        while (mount_q.size() != 0){
            var r = mount_q.dequeue();
            var n = this.polygons[r].properties.neighbours;
            for (let neighbor_r of n) {
                if (mount_explored[neighbor_r] == 0) {
                    mount_explored[neighbor_r] = 1;
                    this.mount_dist[neighbor_r] = this.mount_dist[r] + 1;
                    mount_q.enqueue(neighbor_r);
                }
            }
        }


        while (bound_q.size() != 0){
            var r = bound_q.dequeue();
            var n = this.polygons[r].properties.neighbours;
            for (let neighbor_r of n) {
                if (bound_explored[neighbor_r] == 0) {
                    bound_explored[neighbor_r] = 1;
                    this.bound_dist[neighbor_r] = this.bound_dist[r] + 1;
                    bound_q.enqueue(neighbor_r);
                }
            }
        }

        while (coast_q.size() != 0){
            var r = coast_q.dequeue();
            var n = this.polygons[r].properties.neighbours;
            for (let neighbor_r of n) {
                if (coast_explored[neighbor_r] == 0) {
                    coast_explored[neighbor_r] = 1;
                    this.coast_dist[neighbor_r] = this.coast_dist[r] + 1;
                    coast_q.enqueue(neighbor_r);
                }
            }
        }

        //interpolate heights
        for (var i = 0; i < this.num_regions; i++){
            var a = this.mount_dist[i];
            var b = this.bound_dist[i];
            var c = this.coast_dist[i];
            if (a != 0 && b != 0 && c!= 0) {
                this.heights[i] = (10 * 1/a - 1/c) / (1/a + 1/c + 1/b);
            }
        }
    }

    draw_vectors(scene){
        for (var i = 0; i < this.tangent_vectors.length; i++){
            var vec = this.tangent_vectors[i];
            const origin = new THREE.Vector3(this.centers[i][0], this.centers[i][1], this.centers[i][2]);
            const dir = new THREE.Vector3(this.tangent_vectors[i][0], this.tangent_vectors[i][1], this.tangent_vectors[i][2]);
            dir.normalize();
            const length = 0.02;

            var hex = 0x000000;
            if (this.boundaries[i] == 1) hex = 0xffffff;
            const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, 0.2 * length, length / 5 );
            scene.add( arrowHelper );
        }

    }

    //Find distance on planet, start and goal are tile indices
    a_star(start, goal, water=0){
        //Both start and goal must be on land or on water
        if (this.heights[start] * this.heights[goal] < 0 && water == 0) return [[], Infinity];

        var came_from = new Array(this.num_regions).fill(-1);
        var cost_so_far = new Array(this.num_regions).fill(-1);
        var priority = new Array(this.num_regions).fill(-1);

        cost_so_far[start] = 0;
        //priority[start] = 0;
        var current;

        var frontier = new Heap(1, priority);
        frontier.insert(start);
        while (!frontier.isEmpty()){
            current = frontier.del();
            //debugger;
            if (current == goal) break;

            var neighbours = this.polygons[current].properties.neighbours;
            for (let neighbour_r of neighbours){
                var next = neighbour_r;
                //Only land - land or sea - sea
                if ((this.heights[next] >= 0 && water == 0) || water == 1){
                    var height_diff = this.heights[current] - this.heights[next];
                    var dist = geoDist(this.points.features[current].coordinates[0],
                            this.points.features[current].coordinates[1],
                            this.points.features[next].coordinates[0],
                            this.points.features[next].coordinates[1]);
                    var grid_cost = Math.sqrt(dist**2 + height_diff**2);
                    var new_cost = cost_so_far[current] + grid_cost;
                    if (cost_so_far[next] == -1 || new_cost < cost_so_far[next]){
                        cost_so_far[next] = new_cost;
                        priority[next] = heuristic(next, goal, this.points.features);
                        frontier.insert(next);
                        came_from[next] = current;
                    }
                }
            }

        }
        if (came_from[goal] == -1) return [[], Infinity];
        //Trace back if goal is reachable
        current = goal;
        var path = [];

        while (current != start){
           path.push(current);
           current = came_from[current];
        }
        path.push(start);
        return [path, cost_so_far[goal]];
    }

    generate_ore(n){
        var rand_nums = [];
        //Create n ore centers and surround them
        var nums = Array.from(this.heights);
        var i = this.num_regions;
        var j = 0;
        //Randomly permute this.heights
        while (i>0) {
            j = Math.floor(Math.random() * (i));
            rand_nums.push(j);
            nums.splice(j,1);
            i--;
        }

        var ore_centers = [];
        var k = 0;
        while (k < rand_nums.length && ore_centers.length < n){
            if (this.heights[rand_nums[k]] >= 0) ore_centers.push(rand_nums[k]);
            k++;
        }
        return ore_centers;
    }

    //Bugs spawn on the coast
    generate_bugs(n, model, scene){
        this.bugs = {};
        var rand_nums = [];
        //Create n ore centers and surround them
        var nums = Array.from(this.heights);
        var i = this.num_regions;
        var j = 0;
        //Randomly permute this.heights
        while (i>0) {
            j = Math.floor(Math.random() * (i));
            rand_nums.push(j);
            nums.splice(j,1);
            i--;
        }

        var k = 0;
        while (k < rand_nums.length && Object.keys(this.bugs).length < n){
            //generate on shoreline
            if (this.heights[rand_nums[k]] == -1) {
                //Random number between -100 to 100
                var building = new ECS.Entity();
                var model_copy = model.clone();


                building.addComponent( new ECS.Components.Type(11));
                building.addComponent( new ECS.Components.Tile(rand_nums[k]));
                building.addComponent( new ECS.Components.Status("moving"));

                building.addComponent( new ECS.Components.Number(400));
                building.addComponent( new ECS.Components.Model(model_copy));
                building.addComponent( new ECS.Components.Speed(0.05));

                //Spherical coords
                building.addComponent( new ECS.Components.Coords(this.points.features[rand_nums[k]].coordinates));

                this.bugs[building.id] = building; //add to this.bugs
                //Add bug sprites to scene
                scene.add( model_copy );
                model_copy.position.set(0, 0, 0);
            }
            k++;
        }
    }

    render_bugs(new_north_pole){
        //if (this.bugs.length == 0) return 0;

        for( var entityId in this.bugs ){
            var entity = this.bugs[entityId];
            var global_coords = ambientCoords(entity.components.coords.value[0], entity.components.coords.value[1]);
            var tangent = greatCircleTangents([global_coords[0], global_coords[1], global_coords[2]],
              [new_north_pole.x, new_north_pole.y, new_north_pole.z]);
            var num = entity.components.number.value;
            //Set orientation
            entity.components.model.value.position.set(global_coords[0] * 1.02, global_coords[1] * 1.02, global_coords[2] * 1.02);
            entity.components.model.value.up.set(global_coords[0], global_coords[1], global_coords[2]);
            entity.components.model.value.lookAt(global_coords[0] * 1.02 + tangent[0][0], global_coords[1] * 1.02 + tangent[0][1], global_coords[2] * 1.02 + tangent[0][2]);
            //console.log(entity.components.model.value);
            //entity.components.model.value.material[0].transparent = true;
            //entity.components.model.value.material[0].opacity = num / 400;

        }
    }



    //Save the planet's data as a local json object
    save(){

    }



}

class PlanetRender {
    constructor(selector){
        this.selector = selector;
    }

    setSelector(polygon){
        var points = [];
        var selector = new THREE.Shape();
        var coords = polygon.geometry.coordinates[0];
        var start = ambientCoords(coords[0][0], coords[0][1], 1.01);
        //selector.moveTo(start[0], start[1], start[2]);
        points.push(new THREE.Vector3(start[0], start[1], start[2]));
        for (var i = 1; i < coords.length; i++){
            var ambient_coords = ambientCoords(coords[i][0], coords[i][1], 1.01);
            points.push(new THREE.Vector3(ambient_coords[0], ambient_coords[1], ambient_coords[2]));
        }
        return new THREE.BufferGeometry().setFromPoints( points );
    }
}

function heuristic(a, b, features){
    return geoDist(features[a].coordinates[0],
            features[a].coordinates[1],
            features[b].coordinates[0],
            features[b].coordinates[1])
}

export { Planet, PlanetRender};
