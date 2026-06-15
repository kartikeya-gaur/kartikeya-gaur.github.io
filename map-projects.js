/* =========================================================
   Explorable Research Map – PRO UI VERSION
   Features: Linked Hover, Dashboard UI, Cardinal Coordinates
   ========================================================= */

const INDIA_BOUNDS = [[6, 68], [37, 98]];
const map = L.map("map", {
  zoomControl: true,
  maxBounds: INDIA_BOUNDS,
  maxBoundsViscosity: 1.0
}).fitBounds(INDIA_BOUNDS);

/* -------------------------
   1. Basemap (No Labels)
-------------------------- */
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap & CARTO",
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

/* -------------------------
   2. Project Data
-------------------------- */
const PROJECTS = [
  {
    id: "drdo",
    title: "Military Trafficability Analysis",
    labName: "DRDO – Jodhpur Laboratory",
    location: "Jaisalmer",
    desc: "Analysis of arid region terrain for military maneuvers.",
    reportUrl: "https://kartikeya-gaur.github.io/assets/pdf/dlj_2.pdf",   // <-- new
    coords: { lab: [26.2389, 73.0243], study: [26.9157, 70.9083], type: 'point' }
  },
  {
    id: "bisag",
    title: "Railway Alignment Planning",
    labName: "BISAG-N, Gandhinagar",
    location: "Imphal",
    desc: "PM GatiShakti infrastructure planning for the NE region.",
    reportUrl: "https://kartikeya-gaur.github.io/assets/pdf/bisag-n_2.pdf",   // <-- new
    coords: { lab: [23.2156, 72.6369], study: [24.8170, 93.9368], type: 'point' }
  },
  {
    id: "iirs",
    title: "Inland Water Hydrology",
    labName: "IIRS–ISRO, Dehradun",
    location: "Prayagraj–Varanasi",
    desc: "Satellite altimetry for river discharge estimation.",
    reportUrl: "https://kartikeya-gaur.github.io/assets/pdf/IIRS_work_report.pdf",   // <-- new
    coords: { lab: [30.3165, 78.0322], study: [[25.4358, 81.8463], [25.3176, 82.9739]], type: 'line' }
  }
];
/* -------------------------
   3. Styles (Normal & Highlight)
-------------------------- */
const STYLES = {
  lab:   { radius: 9, fillColor: "#7952B3", color: "#fff", weight: 2, fillOpacity: 0.7 },
  study: { radius: 8, fillColor: "#FFC107", color: "#fff", weight: 2, fillOpacity: 0.7 },
  line:  { color: "#FFC107", weight: 5, opacity: 0.6 },

  highlightLab:   { fillOpacity: 1, weight: 3, color: "#000" },
  highlightStudy: { fillOpacity: 1, weight: 3, color: "#000" },
  highlightLine:  { opacity: 1, weight: 8, color: "#7952B3" }
};

/* -------------------------
   4. UI Controls
-------------------------- */

// Sidebar Dashboard
const dashboard = L.control({ position: "topright" });

dashboard.onAdd = function () {
  const div = L.DomUtil.create("div", "sidebar-dashboard");
  div.innerHTML = `
    <h3 class="sidebar-header">
      <span>Research Explorer</span>
      <button class="sidebar-toggle" title="Collapse panel">&#8963;</button>
    </h3>
    <div id="project-list" class="scroll-container"></div>
    <hr>
    <div id="project-details" class="details-box">
      <p class="placeholder">Select a project to view details</p>
    </div>
    <div class="mini-legend">
      <span class="dot lab"></span> Lab Location
      <span class="dot study"></span> Study Area
    </div>
    <button id="reset-view" class="btn-reset">Reset Map View</button>
  `;
  return div;
};

dashboard.addTo(map);

/* Sidebar collapse — uses setTimeout so the DOM is ready */
setTimeout(() => {
  const toggle = document.querySelector(".sidebar-toggle");
  const panel  = document.querySelector(".sidebar-dashboard");

  toggle?.addEventListener("click", () => {
    panel.classList.toggle("collapsed");
    toggle.innerHTML = panel.classList.contains("collapsed") ? "&#8964;" : "&#8963;";
  });
}, 100);

