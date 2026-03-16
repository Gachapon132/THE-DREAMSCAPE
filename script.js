// ============================================
// THE DREAMSCAPE - INTERACTIVE FEATURES
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    setupScrollEffects();
    setupInteractiveCards();
    initializeCarousel();
    setupCategoryFiltering();
});

// Initialize entrance animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe story cards and category cards (skip featured-stories section)
    document.querySelectorAll('.story-card:not(#featuredStories .story-card), .category-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Setup scroll effects
function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
    });
}

// Setup interactive card effects
function setupInteractiveCards() {
    const cards = document.querySelectorAll('.story-card, .category-card, .carousel-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });

        card.addEventListener('click', function() {
            // Add subtle feedback when card is clicked
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            // If it's a story card with a URL, change the iframe and scroll to viewer
            let url = null;
            let title = this.querySelector('h3').textContent;
            
            if (this.classList.contains('story-card') && this.dataset.url) {
                url = this.dataset.url;
            } else if (this.classList.contains('carousel-card')) {
                // For carousel cards, get URL from parent carousel-item
                const parentItem = this.closest('.carousel-item');
                if (parentItem && parentItem.dataset.url) {
                    url = parentItem.dataset.url;
                }
            }
            
            if (url) {
                const iframe = document.querySelector('#bookViewer iframe');
                const viewerTitle = document.querySelector('#bookViewer h2');
                if (iframe) {
                    iframe.src = url;
                    iframe.title = title;
                }
                if (viewerTitle) {
                    viewerTitle.textContent = '📖 Read: ' + title;
                }
                // Update current story for PDF download - pass the card element
                updateCurrentStory(title, '', '', this);
                document.getElementById('bookViewer').scrollIntoView({behavior: 'smooth'});
            }
        });
    });
}

// Smooth scroll with offset for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open elements if needed
        console.log('Escape key pressed');
    }
});

// ============================================
// CAROUSEL FUNCTIONALITY
// ============================================

let currentSlide = 0;
let carouselItems = [];
let startX = 0;
let endX = 0;
let isDragging = false;

function initializeCarousel() {
    const carouselInner = document.getElementById('carouselInner');
    const carouselPrev = document.getElementById('carouselPrev');
    const carouselNext = document.getElementById('carouselNext');
    const carouselDotsContainer = document.getElementById('carouselDots');

    if (!carouselInner) return;

    carouselItems = document.querySelectorAll('.carousel-item');
    const itemCount = carouselItems.length;

    // Create carousel dots
    for (let i = 0; i < itemCount; i++) {
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        carouselDotsContainer.appendChild(dot);
    }

    // Navigation button listeners
    carouselPrev?.addEventListener('click', () => prevSlide());
    carouselNext?.addEventListener('click', () => nextSlide());

    // Touch/swipe support
    carouselInner.addEventListener('touchstart', handleTouchStart, false);
    carouselInner.addEventListener('touchend', handleTouchEnd, false);

    // Mouse drag support
    carouselInner.addEventListener('mousedown', handleMouseDown, false);
    carouselInner.addEventListener('mousemove', handleMouseMove, false);
    carouselInner.addEventListener('mouseup', handleMouseUp, false);
    carouselInner.addEventListener('mouseleave', handleMouseUp, false);

    // Carousel item click handlers
    carouselItems.forEach(item => {
        const card = item.querySelector('.carousel-card');
        if (card) {
            card.addEventListener('click', function(e) {
                e.stopPropagation();
                const dataUrl = item.dataset.url;
                if (dataUrl) {
                    const iframe = document.querySelector('#bookViewer iframe');
                    const viewerTitle = document.querySelector('#bookViewer h2');
                    if (iframe) {
                        iframe.src = dataUrl;
                        iframe.title = item.querySelector('h3').textContent;
                    }
                    if (viewerTitle) {
                        viewerTitle.textContent = '📖 Read: ' + item.querySelector('h3').textContent;
                    }
                    // Update current story for PDF download - pass element and details
                    const storyTitle = item.querySelector('h3').textContent;
                    const storyDescription = item.querySelector('p')?.textContent || '';
                    const storyAge = item.querySelector('.carousel-badge')?.textContent || '';
                    updateCurrentStory(storyTitle, storyDescription, storyAge, item);
                    document.getElementById('bookViewer').scrollIntoView({behavior: 'smooth'});
                }
            });
        }
    });

    updateCarousel();
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % carouselItems.length;
    updateCarousel();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const carouselInner = document.getElementById('carouselInner');
    if (!carouselInner) return;

    // Update carousel position
    const translateX = -currentSlide * 100;
    carouselInner.style.transform = `translateX(${translateX}%)`;

    // Update dots
    document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    isDragging = true;
}

