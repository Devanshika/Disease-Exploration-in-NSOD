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


width = 1200
height = 500

var svg = d3.select("#knowledgeGraph").append("svg")
    .attr("width", width).attr("height", height);

var tooltip = d3.select("#knowledgeGraph")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px");

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

var colorSchemeDataset = ["#906500",
    "#0248ce",
    "#74cb00",
    "#cc00c0",
    "#7effa8",
    "#f1008b",
    "#000000"
]

var colorSchemeSearch = [
    "#90d911",
    "#d94011"
]

var searchDomain = ["Data", "Linked Data Sources"]

var datasetMode = false;
var datasetBtn = document.getElementById("toggleByDataset");
datasetBtn.disabled = false;
var datasourceBtn = document.getElementById("toggleByDataSource");
datasourceBtn.disabled = true;
var searchBtn = document.getElementById("searchDataBtn");
searchBtn.addEventListener("click", validateAndSearch);
datasetBtn.addEventListener("click", () => toggleView(true))
datasourceBtn.addEventListener("click", () => toggleView(false))


// Get the input field
var inp_field = document.getElementById("searchInpField");

// Execute a function when the user releases a key on the keyboard
inp_field.addEventListener("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard

    if (event.key === "Enter") {

        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        searchBtn.click();
    }
});


function toggleView(byDataset) {
    datasetMode = byDataset;
    if (byDataset) {
        datasetBtn.disabled = true;
        datasourceBtn.disabled = false;
        fetch("/getRDFData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: "" })
            .then(response => response.json())
            .then(function (response) {
                if (response.ok) {
                    createDropdowns(response.data);
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
                    createDropdowns(response.data);
                    createGraph(response.data);
                }
            }).catch(function (error) {
                console.log(error);
            });
    }
}


toggleView(false)

function distanceCalc(d) {
    return d.value;
}

var mouseover = function () {
    tooltip
        .style("opacity", 1)
    d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
}
var mousemove = function (ev, d) {
    var html = ""
    html = html.concat("<p><strong>Subject:</strong> " + d.id + "<br>")
    if (d.dataset != "") {
        html = html.concat("<strong>Dataset:</strong> " + d.dataset + "<br>")
    }
    if (d.group != "") {
        html = html.concat("<strong>Data Source:</strong> " + d.group + "<br>");
    }
    html = html.concat("</p><p>")
    for (ix in d.relationships) {
        relationship = d.relationships[ix];
        html = html.concat("<strong>Relationship Type:</strong> " + relationship.Predicate + " => <strong>Object:</strong> " + relationship.Object + "<br>")
    }
    html = html.concat("</p>")
    var matrix = this.getScreenCTM()
        .translate(+ this.getAttribute("cx"), + this.getAttribute("cy"));
    tooltip.html(html)
        .style("left", (window.pageXOffset + matrix.e + 15) + "px")
        .style("top", (window.pageYOffset + matrix.f - 30) + "px");
}
var mouseleave = function () {
    tooltip
        .style("opacity", 0)
    d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8)
}

createGraph = function (data, byDataset = false, bySearch = false) {
    svg.selectAll("*").remove();
    var color = null;
    if (!bySearch) {
        color = d3.scaleOrdinal(byDataset ? colorSchemeDataset : colorSchemeDataSource);
        color.domain(byDataset ? data.datasets : data.ontologylist)
    }
    else {
        color = d3.scaleOrdinal(colorSchemeSearch);
        color.domain(searchDomain);
        datasetBtn.disabled = false;
        datasourceBtn.disabled = false;
    }
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
        .attr("r", 5)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
    if (!bySearch) {
        if (byDataset) {
            circles.attr("fill", function (d) { return color(d.dataset); })
        }
        else {
            circles.attr("fill", function (d) { return color(d.group); })
        }
    }
    else {
        circles.attr("fill", function (d) { return color(d.search); })
    }
    circles.call(drag(simulation));

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

function createDropdownBtn(dropdown, id, text, eventVal) {
    btn = document.createElement('button');
    btn.classList.add("dropdown-item");
    btn.id = id;
    btn.innerHTML = text
    btn.addEventListener("click", eventVal);
    dropdown.appendChild(btn);
}

function createDropdowns(data) {

    // diseaseMenu = document.getElementById("filterByDiseasesMenu")
    yearMenu = document.getElementById("filterByYearMenu")
    areaMenu = document.getElementById("filterByAreaMenu")

    // diseaseMenu.innerHTML = ""
    yearMenu.innerHTML = ""
    areaMenu.innerHTML = ""

    // createDropdownBtn(diseaseMenu, "reset_dis", "All Diseases", () => toggleView(datasetMode));
    createDropdownBtn(yearMenu, "reset_ye", "All Years", () => toggleView(datasetMode));
    createDropdownBtn(areaMenu, "reset_ar", "All Areas", () => toggleView(datasetMode));


    // for (ix in data.dimensions["hasdisease"]) {
    //     let val = data.dimensions["hasdisease"][ix]
    //     disid = "dis_" + val
    //     createDropdownBtn(diseaseMenu, disid, val, () => filterByDisease(val));
    // }

    for (ix in data.dimensions["refPeriod"]) {
        let val = data.dimensions["refPeriod"][ix]
        disid = "ye_" + val
        createDropdownBtn(yearMenu, disid, val, () => filterByYear(val));
    }

    for (ix in data.dimensions["refArea"]) {
        let val = data.dimensions["refArea"][ix]
        disid = "ar_" + val
        createDropdownBtn(areaMenu, disid, val, () => filterByArea(val));
    }
}


function filterByDisease(disease) {
    dis_data = { "disease": disease }
    fetch("/filterByDiseases", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dis_data) })
        .then(response => response.json())
        .then(function (response) {
            if (response.ok) {
                createGraph(response.data, datasetMode, true);
            }
        }).catch(function (error) {
            console.log(error);
        });

}

function filterByYear(year) {
    year_data = { "year": year }
    fetch("/filterByYear", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(year_data) })
        .then(response => response.json())
        .then(function (response) {
            if (response.ok) {
                createGraph(response.data, datasetMode, true);
            }
        }).catch(function (error) {
            console.log(error);
        });
}

function filterByArea(area) {
    area_data = { "area": area }
    fetch("/filterByArea", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(area_data) })
        .then(response => response.json())
        .then(function (response) {
            if (response.ok) {
                createGraph(response.data, datasetMode, true);
            }
        }).catch(function (error) {
            console.log(error);
        });
}

function filterBySearch(search) {
    search_data = { "search": search }
    fetch("/filterBySearch", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(search_data) })
        .then(response => response.json())
        .then(function (response) {
            if (response.ok) {

                createGraph(response.data, datasetMode, true);
            }
        }).catch(function (error) {
            console.log(error);
        });
}

function validateAndSearch() {
    search_string = removeTags(inp_field.value);
    if (search_string === "") {
        toggleView(datasetMode);
    }
    else {
        filterBySearch(search_string);
    }
}

function removeTags(value) {
    var temp = document.createElement("div");
    temp.innerHTML = value;
    var sanitized = temp.textContent || temp.innerText;
    sanitized = sanitized.trim();
    temp.remove()
    return sanitized;
}