

// Useful helper functions and data structures for the game
function Queue(){
    this.data = new Array(0);
}
Queue.prototype.isEmpty = function(){
    return (this.data.length == 0);
}
Queue.prototype.dequeue = function(){
    if (this.data.length > 0){
        return this.data.splice(0, 1);
    }
    throw "Trying to pop an empty queue!"
}
Queue.prototype.enqueue = function(item){
    this.data.push(item);
}
Queue.prototype.top = function(){
    if (this.data.length > 0){
        return this.data[0];
    }
    throw "Queue is empty!"
}
Queue.prototype.size = function(){
    return this.data.length;
}

//Max heap where score is looked up in arr
function Heap(len, arr){
    //Format is (key) for each array entry
    //Priority is calculated by passing key into the function f
    this.data = new Array(len);
    this.data[0] = -1;
    //this.func = func;
    this.arr = arr; //Array for lookup
}

Heap.prototype.size = function(){
    return this.data.length - 1;
}

Heap.prototype.insert = function(x){
    //Insert a new item to the end of the array
    var pos = this.data.length;
    this.data.push(x);
    //Percolate up
    while(pos / 2 > 0 && this.arr[this.data[pos]] < this.arr[this.data[Math.floor(pos / 2)]]){
        temp = this.data[Math.floor(pos / 2)];
        this.data[Math.floor(pos / 2)] = this.data[pos];
        this.data[pos] = temp;
        pos = Math.floor(pos / 2);
    }
}

Heap.prototype.del = function(){
    //Remove head of Array and replace it with the last element
    var removed = this.data[1];
    this.data[1] = this.data[this.data.length - 1];
    //this.data = this.data.splice(0, this.data.length - 1);
    this.data.pop();
    //Percolate down
    var pos = 1;
    while(pos * 2 < this.data.length){
        minChild = this.minChild(pos);
        if (this.arr[this.data[pos]] > this.arr[this.data[minChild]]){
            temp = this.data[pos];
            this.data[pos] = this.data[minChild];
            this.data[minChild] = temp;
        }
        pos = minChild;

    }
    return removed;
}

Heap.prototype.minChild = function(i){
    if (i * 2 + 1 > this.data.length - 1)
        return i * 2;
    if (this.arr[this.data[i*2]] < this.arr[this.data[i*2+1]])
        return i * 2;
    return i * 2 + 1;
}

Heap.prototype.isEmpty = function(){
    return this.data.length <= 1;
}

//Use haversine formulat to compute great circle distance between two points on sphere
function geoDist(lng1, lat1, lng2, lat2, r=1){
    var del_lat = Math.abs(lat1 - lat2) * Math.PI / 180;
    var del_lng = Math.abs(lng1 - lng2) * Math.PI / 180;
    return r * 2 * Math.asin(
                Math.sqrt(
                  Math.sin(del_lat / 2)**2 + (1 - Math.sin(del_lat / 2)**2
                - Math.sin((lat1 + lat2) * Math.PI / 180)**2 ) * Math.sin(del_lng / 2)**2
                 )
               );
}

//Function for converting spherical coordinates (long, lat) in degrees to coordinates in 3D ambient spaced
function ambientCoords(lng, lat, r=1){
    var lng_rad = (lng * Math.PI / 180) + Math.PI;
    var lat_rad = (lat * Math.PI / 180) + (Math.PI / 2);
    var x = r * Math.cos(lng_rad) * Math.sin(lat_rad);
    var y = r * Math.sin(lng_rad) * Math.sin(lat_rad);
    var z = r * Math.cos(lat_rad);
    //return new THREE.Vector3(x, y, z);
    return [x, y, z];
}

function sphericalCoords(x, y, z, r=1){
    var lat = Math.acos(z/r) - Math.PI / 2;
    var lng = -1 * Math.PI / 2;
    if (x > 0){
        lng = Math.atan(y/x) - Math.PI;
    } else if (x < 0){
        lng = Math.atan(y/x);
    }
    return [lng * 180 / Math.PI, lat * 180 / Math.PI]; //return in degrees
}

