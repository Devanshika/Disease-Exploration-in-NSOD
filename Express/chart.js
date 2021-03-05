yearToggle = document.getElementById("yearToggle")
areaToggle = document.getElementById("areaToggle")
noOfCasesToggle = document.getElementById("noOfCasesToggle")
ratePer100KToggle = document.getElementById("ratePer100KToggle")
getChartBtn = document.getElementById("getChartBtn")
chartTitle = document.getElementById("chartTitle")
chartDescription = document.getElementById("chartDescription")

//width, height of the graph SVG
width = 1200
height = 500
radius = Math.min(width, height) / 2;
//select the div and append an svg with the above width and height
var svg = d3.select("#dataCharts").append("svg")
    .attr("width", width).attr("height", height);

var tooltip = d3.select("#dataCharts").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var tooltip2 = d3.select("#dataCharts").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var checkedDiseases = []

var colorSchemes = {
    "refArea": [
        "#90d911",
        "#d94011"
    ],
    "refPeriod": ["#906500",
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
        "#ae0073"
    ]
}

getDataFromServer()


getChartBtn.disabled = true
function getDataFromServer() {
    fetch("/getChartData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: "" })
        .then(response => response.json())
        .then(function (response) {
            if (response.ok) {
                let data = response.data
                createDiseaseToggles(data.dimensions["hasdisease"])
                getChartBtn.addEventListener("click", () => createGraph(data))
                getChartBtn.disabled = false
            }
        }).catch(function (error) {
            console.log(error);
        });
}

function diseaseToggled(disease) {
    if (document.getElementById(disease).checked) {
        if (checkedDiseases.indexOf(disease) < 0) {
            checkedDiseases.push(disease);
        }
    }
    else {
        pos = checkedDiseases.indexOf(disease)
        if (pos >= 0) {
            checkedDiseases.splice(pos, 1)
        }
    }
}

function getDiseaseID(disease) {
    disease = disease.toLowerCase()
    disease = disease.replace(/\s/g, '')
    return disease
}

function changeCheckboxes(selectVal, diseases) {
    if (!selectVal) {
        for (ix in checkedDiseases) {
            idVal = checkedDiseases[ix]
            document.getElementById(idVal).checked = false
        }
        checkedDiseases = []
    }
    else {
        for (ix in diseases) {
            disease = getDiseaseID(diseases[ix])
            if (checkedDiseases.indexOf(disease) < 0) {
                checkedDiseases.push(disease);
                document.getElementById(disease).checked = true
            }

        }
    }
}

function createDiseaseToggles(diseases) {
    diseaseToggles = document.getElementById("diseaseToggles")
    diseaseToggles.innerHTML = ""
    para = document.createElement('p');
    bold = document.createElement('b');
    bold.innerHTML = "Choose Disease Types"
    diseaseToggles.appendChild(para)
    para.appendChild(bold)
    para2 = document.createElement('p');
    diseaseToggles.appendChild(para2)
    selectButton = document.createElement('button');
    selectButton.classList.add("btn", "btn-secondary", "btn-sm");
    selectButton.innerHTML = "Select All"
    selectButton.addEventListener("click", () => changeCheckboxes(true, diseases))
    para2.appendChild(selectButton)
    deSelectButton = document.createElement('button');
    deSelectButton.classList.add("btn", "btn-secondary", "btn-sm");
    deSelectButton.innerHTML = "Deselect All"
    deSelectButton.addEventListener("click", () => changeCheckboxes(false, diseases))
    para2.appendChild(deSelectButton)
    for (ix in diseases) {
        let disease = getDiseaseID(diseases[ix])
        let label = document.createElement('label');
        label.classList.add("checkbox"); //add bootstrap class
        diseaseToggles.appendChild(label);
        diseaseToggles.appendChild(document.createElement('br'));
        let checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.id = disease
        let att = document.createAttribute("data-toggle")
        att.value = "toggle"
        checkbox.setAttributeNode(att)
        checkbox.addEventListener("click", () => diseaseToggled(disease))
        let att2 = document.createAttribute("checked");
        att2.value = true
        checkbox.setAttributeNode(att2)
        checkedDiseases.push(disease)
        label.appendChild(checkbox)
        label.appendChild(document.createTextNode(diseases[ix]))
    }
}

function createGraph(data) {
    svg.selectAll("*").remove(); //remove previous graph
    tooltip.selectAll("*").remove(); //remove tooltip content
    tooltip2.selectAll("*").remove();
    data_dict = {
        "nodes": [],
        "datasets": data.datasets,
        "dimensions": data.dimensions,
    }
    all_nodes = data.nodes
    for (ix in all_nodes) {
        let node = all_nodes[ix]
        diseases = node.Disease
        for (jx in diseases) {
            if (checkedDiseases.indexOf(getDiseaseID(diseases[jx])) >= 0) {
                data_dict.nodes.push(node)
                break;
            }
        }
    }
    if (yearToggle.checked && areaToggle.checked) //both dimensions are selected
    {
        if (!ratePer100KToggle.checked && !noOfCasesToggle.checked) //one measure should be selected
        {
            return
        }
        measureA = null
        measureB = null
        if (noOfCasesToggle.checked) // make trace for noOfCasesToggle
        {
            measureA = "numberofcases"
        }
        if (ratePer100KToggle.checked) // make trace for ratePer100KToggle
        {
            if (measureA != null) {
                measureB = "rateper100kpopulation"
            }
            else {
                measureA = "rateper100kpopulation"
            }
        }
        createAreawiseLineGraphs(data_dict, measureA, measureB);
    }
    else if (yearToggle.checked) //dimension year is primary
    {
        if (!ratePer100KToggle.checked && !noOfCasesToggle.checked) //make pie chart
        {
            createPie(data_dict, "refPeriod")
        }
        else {
            measureA = null
            measureB = null
            if (noOfCasesToggle.checked) // make trace for noOfCasesToggle
            {
                measureA = "numberofcases"
            }
            if (ratePer100KToggle.checked) // make trace for ratePer100KToggle
            {
                if (measureA != null) {
                    measureB = "rateper100kpopulation"
                }
                else {
                    measureA = "rateper100kpopulation"
                }
            }
            createLineGraphs(data_dict, measureA, measureB)
        }
    }
    else if (areaToggle.checked) //dimension area is primary
    {
        if (!ratePer100KToggle.checked && !noOfCasesToggle.checked) //make pie chart
        {
            createPie(data_dict, "refArea")
        }
    }
}

function createPie(data, dimension) {
    chartTitle.innerHTML = (dimension == "refArea" ? "Area" : "Year") + " Pie Chart"
    chartDescription.innerHTML = "This graph shows the distribution of number of cases of all Observations in terms of " + (dimension == "refArea" ? "Area" : "Year")
    var color = d3.scaleOrdinal(colorSchemes[dimension]);
    color.domain(data.dimensions[dimension])
    var pie = d3.pie()
        .value(function (d) { return d.value; })
        .sort(null);
    var arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.8);

    // Another arc that won't be drawn. Just for labels positioning
    var outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9)

    g = svg
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    pie_data = {}
    unique_values = data.dimensions[dimension]
    for (ix in unique_values) {
        value = unique_values[ix]
        pie_data[value] = 0
    }
    nodes = data.nodes

    for (ix in nodes) {
        node = nodes[ix]
        if (dimension != "refArea") {
            if (node[dimension] == "2006")
                console.log(pie_data[node[dimension]])
        }
        pie_data[node[dimension]] = pie_data[node[dimension]] + parseInt(node["numberofcases"])
    }
    pieData = []
    for (let [key, value] of Object.entries(pie_data)) {
        dictVal = { "key": key, "value": value }
        pieData.push(dictVal)
    }
    pieData = pie(pieData)

    g.selectAll('allSlices')
        .data(pieData)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d) { return (color(d.data.key)) })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)

    g
        .selectAll('allPolylines')
        .data(pieData)
        .enter()
        .append('polyline')
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function (d) {
            var posA = arc.centroid(d) // line insertion in the slice
            var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
            var posC = outerArc.centroid(d); // Label position = almost the same as posB
            // var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            // posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
            return [posA, posB, posC]
        })
    g
        .selectAll('allLabels')
        .data(pieData)
        .enter()
        .append('text')
        .text(function (d) { return d.data.value })
        .attr('transform', function (d) {
            var pos = outerArc.centroid(d);
            // var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            // pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style('text-anchor', function (d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            return (midangle < Math.PI ? 'start' : 'end')
        })

    var legendVal = svg.selectAll(".legend")
        .data(pieData)
        .enter()
        .append("g")
        .attr("transform", function (d, i) {
            return "translate(" + (width - 110) + "," + (i * 15 + 20) + ")";
        })
        .attr("class", "legend");

    legendVal.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function (d, i) {
            return (color(i))
        });

    legendVal.append("text")
        .text(function (d) {
            return d.data.key;
        })
        .style("font-size", 12)
        .attr("y", 10)
        .attr("x", 11);
}

