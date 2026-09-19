/* =========================================================
   Explorable Research Map – PRO UI VERSION
   Features: Linked Hover, Dashboard UI, Cardinal Coordinates
   ========================================================= */

const INDIA_BOUNDS = [[-38, 60], [37, 155]]; // extended to include Sydney, AU
const map = L.map("map", {
  zoomControl: true,
  maxBounds: INDIA_BOUNDS,
  maxBoundsViscosity: 1.0
}).fitBounds(INDIA_BOUNDS);

/* -------------------------
   1. Basemap
-------------------------- */
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19
}).addTo(map);

/* -------------------------
   2. Project Data (With Resource Person & Profiles)
-------------------------- */
const PROJECTS = [
  {
    id: "unsw",
    title: "Comparative Transit Route-Choice Modeling",
    labName: "UNSW, Sydney",
    location: "Bengaluru & Sydney Transit Networks",
    desc: "Built a comparative route-choice modeling pipeline (Expanded Path Size Logit, Nested Recursive Logit) for transit networks in Sydney and Bengaluru, integrating real GTFS feeds and ridership data under Prof. Taha Rashidi.",
    reportUrl: "https://github.com/kartikeya-gaur/PT_route_choice_eps_nrl_mini_project",
    person: {
      name: "Prof. Taha Rashidi",
      role: "Faculty Lead / Supervisor",
      url: "https://www.unsw.edu.au/staff/taha-rashidi"
    },
    coords: { lab: [-33.9173, 151.2313], study: [12.9716, 77.5946], type: 'point' }
  },
  {
    id: "drdo",
    title: "Military Trafficability Analysis",
    labName: "DRDO – Jodhpur Laboratory",
    location: "Jaisalmer",
    desc: "Analysis of arid region terrain for military maneuvers.",
    reportUrl: "https://kartikeya-gaur.github.io/assets/pdf/dlj_2.pdf",
    person: {
      name: "Defence Laboratory (DLJ)",
      role: "Research Division",
      url: "https://www.drdo.gov.in/drdo/labs-and-establishments/defence-laboratory-dlj"
    },
    coords: { lab: [26.2389, 73.0243], study: [26.9157, 70.9083], type: 'point' }
  },
  {
    id: "bisag",
    title: "Railway Alignment Planning",
    labName: "BISAG-N, Gandhinagar",
    location: "Imphal",
    desc: "PM GatiShakti infrastructure planning for the NE region.",
    reportUrl: "https://kartikeya-gaur.github.io/assets/pdf/bisag-n_2.pdf",
    person: {
      name: "BISAG-N Team",
      role: "Geospatial Planning Lead",
      url: "https://bisag-n.gov.in/"
    },
    coords: { lab: [23.2156, 72.6369], study: [24.8170, 93.9368], type: 'point' }
  },
  {
    id: "iirs",
    title: "Inland Water Hydrology",
    labName: "IIRS–ISRO, Dehradun",
    location: "Prayagraj–Varanasi",
    desc: "Satellite altimetry for river discharge estimation.",
    reportUrl: "https://kartikeya-gaur.github.io/assets/pdf/IIRS_work_report.pdf",
    person: {
      name: "Water Resources Dept (IIRS–ISRO)",
      role: "Altimetry Research Lead",
      url: "https://www.iirs.gov.in/"
    },
    coords: { lab: [30.3165, 78.0322], study: [[25.4358, 81.8463], [25.3176, 82.9739]], type: 'line' }
  }
];

/* -------------------------
   3. Styles
-------------------------- */
const COLOR_LAB   = "#7952B3"; // Purple
const COLOR_STUDY = "#FFC107"; // Amber/Yellow

const STYLES = {
  lab:   { radius: 9, fillColor: COLOR_LAB, color: "#fff", weight: 2, fillOpacity: 0.8 },
  study: { radius: 8, fillColor: COLOR_STUDY, color: "#fff", weight: 2, fillOpacity: 0.8 },
  line:  { color: COLOR_STUDY, weight: 5, opacity: 0.7 },

  highlightLab:   { fillOpacity: 1, weight: 3, color: "#000" },
  highlightStudy: { fillOpacity: 1, weight: 3, color: "#000" },
  highlightLine:  { opacity: 1, weight: 8, color: COLOR_LAB }
};

/* -------------------------
   4. UI Controls
-------------------------- */
// 1. Setup the dashboard container
const dashboard = L.control({ position: "topright" });

