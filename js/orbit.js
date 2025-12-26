// ============================================
// ORBIT MANAGER - Handles orbit creation and interactions
// ============================================

class OrbitManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.orbits = [];
        this.orbitLines = [];
        this.orbitLogos = [];
        this.centerLogo = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.textureLoader = new THREE.TextureLoader();
        
        this.init();
    }

    init() {
        this.createCenter();
        this.createOrbits();
        this.setupInteraction();
    }

    // Create Center Logo
    createCenter() {
        const geometry = new THREE.CircleGeometry(3.5, 32); // BIGGER! Was 2.5
        
        // Load center logo texture
        const texture = this.textureLoader.load(
            communityData.center.logo,
            () => console.log('Center logo loaded'),
            undefined,
            (err) => console.error('Error loading center logo:', err)
        );
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            // Emissive makes it glow/visible regardless of lighting
            emissive: 0xffffff,
            emissiveIntensity: 0.3
        });
        
        this.centerLogo = new THREE.Mesh(geometry, material);
        this.centerLogo.userData = { type: 'center', data: communityData.center };
        this.scene.add(this.centerLogo);

        // NO GLOW - removed black circle
    }

    // Create 9 Orbits
    createOrbits() {
        const orbitData = communityData.orbits;
        
        orbitData.forEach((orbit, index) => {
            const radius = 5 + (index * 2.5); // Distance from center
            const segments = 128;
            
            // Create orbit line
            const curve = new THREE.EllipseCurve(
                0, 0,
                radius, radius,
                0, 2 * Math.PI,
                false,
                0
            );
            
            const points = curve.getPoints(segments);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: 0xffffff, // WHITE orbit lines
                transparent: true,
                opacity: 0.9 // Lighter so it's not too heavy
            });
            
            const orbitLine = new THREE.Line(geometry, material);
            orbitLine.rotation.x = Math.PI / 2;
            orbitLine.userData = { type: 'orbit', id: orbit.id, radius: radius };
            this.scene.add(orbitLine);
            this.orbitLines.push(orbitLine);
            
            // Create orbit logo (moving on orbit path)
            const logoGeometry = new THREE.CircleGeometry(2.5, 32); // BIGGER! Was 1.8
            
            // Load orbit logo texture
            const texture = this.textureLoader.load(
                orbit.logo,
                () => console.log(`Orbit ${orbit.id} logo loaded`),
                undefined,
                (err) => console.error(`Error loading orbit ${orbit.id} logo:`, err)
            );
            
            const logoMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide,
                // Emissive makes it visible in any lighting
                emissive: 0xffffff,
                emissiveIntensity: 0.3
            });
            
            const logo = new THREE.Mesh(logoGeometry, logoMaterial);
            logo.userData = { 
                type: 'orbitLogo', 
                id: orbit.id, 
                radius: radius,
                angle: (index / orbitData.length) * Math.PI * 2,
                data: orbit
            };
            
            // Position logo on orbit
            logo.position.x = Math.cos(logo.userData.angle) * radius;
            logo.position.z = Math.sin(logo.userData.angle) * radius;
            
            this.scene.add(logo);
            this.orbitLogos.push(logo);
            
            // NO GLOW - removed background circle
        });
    }

    // Animate orbits rotation
    animate() {
        const speed = 0.001;
        
        this.orbitLogos.forEach((logo, index) => {
            logo.userData.angle += speed * (1 + index * 0.1);
            logo.position.x = Math.cos(logo.userData.angle) * logo.userData.radius;
            logo.position.z = Math.sin(logo.userData.angle) * logo.userData.radius;
            
            // Make logo always face camera
            logo.lookAt(this.camera.position);
        });

        // Gentle rotation for center
        if (this.centerLogo) {
            this.centerLogo.rotation.y += 0.005;
        }
    }

    // Setup click interaction
    setupInteraction() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Check intersections with center
            if (this.centerLogo) {
                const centerIntersects = this.raycaster.intersectObject(this.centerLogo, true);
                if (centerIntersects.length > 0) {
                    this.onCenterClick();
                    return;
                }
            }
            
            // Check intersections with orbit logos
            const logoIntersects = this.raycaster.intersectObjects(this.orbitLogos, true);
            if (logoIntersects.length > 0) {
                const clickedLogo = logoIntersects[0].object;
                if (clickedLogo.userData.type === 'orbitLogo') {
                    this.onOrbitClick(clickedLogo.userData.data);
                }
            }
        });

        // Hover effect
        canvas.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Reset all
            this.orbitLogos.forEach(logo => {
                logo.scale.set(1, 1, 1);
            });
            
            if (this.centerLogo) {
                this.centerLogo.scale.set(1, 1, 1);
            }
            
            // Check hover
            const allObjects = [...this.orbitLogos];
            if (this.centerLogo) allObjects.push(this.centerLogo);
            
            const intersects = this.raycaster.intersectObjects(allObjects, true);
            if (intersects.length > 0) {
                canvas.style.cursor = 'pointer';
                intersects[0].object.scale.set(1.2, 1.2, 1.2);
            } else {
                canvas.style.cursor = 'default';
            }
        });
    }

    // Handle center click
    onCenterClick() {
        console.log('Center clicked!');
        this.showMembers(communityData.center.members, 'LEADER', '#ff69b4');
        this.createParticleBurst(0, 0, 0, 0xff69b4);
    }

    // Handle orbit click
    onOrbitClick(orbitData) {
        console.log('Orbit clicked:', orbitData.name);
        this.showMembers(orbitData.members, orbitData.name, orbitData.color);
        
        // Find logo position for particle effect
        const logo = this.orbitLogos.find(l => l.userData.id === orbitData.id);
        if (logo) {
            this.createParticleBurst(
                logo.position.x, 
                logo.position.y, 
                logo.position.z,
                new THREE.Color(orbitData.color)
            );
        }
    }

    // Create particle burst effect
    createParticleBurst(x, y, z, color) {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions.push(x, y, z);
            velocities.push(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            transparent: true,
            opacity: 1
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData = { velocities: velocities, life: 1.0 };
        this.scene.add(particles);
        
        // Animate particles
        const animateParticles = () => {
            const positions = particles.geometry.attributes.position.array;
            const velocities = particles.userData.velocities;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            particles.userData.life -= 0.02;
            particles.material.opacity = particles.userData.life;
            
            if (particles.userData.life > 0) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
            }
        };
        
        animateParticles();
    }

    // Show members in modal with pagination
    showMembers(members, title, color = '#ff69b4') {
        const modal = document.getElementById('member-modal');
        const memberGrid = document.getElementById('member-grid');
        const modalTitle = document.getElementById('modal-title');
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        // Set dynamic color as CSS variable
        modal.style.setProperty('--orbit-color', color);
        
        // Pagination settings
        const membersPerPage = 10; // 5 columns x 2 rows
        let currentPage = 1;
        const totalPages = Math.ceil(members.length / membersPerPage);
        
        // Function to render current page
        const renderPage = (page) => {
            currentPage = page;
            const startIndex = (page - 1) * membersPerPage;
            const endIndex = startIndex + membersPerPage;
            const pageMembers = members.slice(startIndex, endIndex);
            
            // Clear grid
            memberGrid.innerHTML = '';
            
            // Add members for current page
            pageMembers.forEach((member, index) => {
                const card = document.createElement('div');
                card.className = 'member-card';
                card.style.animationDelay = `${index * 0.1}s`;
                
                card.innerHTML = `
                    <img src="${member.foto}" alt="${member.nama}" class="member-photo">
                    <div class="member-name">${member.nama}</div>
                    <a href="${member.akunX}" target="_blank" class="member-link">Visit X</a>
                `;
                
                memberGrid.appendChild(card);
            });
            
            // Update pagination controls
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === totalPages;
        };
        
        // Set title
        modalTitle.textContent = title;
        
        // Initial render
        renderPage(1);
        
        // Button event listeners
        prevBtn.onclick = () => {
            if (currentPage > 1) renderPage(currentPage - 1);
        };
        
        nextBtn.onclick = () => {
            if (currentPage < totalPages) renderPage(currentPage + 1);
        };
        
        // Show modal
        modal.classList.remove('hidden');
    }
}