function setMeasureVal(measure, node, dataDict, dimension, maxVal) {
    value = parseInt(node[measure])
    if (maxVal) {
        if (dataDict[node[dimension]] < value) {
            dataDict[node[dimension]] = value
        }
    }
    else {
        dataDict[node[dimension]] += value
    }
}

function getGraphData(data, measureA, measureB, areaVal = null) {
    graphData = []
    mA_values = {}
    mB_values = {}
    year_total = {}
    unique_values = data.dimensions["refPeriod"]
    for (ix in unique_values) {
        value = unique_values[ix]
        mA_values[value] = 0
        mB_values[value] = 0
        year_total[value] = 0
    }

    nodes = data.nodes
    for (ix in nodes) {
        node = nodes[ix]
        if (areaVal != null) {
            if (node["refArea"] != areaVal) {
                continue;
            }
        }
        setMeasureVal(measureA, node, mA_values, "refPeriod", measureA != "numberofcases")
        if (measureB != null) {
            setMeasureVal(measureB, node, mB_values, "refPeriod", true)
        }
        year_total[node["refPeriod"]] += 1
    }

    for (key in mA_values) {
        nodeDict = { "refPeriod": key, "measureA": mA_values[key] }

        if (measureB != null) {
            nodeDict["measureB"] = mB_values[key]
        }
        if (measureA == "numberofcases") {
            nodeDict.measureA = nodeDict.measureA == 0 ? 0 : nodeDict.measureA / year_total[key]
        }
        graphData.push(nodeDict);
    }
    return graphData
}

