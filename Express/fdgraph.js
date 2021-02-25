feather.replace()
drag = simulation => {

    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

fetch("/clicked", {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: ""
})
    .then(response => response.json())
    .then(function (response) {
        if (response.ok) {
            data = response.data;
            var svg = d3.select("svg"),
                width = +svg.attr("width"),
                height = +svg.attr("height");
                radius=6;

            var color = d3.scaleOrdinal(d3.schemeCategory10);

            var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(d => d.id))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2));

            var link = svg.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(data.links)
                .enter().append("line")
                .attr("stroke-width", d => Math.sqrt(d.value));

            var node = svg.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("g")
                .data(data.nodes)
                .enter().append("g");

            var circles = node.append("circle")
                .attr("r", 5)
                .attr("fill", function (d) { return color(d.group); })
                .call(drag(simulation));

            node.append("title")
                .text(d => d.id);

            simulation
                .nodes(data.nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(data.links);

            function ticked() {
                link
                    .attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });
                    
                 node.attr("transform", function (d) {
                    d.x = Math.max(radius, Math.min(width - radius, d.x));
                    d.y = Math.max(radius, Math.min(height - radius, d.y));
                         return "translate(" + d.x + "," + d.y + ")";
             })
         
                
           
            }                   
            var legend = svg.selectAll(".legend")
                .data(color.domain())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

            legend.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", color);

            legend.append("text")
                .data(data.ontologylist)
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) { return d; });
        }
        // throw new Error('Request failed.');
    })
    .catch(function (error) {
        console.log(error);
    });
