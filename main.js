d3.queue()
  .defer(d3.json, '//raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json')
  .defer(d3.json, '//raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json')
  .await((err, countyData, educationData) => {
    if (err) return err;

    educationData.forEach(element => {
      let county = countyData.objects.counties.geometries.filter(d => d.id === element.fips);

      county.forEach( d => d.properties = element);
    });

    let geoData = topojson.feature(countyData, countyData.objects.counties).features;



    let color = d3.scaleThreshold()
                  .domain(d3.range(2.6, 75.1, (75.1-2.6)/8))
                  .range(d3.schemeRdYlGn[9]);
                  
    let width = 960,
        height = 600,
        path = d3.geoPath();

    let x = d3.scaleLinear()
              .domain([2.6, 75.1])
              .rangeRound([600, 860]);

    let svg = d3.select('svg')
                .attr('width', width)
                .attr('height', height);

    let tooltip = d3.select('body')
                  .append("div")
                  .attr("class", "tooltip")
                  .attr("id", "tooltip")
                  .style("opacity", 0);

    let g = svg.append("g")
                .attr("class", "key")
                .attr("id", "legend")
                .attr("transform", "translate(0,20)");
            
    g.selectAll("rect")
      .data(color.range().map((d) => {
          d = color.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter()
      .append("rect")
        .attr("height", 8)
        .attr("x", (d) => { return x(d[0]); })
        .attr("width", (d) => { return x(d[1]) - x(d[0]); })
        .attr("fill", (d) => { return color(d[0]); });
            
    g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
            
    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat((x) => { return Math.round(x) + '%' })
        .tickValues(color.domain()))
        .select(".domain")
        .remove();
            

    svg.append('g')
        .selectAll('path')
        .data(geoData)
        .enter()
        .append('path')
        .classed('county', true)
        .attr('d', path)
        .attr('data-fips', d => d.properties.fpis )
        .attr('data-education', d => d.properties.bachelorsOrHigher)
        .attr('fill', d => color(d.properties.bachelorsOrHigher))
        .on('mouseover', d => {
          tooltip
            .transition()
            .style('opacity', .9);

          tooltip
            .attr('data-education', d.properties.bachelorsOrHigher)
            .html(`
              ${d.properties.area_name}, ${d.properties.state} : ${d.properties.bachelorsOrHigher}%
            `)
            .style('left', d3.event.pageX+10+'px') 
            .style('top', d3.event.pageY-10+'px') 
        })
        .on('mouseout', d => {
          tooltip.transition()
                .style('opacity', 0);
        })

    svg.append("path")
        .datum(topojson.mesh(countyData, countyData.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path);

  });