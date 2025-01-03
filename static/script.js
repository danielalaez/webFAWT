document.getElementById("dimension-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const rows = parseInt(document.getElementById("rows").value, 10);
    const columns = parseInt(document.getElementById("columns").value, 10);

    fetch("/set-dimensions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows, columns }),
    })
        .then((response) => response.json())
        .then(() => {
            const fanGrid = document.getElementById("fan-grid");
            fanGrid.innerHTML = "";
            fanGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`; // Dynamically set grid columns

            for (let i = 1; i <= rows * columns; i++) {
                const fan = document.createElement("div");
                fan.classList.add("fan");
                fan.textContent = `${i}\n0%`; // Initialize each fan with ID and 0% velocity
                fan.dataset.velocity = 0; // Store initial velocity as a data attribute
                fan.addEventListener("click", () => fan.classList.toggle("selected"));
                fanGrid.appendChild(fan);
            }

            document.getElementById("fan-controls").style.display = "block";
        });
});

document.getElementById("velocity").addEventListener("input", function () {
    document.getElementById("velocity-value").textContent = this.value;
});

document.getElementById("apply-velocity").addEventListener("click", function () {
    const selectedFans = Array.from(document.querySelectorAll(".fan.selected"));
    const velocity = parseInt(document.getElementById("velocity").value, 10);

    const fanIds = selectedFans.map((fan) => parseInt(fan.textContent.split("\n")[0], 10)); // Get IDs
    console.log(fanIds);

    fetch("/control-fans", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ selected_fans: fanIds, velocity }),
    }).then(() => {
        // Update the displayed velocity for selected fans
        selectedFans.forEach((fan) => {
            fan.dataset.velocity = velocity; // Update velocity in data attribute
            fan.textContent = `${fan.textContent.split("\n")[0]}\n${velocity}%`; // Update displayed velocity
        });
    });
});

document.getElementById("stop-all").addEventListener("click", function () {
    fetch("/stop-all", { method: "POST" }).then(() => {
        // Reset all fans to 0% velocity
        document.querySelectorAll(".fan").forEach((fan) => {
            fan.dataset.velocity = 0; // Update velocity in data attribute
            fan.textContent = `${fan.textContent.split("\n")[0]}\n0%`; // Update displayed velocity
        });
    });
});

document.getElementById("select-all").addEventListener("click", function () {
    const fans = document.querySelectorAll(".fan");
    fans.forEach((fan) => {
        fan.classList.add("selected");
    });
});

document.getElementById("unselect-all").addEventListener("click", function () {
    const fans = document.querySelectorAll(".fan");
    fans.forEach((fan) => {
        fan.classList.remove("selected");
    });
});

document.getElementById("open-modal").addEventListener("click", () => {
    document.getElementById("setup-modal").style.display = "block";
});

document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("setup-modal").style.display = "none";
});

// Close modal if user clicks outside the content
window.addEventListener("click", (event) => {
    const modal = document.getElementById("setup-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});
