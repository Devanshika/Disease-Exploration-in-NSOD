yearToggle = document.getElementById("yearToggle")
areaToggle = document.getElementById("areaToggle")
noOfCasesToggle = document.getElementById("noOfCasesToggle")
ratePer100KToggle = document.getElementById("ratePer100KToggle")
getChartBtn = document.getElementById("getChartBtn")

yearToggle.addEventListener("click", () => toggleView())
areaToggle.addEventListener("click", () => toggleView())
//width, height of the graph SVG
width = 1200
height = 500
radius = Math.min(width, height) / 2;
//select the div and append an svg with the above width and height
var svg = d3.select("#dataCharts").append("svg")
    .attr("width", width).attr("height", height);

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


function toggleView() {
    if (areaToggle.checked) {
        yearToggle.disabled = true
        areaToggle.disabled = false
    }
    else if (yearToggle.checked) {
        areaToggle.disabled = true
        yearToggle.disabled = false

    }
    else if (!areaToggle.checked && !yearToggle.checked) {
        areaToggle.disabled = false
        yearToggle.disabled = false
    }
}

function getDataFromServer() {
    fetch("/getChartData", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: "" })
        .then(response => response.json())
        .then(function (response) {
            if (response.ok) {
                let data = response.data
                getChartBtn.addEventListener("click", () => createGraph(data))
            }
        }).catch(function (error) {
            console.log(error);
        });
}

function createGraph(data) {
    svg.selectAll("*").remove(); //remove previous graph
    if (yearToggle.checked) //dimension year is primary
    {
        if (!ratePer100KToggle.checked && !noOfCasesToggle.checked) //make pie chart
        {
            createPie(data, "refPeriod")
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
            createLineGraphs(data, measureA, measureB)
        }
    }
    else if (areaToggle.checked) //dimension area is primary
    {
        if (!ratePer100KToggle.checked && !noOfCasesToggle.checked) //make pie chart
        {
            createPie(data, "refArea")
        }
        else {
            if (ratePer100KToggle.checked) // make trace for ratePer100KToggle
            {

            }
            if (noOfCasesToggle.checked) // make trace for noOfCasesToggle
            {

            }
        }
    }
    else if (ratePer100KToggle.checked && noOfCasesToggle.checked) //dimension isn't set only measures are set
    {

    }
}

function createPie(data, dimension) {
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
        pie_data[node[dimension]] = pie_data[node[dimension]] + 1
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
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
            posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
            return [posA, posB, posC]
        })
    g
        .selectAll('allLabels')
        .data(pieData)
        .enter()
        .append('text')
        .text(function (d) { console.log(d.data.key); return d.data.key })
        .attr('transform', function (d) {
            var pos = outerArc.centroid(d);
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style('text-anchor', function (d) {
            var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            return (midangle < Math.PI ? 'start' : 'end')
        })
}

function setMeasureVal(measure, node, dataDict) {
    value = node[measure]
    if (measure == "rateper100kpopulation") {

        if (dataDict[node["refPeriod"]] < value) {
            dataDict[node["refPeriod"]] = value
        }
    }
    else if (measure == "numberofcases") {
        dataDict[node["refPeriod"]] += value
    }
}

function createLineGraphs(data, measureA, measureB = null) {
    var margin = { top: 30, right: 20, bottom: 30, left: 50 },
        gWidth = width - margin.left - margin.right,
        gHeight = height - margin.top - margin.bottom;
    g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseTime = d3.timeParse("%Y");

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
        setMeasureVal(measureA, node, mA_values)
        if (measureB != null) {
            setMeasureVal(measureB, node, mB_values)
        }
        year_total[node["refPeriod"]] += 1
    }

    for (key in mA_values) {
        nodeDict = { "refPeriod": key, "measureA": mA_values[key] }
        if (measureB != null) {
            nodeDict["measureB"] = mB_values[key]
        }
        if (measureA == "numberofcases") {
            nodeDict.measureA = nodeDict.measureA / year_total[key]
        }
        graphData.push(nodeDict);
    }
    // for (ix in nodes) {
    //     node = nodes[ix]
    //     nodeDict = { "refPeriod": node["refPeriod"], "measureA": node[measureA] }
    //     if (measureB != null) {
    //         nodeDict["measureB"] = node[measureB]
    //     }
    //     graphData.push(nodeDict)
    // }

    var x = d3.scaleTime()
        .domain(d3.extent(graphData, function (d) { return parseTime(d.refPeriod); }))
        .range([0, gWidth]);

    g
        .append("g")
        .attr("transform", "translate(0," + gHeight + ")")
        .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
        .domain([0, d3.max(graphData, function (d) { return +d.measureA; })])
        .range([gHeight, 0]);

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

    if (measureB != null) {
        var y2 = d3.scaleLinear()
            .domain([0, d3.max(graphData, function (d) { return +d.measureB; })])
            .range([gHeight, 0]);
        g.append("g")
            .attr("stroke", "red")
            .attr("transform", "translate(" + gWidth + " ,0)")
            .call(d3.axisRight(y2));
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