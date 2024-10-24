const map = L.map('map').setView([28.6139, 77.2090], 15); // Center on Delhi with zoom level 15

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
}).addTo(map);
    

const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const lightMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map); 

const darkMap = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="http://stamen.com">Stamen Design</a>'
});

const baseLayers = {
    "Street": streetLayer,
    "Light": lightMap,
    "Dark": darkMap,
};

L.control.layers(baseLayers).addTo(map);
L.control.scale().addTo(map);
L.Control.geocoder({
    defaultMarkGeocode: true
}).addTo(map);


const contextMenu = document.getElementById('context-menu');

map.on('contextmenu', (event) => {
    event.originalEvent.preventDefault(); 
    const { lat, lng } = event.latlng;

    // Position the context menu
    contextMenu.style.left = `${event.originalEvent.pageX}px`;
    contextMenu.style.top = `${event.originalEvent.pageY}px`;
    contextMenu.style.display = 'block';

    contextMenu.setAttribute('data-lat', lat);
    contextMenu.setAttribute('data-lng', lng);

    map.dragging.disable();
});

map.on('click', () => {
    contextMenu.style.display = 'none';
    map.dragging.enable();
});


let shapesGeoJson = [];
function storeShapeAsGeoJson(shape, coordinates) {
    let geometryType;

    if (shape === 'point') {
        geometryType = "Point";
    } else if (shape === 'line') {
        geometryType = "LineString";
    } else if (shape === 'polygon') {
        geometryType = "Polygon";
    } else {
        geometryType = "Polygon"; // Default for existing shapes (heart, star, etc., are polygons)
    }

    const geoJson = {
        "type": "Feature",
        "geometry": {
            "type": geometryType,
            "coordinates": geometryType === 'Polygon' ? [coordinates] : coordinates
        },
        "properties": {
            "shape": shape
        }
    };
    
    shapesGeoJson.push(geoJson);
}


const isSmallScreen = () => window.innerWidth < 768;

function toggleContextMenuFeatures() {
    if (isSmallScreen()) {
        map.off('contextmenu'); // Disable context menu on small screens
        contextMenu.style.display = 'none';
    } else {
        map.on('contextmenu', (event) => {
            event.originalEvent.preventDefault(); // Prevent default context menu
            const { lat, lng } = event.latlng;

            // Position the context menu
            contextMenu.style.left = `${event.originalEvent.pageX}px`;
            contextMenu.style.top = `${event.originalEvent.pageY}px`;
            contextMenu.style.display = 'block';


            contextMenu.setAttribute('data-lat', lat);
            contextMenu.setAttribute('data-lng', lng);

            map.dragging.disable();
        });

        map.on('click', () => {
            contextMenu.style.display = 'none'; // Hide the context menu when map is clicked
            map.dragging.enable(); 
        });
    }
}

// Listen for window resize to toggle context menu features dynamically
window.addEventListener('resize', toggleContextMenuFeatures);
toggleContextMenuFeatures();


function getRandomShape() {
    const shapes = ['heart', 'star', 'flower', 'butterfly', 'spiral', 'starburst'];
    const randomIndex = Math.floor(Math.random() * shapes.length);
    return shapes[randomIndex];
}

function dropRandomShapeAtCenter() {
    const shape = getRandomShape();  
    const center = map.getCenter();  
    const lat = center.lat; 
    const lon = center.lng;     
    dropShape(shape, lat, lon);
}

function dropRandomShapeAtClickedLatLng() {
    const shape = getRandomShape();  // Pick a random shape
    const lat = parseFloat(contextMenu.getAttribute('data-lat'));
    const lng = parseFloat(contextMenu.getAttribute('data-lng'));
    dropShape(shape, lat, lng);
}

function dropShapeAtCenter(shape) {
    const center = map.getCenter(); // Get the center point of the map
    const lat = center.lat; 
    const lon = center.lng;     
    dropShape(shape, lat, lon);
}

function dropShapeAtClickedLatLng(shape){
    const lat = parseFloat(contextMenu.getAttribute('data-lat'));
    const lng = parseFloat(contextMenu.getAttribute('data-lng'));
    dropShape(shape, lat, lng);
}

function dropShape(shape, lat, lng) {
    const shapeFunctions = {
        heart: dropHeart,
        star: dropStar,
        flower: dropFlower,
        butterfly: dropButterfly,
        spiral: dropSpiral,
        starburst: dropStarburst,
    };

    if (shapeFunctions[shape]) {
        shapeFunctions[shape](lat, lng);
    }

    contextMenu.style.display = 'none'; // Hide the context menu
    map.dragging.enable(); // Re-enable map dragging
}

