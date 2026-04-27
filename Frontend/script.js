console.log("Script is running")

const map = L.map('map', {
    maxZoom: 19,
    minZoom: 3,
    zoomAnimation: true,
    markerZoomAnimation: true,
    inertia: true,
    inertiaDeceleration: 3000,
    inertiaMaxSpeed: 1500,
    easeLinearity: 0.2,
}).setView([1.3586, 103.9899], 10);



L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    keepBuffer: 8,
    updateWhenIdle: false, // ← loads tiles while panning, not just after stopping
    updateWhenZooming: false,
}).addTo(map);


const BASE_URL = "https://fr24api.flightradar24.com/api/"
const FullFlight = "live/flight-positions/full"


class Aircraft {
    constructor(data) {
        this.icao = data[0]
        this.callsign = data[1]
        this.country = data[2]
        this.longitude = data[5]
        this.latitude = data[6]
        this.altitude = data[7]
        this.onGround = data[8]
        this.velocity = data[9]
        this.heading = data[10]
    }

    validity() {
        return this.longitude !== null && this.latitude !== null && !this.onGround
    }
    getKnots() {
        if (this.velocity == null) {
            return "N/A"
        }
        else return Math.round((this.velocity) * 1.944)
    }
    getAltitude() {
        if (this.altitude == null) {
            return "N/A"
        }
        else return this.altitude;
    }
    getId() {
        if (this.icao != null && this.icao !== "") {
            return this.icao
        }

        if (this.callsign != null && this.callsign !== "") {
            return this.callsign
        }

        return null
    }
}

function getIconSize() {
    const zoom = map.getZoom();
    if (zoom >= 8) return 60;
    if (zoom >= 5) return 42;
    return 32;
}

async function loadData() {
    try {
        const response = await axios.get('http://localhost:8000/opensky/api/state/all');
        return response.data;
    } catch (err) {
        console.log("Rate limited!");
        return null
    }
}

function createPlaneIcon(heading) {
    const size = getIconSize();
    return L.divIcon({
        className: '',
        html: `<img src="aircraft.png" style="
            width: ${size}px;
            height: ${size}px;
            transform: rotate(${heading}deg);
            transform-origin: center center;
        ">`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
}


document.addEventListener("ContentLoaded", async function () {
    const sidebar = new bootstrap.Offcanvas(document.querySelector("#flightSign"), {
        backdrop: false
    });

    const flightDetails = document.querySelector("#flightDetails")
    const searchButton = document.querySelector("#searchButton")
    const searchInput = document.querySelector("#searchInput")
    const flightPath = L.polyline([], {
        color: "blue",
        weight: 3,
        opacity: 0.7
    });

    let selectedFlightId = null;
    let selectedFlightPath = [];


    const flightLayer = L.layerGroup();
    flightLayer.addTo(map);
    flightPath.addTo(map);
    drawFlight(flightLayer);
    setInterval(function () {
        drawFlight(flightLayer);
    }, 100000);

    searchButton.addEventListener("click", function () {
        const searchValue = searchInput.value;

        if (searchValue === "") {
            flightDetails.innerHTML = `
        <p class="flight-line">Please enter a callsign.</p>
        `;
            sidebar.show();
            return;
        }

        flightDetails.innerHTML = `
        <h2 class="flight-call">${searchValue}</h2>
        <p class="flight-country">Search Result</p>

        <h3 class="flight-section">Flight Info</h3>

        <p class="flight-line">Callsign: ${searchValue}</p>
    `;

        sidebar.show();
    });

    document.querySelector("#flightSign").addEventListener("hidden.bs.offcanvas", function () {
        selectedFlightId = null;
        selectedFlightPath = [];
        flightPath.setLatLngs([]);
    });

    map.on('zoomend moveend', function () {
        drawFlight(flightLayer);
    });

    async function drawFlight(flightLayer) {
        const flightData = await loadData();
        if (flightData == null) return;
        if (flightData.states == null) return;

        const newLayer = L.layerGroup();
        let selectedAircraft = null;

        for (let plane of flightData.states) {
            const aircraft = new Aircraft(plane);
            if (aircraft.validity() == true) {
                const isSelected = aircraft.getId() === selectedFlightId;

                if (isSelected) {
                    selectedAircraft = aircraft;
                }

                const icon = createPlaneIcon(aircraft.heading, isSelected);
                const marker = L.marker([aircraft.latitude, aircraft.longitude], { icon });
                marker.on('click', function () {
                    if (selectedFlightId !== aircraft.getId()) {
                        selectedFlightPath = [];
                        flightPath.setLatLngs([]);
                    }

                    selectedFlightId = aircraft.getId();
                    updateFlightPath(aircraft);
                    openSidebar(aircraft);
                });
                marker.addTo(newLayer);
            }
        }

        flightLayer.clearLayers();
        newLayer.eachLayer(function (layer) {
            layer.addTo(flightLayer);
        });

        updateFlightPath(selectedAircraft);
    }
    function updateFlightPath(aircraft) {
        if (selectedFlightId == null || aircraft == null) {
            flightPath.setLatLngs([]);
            return
        }

        const nextPoint = [aircraft.latitude, aircraft.longitude];
        const lastPoint = selectedFlightPath[selectedFlightPath.length - 1];

        if (lastPoint == null || lastPoint[0] !== nextPoint[0] || lastPoint[1] !== nextPoint[1]) {
            selectedFlightPath.push(nextPoint);
        }

        if (selectedFlightPath.length > 20) {
            selectedFlightPath.shift();
        }

        flightPath.setLatLngs(selectedFlightPath);
    }
    function openSidebar(aircraft) {
        console.log("clicked");
        flightDetails.innerHTML = `
        <h2 class="flight-call">${aircraft.callsign || "Unknown Flight"}</h2>
        <p class="flight-country">${aircraft.country || "Unknown Country"}</p>

        <h3 class="flight-section">Flight Info</h3>

        <p class="flight-line">Hex: ${aircraft.icao || "N/A"}</p>
        <p class="flight-line">Altitude: ${aircraft.getAltitude()} ft</p>
        <p class="flight-line">Speed: ${aircraft.getKnots()} kt</p>
        <p class="flight-line">Track: ${aircraft.heading ?? "N/A"}°</p>
        <p class="flight-line">Position: ${aircraft.latitude}, ${aircraft.longitude}</p>
    `;

        sidebar.show();
    }
});