//Returns a random unit vector in the tangent space of a sphere at point (lng, lat)
function randomTangentVector(lng, lat, r=1){
    var lng_rad = (lng * Math.PI / 180) + Math.PI;
    var lat_rad = (lat * Math.PI / 180) + (Math.PI / 2);

    var del_lng_x = -1 * r * (Math.PI / 180) * Math.sin(lng_rad) * Math.sin(lat_rad);
    var del_lng_y = r * (Math.PI / 180) * Math.cos(lng_rad) * Math.sin(lat_rad);
    var del_lng_z = 0;

    var del_lat_x = r * (Math.PI / 180) * Math.cos(lng_rad) * Math.cos(lat_rad);
    var del_lat_y = r * (Math.PI / 180) * Math.sin(lng_rad) * Math.cos(lat_rad);
    var del_lat_z = -1 * r * (Math.PI / 180) * Math.sin(lat_rad);

    var angle = Math.random() * Math.PI * 2; //Angle of rotation for the tangent Vector

    return [del_lng_x * Math.cos(angle) + del_lat_x * Math.sin(angle),
          del_lng_y * Math.cos(angle) + del_lat_y * Math.sin(angle),
           del_lng_z * Math.cos(angle) + del_lat_z * Math.sin(angle)];
}

//Given two points p, q on a sphere, return the tangent vectors at each point
//tangent to the great circle connecting p and q
function greatCircleTangents(p, q){
    var d = p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    var beta = (d ** 2 + Math.sqrt(d** 4 + d ** 2 + 1)) /  (d ** 2 + 1);
    var alpha = -1 * d * beta;
    var c1 = Math.sqrt(1 - d**2) - d * alpha;
    var c2 = alpha;
    //Tangent vector at p, facing q
    var tangent_p = [alpha * p[0] + beta * q[0], alpha * p[1] + beta * q[1], alpha * p[2] + beta * q[2]];
    //Tangent vector at q, facing p
    var tangent_q = [c1 * p[0] + c2 * q[0], c1 * p[1] + c2 * q[1], c1 * p[2] + c2 * q[2]];
    return [tangent_p, tangent_q];
}

//Given two points p, q on a sphere, see if they are moving
//closer or farther according to their random tangent vectors v, w
function movement(p, q, v, w){
    var tangents = greatCircleTangents(p, q);
    var dot1 = tangents[0][0] * v[0] + tangents[0][1] * v[1] + tangents[0][2] * v[2];
    var dot2 = tangents[1][0] * w[0] + tangents[1][1] * w[1] + tangents[1][2] * w[2];
    return dot1 + dot2;
}

function modified_sigmoid(x){
    return 2 / (1 + Math.exp(-1 * x)) - 1;
}

//GET UNIQUE PAIRS IN ARRAY
uniq = function(items, key) {
    var set = {};
    return items.filter(function(item) {
        var k = key ? key.apply(item) : item;
        return k in set ? false : set[k] = true;
    })
}

function has_coords(arr, coords, length){
    if (coords.length != length || arr.length % coords.length != 0 || arr.length % length != 0) {
        throw new Error("Dimensions do not match!");
    }
    var b = true;
    for (var i = 0; i < arr.length; i+=length){
        for (var j = 0; j < length; j++) {
            if (coords[j] != arr[i + j]) break;
        }
    }
}

//Button class
var Button = function(config) {
    //x and y are coordinates of the CENTER of the button
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 150;
    this.height = config.height || 50;
    this.label = config.label || "Click me!";
    this.font = config.font || this.height / 2 + "px myFont";
    this.canv_rect = config.canv_rect || null;
    if (config.ind != undefined) this.ind = config.ind; //To avoid the case of 0 being fed into config.ind

    //this.ind = config.ind || -1;
    this.color = config.color || "blue";
    this.onClick = config.onClick || function() {};
    this.hover = 0;
};

Button.prototype.draw = function(ctx) {
    ctx.font = this.font;
    ctx.textAlign = "center";
    //Normal button
    if (!this.hover){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
        ctx.fillStyle = "white";
    } else {
        //Hovered over button
        ctx.fillStyle = "rgb(100, 100, 255)";
        ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
        ctx.fillStyle = "black";
    }

    ctx.fillText(this.label, this.x, this.y + (this.height / 4));

};

Button.prototype.isMouseInside = function(mouseX, mouseY) {
    return (mouseX > (this.x - (this.width / 2)) &&
           mouseX < (this.x + (this.width / 2)) &&
           mouseY > (this.y - (this.height / 2)) &&
           mouseY < (this.y + (this.height / 2)));
};

Button.prototype.handleMouseClick = function(mouseX, mouseY) {
    if (this.isMouseInside(mouseX, mouseY)) {
        this.onClick();
    }
};

Button.prototype.handleMouseHover = function(mouseX, mouseY) {
    this.hover = this.isMouseInside(mouseX, mouseY);
};

function compareRects(a, b){
    return (a.left == b.left) && (a.top == b.top) && (a.width == b.width) && (a.height == b.height);
}


function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    tut.width = window.innerWidth;
    tut.height = window.innerHeight / 4 - 20;

    tut.style.top = window.innerHeight * 3 / 4 + 15 + 'px';
};
