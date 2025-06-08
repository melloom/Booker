// Layout options
const LAYOUTS = {
    COMPACT: {
        name: 'Compact',
        icon: 'fa-compress',
        description: 'Shows more regions in a compact view',
        gridTemplate: 'repeat(auto-fit, minmax(320px, 1fr))',
        cardHeight: 'min-height: 400px',
        productGrid: 'grid-template-columns: 1fr',
        timeSlotHeight: 'max-height: 180px'
    },
    STANDARD: {
        name: 'Standard',
        icon: 'fa-th-large',
        description: 'Balanced view with medium-sized cards',
        gridTemplate: 'repeat(auto-fit, minmax(380px, 1fr))',
        cardHeight: 'min-height: 450px',
        productGrid: 'grid-template-columns: 1fr 1fr',
        timeSlotHeight: 'max-height: 200px'
    },
    EXPANDED: {
        name: 'Expanded',
        icon: 'fa-expand',
        description: 'Larger cards with more details',
        gridTemplate: 'repeat(auto-fit, minmax(450px, 1fr))',
        cardHeight: 'min-height: 500px',
        productGrid: 'grid-template-columns: 1fr 1fr',
        timeSlotHeight: 'max-height: 250px'
    }
};

// Filter options
const FILTERS = {
    ALL: {
        name: 'All Services',
        icon: 'fa-th-list',
        description: 'Show all available services'
    },
    BATHROOMS: {
        name: 'Bathrooms Only',
        icon: 'fa-bath',
        description: 'Show only bathroom services'
    },
    ROOFING: {
        name: 'Roofing Only',
        icon: 'fa-home',
        description: 'Show only roofing services'
    }
};

// Page filters
const PAGE_FILTERS = {
    ALL: {
        name: 'All Regions',
        icon: 'fa-globe',
        description: 'Show all regions'
    },
    MIDA: {
        name: 'MIDA',
        icon: 'fa-map-marker-alt',
        description: 'DC, Virginia, Maryland'
    },
    SOPA: {
        name: 'SOPA',
        icon: 'fa-map-marker-alt',
        description: 'Southern Pennsylvania'
    },
    SOVAS: {
        name: 'SOVAS',
        icon: 'fa-map-marker-alt',
        description: 'Southern Virginia'
    },
    FLORIDA: {
        name: 'Florida',
        icon: 'fa-map-marker-alt',
        description: 'Florida region'
    },
    NEW_ENGLAND: {
        name: 'New England',
        icon: 'fa-map-marker-alt',
        description: 'Massachusetts & Rhode Island'
    },
    CONNECTICUT: {
        name: 'Connecticut',
        icon: 'fa-map-marker-alt',
        description: 'Connecticut region'
    }
};