function createAreawiseLineGraphs(data, measureA, measureB = null) {
    chartTitle.innerHTML = "Year vs " + (measureA == "numberofcases" ? "Average Number of Cases" : "Maximum Rate per 100K Population") + (measureB == null ? "" : "and Maximum Rate per 100K Population") + " Line Chart"
    chartDescription.innerHTML = "This graph shows Year wise distribution of all Observations divided by Area. The measures against this dimension are " + (measureA == "numberofcases" ? "Average Number of Cases" : "Maximum Rate per 100K Population") + (measureB == null ? "" : "and Maximum Rate per 100K Population");
    var margin = { top: 30, right: 50, bottom: 30, left: 50 }

    unique_area_vals = data.dimensions["refArea"]
    graphWidth = width / unique_area_vals.length
    graphHeight = height
    curLeftVal = margin.left
    for (ix in unique_area_vals) {
        areaVal = unique_area_vals[ix]
        let graphData = getGraphData(data, measureA, measureB, areaVal)
        let tooltipInst = tooltip
        if (areaVal === "Alberta") {
            tooltipInst = tooltip2
        }
        createLineGraph(graphData, measureA, measureB, margin, graphWidth, graphHeight, curLeftVal, margin.top, tooltipInst, areaVal)
        curLeftVal += graphWidth
    }

}


