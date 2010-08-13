(function() {
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__superClass__ = parent.prototype;
  };
  uv.ScatterDot = function(properties) {
    var scene, that;
    uv.Circle.call(this, properties);
    this.tx = new uv.Tween({
      obj: this.properties,
      property: 'x',
      duration: 2
    });
    this.ty = new uv.Tween({
      obj: this.properties,
      property: 'y',
      duration: 2
    });
    this.tr = new uv.Tween({
      obj: this.properties,
      property: 'radius',
      duration: 2
    });
    scene = this.p('scene');
    scene.register(uv.cmds.RequestFramerate, {
      framerate: 40
    });
    that = this;
    this.tx.on('start', __bind(function() {
      this.p('vis').transitioning = true;
      return scene.execute(uv.cmds.RequestFramerate);
    }, this));
    this.tx.on('finish', __bind(function() {
      scene.unexecute(uv.cmds.RequestFramerate);
      return (this.p('vis').transitioning = false);
    }, this));
    return this;
  };
  __extends(uv.ScatterDot, uv.Circle);
  uv.ScatterDot.prototype.update = function() {
    this.tx.tick();
    this.ty.tick();
    return this.tr.tick();
  };
  uv.ScatterDot.prototype.updateValues = function(x, y, r) {
    this.tx.continueTo(x, 1.5);
    this.ty.continueTo(y, 1.5);
    return this.tr.continueTo(r, 1.5);
  };
  uv.Scatterplot = function(_a, measures, params) {
    this.collection = _a;
    uv.Scatterplot.__superClass__.constructor.call(this, this.collection, measures, params);
    this.itemValueIndex = 0;
    this.width = this.$canvas.width() - 0;
    this.height = this.$canvas.height() - 3;
    this.setMeasures(this.measures);
    this.transitioning = false;
    this.xMin = this.xProp.aggregate(uv.Aggregators.MIN);
    this.xMax = this.xProp.aggregate(uv.Aggregators.MAX);
    this.yMin = this.yProp.aggregate(uv.Aggregators.MIN);
    this.yMax = this.yProp.aggregate(uv.Aggregators.MAX);
    this.formatter = pv.Format.number();
    if ((this.zProp)) {
      this.zMin = this.zProp.aggregate(uv.Aggregators.MIN);
      this.zMax = this.zProp.aggregate(uv.Aggregators.MAX);
      this.z = pv.Scale.linear(this.zMin, this.zMax).range(5, 20);
    }
    this.items = this.collection.all("items").values();
    this.colors = pv.Scale.ordinal(_.map(this.items, function(i) {
      return i.key;
    })).range('#8DB5C8', '#808E89', '#B16649', '#90963C', '#A2C355', '#93BAA1', '#86A2A9');
    this.txMin = new uv.Tween({
      obj: this,
      property: 'xMin',
      duration: 2
    });
    this.txMax = new uv.Tween({
      obj: this,
      property: 'xMax',
      duration: 2
    });
    this.tyMin = new uv.Tween({
      obj: this,
      property: 'yMin',
      duration: 2
    });
    this.tyMax = new uv.Tween({
      obj: this,
      property: 'yMax',
      duration: 2
    });
    this.tzMin = new uv.Tween({
      obj: this,
      property: 'zMin',
      duration: 2
    });
    this.tzMax = new uv.Tween({
      obj: this,
      property: 'zMax',
      duration: 2
    });
    this.build();
    return this;
  };
  __extends(uv.Scatterplot, uv.Visualization);
  uv.Scatterplot.prototype.xScale = function() {
    return pv.Scale.linear(this.xMin, this.xMax).range(0, this.width);
  };
  uv.Scatterplot.prototype.yScale = function() {
    return pv.Scale.linear(this.yMin, this.yMax).range(0, this.height);
  };
  uv.Scatterplot.prototype.zScale = function() {
    return pv.Scale.linear(this.zMin, this.zMax).range(5, 20);
  };
  uv.Scatterplot.prototype.updateMinMax = function() {
    this.targetxMin = this.xProp.aggregate(uv.Aggregators.MIN);
    this.targetxMax = this.xProp.aggregate(uv.Aggregators.MAX);
    this.targetyMin = this.yProp.aggregate(uv.Aggregators.MIN);
    this.targetyMax = this.yProp.aggregate(uv.Aggregators.MAX);
    if (this.zProp) {
      this.targetzMin = this.zProp.aggregate(uv.Aggregators.MIN);
      this.targetzMax = this.zProp.aggregate(uv.Aggregators.MAX);
    }
    this.txMin.continueTo(this.targetxMin, 1.5);
    this.txMax.continueTo(this.targetxMax, 1.5);
    this.tyMin.continueTo(this.targetyMin, 1.5);
    this.tyMax.continueTo(this.targetyMax, 1.5);
    if (this.zProp) {
      this.tzMin.continueTo(this.targetzMin, 1.5);
      return this.tzMax.continueTo(this.targetzMax, 1.5);
    }
  };
  uv.Scatterplot.prototype.updateSampleIndex = function(index) {
    this.itemValueIndex = index;
    return this.updateScatterDots();
  };
  uv.Scatterplot.prototype.updateMeasures = function(measures) {
    this.setMeasures(measures);
    this.txMin.on('start', __bind(function() {
      this.transitioning = true;
      return this.scene.execute(uv.cmds.RequestFramerate);
    }, this));
    this.txMin.on('finish', __bind(function() {
      this.scene.unexecute(uv.cmds.RequestFramerate);
      this.updateScatterDots();
      return (this.transitioning = false);
    }, this));
    return this.updateMinMax();
  };
  uv.Scatterplot.prototype.setMeasures = function(measures) {
    this.xProp = this.collection.get("properties", measures[0]);
    this.yProp = this.collection.get("properties", measures[1]);
    return (this.zProp = this.collection.get("properties", measures[2]));
  };
  uv.Scatterplot.prototype.update = function() {
    this.txMin.tick();
    this.txMax.tick();
    this.tyMin.tick();
    this.tyMax.tick();
    this.tzMin.tick();
    this.tzMax.tick();
    return this.buildAxes(this.xScale(), this.yScale());
  };
  uv.Scatterplot.prototype.updateScatterDots = function() {
    return this.scene.get('plot').all('children').each(__bind(function(index, dot) {
      var radius, x, y;
      x = this.xScale()(dot.p('item').values(this.xProp.key).at(this.itemValueIndex));
      y = this.height - this.yScale()(dot.p('item').values(this.yProp.key).at(this.itemValueIndex));
      radius = this.zProp ? this.zScale()(dot.p('item').values(this.zProp.key).at(this.itemValueIndex)) : 10;
      return dot.updateValues(x, y, radius);
    }, this));
  };
  uv.Scatterplot.prototype.buildAxes = function(x, y) {
    var _a, _b, _c, _d, _e, _f, _g, that;
    this.scene.get('rulers').replace('children', new uv.SortedHash());
    that = this;
    _b = x.ticks();
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      (function() {
        var t;
        var tick = _b[_a];
        t = new uv.Path({
          x: function() {
            return parseInt(x(tick), 10) + 0.5;
          },
          y: this.height - 30,
          type: 'tick',
          strokeStyle: '#ccc',
          points: [
            {
              x: 0,
              y: -this.height
            }
          ],
          preserveShape: true,
          sticky: true
        });
        t.add(new uv.Label({
          x: 0,
          y: 20,
          type: 'tick',
          sticky: true,
          text: function() {
            return that.formatter(tick);
          },
          textAlign: 'center',
          fillStyle: '#444',
          backgroundStyle: '#eee'
        }));
        return this.scene.get('rulers').add(t);
      }).call(this);
    }
    _d = []; _f = y.ticks();
    for (_e = 0, _g = _f.length; _e < _g; _e++) {
      (function() {
        var t;
        var tick = _f[_e];
        return _d.push((function() {
          t = new uv.Path({
            x: 60,
            y: function() {
              return that.height - parseInt(y(tick), 10) + 0.5;
            },
            strokeStyle: '#ccc',
            points: [
              {
                x: this.width,
                y: 0
              }
            ],
            type: 'tick',
            preserveShape: true,
            sticky: true
          });
          t.add(new uv.Label({
            x: -10,
            y: 3,
            text: function() {
              return that.formatter(tick);
            },
            sticky: true,
            type: 'tick',
            textAlign: 'right',
            fillStyle: '#444',
            backgroundStyle: '#eee'
          }));
          return this.scene.get('rulers').add(t);
        }).call(this));
      }).call(this);
    }
    return _d;
  };
  uv.Scatterplot.prototype.build = function() {
    var _a, _b, _c, height, scene, that, width;
    scene = (this.scene = new uv.Scene({
      traverser: uv.traverser.BreadthFirst,
      fillStyle: '#fff',
      displays: [
        {
          container: $('#canvas'),
          width: this.width,
          height: this.height,
          paning: true,
          zooming: true
        }
      ]
    }));
    height = this.height;
    width = this.width;
    that = this;
    this.scene.activeDisplay.on('viewChange', function() {
      var max, min, x, xMaxDomain, xMinDomain, y, yMaxDomain, yMinDomain;
      min = this.worldPos(new uv.Vector(0, height));
      max = this.worldPos(new uv.Vector(width, 0));
      xMinDomain = that.xScale().invert(min.x);
      xMaxDomain = that.xScale().invert(max.x);
      yMinDomain = that.yScale().invert(min.y);
      yMaxDomain = that.yScale().invert(max.y);
      x = pv.Scale.linear(xMinDomain, xMaxDomain).range(0, width);
      y = pv.Scale.linear(yMinDomain, yMaxDomain).range(0, height);
      return that.buildAxes(x, y);
    });
    this.scene.on('frame', __bind(function() {
      return this.transitioning ? this.update() : null;
    }, this));
    this.scene.add(new uv.Bar({}), 'rulers');
    this.scene.add(new uv.Bar({}), 'plot');
    this.scene.add(new uv.Bar({
      fillStyle: 'red'
    }), 'hud');
    _b = this.items;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      (function() {
        var color, dot;
        var item = _b[_a];
        color = this.colors(item.key).color;
        dot = new uv.ScatterDot({
          x: this.xScale()(item.values(this.xProp.key).at(this.itemValueIndex)),
          y: this.height - this.yScale()(item.values(this.yProp.key).at(this.itemValueIndex)),
          vis: this,
          scene: this.scene,
          item: item,
          radius: this.zProp ? this.zScale()(item.values(this.zProp.key).at(this.itemValueIndex)) : 10,
          interactive: true,
          fillStyle: function() {
            return this.active ? '#000' : color;
          },
          preserveShape: true
        });
        dot.add(new uv.Label({
          localX: 0,
          localY: 30,
          text: item.identify(),
          font: 'bold 12px Helvetica, Arial',
          visible: function() {
            return this.parent.active;
          },
          textAlign: 'center',
          preserveShape: true,
          background: true,
          fillStyle: 'white',
          backgroundStyle: '#555'
        }));
        return this.scene.get('plot').add(dot);
      }).call(this);
    }
    this.scene.get('hud').add(new uv.Label({
      x: this.width - 20,
      y: 20,
      textAlign: 'right',
      text: function() {
        return 'FPS: ' + this.scene.fps;
      },
      sticky: true,
      background: true
    }));
    this.scene.get('hud').add(new uv.Label({
      x: this.width - 20,
      y: 50,
      textAlign: 'right',
      text: function() {
        var pos;
        pos = this.scene.activeDisplay.worldPos(new uv.Vector(0, 0));
        return 'Viewport (x,y): ' + parseInt(pos.x) + ', ' + parseInt(pos.y);
      },
      background: true,
      sticky: true
    }));
    this.scene.get('hud').add(new uv.Label({
      x: this.width - 20,
      y: 80,
      textAlign: 'right',
      text: function() {
        var pos;
        pos = scene.activeDisplay.worldPos(new uv.Vector(0, 0));
        return 'mousePos: ' + parseInt(scene.mouseX) + ', ' + parseInt(scene.mouseY);
      },
      sticky: true,
      background: true
    }));
    return this.buildAxes(this.xScale(), this.yScale());
  };
  uv.Scatterplot.prototype.render = function() {
    return this.scene.start();
  };
})();
