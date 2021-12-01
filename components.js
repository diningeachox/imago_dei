//Type of entity: building or terraformed land
ECS.Components.Type = function ComponentType (value){
    this.value = value;

    return this;
};
ECS.Components.Type.prototype.name = 'type';

//Which tile entity is one
ECS.Components.Tile = function ComponentTile (value){
    this.value = value;

    return this;
};
ECS.Components.Tile.prototype.name = 'tile';

//Status of unit
ECS.Components.Status = function ComponentStatus (value){
    this.value = value;
    return this;
};
ECS.Components.Status.prototype.name = 'status';

//Build time
ECS.Components.TotalTime = function ComponentTotalTime (value){
    this.value = value;
    return this;
};
ECS.Components.TotalTime.prototype.name = 'totaltime';

//Build time
ECS.Components.BuildTime = function ComponentBuildTime (value){
    this.value = value;
    return this;
};
ECS.Components.BuildTime.prototype.name = 'buildtime';

//3D model of the entity
ECS.Components.Model = function ComponentModel (value){
    this.value = value || null;
    return this;
};
ECS.Components.Model.prototype.name = 'model';

//3D model of the entity
ECS.Components.Sprite = function ComponentSprite (value){
    this.value = value || null;
    return this;
};
ECS.Components.Sprite.prototype.name = 'sprite';

ECS.Components.Number = function ComponentNumber (value){
    this.value = value || null;
    return this;
};
ECS.Components.Number.prototype.name = 'number';

ECS.Components.Speed = function ComponentSpeed (value){
    this.value = value || null;
    return this;
};
ECS.Components.Speed.prototype.name = 'speed';

ECS.Components.Path = function ComponentPath (value){
    this.value = value || null;
    return this;
};
ECS.Components.Path.prototype.name = 'path';

ECS.Components.ResPath = function ComponentResPath (value){
    this.value = value || {};
    return this;
};
ECS.Components.ResPath.prototype.name = 'respath';

ECS.Components.Goal = function ComponentGoal (value){
    this.value = value || null;
    return this;
};
ECS.Components.Goal.prototype.name = 'goal';

ECS.Components.Target = function ComponentTarget (value){
    this.value = value || null;
    return this;
};
ECS.Components.Target.prototype.name = 'target';

ECS.Components.GoalTile = function ComponentGoalTile (value){
    this.value = value || null;
    return this;
};
ECS.Components.GoalTile.prototype.name = 'goaltile';

ECS.Components.Coords = function ComponentCoords (value){
    this.value = value || null;
    return this;
};
ECS.Components.Coords.prototype.name = 'coords';

ECS.Components.HP = function ComponentHP (value){
    this.value = value || null;
    return this;
};
ECS.Components.HP.prototype.name = 'hp';

ECS.Components.Bar = function ComponentBar (value){
    this.value = value || null;
    return this;
};
ECS.Components.Bar.prototype.name = 'bar';

ECS.Components.Pop = function ComponentPop (value){
    this.value = value;
    return this;
};
ECS.Components.Pop.prototype.name = 'pop';

ECS.Components.MaxPop = function ComponentMaxPop (value){
    this.value = value;
    return this;
};
ECS.Components.MaxPop.prototype.name = 'maxpop';

ECS.Components.Cooldown = function ComponentCooldown (value){
    this.value = value || 0;
    return this;
};
ECS.Components.Cooldown.prototype.name = 'cooldown';

ECS.Components.MinPower = function ComponentMinPower (value){
    this.value = value;
    return this;
};
ECS.Components.MinPower.prototype.name = 'minpower';

ECS.Components.Connections = function ComponentConnections (value){
    this.value = value || {};
    return this;
};
ECS.Components.Connections.prototype.name = 'connections';
