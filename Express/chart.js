yearToggle = document.getElementById("yearToggle")
areaToggle = document.getElementById("areaToggle")
noOfCasesToggle = document.getElementById("noOfCasesToggle")
ratePer100KToggle = document.getElementById("ratePer100KToggle")
getChartBtn = document.getElementById("getChartBtn")

yearToggle.addEventListener("click", () => toggleView())
areaToggle.addEventListener("click", () => toggleView())

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
}