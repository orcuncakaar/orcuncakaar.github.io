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
        document.title = lang === 'tr' ? 'Kişisel Portfolyo | Orçun Çakar' : 'Personal Portfolio | Orçun Çakar';

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

    // --- REGRESYON OYUN ALANI (OLS PLAYGROUND) ---
    const regCanvas = document.getElementById('regression-canvas');
    if (regCanvas) {
        const regCtx = regCanvas.getContext('2d');
        const warningOverlay = document.getElementById('playground-canvas-warning');
        const btnClear = document.getElementById('btn-clear-playground');
        const btnRandom = document.getElementById('btn-random-playground');

        const elFormula = document.getElementById('reg-formula');
        const elCorr = document.getElementById('reg-corr');
        const elR2 = document.getElementById('reg-r2');
        const elSlope = document.getElementById('reg-slope');
        const elIntercept = document.getElementById('reg-intercept');
        const elN = document.getElementById('reg-n');
        const elSSE = document.getElementById('reg-sse');
        const toggleResiduals = document.getElementById('toggle-residuals');

        let points = []; // Canvas koordinatlarındaki {x, y} dizisi

        function resizeRegCanvas() {
            const rect = regCanvas.parentElement.getBoundingClientRect();
            regCanvas.width = rect.width;
            regCanvas.height = rect.height;
            drawRegression();
        }

        window.addEventListener('resize', resizeRegCanvas);

        regCanvas.addEventListener('mousedown', (e) => {
            const rect = regCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Sınırları koru
            if (x >= 30 && x <= regCanvas.width - 10 && y >= 10 && y <= regCanvas.height - 30) {
                points.push({ x, y });
                calculateRegression();
                drawRegression();
            }
        });

        btnClear.addEventListener('click', () => {
            points = [];
            calculateRegression();
            drawRegression();
        });

        btnRandom.addEventListener('click', () => {
            points = [];
            const N = Math.floor(Math.random() * 12) + 8; // 8 ila 20 arasında rastgele nokta
            const w = regCanvas.width;
            const h = regCanvas.height;

            const slope = (Math.random() - 0.5) * 1.2; // Rastgele eğim
            const intercept = (Math.random() * 0.4 + 0.3) * (h - 40); // Rastgele kesişim
            const noise = 30; // Hata terimi (gürültü) miktarı

            for (let i = 0; i < N; i++) {
                const x = 50 + (w - 100) * (i / (N - 1));
                const idealYMath = slope * (x - 30) + intercept;
                const idealYCanvas = (h - 30) - idealYMath;
                const noisyY = idealYCanvas + (Math.random() - 0.5) * noise * 2;
                
                const finalY = Math.max(15, Math.min(h - 35, noisyY));
                points.push({ x, y: finalY });
            }

            calculateRegression();
            drawRegression();
        });

        if (toggleResiduals) {
            toggleResiduals.addEventListener('change', () => {
                drawRegression();
            });
        }

        function calculateRegression() {
            const N = points.length;
            elN.textContent = N;

            if (N < 2) {
                warningOverlay.classList.add('active');
                elFormula.textContent = 'y = β₀ + β₁x';
                elCorr.textContent = '-';
                elR2.textContent = '-';
                elSlope.textContent = '-';
                elIntercept.textContent = '-';
                if (elSSE) elSSE.textContent = '-';
                return;
            }

            warningOverlay.classList.remove('active');

            const H = regCanvas.height;

            // Canvas Y değerini matematiksel Y değerine dönüştür (sol alt köşe 0,0 kabul edilerek)
            const mathPoints = points.map(p => ({
                x: p.x - 30, // Y ekseninden olan uzaklık
                y: (H - 30) - p.y // X ekseninden olan uzaklık
            }));

            // Ortalamaları hesapla
            let sumX = 0, sumY = 0;
            mathPoints.forEach(p => {
                sumX += p.x;
                sumY += p.y;
            });
            const meanX = sumX / N;
            const meanY = sumY / N;

            // Eğim (Slope - m) & Kesişim (Intercept - c) hesaplaması
            let num = 0;
            let den = 0;
            let sumSqX = 0;
            let sumSqY = 0;
            let sumProd = 0;

            mathPoints.forEach(p => {
                const diffX = p.x - meanX;
                const diffY = p.y - meanY;
                num += diffX * diffY;
                den += diffX * diffX;
                sumSqX += diffX * diffX;
                sumSqY += diffY * diffY;
                sumProd += diffX * diffY;
            });

            const slope = den === 0 ? 0 : num / den;
            const intercept = meanY - slope * meanX;

            // Pearson Korelasyon Katsayısı (r)
            let r = 0;
            const denomCorr = Math.sqrt(sumSqX * sumSqY);
            if (denomCorr !== 0) {
                r = sumProd / denomCorr;
            }
            const r2 = r * r;

            // Hata Kareler Toplamı (SSE) hesaplaması
            let sse = 0;
            mathPoints.forEach(p => {
                const yPred = slope * p.x + intercept;
                const error = p.y - yPred;
                sse += error * error;
            });

            // Sonuçları göster
            const sign = intercept >= 0 ? '+' : '-';
            const absIntercept = Math.abs(intercept).toFixed(2);
            elFormula.innerHTML = `y = <span class="text-gradient">${slope.toFixed(2)}x</span> ${sign} <span class="text-gradient-green">${absIntercept}</span>`;
            elCorr.textContent = r.toFixed(4);
            elR2.textContent = r2.toFixed(4);
            elSlope.textContent = slope.toFixed(4);
            elIntercept.textContent = intercept.toFixed(2);
            if (elSSE) elSSE.textContent = sse.toFixed(2);

            regCanvas.calculatedModel = { slope, intercept };
        }

        function drawRegression() {
            const W = regCanvas.width;
            const H = regCanvas.height;

            regCtx.clearRect(0, 0, W, H);

            const isLight = body.classList.contains('light-theme');
            const gridColor = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.03)';
            const axisColor = isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.2)';
            
            // 1. Grafik Izgara Çizimi (Milimetrik Kağıt Deseni)
            const gridSize = 30;
            regCtx.strokeStyle = gridColor;
            regCtx.lineWidth = 1;

            for (let x = 0; x < W; x += gridSize) {
                regCtx.beginPath();
                regCtx.moveTo(x, 0);
                regCtx.lineTo(x, H);
                regCtx.stroke();
            }

            for (let y = 0; y < H; y += gridSize) {
                regCtx.beginPath();
                regCtx.moveTo(0, y);
                regCtx.lineTo(W, y);
                regCtx.stroke();
            }

            // 2. Matematiksel Eksenlerin Çizimi (X ve Y Eksenleri)
            regCtx.strokeStyle = axisColor;
            regCtx.lineWidth = 2;
            
            // X Ekseni (Alt kısımdan 30px yukarıda)
            const xAxisY = H - 30;
            regCtx.beginPath();
            regCtx.moveTo(30, xAxisY);
            regCtx.lineTo(W - 10, xAxisY);
            regCtx.stroke();

            // Y Ekseni (Sol kısımdan 30px sağda)
            const yAxisX = 30;
            regCtx.beginPath();
            regCtx.moveTo(yAxisX, 10);
            regCtx.lineTo(yAxisX, H - 30);
            regCtx.stroke();

            // Eksen Başlıkları
            regCtx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.4)';
            regCtx.font = '600 11px var(--font-body)';
            regCtx.textAlign = 'center';
            regCtx.fillText('X', W - 15, xAxisY + 15);
            regCtx.textAlign = 'right';
            regCtx.fillText('Y', yAxisX - 10, 18);

            // 3. Regresyon Doğrusunun Çizilmesi (N >= 2 ise)
            if (points.length >= 2 && regCanvas.calculatedModel) {
                const { slope, intercept } = regCanvas.calculatedModel;

                // Eksen sınırları içinde çizgi başlangıç ve bitiş koordinatlarını belirle
                const xStartMath = 0;
                const yStartMath = slope * xStartMath + intercept;
                const xEndMath = W - 40;
                const yEndMath = slope * xEndMath + intercept;

                // Matematiksel koordinatları Canvas koordinatlarına dönüştür
                const xStartCanvas = xStartMath + 30;
                const yStartCanvas = (H - 30) - yStartMath;
                const xEndCanvas = xEndMath + 30;
                const yEndCanvas = (H - 30) - yEndMath;

                // 3.0 Hata (Artık / Residual) Çizgilerinin Çizilmesi (Eğer gösterge aktifse)
                if (toggleResiduals && toggleResiduals.checked) {
                    regCtx.strokeStyle = isLight ? 'rgba(220, 38, 38, 0.45)' : 'rgba(239, 68, 68, 0.5)';
                    regCtx.lineWidth = 1.5;
                    regCtx.setLineDash([4, 4]); // Kesikli çizgi

                    points.forEach(p => {
                        const xMath = p.x - 30;
                        const yLineMath = slope * xMath + intercept;
                        const yLineCanvas = (H - 30) - yLineMath;

                        regCtx.beginPath();
                        regCtx.moveTo(p.x, p.y);
                        regCtx.lineTo(p.x, yLineCanvas);
                        regCtx.stroke();
                    });

                    regCtx.setLineDash([]); // Çizgi desenini sıfırla
                }

                // Çizgi gradyanı oluştur
                const lineGradient = regCtx.createLinearGradient(xStartCanvas, 0, xEndCanvas, 0);
                const pColor = isLight ? '#6d28d9' : '#8b5cf6';
                const sColor = isLight ? '#0891b2' : '#06b6d4';
                lineGradient.addColorStop(0, pColor);
                lineGradient.addColorStop(1, sColor);

                // Parlama (Glow) Efekti
                regCtx.shadowColor = pColor;
                regCtx.shadowBlur = 12;
                regCtx.strokeStyle = lineGradient;
                regCtx.lineWidth = 4;
                regCtx.lineCap = 'round';

                regCtx.beginPath();
                regCtx.moveTo(xStartCanvas, yStartCanvas);
                regCtx.lineTo(xEndCanvas, yEndCanvas);
                regCtx.stroke();

                // Parlamayı sıfırla
                regCtx.shadowBlur = 0;
            }

            // 4. Veri Noktalarının Çizilmesi (Glowing Circles)
            points.forEach(p => {
                const pColor = isLight ? '#6d28d9' : '#8b5cf6';
                const sColor = isLight ? '#0891b2' : '#06b6d4';
                
                // Dış gölge dairesi
                regCtx.beginPath();
                regCtx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                regCtx.fillStyle = isLight ? 'rgba(109, 40, 217, 0.2)' : 'rgba(139, 92, 246, 0.25)';
                regCtx.fill();

                // İç katı renk dairesi (radyal gradyanlı)
                regCtx.beginPath();
                regCtx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                regCtx.fillStyle = lineGradientPoints(regCtx, p.x, p.y, pColor, sColor);
                regCtx.fill();

                // Beyaz merkez çekirdek
                regCtx.beginPath();
                regCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                regCtx.fillStyle = '#ffffff';
                regCtx.fill();
            });
        }

        function lineGradientPoints(ctx, x, y, c1, c2) {
            const grad = ctx.createRadialGradient(x, y, 1, x, y, 6);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, c1);
            grad.addColorStop(1, c2);
            return grad;
        }

        // Canvas'ı ilk kez başlat
        setTimeout(resizeRegCanvas, 200);

        // Tema değişiminde renkleri yeniden yükle
        themeToggleBtn.addEventListener('click', () => {
            setTimeout(() => {
                calculateRegression();
                drawRegression();
            }, 100);
        });
    }
});