function createLineGraph(graphData, measureA, measureB = null, margin, widthVal, heightVal, posLeft, posTop, tooltipInst, title = "All Areas") {
    g = svg.append("g")
        .attr("width", widthVal)
        .attr("height", heightVal)
        .attr("transform", "translate(" + posLeft + "," + posTop + ")");
    g.append("text")
        .attr("x", (widthVal / 2))
        .attr("y", 0 - (posTop / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(title);
    gWidth = widthVal - margin.left - margin.right,
        gHeight = heightVal - margin.top - margin.bottom;
    var parseTime = d3.timeParse("%Y");
    bisectDate = d3.bisector(function (d) { return parseTime(d.refPeriod); }).left
    var focus = g.append("g")
        .attr("class", "focusA")
        .style("opacity", 0);

    focus.append("circle")
        .attr("r", 5);

    var focusB = null
    if (measureB != null) {
        focusB = g.append("g").attr("class", "focusB")
            .style("opacity", 0);

        focusB.append("circle").attr("r", 5);
    }
    var tooltipYear = tooltipInst.append("div")
        .attr("class", "tooltip-date");

    var tooltipMeasureA = tooltipInst.append("div");
    tooltipMeasureA.append("span")
        .attr("class", "tooltip-title")
        .text((measureA == "numberofcases" ? "Average Number of Cases" : "Maximum Rate per 100K Population") + ": ");

    var tooltipMeasureAValue = tooltipInst.append("span")
        .attr("id", "measureATooltip")
        .attr("class", "tooltip-measure");

    let tooltipMeasureB = null
    let tooltipMeasureBValue = null
    if (measureB != null) {
        tooltipMeasureB = tooltipInst.append("div");
        tooltipMeasureB.append("span")
            .attr("class", "tooltip-title")
            .text("Maximum Rate per 100K Population: ");

        tooltipMeasureBValue = tooltipMeasureB.append("span")
            .attr("id", "measureBTooltip")
            .attr("class", "tooltip-measure");
    }

    g.append("rect")
        .attr("class", "overlay")
        .attr("width", gWidth)
        .attr("height", gHeight)
        .on("mouseover", function () {
            focus.style("opacity", 1);
            tooltipInst.style("opacity", 1);
            if (measureB != null) {
                focusB.style("opacity", 1);
            }
        })
        .on("mouseout", function () {
            focus.style("opacity", 0);
            tooltipInst.style("opacity", 0);
            if (measureB != null) {
                focusB.style("opacity", 0);
            }
        })
        .on("mousemove", mousemove);

    function mousemove(ev) {
        var x0 = x.invert(d3.pointer(ev)[0]),
            i = bisectDate(graphData, x0, 1),
            d0 = graphData[i - 1],
            d1 = graphData[i],
            d = x0 - parseTime(d0.refPeriod) > parseTime(d1.refPeriod) - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(parseTime(d.refPeriod)) + "," + y(d.measureA) + ")");
        tooltipInst.style("left", (x(parseTime(d.refPeriod)) + 200 + posLeft) + "px");
        tooltipInst.style("top", y(d.measureA) + "px")
        tooltipYear.text(d.refPeriod);
        tooltipMeasureAValue.text(d.measureA);
        if (measureB != null) {
            tooltipMeasureBValue.text(d.measureB);
            focusB.attr("transform", "translate(" + x(parseTime(d.refPeriod)) + "," + y2(d.measureB) + ")")
        }
    }

    var x = d3.scaleTime()
        .domain(d3.extent(graphData, function (d) { return parseTime(d.refPeriod); }))
        .range([0, gWidth]);

    g
        .append("g")
        .attr("transform", "translate(0," + gHeight + ")")
        .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
        .domain([0, d3.max(graphData, function (d) { return d.measureA; })])
        .range([gHeight, 0]);

    var y2 = null

    g.append("g")
        .attr("stroke", "steelblue")
        .call(d3.axisLeft(y));

    g.append("path")
        .datum(graphData)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .attr("d", d3.line()
            .x(function (d) { return x(parseTime(d.refPeriod)); })
            .y(function (d) { return y(d.measureA); }));

    g.append("text")
        .attr("text-anchor", "end")
        .attr("x", gWidth)
        .attr("y", gHeight - 6)
        .text("Year");

    g.append("text")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(measureA == "numberofcases" ? "Average Number of Cases" : "Maximum Rate Per 100K Population");

    if (measureB != null) {
        y2 = d3.scaleLinear()
            .domain([0, d3.max(graphData, function (d) { return d.measureB; })])
            .range([gHeight, 0]);
        g.append("g")
            .attr("stroke", "red")
            .attr("transform", "translate(" + gWidth + " ,0)")
            .call(d3.axisRight(y2));

        g.append("text")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "translate(" + gWidth + " ,0)")
            .text("Maximum Rate Per 100K Population");
        g.append("path")
            .datum(graphData)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) { return x(parseTime(d.refPeriod)); })
                .y(function (d) { return y2(d.measureB); }))
    }

}

function createLineGraphs(data, measureA, measureB = null) {
    chartTitle.innerHTML = "Year vs " + (measureA == "numberofcases" ? "Average Number of Cases" : "Maximum Rate per 100K Population") + (measureB == null ? "" : "and Maximum Rate per 100K Population") + " Line Chart"
    chartDescription.innerHTML = "This graph shows Year wise distribution of all Observations. The measures against this dimension are " + (measureA == "numberofcases" ? "Average Number of Cases" : "Maximum Rate per 100K Population") + (measureB == null ? "" : "and Maximum Rate per 100K Population");
    var margin = { top: 30, right: 20, bottom: 30, left: 50 }

    let graphData = getGraphData(data, measureA, measureB)
    createLineGraph(graphData, measureA, measureB, margin, width, height, margin.left, margin.top, tooltip)
}