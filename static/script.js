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
            fan.dataset.id = i; // Assign a unique ID to each fan
            fan.textContent = `${i}\n0%`; // Initialize with 0% velocity
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


let experimentRunning = false; // Flag to track experiment status
let experimentInterval; // Variable to store the interval for experiment

document.getElementById("upload-csv").addEventListener("click", function () {
    const fileInput = document.getElementById("csv-file");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a CSV file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const rows = content.split("\n").map(row => row.split(","));

        // Extract header and data
        const header = rows[0];
        const data = rows.slice(1).filter(row => row.length > 1); // Filter out empty rows

        experimentRunning = true;
        updateStatusFlag("running");
        document.getElementById("stop-experiment").style.display = "inline-block";

        fetch("/upload-csv", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ header, data }),
        }).then(response => {
            if (response.ok) {
                console.log("CSV File OK.")
            } else {
                alert("Error uploading CSV.");
            }
        });
    };

    reader.readAsText(file);
});

document.getElementById("stop-experiment").addEventListener("click", function () {
    if (experimentRunning) {
        fetch("/stop-experiment", { method: "POST" })
            .then(() => {
                experimentRunning = false;
                clearInterval(experimentInterval); // Stop any ongoing interval
                updateStatusFlag("stopped");
                document.getElementById("stop-experiment").style.display = "none";
            });
    }
});

let pollingInterval = null; // Variable to store the interval ID

function updateStatusFlag(status) {
    const statusFlag = document.getElementById("status-flag");
    statusFlag.className = "status-flag " + status;

    if (status === "running") {
        statusFlag.textContent = "Experiment Status: Running";

        // Start polling only if not already polling
        if (!pollingInterval) {
            pollingInterval = setInterval(() => {
                fetch('/fan-status')
                    .then(response => response.json())
                    .then(data => {
                        for (const [fanId, velocity] of Object.entries(data)) {
                            const fanDiv = document.querySelector(`.fan[data-id="${fanId}"]`);
                            if (fanDiv) {
                                fanDiv.textContent = `${fanId}\n${velocity}%`;
                                fanDiv.dataset.velocity = velocity;
                            }
                        }
                    })
                    .catch(error => console.error('Error fetching fan status:', error)); // Handle errors gracefully
            }, 500); // Poll every 0.5 seconds
        }
    } else {
        // Stop polling when experiment is stopped or idle
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null; // Reset the interval ID
        }

        if (status === "stopped") {
            statusFlag.textContent = "Experiment Status: Stopped";
        } else {
            statusFlag.textContent = "Experiment Status: Ready to run";
        }
    }
}


