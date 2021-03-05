//creating global variables
areaString = "All Areas"
searchString = ""
yearString = "All Years"
//create a event driven simulation for dragging graph nodes
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

//width, height and radius of the graph SVG
width = 1200
height = 500
radius = 6;

//select the div and append an svg with the above width and height
var svg = d3.select("#knowledgeGraph").append("svg")
    .attr("width", width).attr("height", height);

//create a tooltip for each node that allows for displaying data
var tooltip = d3.select("#knowledgeGraph")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px");

//create a color scheme for linked data sources
var colorSchemeDataSource = ["#906500",
    "#0248ce",
    "#74cb00",
    "#cc00c0",
    "#7effa8",
    "#f1008b",
    "#00b7ae",
    "#f29cff",
    "#5de9ff",
    "#d25700",
    "#0095d9",
    "#ffe462",
    "#ae0073",
    "#005936",
    "#b70038",
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

//create a color scheme for datasets
var colorSchemeDataset = ["#906500",
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
    "#000000"
]

//create a color scheme for search results
var colorSchemeSearch = [
    "#90d911",
    "#d94011"
]

//domain for search results
var searchDomain = ["Data", "Linked Data Sources"]

//boolean to check which mode is active
var datasetMode = false;
//Button to toggle graph to use dataset as domain
var datasetBtn = document.getElementById("toggleByDataset");
datasetBtn.disabled = false;
//Button to toggle graph to use data source as domain
var datasourceBtn = document.getElementById("toggleByDataSource");
datasourceBtn.disabled = true;
//Button that allows for searching in the application
var searchBtn = document.getElementById("searchDataBtn");
//Events for above buttons
searchBtn.addEventListener("click", validateAndSearch);
datasetBtn.addEventListener("click", () => toggleView(true))
datasourceBtn.addEventListener("click", () => toggleView(false))
checkboxBtn = document.getElementById("linkedDataToggle")
checkboxBtn.addEventListener("click", () => toggleView(true))
// Search input field
var inp_field = document.getElementById("searchInpField");
var areaid = document.getElementById("filterByArea");
var yearid = document.getElementById("filterByYear");
// Execute search when enter is pressed
inp_field.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchBtn.click();
    }
});

