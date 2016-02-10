import d3 from 'd3';
import d3Tip from 'd3-tip';
import { queue } from 'd3-queue';
import topojson from 'topojson';

d3.tip = d3Tip(d3);

var width = 960,
    height = 600;

var projection = d3.geo.albersUsa()
    .scale(1280)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

var year = '1978';
var totalPrisonersByYearByState = d3.map();

var tip = d3.tip()
  .attr('class', 'tip')
    .offset([-10, 0])
    .direction('n')
    .html(function(d) {
      return d.properties.name + '<br/> Total Prisoners: ' + totalPrisonersByYearByState.get(year).get(d.properties.code);
    });

svg.call(tip);

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

  // svg.append('path')
  //   .datum(topojson.feature(us, us.objects.land))
  //   .attr('class', 'land')
  //   .attr('d', path);

  // draw states as one path

  // svg.append('path')
  //     .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
  //     .attr('class', 'border border--state')
  //     .attr('d', path);

  // draw one path per state

  svg.append('g')
    .attr('class', 'states')
    .selectAll('path')
      .data(topojson.feature(us, us.objects.states).features)
    .enter().append('path')
      .attr('class', 'state')
      .attr('id', function (d) { return d.properties.code; })
      .attr('d', path)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);
}
