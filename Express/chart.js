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

//select the div and append an svg with the above width and height
var svg = d3.select("#dataCharts").append("svg")
    .attr("width", width).attr("height", height);

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
    document.getElementById("debug").innerHTML = JSON.stringify(data)
    if (yearToggle.checked) //dimension year is primary
    {
        if (!ratePer100KToggle.checked && !noOfCasesToggle.checked) //make pie chart
        {

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
    else if (areaToggle.checked) //dimension area is primary
    {
        if (!ratePer100KToggle.checked && !noOfCasesToggle.checked) //make pie chart
        {

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