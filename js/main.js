// ============================================
// MAIN.JS - Three.js Scene Setup & Animation
// ============================================

let scene, camera, renderer, orbitManager;
let stars = [];

// Initialize everything
function init() {
    // Scene
    scene = new THREE.Scene();
    // NO FOG - removed for sharp colors

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);

  // Renderer
renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: false,
    preserveDrawingBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xff0000, 1); // Red fallback
document.getElementById('container').appendChild(renderer.domElement);

    // Add half-half background
    createGradientBackground();

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff1493, 1.5, 100);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create starfield
    createStarfield();

    // Initialize Orbit Manager
    orbitManager = new OrbitManager(scene, camera, renderer);

    // Event Listeners
    setupEventListeners();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);

    // Start animation
    animate();
}

// Create circular white center with red outer area
function createGradientBackground() {
    // Create canvas
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Fill entire canvas with RED first
    context.fillStyle = '#ff0000ff';
    context.fillRect(0, 0, size, size);
    
    // Draw WHITE circle in center (safe zone for orbits)
    // Radius calculation: orbit 9 is at ~25 units, add 8 units safety margin
    const whiteRadius = size * 0.40; // 45% of canvas = safe for all orbits
    
    context.fillStyle = '#ff0000ff';
    context.beginPath();
    context.arc(centerX, centerY, whiteRadius, 0, Math.PI * 2);
    context.fill();
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    // Create flat plane as background
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    
    const background = new THREE.Mesh(geometry, material);
    background.position.z = -50; // Behind everything
    scene.add(background);
}

// Create circle texture for stars (to replace square)
function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const ctx = canvas.getContext('2d');
    
    // Create radial gradient for smooth circle
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
}

// Create animated starfield background
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        
        positions.push(x, y, z);
        
        // White colors for stars
        const color = new THREE.Color();
        color.setRGB(1.0, 1.0, 1.0); // White instead of pink
        colors.push(color.r, color.g, color.b);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        map: createCircleTexture(),
        blending: THREE.AdditiveBlending
    });
    
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    
    stars.push(starField);
    
    // Add second layer of pink stars
    const starGeometry2 = new THREE.BufferGeometry();
    const positions2 = [];
    const colors2 = [];
    
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 300;
        const y = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        positions2.push(x, y, z);
        
        // White colors for stars
        const color = new THREE.Color();
        color.setRGB(1.0, 1.0, 1.0); // White
        colors2.push(color.r, color.g, color.b);
    }
    
    starGeometry2.setAttribute('position', new THREE.Float32BufferAttribute(positions2, 3));
    starGeometry2.setAttribute('color', new THREE.Float32BufferAttribute(colors2, 3));
    
    const starMaterial2 = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        map: createCircleTexture(),
        blending: THREE.AdditiveBlending
    });
    
    const starField2 = new THREE.Points(starGeometry2, starMaterial2);
    scene.add(starField2);
    stars.push(starField2);
}

// Animate stars (twinkling effect)
function animateStars() {
    stars.forEach((starField, index) => {
        // Gentle rotation
        starField.rotation.y += 0.0001 * (index + 1);
        starField.rotation.x += 0.00005 * (index + 1);
        
        // Twinkling effect
        const positions = starField.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const twinkle = Math.sin(Date.now() * 0.001 + i) * 0.1;
            starField.material.opacity = 0.6 + twinkle;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Close modal
    const closeBtn = document.getElementById('close-modal');
    const modal = document.getElementById('member-modal');
    const overlay = modal.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    overlay.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Search functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-user');
    
    searchBtn.addEventListener('click', () => searchUser(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUser(searchInput.value);
    });
    
    // Mouse wheel zoom
    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        const zoomSpeed = 0.1;
        const delta = event.deltaY * zoomSpeed;
        
        camera.position.z += delta * 0.1;
        camera.position.z = Math.max(15, Math.min(60, camera.position.z));
    });
    
    // Mouse drag to rotate view
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (event) => {
        if (event.button === 2) { // Right click
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });
    
    renderer.domElement.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - previousMousePosition.x;
            const deltaY = event.clientY - previousMousePosition.y;
            
            // Rotate camera around center
            const radius = Math.sqrt(
                camera.position.x ** 2 + 
                camera.position.z ** 2
            );
            
            const angle = Math.atan2(camera.position.z, camera.position.x);
            const newAngle = angle - deltaX * 0.01;
            
            camera.position.x = radius * Math.cos(newAngle);
            camera.position.z = radius * Math.sin(newAngle);
            camera.position.y += deltaY * 0.1;
            camera.position.y = Math.max(5, Math.min(40, camera.position.y));
            
            camera.lookAt(0, 0, 0);
            
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Prevent context menu on right click
    renderer.domElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
    
    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    renderer.domElement.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        }
    });
    
    renderer.domElement.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            const deltaX = event.touches[0].clientX - touchStartX;
            const deltaY = event.touches[0].clientY - touchStartY;
            
            const radius = Math.sqrt(
                camera.position.x ** 2 + 
                camera.position.z ** 2
            );
            
            const angle = Math.atan2(camera.position.z, camera.position.x);
            const newAngle = angle - deltaX * 0.005;
            
            camera.position.x = radius * Math.cos(newAngle);
            camera.position.z = radius * Math.sin(newAngle);
            camera.position.y += deltaY * 0.05;
            camera.position.y = Math.max(5, Math.min(40, camera.position.y));
            
            camera.lookAt(0, 0, 0);
            
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        }
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Reset camera to default position
function resetCamera() {
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);
}


// Search user by name
function searchUser(query) {
    if (!query || query.trim() === '') {
        alert('Please enter a name to search');
        return;
    }
    
    const searchTerm = query.trim().toLowerCase();
    
    // Search in all members (center + all orbits)
    let foundMember = null;
    let foundLocation = '';
    
    // Search in center
    const centerMember = communityData.center.members.find(m => 
        m.nama.toLowerCase().includes(searchTerm)
    );
    
    if (centerMember) {
        foundMember = centerMember;
        foundLocation = 'LEADER';
    } else {
        // Search in orbits
        for (let orbit of communityData.orbits) {
            const orbitMember = orbit.members.find(m => 
                m.nama.toLowerCase().includes(searchTerm)
            );
            if (orbitMember) {
                foundMember = orbitMember;
                foundLocation = orbit.name;
                break;
            }
        }
    }
    
    if (foundMember) {
        // Show floating profile card (no modal background)
        showSearchResult(foundMember, foundLocation);
        // Clear search input
        document.getElementById('search-user').value = '';
    } else {
        alert(`User "${query}" not found`);
    }
}

// Show search result as floating profile card
function showSearchResult(member, location) {
    const searchResult = document.getElementById('search-result');
    
    searchResult.innerHTML = `
        <div class="search-profile-card">
            <button class="close-search" onclick="closeSearchResult()">×</button>
            <img src="${member.foto}" alt="${member.nama}" class="member-photo">
            <div class="member-name">${member.nama}</div>
            <div class="member-location">${location}</div>
            <a href="${member.akunX}" target="_blank" class="member-link">Visit X</a>
        </div>
    `;
    
    searchResult.classList.remove('hidden');
}

// Close search result
function closeSearchResult() {
    document.getElementById('search-result').classList.add('hidden');
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Animate orbits
    if (orbitManager) {
        orbitManager.animate();
    }
    
    // Animate stars
    animateStars();
    
    // Render
    renderer.render(scene, camera);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