function downloadShapesAsZip() {
    if (shapesGeoJson.length === 0) {
        alert("No shapes available for download.");
        return;
    }

    const zip = new JSZip();
    const shapeCount = {};  // Keeps track of how many times each shape type is added

    shapesGeoJson.forEach((shape, index) => {
        const shapeType = shape.properties.shape;
        
        // Track the number of shapes of the same type
        if (!shapeCount[shapeType]) {
            shapeCount[shapeType] = 1; 
        } else {
            shapeCount[shapeType]++;  
        }

        const filename = `${shapeType}-${shapeCount[shapeType]}.geojson`;

        const geoJsonString = JSON.stringify(shape, null, 2);

        zip.file(filename, geoJsonString);
    });

    zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, "shapes.zip");
    });
}

function generateHeartCoordinates(centerLat, centerLon, zoomScale) {
    const theta = Array.from({ length: 1000 }, (_, i) => i * 2 * Math.PI / 999);
    const x = theta.map(t => 16 * Math.pow(Math.sin(t), 3));
    const y = theta.map(t => 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    return x.map((val, index) => [zoomScale * y[index] + centerLat, zoomScale * val + centerLon]);
}


function dropHeart(lat, lon) {
    const zoomLevel = map.getZoom();
    const baseScale = 0.001;
    const zoomScale = Math.pow(2, 15 - zoomLevel);
    const scale = baseScale * zoomScale;

    const heartCoords = generateHeartCoordinates(lat, lon, scale);
    
    L.polygon(heartCoords, { color: 'red', fillOpacity: 0.5 }).addTo(map);

    storeShapeAsGeoJson('heart', heartCoords);
}


function generateStarCoordinates(centerLat, centerLon, zoomScale) {
    const points = 5;
    const radiusOuter = 0.005 * zoomScale; // Scaled outer radius
    const radiusInner = 0.002 * zoomScale; // Scaled inner radius
    const angle = Math.PI / points;

    let coords = [];
    for (let i = 0; i < 2 * points; i++) {
        const r = (i % 2 === 0) ? radiusOuter : radiusInner;
        const x = centerLon + r * Math.sin(i * angle);
        const y = centerLat + r * Math.cos(i * angle);
        coords.push([y, x]);
    }
    return coords;
}

function dropStar(lat, lon) {
    const zoomLevel = map.getZoom();
    const baseScale = 0.001;
    const zoomScale = baseScale * Math.pow(2, 15 - zoomLevel); // Scale based on zoom level

    const starCoords = generateStarCoordinates(lat, lon, zoomScale);
    L.polygon(starCoords, { color: 'yellow', fillOpacity: 0.5 }).addTo(map);
    
    storeShapeAsGeoJson('star', starCoords);
}


function generateFlowerCoordinates(centerLat, centerLon, zoomScale) {
    const petals = 8;
    const baseScale = 0.1;
    const scale = baseScale * zoomScale;

    const coords = [];
    for (let t = 0; t <= 2 * Math.PI; t += 0.01) {
        const r = Math.sin(petals * t);
        const x = centerLon + scale * r * Math.cos(t);
        const y = centerLat + scale * r * Math.sin(t);
        coords.push([y, x]);
    }
    return coords;
}

function dropFlower(lat, lon) {
    const zoomLevel = map.getZoom();
    const baseScale = 0.05;
    const zoomScale = 0.0005 * Math.pow(2, 20 - zoomLevel);

    const flowerCoords = generateFlowerCoordinates(lat, lon, zoomScale);
    const flowerShape = L.polygon(flowerCoords, { color: 'pink', fillOpacity: 0.5 }).addTo(map);

    flowerShape.enableEdit(map);

    storeShapeAsGeoJson('flower', flowerCoords);
}



function generateButterflyCoordinates(centerLat, centerLon, zoomScale) {
    const baseScale = 0.1; // Increase base scale for better visibility
    const scale = baseScale * zoomScale; // Apply zoom scaling

    const coords = [];
    for (let t = 0; t <= 2 * Math.PI; t += 0.01) {
        const x = Math.sin(t) * (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t));
        const y = Math.cos(t) * (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t));
        coords.push([scale * y + centerLat, scale * x + centerLon]);
    }
    return coords;
}

function dropButterfly(lat, lon) {
    const zoomLevel = map.getZoom();
    const baseScale = 0.05; // Adjust base scale for proper sizing
    const zoomScale = 0.0005 * Math.pow(2, 20 - zoomLevel); // Adjust scaling to make it visible at all zoom levels

    const butterflyCoords = generateButterflyCoordinates(lat, lon, zoomScale);
    const butterflyShape = L.polygon(butterflyCoords, { color: 'purple', fillOpacity: 0.5 }).addTo(map);

    butterflyShape.enableEdit(map);

    storeShapeAsGeoJson('butterfly', butterflyCoords);
}


function generateSpiralCoordinates(centerLat, centerLon) {
    const turns = 4;
    const scale = 0.0005;

    const coords = [];
    for (let t = 0; t <= turns * 2 * Math.PI; t += 0.01) {
        const r = t / (2 * Math.PI);
        const x = centerLon + scale * r * Math.cos(t);
        const y = centerLat + scale * r * Math.sin(t);
        coords.push([y, x]);
    }
    return coords;
}

