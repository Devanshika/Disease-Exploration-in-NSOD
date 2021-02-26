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

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

radius = 6;
var colorSchemeDataSource = ["#906500",
    "#0248ce",
    "#74cb00",
    "#cc00c0",
    "#7effa8",
    "#f1008b",
    "#00b7ae",
    "#b70038",
    "#5de9ff",
    "#d25700",
    "#0095d9",
    "#ffe462",
    "#ae0073",
    "#005936",
    "#f29cff",
    "#193500",
    "#ff8490",
    "#001c0e",
    "#e0eeff",
    "#7b0004",
    "#00abd2",
    "#6a0018",
    "#016b82",
    "#331800",
    "#005255"
]

var colorSchemeDataset =
    [
        "#906500",
        "#0248ce",
        "#74cb00",
        "#cc00c0",
        "#7effa8",
        "#f1008b",
        "#000000"
    ]

var datasetBtn = document.getElementById("toggleByDataset");
datasetBtn.disabled = false;
var datasourceBtn = document.getElementById("toggleByDataSource");
datasourceBtn.disabled = true;

datasetBtn.addEventListener("click", () => toggleView(true))
datasourceBtn.addEventListener("click", () => toggleView(false))

function toggleView(byDataset) {
    if (byDataset) {
        datasetBtn.disabled = true;
        datasourceBtn.disabled = false;
        fetch("/getRDFData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: "" })
            .then(response => response.json())
            .then(function (response) {
                if (response.ok) {
                    createGraph(response.data, true);
                }
            }).catch(function (error) {
                console.log(error);
            });
    }
    else {
        datasetBtn.disabled = false;
        datasourceBtn.disabled = true;
        fetch("/getRDFData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: "" })
            .then(response => response.json())
            .then(function (response) {
                if (response.ok) {
                    createGraph(response.data);
                }
            }).catch(function (error) {
                console.log(error);
            });
    }
}


fetch("/getRDFData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: "" })
    .then(response => response.json())
    .then(function (response) {
        if (response.ok) {
            createGraph(response.data);
        }
    }).catch(function (error) {
        console.log(error);
    });

function distanceCalc(d) {
    return d.value;
}



createGraph = function (data, byDataset = false) {
    // test = {}
    // test["datasets"] = data.datasets
    // test["dimensions"] = data.dimensions
    // test["measures"] = data.measures
    // document.getElementById("debug").innerHTML = "Datasets Dimensions and Measures:-\n"+JSON.stringify(test)
    svg.selectAll("*").remove();
    var color = d3.scaleOrdinal(byDataset ? colorSchemeDataset : colorSchemeDataSource);
    color.domain(byDataset ? data.datasets : data.ontologylist)

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(distanceCalc))
        .force("charge", d3.forceManyBody().strength(-30).distanceMax(200))
        .force("center", d3.forceCenter(width / 3, height / 2));

    var link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.links)
        .enter().append("line")
        .attr("stroke-width",
            function (d) {
                value = d.value > 20 ? 1 : 4;
                return Math.sqrt(value)
            });

    var node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g");

    var circles = node.append("circle")
        .data(data.nodes)
        .attr("r", 5);
    if (byDataset) {
        circles.attr("fill", function (d) { return color(d.dataset); })
    }
    else {
        circles.attr("fill", function (d) { return color(d.group); })
    }
    circles.call(drag(simulation));

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
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function (d) { return d; });

}