// ─── Cardinal Coordinate Tracker ───────────────────────────
const coordDisplay = L.control({ position: "bottomleft" });

coordDisplay.onAdd = function () {
  const div = L.DomUtil.create("div", "latlng-display");
  div.innerHTML = "20.000° N, 78.000° E";
  return div;
};

coordDisplay.addTo(map);

// FIX: listen to mousemove and write the live coordinates into the display div
map.on("mousemove", (e) => {
  const { lat, lng } = e.latlng;
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  document.querySelector(".latlng-display").innerHTML =
    `${Math.abs(lat).toFixed(3)}° ${latDir},&nbsp;&nbsp;${Math.abs(lng).toFixed(3)}° ${lngDir}`;
});

/* -------------------------
   5. Linked Logic & Implementation
-------------------------- */
const layerGroups = {};

PROJECTS.forEach(proj => {
  const group = L.layerGroup().addTo(map);
  layerGroups[proj.id] = group;

  // Lab marker
  const labMarker = L.circleMarker(proj.coords.lab, STYLES.lab)
    .bindTooltip(proj.labName, { direction: "top", offset: [0, -5] })
    .addTo(group);

  // Study layer (point or polyline)
  let studyLayer;
  if (proj.coords.type === 'line') {
    studyLayer = L.polyline(proj.coords.study, STYLES.line).addTo(group);
  } else {
    studyLayer = L.circleMarker(proj.coords.study, STYLES.study).addTo(group);
  }
  studyLayer.bindTooltip(`Study Area: ${proj.location}`, { direction: "top", offset: [0, -5] });

  // Linked hover
  const pair = [labMarker, studyLayer];
  pair.forEach(element => {
    element.on('mouseover', () => {
      labMarker.setStyle(STYLES.highlightLab);
      studyLayer.setStyle(proj.coords.type === 'line' ? STYLES.highlightLine : STYLES.highlightStudy);
      labMarker.openTooltip();
      studyLayer.openTooltip();
    });

    element.on('mouseout', () => {
      labMarker.setStyle(STYLES.lab);
      studyLayer.setStyle(proj.coords.type === 'line' ? STYLES.line : STYLES.study);
      labMarker.closeTooltip();
      studyLayer.closeTooltip();
    });

    element.on('click', () => selectProject(proj.id));
  });

  // Sidebar list item
  const item = document.createElement("div");
  item.className = "project-item";
  item.id = `item-${proj.id}`;
  item.innerHTML = `<strong>${proj.location}</strong><br><small>${proj.labName}</small>`;
  item.onclick = () => selectProject(proj.id);
  document.getElementById("project-list").appendChild(item);
});

function selectProject(id) {
  const proj = PROJECTS.find(p => p.id === id);

  document.querySelectorAll('.project-item').forEach(i => i.classList.remove('active'));
  document.getElementById(`item-${id}`).classList.add('active');

  document.getElementById("project-details").innerHTML = `
    <h4>${proj.title}</h4>
    <p>${proj.desc}</p>
    <div class="actions">
      <a href="${proj.reportUrl}" target="_blank" rel="noopener" class="btn-link">View Report</a>
    </div>
  `;

  const bounds = layerGroups[id].getLayers().reduce(
    (b, l) => b.extend(l.getBounds ? l.getBounds() : l.getLatLng()),
    L.latLngBounds()
  );
  map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
}

document.getElementById("reset-view").onclick = () => {
  map.flyToBounds(INDIA_BOUNDS, { duration: 1.5 });
  document.querySelectorAll('.project-item').forEach(i => i.classList.remove('active'));
  document.getElementById("project-details").innerHTML = '<p class="placeholder">Select a project</p>';
};

/* -------------------------
   6. India Base Layer
-------------------------- */
fetch("bound.geojson")
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      interactive: false,
      style: { color: "#343A40", weight: 1, fillColor: "#E1E8EB", fillOpacity: 0.15 }
    }).addTo(map);
  });