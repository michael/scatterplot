class uv.ScatterDot extends uv.Circle
  constructor: (properties) ->
    uv.Circle.call(this, properties)
    
    @tx = new uv.Tween({
      obj: @properties
      property: 'x'
      duration: 2
    })

    @ty = new uv.Tween({
      obj: @properties
      property: 'y'
      duration: 2
    })
    
    @tr = new uv.Tween({
      obj: @properties
      property: 'radius'
      duration: 2
    })
    
    scene = @p('scene')
    scene.register(uv.cmds.RequestFramerate, {framerate: 40});    
    
    that = this
    # Request and release high framerate on demand
    @tx.on 'start', =>
      @p('vis').transitioning = true
      scene.execute(uv.cmds.RequestFramerate)
    @tx.on 'finish', =>
      scene.unexecute(uv.cmds.RequestFramerate)
      @p('vis').transitioning = false
      
  update: ->
    @tx.tick()
    @ty.tick()
    @tr.tick()
    
  updateValues: (x, y, r) ->
    @tx.continueTo(x, 1.5)
    @ty.continueTo(y, 1.5)
    @tr.continueTo(r, 1.5)
    

class uv.Scatterplot extends uv.Visualization
  constructor: (@collection, measures, params) ->
    super(@collection, measures, params)
    
    @itemValueIndex = 0
    
    @width = @$canvas.width() -0
    @height = @$canvas.height() - 3
    @setMeasures(@measures)
    @transitioning = false
    
    # Init Scales
    @xMin = @xProp.aggregate(uv.Aggregators.MIN)
    @xMax = @xProp.aggregate(uv.Aggregators.MAX)
    @yMin = @yProp.aggregate(uv.Aggregators.MIN)
    @yMax = @yProp.aggregate(uv.Aggregators.MAX)
    @formatter = pv.Format.number()
    
    # Encode 3rd measure as dot size
    if (@zProp) 
      @zMin = @zProp.aggregate(uv.Aggregators.MIN)
      @zMax = @zProp.aggregate(uv.Aggregators.MAX)
      @z = pv.Scale.linear(@zMin, @zMax).range(5, 20)

    @items = @collection.all("items").values();
    @colors = pv.Scale.ordinal(_.map(@items, (i) -> i.key))
                .range('#8DB5C8', '#808E89', '#B16649', '#90963C', '#A2C355', '#93BAA1', '#86A2A9')

    # Scale tweening
    @txMin = new uv.Tween({ obj: this, property: 'xMin', duration: 2 })
    @txMax = new uv.Tween({ obj: this, property: 'xMax', duration: 2 })
    @tyMin = new uv.Tween({ obj: this, property: 'yMin', duration: 2 })
    @tyMax = new uv.Tween({ obj: this, property: 'yMax', duration: 2 })
    @tzMin = new uv.Tween({ obj: this, property: 'zMin', duration: 2 })
    @tzMax = new uv.Tween({ obj: this, property: 'zMax', duration: 2 })

    @build()
    
  xScale: ->
    pv.Scale.linear(@xMin, @xMax).range(0, @width)
  yScale: ->
    pv.Scale.linear(@yMin, @yMax).range(0, @height)
  zScale: ->
    pv.Scale.linear(@zMin, @zMax).range(5, 20)
  
  updateMinMax: ->
    @targetxMin = @xProp.aggregate(uv.Aggregators.MIN)
    @targetxMax = @xProp.aggregate(uv.Aggregators.MAX)
    @targetyMin = @yProp.aggregate(uv.Aggregators.MIN)
    @targetyMax = @yProp.aggregate(uv.Aggregators.MAX)
    
    if @zProp
      @targetzMin = @zProp.aggregate(uv.Aggregators.MIN)
      @targetzMax = @zProp.aggregate(uv.Aggregators.MAX)
    
    @txMin.continueTo(@targetxMin, 1.5)
    @txMax.continueTo(@targetxMax, 1.5)
    @tyMin.continueTo(@targetyMin, 1.5)
    @tyMax.continueTo(@targetyMax, 1.5)
    if @zProp
      @tzMin.continueTo(@targetzMin, 1.5)
      @tzMax.continueTo(@targetzMax, 1.5)

  
  updateSampleIndex: (index) ->
    @itemValueIndex = index
    @updateScatterDots()
  
  updateMeasures: (measures) ->
    @setMeasures(measures)
    @txMin.on 'start', =>
      @transitioning = true
      @scene.execute(uv.cmds.RequestFramerate)
  
    @txMin.on 'finish', =>
      @scene.unexecute(uv.cmds.RequestFramerate)
      @updateScatterDots()
      @transitioning = false
    
    @updateMinMax()
    
  setMeasures: (measures) ->
    @xProp = @collection.get("properties", measures[0])
    @yProp = @collection.get("properties", measures[1])
    @zProp = @collection.get("properties", measures[2])
  
  # updates the dots and scales on every frame, while transitioning
  update: ->
    @txMin.tick()
    @txMax.tick()
    @tyMin.tick()
    @tyMax.tick()
    @tzMin.tick()
    @tzMax.tick()
    
    @buildAxes(@xScale(), @yScale())
    
  updateScatterDots: ->
    @scene.get('plot').all('children').each (index, dot) =>
      x = @xScale()(dot.p('item').values(@xProp.key).at(@itemValueIndex))
      y = @height-@yScale()(dot.p('item').values(@yProp.key).at(@itemValueIndex))
      radius = if @zProp then @zScale()(dot.p('item').values(@zProp.key).at(@itemValueIndex)) else 10
      dot.updateValues(x, y, radius)
    
  buildAxes: (x, y) ->
    @scene.get('rulers').replace('children', new uv.SortedHash())
    that = this
    
    for tick in x.ticks()
      
      t = new uv.Path({
        x: -> 
          parseInt(x(tick), 10) + 0.5
        y: @height-30,
        type: 'tick',
        strokeStyle: '#ccc'
        points: [{x: 0, y: -@height}]
        preserveShape: true
        sticky: true
      })
      
      t.add new uv.Label {
        x: 0
        y: 20
        type: 'tick'
        sticky: true
        text: -> that.formatter(tick)
        textAlign: 'center'
        fillStyle: '#444'
        backgroundStyle: '#eee'
      }
      @scene.get('rulers').add(t)
      
    # y-Axis
    for tick in y.ticks()
      t = new uv.Path {
        x: 60
        y: -> that.height-parseInt(y(tick), 10) + 0.5
        strokeStyle: '#ccc'
        points: [{x: @width, y: 0}]
        type: 'tick'
        preserveShape: true
        sticky: true
      }
      
      t.add new uv.Label {
        x: -10
        y: 3
        text: -> that.formatter(tick)
        sticky: true
        type: 'tick'
        textAlign: 'right'
        fillStyle: '#444'
        backgroundStyle: '#eee'
      }
      
      @scene.get('rulers').add(t)

  build: ->
    # Scene init
    scene = @scene = new uv.Scene {
      traverser: uv.traverser.BreadthFirst
      fillStyle: '#fff'
      displays: [{
        container: $('#canvas')
        width: @width
        height: @height
        paning: true
        zooming: true
      }]
    }
    
    height = @height
    width = @width
    that = this
    
    # Recalculate Rulers (Scales)
    @scene.activeDisplay.on 'viewChange', ->

      min = @worldPos(new uv.Vector(0,height))
      max = @worldPos(new uv.Vector(width,0))
      
      xMinDomain = that.xScale().invert(min.x)
      xMaxDomain = that.xScale().invert(max.x)
      yMinDomain = that.yScale().invert(min.y)
      yMaxDomain = that.yScale().invert(max.y)
      
      x = pv.Scale.linear(xMinDomain, xMaxDomain).range(0, width)
      y = pv.Scale.linear(yMinDomain, yMaxDomain).range(0, height)
      
      that.buildAxes(x, y)
    
    # Update tweens on every frame
    @scene.on 'frame', =>
      if @transitioning
        @update()
    
    # Rulers Panel
    @scene.add(new uv.Bar({}), 'rulers');
    
    # Plot Panel
    @scene.add(new uv.Bar({}), 'plot');
    
    # HUD
    @scene.add(new uv.Bar({fillStyle: 'red'}), 'hud');
    
    # Dots
    for item in @items
      color = @colors(item.key).color
      
      dot = new uv.ScatterDot {
        x: @xScale()(item.values(@xProp.key).at(@itemValueIndex))
        y: @height-@yScale()(item.values(@yProp.key).at(@itemValueIndex))
        vis: this
        scene: @scene
        item: item
        radius: if @zProp then @zScale()(item.values(@zProp.key).at(@itemValueIndex)) else 10
        interactive: true
        fillStyle: -> if @active then '#000' else color
        preserveShape: true
      }
      
      dot.add new uv.Label {
        localX: 0
        localY: 30
        text: item.identify()
        font: 'bold 12px Helvetica, Arial'
        visible: -> @parent.active
        textAlign: 'center'
        preserveShape: true
        background: true
        fillStyle: 'white'
        backgroundStyle: '#555'
      }
      
      @scene.get('plot').add(dot)
    
    
    # Framerate
    @scene.get('hud').add(new uv.Label {
      x: @width-20
      y: 20
      textAlign: 'right'
      text: -> 
        'FPS: '+ @scene.fps
      sticky: true
      background: true
    })
    
    # WorldPos
    @scene.get('hud').add new uv.Label {
      x: @width-20
      y: 50
      textAlign: 'right'
      text: -> 
        pos = @scene.activeDisplay.worldPos(new uv.Vector(0,0))
        'Viewport (x,y): '+ parseInt(pos.x) +', '+ parseInt(pos.y)
      background: true
      sticky: true
    }
    
    # Scene Mouse Coordinates
    @scene.get('hud').add new uv.Label {
      x: @width-20
      y: 80
      textAlign: 'right'
      text: -> 
        pos = scene.activeDisplay.worldPos(new uv.Vector(0,0))
        'mousePos: '+ parseInt(scene.mouseX) +', '+ parseInt(scene.mouseY)
      sticky: true
      background: true,
    }
    
    @buildAxes(@xScale(), @yScale())

  render: ->
    @scene.start()
    
    
    