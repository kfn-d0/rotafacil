(function () {
    'use strict';

    const state = {
        base: {
            lat: -2.5297,
            lng: -44.2825,
            name: 'Central (Base)'
        },
        clients: [],
        routeLayer: null,
        markersLayer: null,
        map: null,
        nextId: 1
    };

    const dom = {
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        mobileSidebarToggle: document.getElementById('mobileSidebarToggle'),
        baseLat: document.getElementById('baseLat'),
        baseLng: document.getElementById('baseLng'),
        updateBaseBtn: document.getElementById('updateBaseBtn'),
        clientName: document.getElementById('clientName'),
        clientLink: document.getElementById('clientLink'),
        clientLat: document.getElementById('clientLat'),
        clientLng: document.getElementById('clientLng'),
        coordsManual: document.getElementById('coordsManual'),
        toggleManualCoords: document.getElementById('toggleManualCoords'),
        addClientBtn: document.getElementById('addClientBtn'),
        clientList: document.getElementById('clientList'),
        clientCount: document.getElementById('clientCount'),
        emptyState: document.getElementById('emptyState'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        calculateRouteBtn: document.getElementById('calculateRouteBtn'),
        openGoogleMapsBtn: document.getElementById('openGoogleMapsBtn'),
        routeSummary: document.getElementById('routeSummary'),
        closeRouteSummary: document.getElementById('closeRouteSummary'),
        totalDistance: document.getElementById('totalDistance'),
        totalTime: document.getElementById('totalTime'),
        totalStops: document.getElementById('totalStops'),
        routeOrder: document.getElementById('routeOrder'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        toastContainer: document.getElementById('toastContainer')
    };

    function initMap() {
        state.map = L.map('map', {
            center: [state.base.lat, state.base.lng],
            zoom: 13,
            zoomControl: true,
            attributionControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(state.map);

        state.markersLayer = L.layerGroup().addTo(state.map);
        state.routeLayer = L.layerGroup().addTo(state.map);

        addBaseMarker();
    }

    function createBaseIcon() {
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="position:relative;">
                    <div class="pulse-ring"></div>
                    <div class="marker-base"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -42]
        });
    }

    function createClientIcon(number, optimized = false) {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-client ${optimized ? 'optimized' : ''}">${number}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -20]
        });
    }

    function addBaseMarker() {
        const marker = L.marker([state.base.lat, state.base.lng], {
            icon: createBaseIcon(),
            zIndexOffset: 1000
        });

        marker.bindPopup(`
            <div class="popup-title">🏢 ${state.base.name}</div>
            <div class="popup-subtitle">Ponto de partida e retorno</div>
        `);

        state.markersLayer.addLayer(marker);
    }

    function refreshMarkers(optimizedOrder = null) {
        state.markersLayer.clearLayers();
        addBaseMarker();

        state.clients.forEach((client, index) => {
            let displayNumber = index + 1;
            let isOptimized = false;

            if (optimizedOrder) {
                const orderIndex = optimizedOrder.findIndex(o => o.id === client.id);
                if (orderIndex !== -1) {
                    displayNumber = orderIndex + 1;
                    isOptimized = true;
                }
            }

            const marker = L.marker([client.lat, client.lng], {
                icon: createClientIcon(displayNumber, isOptimized)
            });

            marker.bindPopup(`
                <div class="popup-title">${client.name}</div>
                <div class="popup-subtitle">${client.lat.toFixed(6)}, ${client.lng.toFixed(6)}</div>
                ${isOptimized ? `<div class="popup-order">Parada #${displayNumber}</div>` : ''}
            `);

            state.markersLayer.addLayer(marker);
        });
    }

    function extractCoordsFromLink(link) {
        if (!link || typeof link !== 'string') return null;

        link = link.trim();

        let match = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        match = link.match(/[?&](?:q|query)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        match = link.match(/\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        match = link.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        match = link.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        match = link.match(/\/dir\/.*?(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        match = link.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        return null;
    }

    function addClient(name, lat, lng) {
        const client = {
            id: state.nextId++,
            name: name || `Cliente ${state.clients.length + 1}`,
            lat: lat,
            lng: lng
        };

        state.clients.push(client);
        clearRoute();
        updateClientList();
        refreshMarkers();
        fitMapBounds();
        saveState();

        showToast(`${client.name} adicionado!`, 'success');
    }

    function removeClient(id) {
        const index = state.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            const name = state.clients[index].name;
            state.clients.splice(index, 1);
            clearRoute();
            updateClientList();
            refreshMarkers();
            if (state.clients.length > 0) fitMapBounds();
            saveState();
            showToast(`${name} removido.`, 'info');
        }
    }

    function clearAllClients() {
        if (state.clients.length === 0) return;
        state.clients = [];
        clearRoute();
        updateClientList();
        refreshMarkers();
        state.map.setView([state.base.lat, state.base.lng], 13);
        saveState();
        showToast('Todos os clientes removidos.', 'info');
    }

    function updateClientList() {
        const count = state.clients.length;
        dom.clientCount.textContent = count;
        dom.calculateRouteBtn.disabled = count < 1;

        if (count === 0) {
            dom.emptyState.style.display = 'flex';
            dom.clientList.innerHTML = '';
            dom.clientList.appendChild(dom.emptyState);
            return;
        }

        dom.emptyState.style.display = 'none';
        dom.clientList.innerHTML = '';

        state.clients.forEach((client, index) => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-number">${index + 1}</div>
                <div class="client-info">
                    <div class="client-name">${escapeHtml(client.name)}</div>
                    <div class="client-coords">${client.lat.toFixed(6)}, ${client.lng.toFixed(6)}</div>
                </div>
                <div class="client-actions">
                    <button class="btn-icon" title="Centralizar no mapa" data-action="focus" data-id="${client.id}">
                        <i data-lucide="crosshair"></i>
                    </button>
                    <button class="btn-icon btn-danger-icon" title="Remover" data-action="remove" data-id="${client.id}">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            `;
            dom.clientList.appendChild(card);
        });

        lucide.createIcons();
    }

    async function calculateRoute() {
        if (state.clients.length === 0) return;

        dom.loadingOverlay.style.display = 'flex';

        try {
            if (state.clients.length === 1) {
                await calculateSimpleRoute();
            } else {
                await calculateOptimizedRoute();
            }
        } catch (error) {
            console.error('Route calculation error:', error);
            showToast('Erro ao calcular rota. Tente novamente.', 'error');
        } finally {
            dom.loadingOverlay.style.display = 'none';
        }
    }

    async function calculateSimpleRoute() {
        const client = state.clients[0];
        const coords = `${state.base.lng},${state.base.lat};${client.lng},${client.lat}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            showToast('Não foi possível calcular a rota.', 'error');
            return;
        }

        const route = data.routes[0];
        const distance = route.distance;
        const duration = route.duration;

        drawRoute(route.geometry.coordinates);
        const optimizedOrder = [{ ...client, order: 1 }];
        refreshMarkers(optimizedOrder);
        showRouteSummary(distance, duration, optimizedOrder);
    }

    async function calculateOptimizedRoute() {
        const allPoints = [
            { lng: state.base.lng, lat: state.base.lat, name: state.base.name, isBase: true },
            ...state.clients.map(c => ({ lng: c.lng, lat: c.lat, name: c.name, id: c.id, isBase: false }))
        ];

        const coordsStr = allPoints
            .map(p => `${p.lng},${p.lat}`)
            .join(';');

        const url = `https://router.project-osrm.org/trip/v1/driving/${coordsStr}?source=first&roundtrip=true&overview=full&geometries=geojson&steps=true`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
            await calculateSequentialRoute();
            return;
        }

        const trip = data.trips[0];
        const distance = trip.distance;
        const duration = trip.duration;

        const waypoints = data.waypoints;
        const optimizedOrder = [];

        const sortedWaypoints = waypoints
            .map((wp, idx) => ({ ...wp, originalIndex: idx }))
            .sort((a, b) => a.waypoint_index - b.waypoint_index);

        sortedWaypoints.forEach(wp => {
            if (wp.originalIndex === 0) return;
            const client = state.clients[wp.originalIndex - 1];
            if (client) {
                optimizedOrder.push({
                    ...client,
                    order: optimizedOrder.length + 1
                });
            }
        });

        drawRoute(trip.geometry.coordinates);
        refreshMarkers(optimizedOrder);
        showRouteSummary(distance, duration, optimizedOrder);
    }

    async function calculateSequentialRoute() {
        const points = [
            `${state.base.lng},${state.base.lat}`,
            ...state.clients.map(c => `${c.lng},${c.lat}`),
            `${state.base.lng},${state.base.lat}`
        ];

        const coordsStr = points.join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            showToast('Não foi possível calcular a rota.', 'error');
            return;
        }

        const route = data.routes[0];
        const optimizedOrder = state.clients.map((c, i) => ({ ...c, order: i + 1 }));

        drawRoute(route.geometry.coordinates);
        refreshMarkers(optimizedOrder);
        showRouteSummary(route.distance, route.duration, optimizedOrder);
    }

    function drawRoute(coordinates) {
        state.routeLayer.clearLayers();

        const latLngs = coordinates.map(coord => [coord[1], coord[0]]);

        const glowLine = L.polyline(latLngs, {
            color: 'rgba(59, 130, 246, 0.3)',
            weight: 12,
            lineCap: 'round',
            lineJoin: 'round'
        });
        state.routeLayer.addLayer(glowLine);

        const routeLine = L.polyline(latLngs, {
            color: '#3b82f6',
            weight: 5,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: null
        });
        state.routeLayer.addLayer(routeLine);

        const animatedLine = L.polyline(latLngs, {
            color: '#60a5fa',
            weight: 3,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: '8 12',
            dashOffset: '0'
        });
        state.routeLayer.addLayer(animatedLine);

        const pathElement = animatedLine.getElement();
        if (pathElement) {
            pathElement.style.animation = 'dash 1.5s linear infinite';
        }

        state.map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
    }

    function clearRoute() {
        if (state.routeLayer) state.routeLayer.clearLayers();
        dom.routeSummary.style.display = 'none';
        dom.openGoogleMapsBtn.style.display = 'none';
    }

    function showRouteSummary(distance, duration, optimizedOrder) {
        const distKm = (distance / 1000).toFixed(1);
        dom.totalDistance.textContent = `${distKm} km`;

        const hours = Math.floor(duration / 3600);
        const minutes = Math.round((duration % 3600) / 60);
        if (hours > 0) {
            dom.totalTime.textContent = `${hours}h ${minutes}min`;
        } else {
            dom.totalTime.textContent = `${minutes} min`;
        }

        dom.totalStops.textContent = optimizedOrder.length;

        dom.routeOrder.innerHTML = `
            <div class="route-order-title">Ordem de Visita</div>
        `;

        const startStep = document.createElement('div');
        startStep.className = 'route-step';
        startStep.innerHTML = `
            <div class="route-step-number base">⊛</div>
            <div class="route-step-name">${escapeHtml(state.base.name)}</div>
            <div class="route-step-detail">Início</div>
        `;
        dom.routeOrder.appendChild(startStep);

        optimizedOrder.forEach((client, idx) => {
            const step = document.createElement('div');
            step.className = 'route-step';
            step.innerHTML = `
                <div class="route-step-number client">${idx + 1}</div>
                <div class="route-step-name">${escapeHtml(client.name)}</div>
                <div class="route-step-detail">Parada</div>
            `;
            dom.routeOrder.appendChild(step);
        });

        const endStep = document.createElement('div');
        endStep.className = 'route-step';
        endStep.innerHTML = `
            <div class="route-step-number base">⊛</div>
            <div class="route-step-name">${escapeHtml(state.base.name)}</div>
            <div class="route-step-detail">Retorno</div>
        `;
        dom.routeOrder.appendChild(endStep);

        dom.routeSummary.style.display = 'block';
        dom.openGoogleMapsBtn.style.display = 'flex';

        state.lastOptimizedOrder = optimizedOrder;
    }

    function openInGoogleMaps() {
        if (!state.lastOptimizedOrder || state.lastOptimizedOrder.length === 0) return;

        const order = state.lastOptimizedOrder;
        const origin = `${state.base.lat},${state.base.lng}`;
        const destination = origin;

        const waypoints = order.map(c => `${c.lat},${c.lng}`).join('|');

        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;

        window.open(url, '_blank');
    }

    function fitMapBounds() {
        const points = [
            [state.base.lat, state.base.lng],
            ...state.clients.map(c => [c.lat, c.lng])
        ];

        if (points.length <= 1) {
            state.map.setView([state.base.lat, state.base.lng], 13);
            return;
        }

        const bounds = L.latLngBounds(points);
        state.map.fitBounds(bounds, { padding: [60, 60] });
    }

    function focusClient(id) {
        const client = state.clients.find(c => c.id === id);
        if (client) {
            state.map.setView([client.lat, client.lng], 16, { animate: true });
        }
    }

    function saveState() {
        try {
            const data = {
                base: state.base,
                clients: state.clients,
                nextId: state.nextId
            };
            localStorage.setItem('rotafacil_state', JSON.stringify(data));
        } catch (e) {
        }
    }

    function loadState() {
        try {
            const data = JSON.parse(localStorage.getItem('rotafacil_state'));
            if (data) {
                if (data.base) {
                    state.base = data.base;
                    dom.baseLat.value = data.base.lat;
                    dom.baseLng.value = data.base.lng;
                }
                if (data.clients && Array.isArray(data.clients)) {
                    state.clients = data.clients;
                    state.nextId = data.nextId || data.clients.length + 1;
                }
            }
        } catch (e) {
        }
    }

    function showToast(message, type = 'info') {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type]}" class="toast-icon"></i>
            <span class="toast-message">${escapeHtml(message)}</span>
        `;

        dom.toastContainer.appendChild(toast);
        lucide.createIcons({ nodes: [toast] });

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function initEventListeners() {
        dom.sidebarToggle.addEventListener('click', () => {
            dom.sidebar.classList.toggle('collapsed');
        });

        dom.mobileSidebarToggle.addEventListener('click', () => {
            dom.sidebar.classList.toggle('mobile-open');
        });

        dom.updateBaseBtn.addEventListener('click', () => {
            const lat = parseFloat(dom.baseLat.value);
            const lng = parseFloat(dom.baseLng.value);

            if (isNaN(lat) || isNaN(lng)) {
                showToast('Coordenadas inválidas.', 'error');
                return;
            }

            state.base.lat = lat;
            state.base.lng = lng;
            clearRoute();
            refreshMarkers();
            state.map.setView([lat, lng], 13);
            saveState();
            showToast('Localização da base atualizada!', 'success');
        });

        dom.toggleManualCoords.addEventListener('click', () => {
            const isVisible = dom.coordsManual.style.display !== 'none';
            dom.coordsManual.style.display = isVisible ? 'none' : 'block';
            dom.toggleManualCoords.querySelector('span').textContent = isVisible
                ? 'Inserir coordenadas manualmente'
                : 'Usar link do Google Maps';
        });

        dom.addClientBtn.addEventListener('click', () => {
            handleAddClient();
        });

        dom.clientLink.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddClient();
            }
        });

        dom.clientName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                dom.clientLink.focus();
            }
        });

        dom.clientList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const id = parseInt(btn.dataset.id);

            if (action === 'remove') removeClient(id);
            if (action === 'focus') focusClient(id);
        });

        dom.clearAllBtn.addEventListener('click', () => {
            if (state.clients.length > 0) {
                clearAllClients();
            }
        });

        dom.calculateRouteBtn.addEventListener('click', () => {
            calculateRoute();
        });

        dom.openGoogleMapsBtn.addEventListener('click', () => {
            openInGoogleMaps();
        });

        dom.closeRouteSummary.addEventListener('click', () => {
            dom.routeSummary.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                dom.sidebar.classList.contains('mobile-open') &&
                !dom.sidebar.contains(e.target) &&
                !dom.mobileSidebarToggle.contains(e.target)) {
                dom.sidebar.classList.remove('mobile-open');
            }
        });

        dom.clientLink.addEventListener('paste', (e) => {
            setTimeout(() => {
                const text = dom.clientLink.value.trim();
                if (text && extractCoordsFromLink(text)) {
                    dom.clientLink.style.borderColor = 'var(--success)';
                    setTimeout(() => {
                        dom.clientLink.style.borderColor = '';
                    }, 1500);
                }
            }, 100);
        });
    }

    function handleAddClient() {
        const name = dom.clientName.value.trim();
        let lat, lng;

        if (dom.coordsManual.style.display !== 'none' && dom.clientLat.value && dom.clientLng.value) {
            lat = parseFloat(dom.clientLat.value);
            lng = parseFloat(dom.clientLng.value);
        } else {
            const link = dom.clientLink.value.trim();
            if (!link) {
                showToast('Cole um link do Google Maps ou insira as coordenadas.', 'warning');
                dom.clientLink.focus();
                return;
            }

            const coords = extractCoordsFromLink(link);
            if (!coords) {
                showToast('Não foi possível extrair coordenadas do link. Tente inserir manualmente.', 'error');
                return;
            }

            lat = coords.lat;
            lng = coords.lng;
        }

        if (isNaN(lat) || isNaN(lng)) {
            showToast('Coordenadas inválidas.', 'error');
            return;
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            showToast('Coordenadas fora do intervalo válido.', 'error');
            return;
        }

        addClient(name || `Cliente ${state.clients.length + 1}`, lat, lng);

        dom.clientName.value = '';
        dom.clientLink.value = '';
        dom.clientLat.value = '';
        dom.clientLng.value = '';
        dom.clientName.focus();
    }

    function addDashAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes dash {
                to {
                    stroke-dashoffset: -20;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        loadState();
        initMap();
        initEventListeners();
        addDashAnimation();
        updateClientList();

        if (state.clients.length > 0) {
            refreshMarkers();
            fitMapBounds();
        }

        lucide.createIcons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