function resetMenuValues() {
    searchInpField.text = ""

}
function toggleView(byDataset) {
    datasetMode = byDataset; //set global variable
    if (byDataset) {
        datasetBtn.disabled = true;
        datasourceBtn.disabled = false;
        checkboxBtn.disabled = false;
        data = { "showLinkedDataToggle": checkboxBtn.checked }
        fetch("/getByDataset", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
            .then(response => response.json())
            .then(function (response) {
                if (response.ok) {
                    createDropdowns(response.data);//create dropdowns for filters
                    createGraph(response.data, datasetMode);//create graph
                }
            }).catch(function (error) {
                console.log(error);
            });
    }
    else {
        datasetBtn.disabled = false;
        datasourceBtn.disabled = true;
        checkboxBtn.disabled = true;
        fetch("/getRDFData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: "" })
            .then(response => response.json())
            .then(function (response) {
                if (response.ok) {
                    createDropdowns(response.data);//create dropdowns for filters
                    createGraph(response.data, datasetMode);//create graph
                }
            }).catch(function (error) {
                console.log(error);
            });
    }
    //get all data

}

toggleView(false) //setup the initial draw for graph

var mouseover = function () { //mouse over function to allow for tooltip to be displayed
    tooltip.style("opacity", 1)
    d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
}
function getObjectValue(object) {
    hashPos = object.indexOf("#");
    if (hashPos == -1) {
        hashPos = object.lastIndexOf("/");
    }
    return object.substring(hashPos + 1);
}
var mousemove = function (ev, d) { //display tooltip content when mouse is moved
    var html = ""
    html = html.concat("<p><strong>Subject:</strong> " + getObjectValue(d.id) + "<br>")
    if (d.dataset != "Linked Data") {
        html = html.concat("<strong>Dataset:</strong> " + d.dataset + "<br>")
    }
    // if (d.group != "") {
    //     html = html.concat("<strong>Data Source:</strong> " + d.group + "<br>");
    // }
    html = html.concat("</p><p>")
    diseaseList = []
    for (ix in d.relationships) {
        relationship = d.relationships[ix];
        if (relationship.predicate == "refArea") {
            relationship.predicate = "Province"
        }
        if (relationship.predicate == "refPeriod") {
            relationship.predicate = "Year"
        }
        if (relationship.predicate == "numberofcases") {
            relationship.predicate = "Number of Cases"
        }
        if (relationship.predicate == "rateper100kpopulation") {
            relationship.predicate = "Rate per 100k Population"
        }
        if (relationship.predicate == "Disease") {
            if (relationship.object != "disease") {
                diseaseList.push(relationship.object)

            }
            continue;
        }
        html = html.concat("<strong>" + relationship.predicate + "</strong> => " + relationship.object + "<br>")
    }
    if (diseaseList.length != 0) {
        html = html.concat("<strong>" + "Diseases" + "</strong> => <br>")
        for (i in diseaseList) {
            if (i != diseaseList.length - 1)
                html = html.concat(diseaseList[i] + "<br>")
            else
                html = html.concat(diseaseList[i])
        }
    }
    html = html.concat("</p>")
    var matrix = this.getScreenCTM()
        .translate(+ this.getAttribute("cx"), + this.getAttribute("cy"));
    tooltip.html(html)
        .style("left", (window.pageXOffset + matrix.e + 15) + "px")
        .style("top", (window.pageYOffset + matrix.f - 30) + "px");
}
var mouseleave = function () { //remove tooltip on mouse leave
    tooltip
        .style("opacity", 0)
    d3.select(this)
        .attr("stroke", "#fff")
        .style("opacity", 0.8)
}
var nodeclick = function (ev, d) { //open NSOD link on node click
    if (d.url != "") {
        window.open(d.url)
    }
}
createGraph = function (data, byDataset = false, bySearch = false) {
    svg.selectAll("*").remove(); //remove previous nodes
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
        checkboxBtn.disabled = true;
    }
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-30).distanceMax(200))
        .force("center", d3.forceCenter(width / 3, height / 2));//create a force simulation with link,center and manybody forces

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
            });//create link for nodes

    var node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .style("opacity", 0.8)
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g");//create nodes of the graph


    var circles = node.append("circle")
        .data(data.nodes)
        .attr("r", bySearch ? 25 : 5)
        // .text(d => d.id) 
        // 


        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)//create circles inside the nodes and bind mouse events
        .on("click", nodeclick);
    simulation.force("link").distance(function (d) {
        return (bySearch ? 4.5 : 1) * d.value;
    })

    if (bySearch) {

        var label = node.append("text")
            .text(function (d) {
                for (ix in d.relationships) {
                    relationship = d.relationships[ix];
                    if (relationship.predicate == "numberofcases")
                        return relationship.object;
                }
                return ""
            })
            .attr('x', 0)
            .attr('y', 0);
    }
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

    simulation.force("link").links(data.links);//set links for force links

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
        .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });//create a legend

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
    btn = document.createElement('button'); //create button element
    btn.classList.add("dropdown-item"); //add bootstrap class
    btn.id = id; //set id
    btn.innerHTML = text //text
    btn.addEventListener("click", eventVal);
    dropdown.appendChild(btn); //append to dropdown menu
}

function createDropdowns(data) {

    //initilizing filter values to default values
    searchString = ""
    areaString = "All Areas"
    yearString = "All Years"
    yearid.innerHTML = yearString;
    inp_field.value = searchString;
    areaid.innerHTML = areaString;

    // diseaseMenu = document.getElementById("filterByDiseasesMenu")
    yearMenu = document.getElementById("filterByYearMenu")
    areaMenu = document.getElementById("filterByAreaMenu")

    // diseaseMenu.innerHTML = ""
    yearMenu.innerHTML = ""
    areaMenu.innerHTML = ""

    // createDropdownBtn(diseaseMenu, "reset_dis", "All Diseases", () => toggleView(datasetMode));
    createDropdownBtn(yearMenu, "reset_ye", "All Years", () => filterByYear("All Years"));
    createDropdownBtn(areaMenu, "reset_ar", "All Areas", () => filterByArea("All Areas"));



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
    yearString = year
    filterData()
}

function filterByArea(area) {
    areaString = area
    filterData()
}

function validateAndSearch() {
    searchString = removeTags(inp_field.value);
    filterData()
}

function filterData() {
    data = { "year": yearString, "area": areaString, "search": searchString }
    fetch("/filterData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(response => response.json())
        .then(function (response) {
            if (response.ok) {
                createGraph(response.data, false, true);
                yearid.innerHTML = yearString;
                inp_field.value = searchString;
                areaid.innerHTML = areaString;
            }
        }).catch(function (error) {
            console.log(error);
        });
}

function removeTags(value) {
    var temp = document.createElement("div");
    temp.innerHTML = value;
    var sanitized = temp.textContent || temp.innerText;
    sanitized = sanitized.trim();
    temp.remove()
    return sanitized;
}