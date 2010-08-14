$(function() {
  
  setTimeout(init, 100);
  
  function init() {
    // load some data (represented as a Collection)
    c = new uv.Collection(countries_fixture);
  
    var xProp = c.get('properties', 'life_expectancy_male');
    var yProp = c.get('properties', 'life_expectancy_female');
    var zProp = c.get('properties', 'population');
  
    // construct a visualization based on that data
    vis = new uv.Scatterplot(c, {
      measures: [xProp.key, yProp.key, zProp.key],
      params: {}
    });
    
    var settings = '';

    var props = c.all('properties').select(function(key, p) {
      return p.type === 'number' && !p.unique;
    });

    var options = '';
    
    props.each(function(index, p) {
      options += "<option value="+p.key+" "+(p.key === 'life_expectancy_male' ? ' selected="true"' : '')+">"+p.name+"</option>";
    });
    
    settings += '<h3>Measures</h3><h4>X-Axis</h4><select id="xProp">'+options+'</select>';
    
    options = '';
    props.each(function(index, p) {
      options += "<option value="+p.key+" "+(p.key === 'life_expectancy_female' ? ' selected="true"' : '')+">"+p.name+"</option>";
    });
    
    settings += '<h4>Y-Axis</h4><select id="yProp">'+options+'</select>';

    options = '';
    props.each(function(index, p) {
      options += "<option value="+p.key+" "+(p.key === 'population' ? ' selected="true"' : '')+">"+p.name+"</option>";
    });
    
    settings += '<h4>Dot-Size</h4><select id="zProp">'+options+'</select>';
    settings += '</div>';
    
    settings += '<div class="settings"><h3>Sample</h3><input id="item_value_index" type="range" min="0" max="'+(xProp.categories.length-1)+'" value="'+vis.itemValueIndex+'"><br/><h2 id="current-category">'+xProp.categories[vis.itemValueIndex]+'</span></h2>';
    
    var $settings = $(settings);
  
    $('#sidebar').append($settings);
  
    $('#item_value_index').change(function() {
      if (vis.itemValueIndex !== $(this).val()) {
        vis.updateSampleIndex($(this).val());
      
        $('#current-category').html(xProp.categories[vis.itemValueIndex]);
        vis.render();
      }
    });
    
    $('#xProp').add('#yProp').add('#zProp').change(function() {
        var xProp = $('#xProp').val();
        var yProp = $('#yProp').val();
        var zProp = $('#zProp').val();
        vis.updateMeasures([xProp, yProp, zProp]);
    });
  
    vis.render();
  }
});