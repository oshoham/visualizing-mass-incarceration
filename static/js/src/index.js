import d3 from 'd3';
import d3Tip from 'd3-tip';
import { queue } from 'd3-queue';
import topojson from 'topojson';

d3.tip = d3Tip(d3);

var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var projection = d3.geo.albersUsa()
    .scale(1280)
    .translate([width / 2 - width / 8, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

var totalPrisonersByYearByState = d3.map();

queue()
  .defer(d3.json, 'static/json/us.json')
  .defer(d3.csv, 'static/data/total_prisoners_by_year_by_state.csv', function (d) {
    if (!totalPrisonersByYearByState.has(d.year)) {
      totalPrisonersByYearByState.set(d.year, d3.map());
    }

    totalPrisonersByYearByState.get(d.year).set(d.state, d.total);
  })
  .await(ready);

function ready (error, us) {
  if (error) {
    return console.error(error);
  }

  var initialYear = '1978';

  var tip = d3.tip()
    .attr('class', 'tip')
      .offset([-10, 0])
      .direction('n')
      .html(function (d) {
        return d.properties.name + '<br/>' + totalPrisonersByYearByState.get(initialYear).get(d.properties.code);
      });

  svg.call(tip);

  // // calculate global min and max across all years and states

  // var [min, max] = totalPrisonersByYearByState.values().reduce(function ([globalMin, globalMax], totalPrisonersByState) {
  //   let [localMax, localMin] = d3.extent(totalPrisonersByState.values());
  //   return [Math.min(globalMin, localMin), Math.max(globalMax, localMax)];
  // }, [Number.MAX_SAFE_INTEGER, 0]);

  var [max, min] = d3.extent(totalPrisonersByYearByState.get(initialYear).values());

  var quantize = d3.scale.quantize()
    .domain([min, max])
    .range(d3.range(9).map(function(i) { return `state--q${i}-9`; }));

  var states = svg.append('g')
    .attr('class', 'states')
    .selectAll('path')
      .data(topojson.feature(us, us.objects.states).features)
    .enter().append('path')
      .attr('class', function (d) { return `state ${quantize(totalPrisonersByYearByState.get(initialYear).get(d.properties.code))}`; })
      .attr('id', function (d) { return d.properties.code; })
      .attr('d', path)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  var label = svg.append('text')
    .attr('class', 'year')
    .attr('text-anchor', 'end')
    .attr('y', height - 24)
    .attr('x', width - 24)
    .text(initialYear);

  // Add an overlay for the year label.
  var box = label.node().getBBox();
  var yearScale = d3.scale.linear()
    .domain(d3.extent(totalPrisonersByYearByState.keys()))
    .range([box.x + 10, box.x + box.width - 10])
    .clamp(true);

  var overlay = svg.append('rect')
    .attr('class', 'overlay')
    .attr('x', box.x)
    .attr('y', box.y)
    .attr('width', box.width)
    .attr('height', box.height)
    .on('mouseover', function () { label.classed('active', true); })
    .on('mouseout', function () { label.classed('active', false); })
    .on('mousemove', onMouseOverYear)
    .on('touchmove', onMouseOverYear);

  function onMouseOverYear () {
    var year = Math.round(yearScale.invert(d3.mouse(this)[0])).toString();
    label.text(year);
    states.attr('class', function (d) {
      return `state ${quantize(totalPrisonersByYearByState.get(year).get(d.properties.code))}`;
    });
    tip.html(function (d) {
      return d.properties.name + '<br/>' + totalPrisonersByYearByState.get(year).get(d.properties.code);
    });
  }
}