function handleTouchEnd(e) {
    endX = e.changedTouches[0].clientX;
    isDragging = false;
    handleSwipe();
}

function handleMouseDown(e) {
    startX = e.clientX;
    isDragging = true;
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
}

function handleMouseUp(e) {
    endX = e.clientX;
    isDragging = false;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = startX - endX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swiped left, go to next
            nextSlide();
        } else {
            // Swiped right, go to previous
            prevSlide();
        }
    }
}

// Function to show all stories from menu
function showAllStories() {
    const categoryCards = document.querySelectorAll('.category-card[data-filter]');
    const storyCards = document.querySelectorAll('#storyLibraryGrid .story-card');
    
    // Remove active class from all category cards
    categoryCards.forEach(c => c.classList.remove('active'));
    
    // Show all stories
    storyCards.forEach(story => {
        story.style.display = 'block';
        story.style.opacity = '1';
    });
    
    // Scroll to story library
    setTimeout(() => {
        document.querySelector('#storyLibrary').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function setupCategoryFiltering() {
    const categoryCards = document.querySelectorAll('.category-card[data-filter]');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const selectedCategory = this.dataset.filter;
            const storyCards = document.querySelectorAll('#storyLibraryGrid .story-card');
            
            // Remove active class from all category cards
            categoryCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Filter stories - handle multiple categories separated by space
            let visibleCount = 0;
            storyCards.forEach(story => {
                const storyCategories = story.dataset.category?.split(' ') || [];
                if (storyCategories.includes(selectedCategory)) {
                    story.style.display = 'block';
                    story.style.opacity = '1';
                    story.style.animation = 'fadeIn 0.5s ease';
                    visibleCount++;
                } else {
                    story.style.display = 'none';
                }
            });
            
            // Show message if no stories found
            if (visibleCount === 0) {
                alert('No stories found in this category.');
            }
            
            // Scroll to Story Library
            document.querySelector('#storyLibrary').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Add event listener to reset filter when clicking active category
    categoryCards.forEach(card => {
        card.addEventListener('dblclick', function() {
            // Double-click to show all stories
            categoryCards.forEach(c => c.classList.remove('active'));
            document.querySelectorAll('#storyLibraryGrid .story-card').forEach(story => {
                story.style.display = 'block';
                story.style.opacity = '1';
            });
            alert('Showing all stories. Click a category to filter.');
        });
    });
}

// Add fadeIn animation to CSS (will be added via style tag)
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .category-card.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        transform: scale(1.05);
    }
    .category-card.active h3,
    .category-card.active p {
        color: white;
    }
`;
document.head.appendChild(style);

// ============================================
// GLOWING BUBBLES ON CLICK
// ============================================

function createBubble(e) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    
    const size = Math.random() * 30 + 20; // Random size between 20-50px
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = e.pageX + 'px';
    bubble.style.top = e.pageY + 'px';
    bubble.style.transform = 'translate(-50%, -50%)';
    
    // Random direction for floating
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 100 + 50;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 100;
    
    bubble.style.setProperty('--tx', tx + 'px');
    bubble.style.setProperty('--ty', ty + 'px');
    
    document.body.appendChild(bubble);
    
    // Remove bubble after animation completes
    setTimeout(() => {
        bubble.remove();
    }, 1000);
}

// Add click event listener to entire document
document.addEventListener('click', createBubble);

// ============================================
// PDF DOWNLOAD FUNCTIONALITY
// ============================================

// Store current story information globally
let currentStory = {
    title: 'The Tales of Fireflies - Meadow',
    description: 'Where magical fireflies light up the July Festival with wonder and enchantment.',
    age: '4-8 years',
    url: 'https://simplebooklet.com/thetailesoffirefliesmeadow3',
    pdfUrl: null,  // Optional: direct PDF URL if available
    element: null  // Store reference to the story element
};

// Update current story when user clicks on a story card or carousel item
function updateCurrentStory(title, description = '', age = '', element = null) {
    currentStory.title = title;
    if (description) currentStory.description = description;
    if (age) currentStory.age = age;
    if (element) currentStory.element = element;
    
    // Try to get pdfUrl from element if available
    if (element && element.dataset.pdf) {
        currentStory.pdfUrl = element.dataset.pdf;
    } else {
        currentStory.pdfUrl = null;
    }
}

// Function to download story as PDF
function downloadStoryPDF() {
    // Get the current story title from the viewer heading
    const viewerTitle = document.querySelector('#bookViewer h2').textContent.replace('📖 Read: ', '');
    
    // If there's a direct PDF URL, download it directly
    if (currentStory.pdfUrl) {
        downloadDirectPDF();
        return;
    }
    
    // Otherwise, try to capture the iframe and create a PDF
    downloadStoryWithScreenshot();
}

// Download direct PDF file (if available)
function downloadDirectPDF() {
    const a = document.createElement('a');
    a.href = currentStory.pdfUrl;
    a.download = currentStory.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Capture iframe and create PDF screenshot
function downloadStoryWithScreenshot() {
    const viewerTitle = document.querySelector('#bookViewer h2').textContent.replace('📖 Read: ', '');
    const iframe = document.querySelector('#bookViewer iframe');
    
    if (!iframe) {
        alert('No story content loaded. Please select a story first.');
        return;
    }
    
    // Show loading message
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = '⏳ Creating PDF...';
    downloadBtn.disabled = true;
    
    // Try to capture visible iframe area and combine with story info
    html2canvas(iframe, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Add title page
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Title page styling
        pdf.setFillColor(99, 102, 241); // Primary color
        pdf.rect(0, 0, pageWidth, 50, 'F');
        
        // Title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.text('📚 ' + viewerTitle, 15, 25, { maxWidth: pageWidth - 30 });
        
        // Reset colors
        pdf.setTextColor(0, 0, 0);
        
        // Story information
        pdf.setFontSize(12);
        pdf.text('Age Group: ' + currentStory.age, 15, 70);
        pdf.text('From: The Dreamscape - Children\'s Stories & Adventures', 15, 80);
        pdf.text('Downloaded on: ' + new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }), 15, 90);
        
        // Description
        if (currentStory.description) {
            pdf.setFontSize(10);
            const descriptionY = 105;
            pdf.text('Description:', 15, descriptionY);
            const splitDescription = pdf.splitTextToSize(currentStory.description, pageWidth - 30);
            pdf.text(splitDescription, 15, descriptionY + 8);
        }
        
        // Add a page break
        pdf.addPage();
        
        // Add the screenshot of the iframe
        const imgY = 10;
        if (imgHeight > pageHeight - 20) {
            // If image is too tall, split into multiple pages
            let heightLeft = imgHeight;
            let position = imgY;
            pdf.addImage(imgData, 'JPEG', 5, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 20;
            
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 5, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
        } else {
            pdf.addImage(imgData, 'JPEG', 5, imgY, imgWidth, imgHeight);
        }
        
        // Add footer with copyright
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text('© The Dreamscape. All rights reserved. For personal, non-commercial use only.', 
            pageWidth / 2, pdf.internal.pageSize.getHeight() - 5, { align: 'center' });
        
        // Save the PDF
        pdf.save(viewerTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_dreamscape.pdf');
        
        // Restore button
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }).catch(error => {
        console.error('Error creating PDF:', error);
        alert('Error creating PDF. Please try again.');
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    });
}

// Log page load info
console.log('🎉 Welcome to The Dreamscape!');
console.log('📚 This website is dedicated to children\'s stories and adventures.');
console.log('✨ Enjoy exploring our collection of magical tales!');