function dropSpiral(lat, lon) {
    const spiralCoords = generateSpiralCoordinates(lat, lon);
    L.polygon(spiralCoords, { color: 'green', fillOpacity: 0.5 }).addTo(map);
    //map.fitBounds([[lat, lon], ...spiralCoords]);

    storeShapeAsGeoJson('spiral', spiralCoords);
}

function generateStarburstCoordinates(centerLat, centerLon, zoomScale) {
    const rays = 16;
    const baseRadiusOuter = 0.1;
    const baseRadiusInner = 0.05;
    const radiusOuter = baseRadiusOuter * zoomScale;
    const radiusInner = baseRadiusInner * zoomScale;
    const angle = Math.PI / rays;

    let coords = [];
    for (let i = 0; i < 2 * rays; i++) {
        const r = (i % 2 === 0) ? radiusOuter : radiusInner;
        const x = centerLon + r * Math.sin(i * angle);
        const y = centerLat + r * Math.cos(i * angle);
        coords.push([y, x]);
    }
    return coords;
}

function dropStarburst(lat, lon) {
    const zoomLevel = map.getZoom();
    const baseScale = 0.0005;
    const zoomScale = baseScale * Math.pow(2, 20 - zoomLevel);

    const starburstCoords = generateStarburstCoordinates(lat, lon, zoomScale);
    const starburstShape = L.polygon(starburstCoords, { color: 'orange', fillOpacity: 0.5 }).addTo(map);
    
    starburstShape.enableEdit(map);

    storeShapeAsGeoJson('starburst', starburstCoords);
}


function getRandomLatLng() {
    const bounds = map.getBounds(); // Get the current map bounds
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const lat = Math.random() * (northEast.lat - southWest.lat) + southWest.lat;
    const lng = Math.random() * (northEast.lng - southWest.lng) + southWest.lng;

    return [lat, lng];
}

function drawRandomPoint() {
    const [lat, lng] = getRandomLatLng();
    const marker = L.marker([lat, lng]).addTo(map); // Add a marker to represent the point
    storeShapeAsGeoJson('point', [[lat, lng]]); // Store as GeoJSON
}

function drawRandomLine() {
    const lineCoordinates = [];
    const numPoints = Math.floor(Math.random() * 100) + 10; 
    const startLatLng = getRandomLatLng(); 

    lineCoordinates.push(startLatLng);

    let previousLatLng = startLatLng;

    for (let i = 1; i < numPoints; i++) {
        // Generate a small random offset to simulate GPS drift
        const offsetLat = (Math.random() - 0.5) * 0.001;
        const offsetLng = (Math.random() - 0.5) * 0.001;

        const newLat = previousLatLng[0] + offsetLat;
        const newLng = previousLatLng[1] + offsetLng;
        const newLatLng = [newLat, newLng];

        lineCoordinates.push(newLatLng);
        previousLatLng = newLatLng;
    }

    const polyline = L.polyline(lineCoordinates, { 
        color: 'blue', 
        weight: 3,
        opacity: 0.7,

    }).addTo(map);

    storeShapeAsGeoJson('line', lineCoordinates);
}


function drawRandomPolygon() {
    const polygonCoordinates = [];
    const numVertices = Math.floor(Math.random() * 5) + 3; // Random number of vertices for the polygon (between 3 and 8)
    const center = getRandomLatLng(); // Central point of the polygon

    // Get the current zoom level of the map
    const zoomLevel = map.getZoom();

    // Adjust the radius based on the zoom level
    const baseRadius = 0.010; // Base radius
    const zoomScale = Math.pow(2, 15 - zoomLevel); // Scale factor based on zoom level
    const radius = baseRadius * zoomScale * (Math.random() * 0.5 + 0.75); // Adjust radius for polygon

    for (let i = 0; i < numVertices; i++) {
        const angle = (i / numVertices) * 2 * Math.PI; // Evenly distribute points around the center
        const offsetLat = Math.cos(angle) * radius * (1 + Math.random() * 0.2); // Randomness in radius for irregular shape
        const offsetLng = Math.sin(angle) * radius * (1 + Math.random() * 0.2); // Randomness in radius for irregular shape

        const newLat = center[0] + offsetLat;
        const newLng = center[1] + offsetLng;
        polygonCoordinates.push([newLat, newLng]);
    }

    polygonCoordinates.push(polygonCoordinates[0]); // Close the polygon

    const polygon = L.polygon(polygonCoordinates, {
        color: 'green',
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.4
    }).addTo(map);

    storeShapeAsGeoJson('polygon', polygonCoordinates);
}




function clearMap() {
    map.eachLayer(function (layer) {
        if (!layer._url) {
            map.removeLayer(layer); 
        }
    });

    shapesGeoJson = [];
}