dashboard.onAdd = function () {
  const div = L.DomUtil.create("div", "sidebar-dashboard collapsed");
  div.innerHTML = `
    <div class="sidebar-header" id="sidebar-header">
      <span>Research Explorer</span>
      <button class="sidebar-toggle" id="sidebar-toggle-btn">&#8964;</button>
    </div>
    <div id="project-list" class="scroll-container"></div>
    <hr style="margin:0; border:none; border-top:1px solid #eee;">
    <div id="project-details" class="details-box">
      <p class="placeholder" style="color:#777; font-size:13px; margin:0;">Click any marker to view details</p>
    </div>
    <div class="mini-legend">
      <span><span class="dot lab" style="background:#7952B3;"></span> Resource Center</span>
      <span><span class="dot study" style="background:#FFC107;"></span> Study Area</span>
    </div>
    <button id="reset-view" class="btn-reset">Reset Map View</button>
  `;
  return div;
};

dashboard.addTo(map);

// 2. Click header to toggle open/close manually
setTimeout(() => {
  const header = document.getElementById("sidebar-header");
  const panel  = document.querySelector(".sidebar-dashboard");
  const toggle = document.getElementById("sidebar-toggle-btn");

  header?.addEventListener("click", () => {
    panel.classList.toggle("collapsed");
    toggle.innerHTML = panel.classList.contains("collapsed") ? "&#8964;" : "&#8963;";
  });
}, 100);

// 3. Selection function (automatically pops open and applies color tone)
function selectProject(id, clickedType = 'lab') {
  const proj = PROJECTS.find(p => p.id === id);
  if (!proj) return;

  const panel  = document.querySelector(".sidebar-dashboard");
  const toggle = document.getElementById("sidebar-toggle-btn");
  const header = document.getElementById("sidebar-header");

  // Force open the panel
  if (panel) {
    panel.classList.remove("collapsed");
    if (toggle) toggle.innerHTML = "&#8963;";
  }

  // Dynamic Theme Color Tone
  const themeColor = clickedType === 'lab' ? "#7952B3" : "#FFC107";
  const badgeLabel = clickedType === 'lab' ? "Resource Center / Lab" : "Study Area";
  const badgeTextColor = clickedType === 'lab' ? "#ffffff" : "#222222";

  if (panel) {
    panel.style.borderTop = `4px solid ${themeColor}`;
    panel.style.boxShadow = `0 10px 25px ${themeColor}44`;
  }
  if (header) {
    header.style.color = themeColor;
  }

  // Active state in project list
  document.querySelectorAll('.project-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.getElementById(`item-${id}`);
  if (activeItem) activeItem.classList.add('active');

  // Fill in project info and person profile link
  const person = proj.person || { name: "Lead Researcher", role: "Investigator", url: proj.reportUrl };

  document.getElementById("project-details").innerHTML = `
    <span style="display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; margin-bottom:6px; background:${themeColor}; color:${badgeTextColor};">
      ${badgeLabel}
    </span>
    <h4 style="margin: 2px 0 6px 0; font-size: 14px; color: #111;">${proj.title}</h4>
    
    <!-- Person Profile Link -->
    <div style="background:#f8f9fa; border-left:3px solid ${themeColor}; padding:6px 10px; border-radius:4px; margin: 8px 0;">
      <small style="color:#666; display:block; text-transform:uppercase; font-size:9px; letter-spacing:0.5px;">${person.role}</small>
      <a href="${person.url}" target="_blank" rel="noopener noreferrer" 
         style="color:${themeColor}; font-weight:700; text-decoration:underline; font-size:12px; display:inline-flex; align-items:center; gap:4px;">
        <i class="fas fa-external-link-alt" style="font-size:10px;"></i> ${person.name}
      </a>
    </div>

    <p style="font-size: 12px; line-height: 1.45; color: #444; margin: 6px 0 10px 0;">${proj.desc}</p>
    
    <a href="${proj.reportUrl}" target="_blank" rel="noopener" 
       style="display:inline-block; background:${themeColor}; color:${badgeTextColor}; padding:5px 12px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:600;">
      View Report →
    </a>
  `;

  // Fly to point/bounds
  const bounds = layerGroups[id].getLayers().reduce(
    (b, l) => b.extend(l.getBounds ? l.getBounds() : l.getLatLng()),
    L.latLngBounds()
  );
  map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2 });
}

// Reset button handler
document.getElementById("reset-view").onclick = () => {
  map.flyToBounds(INDIA_BOUNDS, { duration: 1.5 });
  document.querySelectorAll('.project-item').forEach(i => i.classList.remove('active'));
  
  const panel  = document.querySelector(".sidebar-dashboard");
  const header = document.getElementById("sidebar-header");
  if (panel) {
    panel.style.borderTop = "";
    panel.style.boxShadow = "";
  }
  if (header) {
    header.style.color = "";
  }
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
  })
  .catch(() => console.log("bound.geojson not found, continuing without overlay."));
