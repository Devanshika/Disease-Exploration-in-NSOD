yearid = document.getElementById("yearToggle")
areaid = document.getElementById("areaToggle")
yearid.addEventListener("click", () => toggleView())
areaid.addEventListener("click", () => toggleView())

function toggleView() {
    if (areaid.checked) {
        yearid.disabled = true
        areaid.disabled= false
    }
    else if (yearid.checked) {
        areaid.disabled = true
        yearid.disabled =false 
        
    }
    else if(!areaid.checked && !yearid.checked){
        areaid.disabled=false
        yearid.disabled= false
    }
}