// Initialize layout controls
function initializeLayoutControls() {
    const headerContent = document.querySelector('.header-content');
    const sizeControls = document.querySelector('.size-controls');
    
    // Remove old size controls
    if (sizeControls) {
        sizeControls.remove();
    }

    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    controlsContainer.innerHTML = `
        <div class="layout-options">
            ${Object.entries(LAYOUTS).map(([key, layout]) => `
                <button class="layout-button ${key === 'STANDARD' ? 'active' : ''}" 
                        data-layout="${key}"
                        title="${layout.description}">
                    <i class="fas ${layout.icon}"></i>
                    <span>${layout.name}</span>
                </button>
            `).join('')}
        </div>
        <div class="filter-options">
            <div class="filter-dropdown">
                <button class="filter-dropdown-button" id="serviceFilterButton">
                    <i class="fas fa-filter"></i>
                    <span>Filter Services</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="filter-dropdown-content" id="serviceFilterContent">
                    ${Object.entries(FILTERS).map(([key, filter]) => `
                        <div class="filter-option ${key === 'ALL' ? 'active' : ''}"
                             data-filter="${key}">
                            <i class="fas ${filter.icon}"></i>
                            <span>${filter.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="filter-dropdown">
                <button class="filter-dropdown-button" id="regionFilterButton">
                    <i class="fas fa-map-marked-alt"></i>
                    <span>Filter Regions</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="filter-dropdown-content" id="regionFilterContent">
                    ${Object.entries(PAGE_FILTERS).map(([key, filter]) => `
                        <div class="filter-option ${key === 'ALL' ? 'active' : ''}"
                             data-page-filter="${key}">
                            <i class="fas ${filter.icon}"></i>
                            <span>${filter.name}</span>
                            <span class="filter-description">${filter.description}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Insert after the day navigation
    const dayNavigation = document.querySelector('.day-navigation');
    if (dayNavigation) {
        dayNavigation.parentNode.insertBefore(controlsContainer, dayNavigation.nextSibling);
    }

    // Add event listeners for layout buttons
    controlsContainer.querySelectorAll('.layout-button').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            controlsContainer.querySelectorAll('.layout-button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to clicked button
            button.classList.add('active');
            // Switch layout
            switchLayout(button.dataset.layout);
        });
    });

    // Get filter elements
    const serviceFilterButton = document.getElementById('serviceFilterButton');
    const serviceFilterContent = document.getElementById('serviceFilterContent');
    const regionFilterButton = document.getElementById('regionFilterButton');
    const regionFilterContent = document.getElementById('regionFilterContent');

    // Add dropdown functionality for service filters
    serviceFilterButton.addEventListener('click', (e) => {
        e.stopPropagation();
        serviceFilterContent.classList.toggle('show');
        regionFilterContent.classList.remove('show');
    });

    controlsContainer.querySelectorAll('.filter-option[data-filter]').forEach(option => {
        option.addEventListener('click', () => {
            switchFilter(option.dataset.filter);
            serviceFilterContent.classList.remove('show');
            
            // Update active state
            controlsContainer.querySelectorAll('.filter-option[data-filter]').forEach(opt => {
                opt.classList.remove('active');
            });
            option.classList.add('active');
            
            // Update button text
            const selectedFilter = FILTERS[option.dataset.filter];
            serviceFilterButton.querySelector('span').textContent = selectedFilter.name;
        });
    });

    // Add dropdown functionality for region filters
    regionFilterButton.addEventListener('click', (e) => {
        e.stopPropagation();
        regionFilterContent.classList.toggle('show');
        serviceFilterContent.classList.remove('show');
    });

    controlsContainer.querySelectorAll('.filter-option[data-page-filter]').forEach(option => {
        option.addEventListener('click', () => {
            switchPageFilter(option.dataset.pageFilter);
            regionFilterContent.classList.remove('show');
            
            // Update active state
            controlsContainer.querySelectorAll('.filter-option[data-page-filter]').forEach(opt => {
                opt.classList.remove('active');
            });
            option.classList.add('active');
            
            // Update button text
            const selectedFilter = PAGE_FILTERS[option.dataset.pageFilter];
            regionFilterButton.querySelector('span').textContent = selectedFilter.name;
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!serviceFilterButton.contains(e.target) && !serviceFilterContent.contains(e.target)) {
            serviceFilterContent.classList.remove('show');
        }
        if (!regionFilterButton.contains(e.target) && !regionFilterContent.contains(e.target)) {
            regionFilterContent.classList.remove('show');
        }
    });

    // Apply initial layout
    switchLayout('STANDARD');
}

// Switch layout
function switchLayout(layoutKey) {
    const layout = LAYOUTS[layoutKey];
    if (!layout) return;

    // Store current active filters
    const activeServiceFilter = document.querySelector('.filter-option[data-filter].active')?.dataset.filter;
    const activeRegionFilter = document.querySelector('.filter-option[data-page-filter].active')?.dataset.pageFilter;

    // Apply layout
    const regionsGrid = document.querySelector('.regions-grid');
    if (regionsGrid) {
        regionsGrid.style.gridTemplateColumns = layout.gridTemplate;
        
        // Update region card heights
        document.querySelectorAll('.region-card').forEach(card => {
            card.style.cssText = layout.cardHeight;
        });

        // Update product section layout
        document.querySelectorAll('.products-container').forEach(container => {
            container.style.cssText = layout.productGrid;
        });

        // Update product section heights
        document.querySelectorAll('.product-section').forEach(section => {
            section.style.minHeight = '0';
            section.style.flex = '1';
            section.style.display = 'flex';
            section.style.flexDirection = 'column';
            section.style.overflow = 'hidden';
        });

        // Update time slots grid
        document.querySelectorAll('.time-slots-grid').forEach(grid => {
            grid.style.display = 'grid';
            grid.style.gap = '0.5rem';
            grid.style.overflowY = 'auto';
            grid.style.maxHeight = layout.timeSlotHeight;
            grid.style.padding = '0.5rem';
            grid.style.gridTemplateColumns = '1fr';
            grid.style.scrollbarWidth = 'thin';
            grid.style.scrollbarColor = 'var(--primary-color) #e2e8f0';
        });

        // Reapply active filters
        if (activeServiceFilter) {
            switchFilter(activeServiceFilter);
        }
        if (activeRegionFilter) {
            switchPageFilter(activeRegionFilter);
        }
    }
}

// Switch filter
function switchFilter(filterKey) {
    const filter = FILTERS[filterKey];
    if (!filter) return;

    // Get the current layout
    const activeLayout = document.querySelector('.layout-button.active')?.dataset.layout || 'STANDARD';
    const layout = LAYOUTS[activeLayout];

    // Apply filter
    const productSections = document.querySelectorAll('.product-section');
    let visibleSections = 0;

    productSections.forEach(section => {
        const product = section.querySelector('.product-title').textContent.trim();
        switch (filterKey) {
            case 'BATHROOMS':
                section.style.display = product === 'Bathrooms' ? 'flex' : 'none';
                if (product === 'Bathrooms') visibleSections++;
                break;
            case 'ROOFING':
                section.style.display = product === 'Roofing' ? 'flex' : 'none';
                if (product === 'Roofing') visibleSections++;
                break;
            default:
                section.style.display = 'flex';
                visibleSections++;
        }
    });

    // Adjust product container layout based on visible sections
    document.querySelectorAll('.products-container').forEach(container => {
        if (visibleSections === 1) {
            container.style.gridTemplateColumns = '1fr';
        } else {
            container.style.gridTemplateColumns = layout.productGrid;
        }
    });

    // Update button text
    const serviceFilterButton = document.getElementById('serviceFilterButton');
    if (serviceFilterButton) {
        serviceFilterButton.querySelector('span').textContent = filter.name;
    }
}

// Switch page filter
function switchPageFilter(filterKey) {
    const filter = PAGE_FILTERS[filterKey];
    if (!filter) return;

    // Get the current layout
    const activeLayout = document.querySelector('.layout-button.active')?.dataset.layout || 'STANDARD';
    const layout = LAYOUTS[activeLayout];

    // Apply filter
    const regionCards = document.querySelectorAll('.region-card');
    let visibleCards = 0;

    regionCards.forEach(card => {
        const regionName = card.querySelector('.region-title').textContent.trim();
        if (filterKey === 'ALL') {
            card.style.display = 'flex';
            visibleCards++;
        } else {
            card.style.display = regionName === filter.name ? 'flex' : 'none';
            if (regionName === filter.name) visibleCards++;
        }
    });

    // Adjust regions grid layout based on visible cards
    const regionsGrid = document.querySelector('.regions-grid');
    if (regionsGrid) {
        if (visibleCards === 1) {
            regionsGrid.style.gridTemplateColumns = '1fr';
        } else {
            regionsGrid.style.gridTemplateColumns = layout.gridTemplate;
        }
    }

    // Update button text
    const regionFilterButton = document.getElementById('regionFilterButton');
    if (regionFilterButton) {
        regionFilterButton.querySelector('span').textContent = filter.name;
    }
}

// Update styles
const styles = `
    .controls-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 1rem;
    }

    .layout-options,
    .filter-options {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    .layout-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: var(--border-radius);
        background: white;
        color: var(--text-color);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .layout-button:hover {
        border-color: var(--primary-color);
        transform: translateY(-1px);
    }

    .layout-button.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
    }

    .layout-button i {
        font-size: 1rem;
    }

    /* Filter Dropdown Styles */
    .filter-dropdown {
        position: relative;
    }

    .filter-dropdown-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: var(--border-radius);
        background: white;
        color: var(--text-color);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 160px;
    }

    .filter-dropdown-button:hover {
        border-color: var(--primary-color);
    }

    .filter-dropdown-button i {
        font-size: 1rem;
    }

    .filter-dropdown-button .fa-chevron-down {
        margin-left: auto;
        font-size: 0.75rem;
        transition: transform 0.2s ease;
    }

    .filter-dropdown-content {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        margin-top: 0.5rem;
        display: none;
        z-index: 1000;
        max-height: 300px;
        overflow-y: auto;
    }

    .filter-dropdown-content.show {
        display: block;
    }

    .filter-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .filter-option:hover {
        background: #f8fafc;
    }

    .filter-option.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
    }

    .filter-option i {
        font-size: 1rem;
        width: 20px;
        text-align: center;
    }

    .filter-description {
        font-size: 0.75rem;
        color: var(--text-light);
        margin-left: auto;
    }

    .filter-option.active .filter-description {
        color: rgba(255, 255, 255, 0.8);
    }

    @media (max-width: 768px) {
        .controls-container {
            padding: 0.5rem;
        }

        .layout-options,
        .filter-options {
            flex-direction: column;
            align-items: stretch;
        }

        .layout-button span {
            display: none;
        }

        .layout-button {
            padding: 0.5rem;
        }

        .filter-dropdown-button {
            width: 100%;
            justify-content: center;
        }

        .filter-dropdown-button span {
            display: none;
        }

        .filter-dropdown-content {
            width: 100%;
        }

        .filter-option span {
            display: none;
        }

        .filter-option {
            justify-content: center;
            padding: 0.5rem;
        }

        .filter-description {
            display: none;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Export functions
export {
    initializeLayoutControls,
    switchLayout,
    switchFilter,
    switchPageFilter
}; 