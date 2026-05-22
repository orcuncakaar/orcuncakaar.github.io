document.addEventListener('DOMContentLoaded', () => {

    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light') {
        body.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
        body.classList.remove('light-theme');
    } else if (!prefersDark) {
        
        body.classList.add('light-theme');
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');

        updateCanvasColors();
    });

    const langToggleBtn = document.getElementById('lang-toggle');
    let currentLang = localStorage.getItem('lang') || 'tr';
    const typedTextSpan = document.getElementById('typed-text');
    let textArray = [];
    const typingSpeed = 70;
    const erasingSpeed = 40;
    const newTextDelay = 2000;
    let textArrayIndex = 0;
    let charIndex = 0;
    let typingTimeout;

    function type() {
        if (!textArray || textArray.length === 0) return;
        if (charIndex < textArray[textArrayIndex].length) {
            if (typedTextSpan) {
                typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
            }
            charIndex++;
            typingTimeout = setTimeout(type, typingSpeed);
        } else {
            typingTimeout = setTimeout(erase, newTextDelay);
        }
    }

    function erase() {
        if (!textArray || textArray.length === 0) return;
        if (charIndex > 0) {
            if (typedTextSpan) {
                typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
            }
            charIndex--;
            typingTimeout = setTimeout(erase, erasingSpeed);
        } else {
            textArrayIndex++;
            if (textArrayIndex >= textArray.length) textArrayIndex = 0;
            typingTimeout = setTimeout(type, typingSpeed + 300);
        }
    }

    function resetTypewriter(lang) {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        textArray = (translations[lang] && translations[lang]["typed-strings"]) || [];
        textArrayIndex = 0;
        charIndex = 0;
        if (typedTextSpan) {
            typedTextSpan.textContent = '';
        }
        if (textArray.length) {
            typingTimeout = setTimeout(type, 500);
        }
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[lang] && translations[lang][key] !== undefined) {
                el.textContent = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-translate-html]').forEach(el => {
            const key = el.getAttribute('data-translate-html');
            if (translations[lang] && translations[lang][key] !== undefined) {
                el.innerHTML = translations[lang][key];
            }
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            if (translations[lang] && translations[lang][key] !== undefined) {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        });

        const langText = document.querySelector('#lang-toggle .lang-text');
        if (langText) {
            langText.textContent = lang === 'tr' ? 'EN' : 'TR';
        }

        resetTypewriter(lang);
    }

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const nextLang = currentLang === 'tr' ? 'en' : 'tr';
            setLanguage(nextLang);
        });
    }

    setLanguage(currentLang);

    const canvas = document.getElementById('neural-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animationFrameId;
    let mouse = { x: null, y: null, radius: 150 };

    let particleColor = 'rgba(139, 92, 246, 0.4)';  
    let connectorColor = 'rgba(6, 182, 212, 0.08)'; 
    let mouseLineColor = 'rgba(139, 92, 246, 0.15)';

    function updateCanvasColors() {
        const isLight = body.classList.contains('light-theme');
        if (isLight) {
            particleColor = 'rgba(109, 40, 217, 0.35)';   
            connectorColor = 'rgba(8, 145, 178, 0.06)';   
            mouseLineColor = 'rgba(109, 40, 217, 0.12)';
        } else {
            particleColor = 'rgba(139, 92, 246, 0.4)';    
            connectorColor = 'rgba(6, 182, 212, 0.08)';   
            mouseLineColor = 'rgba(139, 92, 246, 0.15)';
        }
    }
    updateCanvasColors(); 

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 0.8; 
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2.5 + 1.5;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = particleColor;
            ctx.fill();
        }

        update() {
            
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

            this.x += this.vx;
            this.y += this.vy;

            if (mouse.x !== null && mouse.y !== null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    
                    this.x += (dx / distance) * force * 1.2;
                    this.y += (dy / distance) * force * 1.2;
                }
            }

            this.draw();
        }
    }

    function initParticles() {
        particles = [];
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 11000); 
        const limitedParticles = Math.min(numberOfParticles, 120); 
        
        for (let i = 0; i < limitedParticles; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(x, y));
        }
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 110) {
                    const opacity = (1 - (distance / 110)) * 0.8;
                    ctx.strokeStyle = connectorColor.replace('0.08', opacity.toFixed(2)).replace('0.06', opacity.toFixed(2));
                    ctx.lineWidth = 1.0;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }

            if (mouse.x !== null && mouse.y !== null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const opacity = (1 - (distance / mouse.radius)) * 0.45;
                    ctx.strokeStyle = mouseLineColor.replace('0.15', opacity.toFixed(2)).replace('0.12', opacity.toFixed(2));
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => particle.update());
        connectParticles();
        
        animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', (e) => {
        
        const heroSection = document.getElementById('home');
        const heroRect = heroSection.getBoundingClientRect();
        
        if (e.clientY >= heroRect.top && e.clientY <= heroRect.bottom) {
            mouse.x = e.clientX;
            mouse.y = e.clientY - heroRect.top;
        } else {
            mouse.x = null;
            mouse.y = null;
        }
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();



    const projectCountEl = document.getElementById('stat-projects');
    const hoursCountEl = document.getElementById('stat-hours');
    
    const targetProjects = 18;  
    const targetHours = 1200;   
    let statsAnimated = false;

    function animateCount(element, target, duration, suffix = "") {
        let start = 0;
        const stepTime = Math.abs(Math.floor(duration / target));

        const increment = target > 100 ? Math.ceil(target / 100) : 1;
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = start + suffix;
            }
        }, Math.max(stepTime, 15));
    }

    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {

                if (entry.target.id === 'about' && !statsAnimated) {
                    statsAnimated = true;
                    if (projectCountEl) animateCount(projectCountEl, targetProjects, 1500, "+");
                    if (hoursCountEl) animateCount(hoursCountEl, targetHours, 1800, " Saat+");
                }

                if (entry.target.classList.contains('reveal')) {
                    entry.target.classList.add('active');
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => scrollObserver.observe(el));
    const skillsSection = document.getElementById('skills');
    const aboutSection = document.getElementById('about');
    
    if (skillsSection) scrollObserver.observe(skillsSection);
    if (aboutSection) scrollObserver.observe(aboutSection);

    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    card.classList.remove('hide');
                    
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    
                    setTimeout(() => {
                        card.classList.add('hide');
                    }, 300);
                }
            });
        });
    });

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbarLinks = document.getElementById('navbar-links');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navbarLinks.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navbarLinks.classList.remove('active');
        });
    });

    const contactForm = document.getElementById('portfolio-contact-form');
    const formFeedback = document.getElementById('form-message');

    const WEB3FORMS_ACCESS_KEY = "27a2282e-8e92-4ee8-9c4c-adf8345398cc";

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = translations[currentLang]["form-sending"] || "Gönderiliyor...";
            
            formFeedback.style.display = 'block';
            formFeedback.className = "form-feedback";
            formFeedback.textContent = translations[currentLang]["form-delivering"] || "Mesajınız iletiliyor...";

            if (WEB3FORMS_ACCESS_KEY === "BURAYA_ANAHTARINIZI_YAZIN" || WEB3FORMS_ACCESS_KEY.trim() === "") {
                setTimeout(() => {
                    contactForm.reset();
                    formFeedback.textContent = currentLang === 'tr' 
                        ? "Mesajınız başarıyla gönderildi (Simülasyon Modu)! Gerçek e-posta almak için script.js dosyasındaki WEB3FORMS_ACCESS_KEY değerini güncelleyin."
                        : "Your message was successfully sent (Simulation Mode)! Update WEB3FORMS_ACCESS_KEY in script.js to receive real emails.";
                    formFeedback.className = "form-feedback success";
                    submitBtn.disabled = false;
                    submitBtn.textContent = translations[currentLang]["form-btn-submit"] || "Mesaj Gönder";

                    setTimeout(() => {
                        formFeedback.style.display = 'none';
                    }, 6000);
                }, 1200);
                return;
            }

            const formData = new FormData(contactForm);
            formData.append("access_key", WEB3FORMS_ACCESS_KEY);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            })
            .then(async (response) => {
                const result = await response.json();
                if (response.status === 200) {
                    contactForm.reset();
                    formFeedback.textContent = translations[currentLang]["form-success"] || "Mesajınız başarıyla gönderildi!";
                    formFeedback.className = "form-feedback success";
                } else {
                    formFeedback.textContent = (currentLang === 'tr' ? "Bir hata oluştu: " : "An error occurred: ") + (result.message || (currentLang === 'tr' ? "Mesaj iletilemedi." : "Message could not be delivered."));
                    formFeedback.className = "form-feedback error";
                }
            })
            .catch(error => {
                formFeedback.textContent = translations[currentLang]["form-error"] || "Bağlantı hatası!";
                formFeedback.className = "form-feedback error";
                console.error("Form error:", error);
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = translations[currentLang]["form-btn-submit"] || "Mesaj Gönder";

                setTimeout(() => {
                    formFeedback.style.display = 'none';
                }, 6000);
            });
        });
    }

    const scrollTopBtn = document.getElementById('scroll-to-top');
    const navbar = document.getElementById('main-navbar');
    const currentYearSpan = document.getElementById('current-year');
    const scrollBar = document.getElementById('scroll-bar');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    window.addEventListener('scroll', () => {
        
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (scrollBar) {
            scrollBar.style.width = scrollPercent + '%';
        }

        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }

        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    const bentoCards = document.querySelectorAll('.bento-card, .certificate-card');
    
    bentoCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});
