document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const docEl = document.documentElement;

    // --- NAVBAR ELEMANLARI & SLIDING PILL ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbarLinks = document.getElementById('navbar-links');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    const navIndicatorPill = document.getElementById('nav-indicator-pill');

    function updateSlidingPill(targetLink, isInitial = false) {
        if (!navIndicatorPill || !targetLink || !navbarLinks) return;
        if (window.innerWidth <= 1024) {
            navIndicatorPill.style.opacity = '0';
            return;
        }

        const li = targetLink.closest('li');
        if (!li) return;

        const left = li.offsetLeft;
        const top = li.offsetTop;
        const width = targetLink.offsetWidth || li.offsetWidth;
        const height = targetLink.offsetHeight || li.offsetHeight;

        if (width === 0 || height === 0) return;

        if (isInitial) {
            navIndicatorPill.style.transition = 'none';
        }

        navIndicatorPill.style.left = `${left}px`;
        navIndicatorPill.style.top = `${top}px`;
        navIndicatorPill.style.width = `${width}px`;
        navIndicatorPill.style.height = `${height}px`;
        navIndicatorPill.style.opacity = '1';

        if (isInitial) {
            navIndicatorPill.offsetHeight; // Reflow
            requestAnimationFrame(() => {
                navIndicatorPill.style.transition = '';
            });
        }
    }

    // --- SITE SHELL ENTEGRASYONU ---
    let currentLang = window.SiteShell ? window.SiteShell.currentLang : (localStorage.getItem('lang') || 'tr');
    let refreshPlayground = null;
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

    // Dil değiştiğinde daktilo, oyun alanı ve kayan hapı güncelle
    window.addEventListener('languageChanged', (e) => {
        currentLang = e.detail.lang;
        resetTypewriter(currentLang);
        if (refreshPlayground) refreshPlayground();
        setTimeout(() => {
            const active = document.querySelector('.nav-links .nav-link.active') || navLinks[0];
            if (active) updateSlidingPill(active);
        }, 80);
    });

    // Tema değiştiğinde canvas renklerini güncelle
    window.addEventListener('themeChanged', () => {
        if (typeof updateCanvasColors === 'function') updateCanvasColors();
    });

    // İlk daktilo başlatma
    resetTypewriter(currentLang);
    // WebGL Fluid Simulation is loaded via fluid-simulation.js

    // --- BENTO HERO TILES INTERACTIVE 3D TILT ---
    const bentoHeroTiles = document.querySelectorAll('.bento-hero-tile');
    if (bentoHeroTiles.length > 0 && window.matchMedia('(hover: hover)').matches) {
        bentoHeroTiles.forEach(tile => {
            let isHovered = false;
            tile.addEventListener('mouseenter', () => { isHovered = true; });
            tile.addEventListener('mouseleave', () => {
                isHovered = false;
                tile.style.transform = '';
            });
            tile.addEventListener('mousemove', (e) => {
                if (!isHovered) return;
                const rect = tile.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const rotX = -(y / (rect.height / 2)) * 3.5;
                const rotY = (x / (rect.width / 2)) * 3.5;
                tile.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
            });
        });
    }

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
    const sections = document.querySelectorAll('header.hero, section.section');

    let lockedTargetId = null;
    let lockTimeout = null;
    let lastClickTime = 0;

    function setActiveNav(targetLink) {
        if (!targetLink) return;
        const currentActive = document.querySelector('.nav-links .nav-link.active');
        if (currentActive === targetLink) {
            updateSlidingPill(targetLink);
            return;
        }
        navLinks.forEach(l => {
            if (!l.getAttribute('href').includes('blog.html')) {
                l.classList.remove('active');
            }
        });
        targetLink.classList.add('active');
        updateSlidingPill(targetLink);
    }

    // Mobil menu, cam efektli .navbar-pill-wrapper icinde duruyordu.
    // backdrop-filter (ve .navbar-full-view'daki transform) o atayi
    // position:fixed ogeler icin konum referansi yapiyor; bu yuzden acilan
    // menu viewport'a degil hapa gore konumlaniyor, width:calc(100% - 32px)
    // 343px yerine ~110px cikiyor ve menu navbar'in icinde dar bir serit
    // olarak beliriyordu -- kullaniciya "acilmiyor" gibi gorunuyordu.
    // Cozum: mobilde <ul>'yi referans olusturmayan .navbar'a tasi.
    const navbarEl = document.getElementById('main-navbar');
    if (navbarLinks && navbarEl) {
        const anaKonum = navbarLinks.parentElement;
        const anaKardes = navbarLinks.nextElementSibling;
        let mobilKonumda = false;

        const yerlestirNavLinks = () => {
            const mobil = window.innerWidth <= 1024;
            if (mobil && !mobilKonumda) {
                navbarEl.appendChild(navbarLinks);
                mobilKonumda = true;
            } else if (!mobil && mobilKonumda) {
                anaKonum.insertBefore(navbarLinks, anaKardes);
                mobilKonumda = false;
            }
        };

        yerlestirNavLinks();
        window.addEventListener('resize', yerlestirNavLinks, { passive: true });
    }

    if (mobileMenuBtn && navbarLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navbarLinks.classList.toggle('active');
        });
    }

    const compactBrand = document.querySelector('.compact-brand');
    if (compactBrand) {
        compactBrand.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            lockedTargetId = 'home';
            lastClickTime = Date.now();
            if (lockTimeout) clearTimeout(lockTimeout);
            lockTimeout = setTimeout(() => {
                lockedTargetId = null;
                updateActiveNavLink();
            }, 1800);

            const homeLink = document.querySelector('.nav-links a[href="#home"]');
            if (homeLink) {
                setActiveNav(homeLink);
            } else {
                navLinks.forEach(l => l.classList.remove('active'));
                if (navIndicatorPill) navIndicatorPill.style.opacity = '0';
            }
            updateCompactSectionLabel('home', currentLang === 'tr' ? 'Ana Sayfa' : 'Home');
            
            const pillWrapper = document.getElementById('navbar-pill-wrapper');
            if (pillWrapper) pillWrapper.classList.remove('is-compact');

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        compactBrand.addEventListener('mouseenter', (e) => {
            e.stopPropagation();
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (mobileMenuBtn && navbarLinks) {
                mobileMenuBtn.classList.remove('active');
                navbarLinks.classList.remove('active');
            }

            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                // 1. Tıklanan sekmeyi anında aktif yap ve hapı tek hamlede doğrudan oraya kaydır
                setActiveNav(this);
                lastClickTime = Date.now();
                lockedTargetId = targetId;

                // Mini adadaki etiketi de anında hedef sekmeye kilitle
                updateCompactSectionLabel(targetId, this.textContent.trim());

                if (targetId === 'home') {
                    const pillWrapper = document.getElementById('navbar-pill-wrapper');
                    if (pillWrapper) pillWrapper.classList.remove('is-compact');
                }

                if (lockTimeout) clearTimeout(lockTimeout);
                lockTimeout = setTimeout(() => {
                    lockedTargetId = null;
                    updateActiveNavLink();
                }, 2200);

                // 2. Hedef bölüme doğru pürüzsüz kaydır
                if (targetId === 'home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (targetSection) {
                    const navbarOffset = 80;
                    const elementPosition = targetSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });

        // Hover animasyonu: Fare sekmelerin üzerine geldiğinde hap oraya kayar
        link.addEventListener('mouseenter', function() {
            updateSlidingPill(this);
        });
    });

    // Kaydırma bittiğinde (scrollend) kilidi güvenle serbest bırak
    if ('onscrollend' in window) {
        window.addEventListener('scrollend', () => {
            if (lockedTargetId) {
                lockedTargetId = null;
                if (lockTimeout) clearTimeout(lockTimeout);
                updateActiveNavLink();
            }
        }, { passive: true });
    }

    // Kullanıcı manuel kaydırma yaparsa (tıklamadan en az 300ms sonra) kilit serbest bırakılır
    window.addEventListener('wheel', () => {
        if (lockedTargetId && Date.now() - lastClickTime > 300) {
            lockedTargetId = null;
            if (lockTimeout) clearTimeout(lockTimeout);
            updateActiveNavLink();
        }
    }, { passive: true });

    window.addEventListener('touchstart', () => {
        if (lockedTargetId && Date.now() - lastClickTime > 300) {
            lockedTargetId = null;
            if (lockTimeout) clearTimeout(lockTimeout);
            updateActiveNavLink();
        }
    }, { passive: true });

    const navbarPill = document.getElementById('navbar-pill-wrapper');
    const compactSectionLabel = document.querySelector('#compact-section-label .compact-text');
    let lastScrollPos = window.scrollY || 0;

    const sectionOrder = ['home', 'about', 'skills', 'projects', 'playground', 'timeline', 'certificates', 'contact'];
    let currentSectionIndex = 0;
    let isTextMorphing = false;

    function updateCompactSectionLabel(newSectionId, newText) {
        if (!compactSectionLabel) return;
        if (compactSectionLabel.textContent.trim() === newText.trim()) return;

        const newIndex = sectionOrder.indexOf(newSectionId);
        const oldIndex = currentSectionIndex;
        
        // Yön tespiti: Aşağı mı iniliyor, yukarı mı çıkılıyor?
        const isGoingDown = newIndex >= oldIndex;
        currentSectionIndex = newIndex >= 0 ? newIndex : 0;

        if (isTextMorphing) {
            compactSectionLabel.textContent = newText;
            return;
        }

        isTextMorphing = true;
        
        // 1. Eski yazıyı gidiş yönüne doğru fırlat ve soldur
        compactSectionLabel.classList.remove('slide-in-from-bottom', 'slide-in-from-top');
        compactSectionLabel.classList.add(isGoingDown ? 'slide-out-up' : 'slide-out-down');

        setTimeout(() => {
            // 2. Yeni yazıyı yükle ve başlangıç konumuna (alttan ya da üstten) yerleştir
            compactSectionLabel.textContent = newText;
            compactSectionLabel.classList.remove('slide-out-up', 'slide-out-down');
            compactSectionLabel.classList.add(isGoingDown ? 'slide-in-from-bottom' : 'slide-in-from-top');
            void compactSectionLabel.offsetWidth; // Reflow

            // 3. Yaylanarak içeri girsin
            compactSectionLabel.classList.remove('slide-in-from-bottom', 'slide-in-from-top');
            
            setTimeout(() => {
                isTextMorphing = false;
            }, 260);
        }, 130);
    }

    function handleDynamicIsland() {
        if (!navbarPill || window.innerWidth <= 1024) return;
        const currentScroll = window.scrollY || window.pageYOffset;

        // Sayfanın en üstünde (Hero / Ana Sayfa bölümü) her zaman tam açık
        if (currentScroll <= 140) {
            if (navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.remove('is-compact');
                const active = document.querySelector('.nav-links .nav-link.active') || navLinks[0];
                if (active) updateSlidingPill(active);
            }
            lastScrollPos = currentScroll;
            return;
        }

        // Aşağı kaydırma -> mini adaya dönüştür
        if (currentScroll > lastScrollPos + 10 && currentScroll > 180) {
            if (!navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.add('is-compact');
            }
        } 
        // Yukarı kaydırma (mouse tekerleğini yukarı çevirince) -> büyük menüye genişlet
        else if (currentScroll < lastScrollPos - 25) {
            if (navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.remove('is-compact');
                const active = document.querySelector('.nav-links .nav-link.active') || navLinks[0];
                if (active) updateSlidingPill(active);
            }
        }

        lastScrollPos = currentScroll;
    }

    if (compactSectionLabel) {
        const expandMenu = (e) => {
            if (navbarPill && navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.remove('is-compact');
                const active = document.querySelector('.nav-links .nav-link.active') || navLinks[0];
                if (active) updateSlidingPill(active, true);
            }
        };
        compactSectionLabel.addEventListener('mouseenter', expandMenu);
        compactSectionLabel.addEventListener('click', expandMenu);
    }

    if (navbarPill) {
        navbarPill.addEventListener('mouseleave', () => {
            const currentScroll = window.scrollY || window.pageYOffset;
            if (currentScroll > 180 && !navbarPill.classList.contains('is-compact')) {
                navbarPill.classList.add('is-compact');
            }
        });
    }

    // Fare menüden ayrıldığında hap o an aktif olan sekmeye geri döner
    if (navbarLinks) {
        navbarLinks.addEventListener('mouseleave', () => {
            const activeLink = document.querySelector('.nav-links .nav-link.active') || navLinks[0];
            if (activeLink) {
                updateSlidingPill(activeLink);
            }
        });
    }

    window.addEventListener('resize', () => {
        const activeLink = document.querySelector('.nav-links .nav-link.active') || navLinks[0];
        if (activeLink) {
            updateSlidingPill(activeLink);
        }
    });

    const sectionNavMap = {
        'home': 'home',
        'about': 'about',
        'skills': 'about',
        'projects': 'projects',
        'playground': 'projects',
        'timeline': 'timeline',
        'certificates': 'timeline',
        'contact': 'contact'
    };

    function updateActiveNavLink() {
        // Tıklama ile kaydırma sürerken kilitli hedefte kal
        if (lockedTargetId) {
            const mappedNavId = sectionNavMap[lockedTargetId] || lockedTargetId;
            const targetLink = document.querySelector(`.nav-links a[href="#${mappedNavId}"]`);
            if (targetLink) {
                setActiveNav(targetLink);
                updateCompactSectionLabel(lockedTargetId, targetLink.textContent.trim());
            }
            return;
        }

        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        // Sayfa tepesinde iken (Hero / Ana Sayfa)
        if (scrollY < 120) {
            const homeLink = document.querySelector('.nav-links a[href="#home"]');
            if (homeLink) {
                setActiveNav(homeLink);
            } else {
                navLinks.forEach(l => l.classList.remove('active'));
                if (navIndicatorPill) navIndicatorPill.style.opacity = '0';
            }
            updateCompactSectionLabel('home', currentLang === 'tr' ? 'Ana Sayfa' : 'Home');
            return;
        }

        // Sayfa en altına inildiyse her zaman İletişim
        if (windowHeight + scrollY >= docHeight - 60) {
            const contactLink = document.querySelector('.nav-links a[href="#contact"]');
            if (contactLink) {
                setActiveNav(contactLink);
                updateCompactSectionLabel('contact', contactLink.textContent.trim());
                return;
            }
        }

        // Odak noktasına (viewport'un üst 1/3'lük kısmına) göre aktif bölümü bul
        const focusPoint = scrollY + 180;
        let currentSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (focusPoint >= sectionTop && focusPoint < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            const mappedNavId = sectionNavMap[currentSectionId];
            if (mappedNavId) {
                const activeLink = document.querySelector(`.nav-links a[href="#${mappedNavId}"]`);
                if (activeLink) {
                    setActiveNav(activeLink);
                    updateCompactSectionLabel(currentSectionId, activeLink.textContent.trim());
                }
            } else if (currentSectionId === 'home') {
                const homeLink = document.querySelector('.nav-links a[href="#home"]');
                if (homeLink) {
                    setActiveNav(homeLink);
                } else {
                    navLinks.forEach(l => l.classList.remove('active'));
                    if (navIndicatorPill) navIndicatorPill.style.opacity = '0';
                }
                updateCompactSectionLabel('home', currentLang === 'tr' ? 'Ana Sayfa' : 'Home');
            }
        }
    }

    const contactForm = document.getElementById('portfolio-contact-form');
    const formFeedback = document.getElementById('form-message');

    const WEB3FORMS_ACCESS_KEY = "27a2282e-8e92-4ee8-9c4c-adf8345398cc";

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // 1. Bot & Spam Protection: Honeypot Check
            const botcheck = contactForm.querySelector('input[name="botcheck"]');
            if (botcheck && botcheck.checked) {
                // Silently simulate success for automated bots without consuming API quota
                contactForm.reset();
                formFeedback.style.display = 'block';
                formFeedback.textContent = translations[currentLang]["form-success"] || "Mesajınız başarıyla gönderildi!";
                formFeedback.className = "form-feedback success";
                return;
            }

            // 2. Client-side Rate Limiting: 60-second cooldown
            const RATE_LIMIT_MS = 60000;
            const lastSubmission = localStorage.getItem('last_contact_submission');
            if (lastSubmission) {
                const timePassed = Date.now() - parseInt(lastSubmission, 10);
                if (timePassed < RATE_LIMIT_MS) {
                    const remainingSec = Math.ceil((RATE_LIMIT_MS - timePassed) / 1000);
                    formFeedback.style.display = 'block';
                    formFeedback.className = "form-feedback error";
                    const rateMsg = translations[currentLang]["form-rate-limit"] || "Spam Koruması: Lütfen yeni bir mesaj göndermeden önce 60 saniye bekleyin.";
                    formFeedback.textContent = `${rateMsg} (${remainingSec}s)`;
                    setTimeout(() => {
                        formFeedback.style.display = 'none';
                    }, 5000);
                    return;
                }
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = translations[currentLang]["form-sending"] || "Gönderiliyor...";
            
            formFeedback.style.display = 'block';
            formFeedback.className = "form-feedback";
            formFeedback.textContent = translations[currentLang]["form-delivering"] || "Mesajınız iletiliyor...";

            if (WEB3FORMS_ACCESS_KEY === "BURAYA_ANAHTARINIZI_YAZIN" || WEB3FORMS_ACCESS_KEY.trim() === "") {
                setTimeout(() => {
                    contactForm.reset();
                    localStorage.setItem('last_contact_submission', Date.now().toString());
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
                    localStorage.setItem('last_contact_submission', Date.now().toString());
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
    const compactScrollPercent = document.getElementById('compact-scroll-percent');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }



    function initNavbarState() {
        if (!navbarPill) return;
        const currentScroll = window.scrollY || window.pageYOffset;
        
        // Sayfanın en üstünde iken asla kompakt ada modunda kalmasın
        if (currentScroll <= 140) {
            navbarPill.classList.remove('is-compact');
        } else {
            navbarPill.classList.add('is-compact');
        }
        
        lastScrollPos = currentScroll;
        updateActiveNavLink();

        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min(100, Math.max(0, Math.round(docHeight > 0 ? (currentScroll / docHeight) * 100 : 0)));
        if (compactScrollPercent) {
            compactScrollPercent.textContent = `${scrollPercent}%`;
        }
        
        // Sayfa geçişlerinden (örn. blog -> anasayfa) sonra hapın konumunu tazele
        setTimeout(() => {
            const active = document.querySelector('.nav-links .nav-link.active') || navLinks[0];
            if (active) {
                setActiveNav(active);
                updateSlidingPill(active);
            }
        }, 80);
    }

    initNavbarState();
    window.addEventListener('load', initNavbarState);
    window.addEventListener('pageshow', initNavbarState);

    // Scroll işi requestAnimationFrame ile kare başına bir kez çalışır;
    // sayfa yüksekliği her karede değil, yalnızca boyut değiştiğinde ölçülür.
    let scrollTicking = false;
    let cachedDocHeight = 0;

    const recalcDocHeight = () => {
        cachedDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    };

    recalcDocHeight();
    window.addEventListener('resize', recalcDocHeight, { passive: true });
    window.addEventListener('load', recalcDocHeight);
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(recalcDocHeight).observe(document.body);
    }

    const onScrollFrame = () => {
        scrollTicking = false;

        handleDynamicIsland();
        updateActiveNavLink();

        const scrollTop = window.scrollY || window.pageYOffset;
        const docHeight = cachedDocHeight;
        const scrollPercent = Math.min(100, Math.max(0, Math.round(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)));
        if (compactScrollPercent) {
            compactScrollPercent.textContent = `${scrollPercent}%`;
        }

        if (scrollTopBtn) {
            if (scrollTop > 500) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        }
    };

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(onScrollFrame);
        }
    }, { passive: true });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

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
        const btnUndo = document.getElementById('btn-undo-playground');
        const btnRandom = document.getElementById('btn-random-playground');

        const elFormula = document.getElementById('reg-formula');
        const elCorr = document.getElementById('reg-corr');
        const elR2 = document.getElementById('reg-r2');
        const elSlope = document.getElementById('reg-slope');
        const elIntercept = document.getElementById('reg-intercept');
        const elN = document.getElementById('reg-n');
        const elSSE = document.getElementById('reg-sse');
        const toggleResiduals = document.getElementById('toggle-residuals');
        const selectModelType = document.getElementById('select-model-type');
        const btnDownloadCsv = document.getElementById('btn-download-csv');
        const elLabelSlope = document.getElementById('label-slope');
        const elLabelIntercept = document.getElementById('label-intercept');
        const formAddPoint = document.getElementById('playground-add-point-form');
        const inputPointX = document.getElementById('point-x-input');
        const inputPointY = document.getElementById('point-y-input');

        let points = []; // Canvas koordinatlarındaki {x, y} dizisi
        let modelType = 'linear';
        let oldWidth = 0;
        let oldHeight = 0;
        let hoveredPointIndex = -1;

        function resizeRegCanvas() {
            const rect = regCanvas.parentElement.getBoundingClientRect();
            const newWidth = Math.max(300, Math.floor(rect.width || 600));
            const newHeight = Math.max(200, Math.floor(rect.height || (newWidth * 10 / 16)));

            if (oldWidth > 0 && oldHeight > 0 && (oldWidth !== newWidth || oldHeight !== newHeight)) {
                points = points.map(p => {
                    const pctX = p.x / oldWidth;
                    const pctY = p.y / oldHeight;
                    return {
                        x: pctX * newWidth,
                        y: pctY * newHeight
                    };
                });
            }

            regCanvas.width = newWidth;
            regCanvas.height = newHeight;
            oldWidth = newWidth;
            oldHeight = newHeight;

            if (inputPointX) inputPointX.placeholder = `0-${Math.floor(newWidth - 40)}`;
            if (inputPointY) inputPointY.placeholder = `0-${Math.floor(newHeight - 40)}`;

            calculateRegression();
            drawRegression();
        }

        window.addEventListener('resize', resizeRegCanvas);

        const canvasContainer = regCanvas.parentElement;

        function addPointFromEvent(e) {
            const rect = regCanvas.getBoundingClientRect();
            const isTouch = (e.type && e.type.startsWith('touch')) || (e.touches && e.touches.length > 0);
            const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left + rect.width / 2);
            const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : rect.top + rect.height / 2);

            const x = clientX - rect.left;
            const y = clientY - rect.top;

            // Nokta Silme Tespiti: Mevcut bir noktanın üzerine tıklandıysa/dokunulduysa sil
            const hitRadius = isTouch ? 20 : 15;
            let hitIndex = -1;
            for (let i = points.length - 1; i >= 0; i--) {
                const dx = points[i].x - x;
                const dy = points[i].y - y;
                if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
                    hitIndex = i;
                    break;
                }
            }

            if (hitIndex !== -1) {
                points.splice(hitIndex, 1);
                hoveredPointIndex = -1;
            } else {
                const clampedX = Math.max(30, Math.min(regCanvas.width - 10, x));
                const clampedY = Math.max(10, Math.min(regCanvas.height - 30, y));
                points.push({ x: clampedX, y: clampedY });
            }

            calculateRegression();
            drawRegression();
        }

        regCanvas.addEventListener('mousedown', (e) => {
            addPointFromEvent(e);
        });

        regCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            addPointFromEvent(e);
        }, { passive: false });

        // Fare ile nokta üzerine gelindiğinde imleci değiştir ve silme göstergesi için tetikle
        regCanvas.addEventListener('mousemove', (e) => {
            const rect = regCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            let foundIndex = -1;
            for (let i = points.length - 1; i >= 0; i--) {
                const dx = points[i].x - mouseX;
                const dy = points[i].y - mouseY;
                if (Math.sqrt(dx * dx + dy * dy) <= 15) {
                    foundIndex = i;
                    break;
                }
            }
            if (foundIndex !== hoveredPointIndex) {
                hoveredPointIndex = foundIndex;
                regCanvas.style.cursor = (hoveredPointIndex !== -1) ? 'pointer' : 'crosshair';
                drawRegression();
            }
        });

        regCanvas.addEventListener('mouseleave', () => {
            if (hoveredPointIndex !== -1) {
                hoveredPointIndex = -1;
                regCanvas.style.cursor = 'crosshair';
                drawRegression();
            }
        });

        if (canvasContainer) {
            canvasContainer.addEventListener('click', (e) => {
                if (e.target !== regCanvas) {
                    addPointFromEvent(e);
                }
            });
        }

        // Manuel / Erişilebilir Nokta Ekleme Fonksiyonu
        function addManualPoint(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            let xVal = inputPointX && inputPointX.value !== '' ? parseFloat(inputPointX.value) : NaN;
            let yVal = inputPointY && inputPointY.value !== '' ? parseFloat(inputPointY.value) : NaN;

            const maxX = Math.max(10, regCanvas.width - 40);
            const maxY = Math.max(10, regCanvas.height - 40);

            // Eğer boş bırakıldıysa rastgele veya orta alandan bir nokta oluştur
            if (isNaN(xVal)) xVal = Math.round(maxX * (0.2 + Math.random() * 0.6));
            if (isNaN(yVal)) yVal = Math.round(maxY * (0.2 + Math.random() * 0.6));

            const clampedX = Math.max(0, Math.min(maxX, xVal));
            const clampedY = Math.max(0, Math.min(maxY, yVal));

            const xCanvas = 30 + clampedX;
            const yCanvas = (regCanvas.height - 30) - clampedY;

            points.push({ x: xCanvas, y: yCanvas });
            calculateRegression();
            drawRegression();

            if (inputPointX) inputPointX.value = '';
            if (inputPointY) inputPointY.value = '';
            if (inputPointX) inputPointX.focus();
        }

        const btnAddPoint = document.getElementById('btn-add-point');
        if (formAddPoint) {
            formAddPoint.addEventListener('submit', addManualPoint);
        }
        if (btnAddPoint) {
            btnAddPoint.addEventListener('click', addManualPoint);
        }

        // Son Noktayı Geri Al (Undo) Butonu
        if (btnUndo) {
            btnUndo.addEventListener('click', () => {
                if (points.length > 0) {
                    points.pop();
                    hoveredPointIndex = -1;
                    calculateRegression();
                    drawRegression();
                }
            });
        }

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                points = [];
                hoveredPointIndex = -1;
                calculateRegression();
                drawRegression();
            });
        }

        if (btnRandom) {
            btnRandom.addEventListener('click', () => {
            points = [];
            const N = Math.floor(Math.random() * 12) + 8; // 8 ila 20 arasında rastgele nokta
            const w = regCanvas.width;
            const h = regCanvas.height;
            const noise = 30; // Hata terimi (gürültü) miktarı

            if (modelType === 'linear') {
                const slope = (Math.random() - 0.5) * 1.2; // Rastgele eğim
                const intercept = (Math.random() * 0.4 + 0.3) * (h - 40); // Rastgele kesişim
                for (let i = 0; i < N; i++) {
                    const x = 50 + (w - 100) * (i / (N - 1));
                    const idealYMath = slope * (x - 30) + intercept;
                    const idealYCanvas = (h - 30) - idealYMath;
                    const noisyY = idealYCanvas + (Math.random() - 0.5) * noise * 2;
                    const finalY = Math.max(15, Math.min(h - 35, noisyY));
                    points.push({ x, y: finalY });
                }
            } else if (modelType === 'polynomial') {
                // Parabol: y = a*x^2 + b*x + c
                const isUp = Math.random() > 0.5;
                const a = (isUp ? 1 : -1) * (Math.random() * 0.0012 + 0.0006); 
                const b = -a * (w - 80); // Tepe noktası merkeze yakın
                const c = isUp ? 30 + Math.random() * 40 : h - 120 - Math.random() * 40;

                for (let i = 0; i < N; i++) {
                    const x = 50 + (w - 100) * (i / (N - 1));
                    const xMath = x - 30;
                    const idealYMath = a * xMath * xMath + b * xMath + c;
                    const idealYCanvas = (h - 30) - idealYMath;
                    const noisyY = idealYCanvas + (Math.random() - 0.5) * noise * 2;
                    const finalY = Math.max(15, Math.min(h - 35, noisyY));
                    points.push({ x, y: finalY });
                }
            } else if (modelType === 'exponential') {
                // Üstel: y = a * e^(b*x)
                const isGrowth = Math.random() > 0.5;
                const a = Math.random() * 25 + 15; // x=0 anındaki başlangıç değeri
                const b = (isGrowth ? 1 : -1) * (Math.random() * 0.005 + 0.004);

                for (let i = 0; i < N; i++) {
                    const x = 50 + (w - 100) * (i / (N - 1));
                    const xMath = x - 30;
                    const idealYMath = a * Math.exp(b * xMath);
                    const idealYCanvas = (h - 30) - idealYMath;
                    const noisyY = idealYCanvas + (Math.random() - 0.5) * noise * 2;
                    const finalY = Math.max(15, Math.min(h - 35, noisyY));
                    points.push({ x, y: finalY });
                }
            }

            calculateRegression();
            drawRegression();
            });
        }

        if (selectModelType) {
            selectModelType.addEventListener('change', (e) => {
                modelType = e.target.value;
                calculateRegression();
                drawRegression();
            });
        }

        if (btnDownloadCsv) {
            btnDownloadCsv.addEventListener('click', () => {
                downloadCSV();
            });
        }

        function downloadCSV() {
            if (points.length === 0) return;
            const H = regCanvas.height;
            let csvRows = [];
            
            if (currentLang === 'tr') {
                // Türkçe Excel uyumluluğu: Noktalı virgül (;) ayırıcı ve virgül (,) ondalık ayracı
                csvRows.push('sep=;');
                csvRows.push('X;Y');
                points.forEach(p => {
                    const xMath = (p.x - 30).toFixed(2).replace('.', ',');
                    const yMath = ((H - 30) - p.y).toFixed(2).replace('.', ',');
                    csvRows.push(`${xMath};${yMath}`);
                });
            } else {
                // İngilizce Excel uyumluluğu: Virgül (,) ayırıcı ve nokta (.) ondalık ayracı
                csvRows.push('sep=,');
                csvRows.push('X,Y');
                points.forEach(p => {
                    const xMath = (p.x - 30).toFixed(2);
                    const yMath = ((H - 30) - p.y).toFixed(2);
                    csvRows.push(`${xMath},${yMath}`);
                });
            }
            
            const csvContent = csvRows.join("\r\n");
            // UTF-8 BOM ekleyerek Excel'in Türkçe karakterleri ve özel yapıları doğru tanımasını sağlıyoruz
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "regression_points.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        if (toggleResiduals) {
            toggleResiduals.addEventListener('change', () => {
                drawRegression();
            });
        }

        function calculateRegression() {
            const N = points.length;
            if (elN) elN.textContent = N;

            // Buton durumlarını güncelle (0 nokta varken pasifleştir)
            if (btnUndo) btnUndo.disabled = (N === 0);
            if (btnClear) btnClear.disabled = (N === 0);
            if (btnDownloadCsv) btnDownloadCsv.disabled = (N === 0);

            const minPoints = (modelType === 'polynomial') ? 3 : 2;

            if (N === 0) {
                if (warningOverlay) warningOverlay.classList.add('active');
                if (elFormula) elFormula.textContent = modelType === 'polynomial' ? 'y = ax² + bx + c' : (modelType === 'exponential' ? 'y = ae^(bx)' : 'y = β₀ + β₁x');
                if (elCorr) elCorr.textContent = '-';
                if (elR2) elR2.textContent = '-';
                if (elSlope) elSlope.textContent = '-';
                if (elIntercept) elIntercept.textContent = '-';
                if (elSSE) elSSE.textContent = '-';
                regCanvas.calculatedModel = null;
                return;
            }

            // En az 1 nokta varsa uyarı katmanını tamamen kaldır
            if (warningOverlay) warningOverlay.classList.remove('active');

            if (N < minPoints) {
                // Reset labels
                if (elLabelSlope && elLabelIntercept) {
                    if (modelType === 'linear') {
                        elLabelSlope.textContent = currentLang === 'tr' ? "Eğim (Slope / m)" : "Slope (m)";
                        elLabelSlope.setAttribute('data-translate', 'playground-stat-slope');
                        elLabelIntercept.textContent = currentLang === 'tr' ? "Kesişim (y-Intercept / c)" : "Intercept (c)";
                        elLabelIntercept.setAttribute('data-translate', 'playground-stat-intercept');
                    } else if (modelType === 'polynomial') {
                        elLabelSlope.textContent = currentLang === 'tr' ? "Katsayı (a)" : "Coefficient (a)";
                        elLabelSlope.removeAttribute('data-translate');
                        elLabelIntercept.textContent = currentLang === 'tr' ? "Sabit Terim (c)" : "Constant (c)";
                        elLabelIntercept.removeAttribute('data-translate');
                    } else if (modelType === 'exponential') {
                        elLabelSlope.textContent = currentLang === 'tr' ? "Büyüme Oranı (b)" : "Growth Rate (b)";
                        elLabelSlope.removeAttribute('data-translate');
                        elLabelIntercept.textContent = currentLang === 'tr' ? "Başlangıç Değeri (a)" : "Initial Value (a)";
                        elLabelIntercept.removeAttribute('data-translate');
                    }
                }

                if (elFormula) {
                    const remaining = minPoints - N;
                    elFormula.innerHTML = `<span style="font-size: 0.95rem; opacity: 0.9;">${currentLang === 'tr' ? `Hesaplama için ${remaining} nokta daha ekleyin (${N}/${minPoints})` : `Add ${remaining} more point(s) (${N}/${minPoints})`}</span>`;
                }
                if (elCorr) elCorr.textContent = '-';
                if (elR2) elR2.textContent = '-';
                if (elSlope) elSlope.textContent = '-';
                if (elIntercept) elIntercept.textContent = '-';
                if (elSSE) elSSE.textContent = '-';
                regCanvas.calculatedModel = null;
                return;
            }

            const H = regCanvas.height;

            // Canvas Y değerini matematiksel Y değerine dönüştür (sol alt köşe 0,0 kabul edilerek)
            const mathPoints = points.map(p => ({
                x: p.x - 30, // Y ekseninden olan uzaklık
                y: (H - 30) - p.y // X ekseninden olan uzaklık
            }));

            let sumY = 0;
            mathPoints.forEach(p => sumY += p.y);
            const meanY = sumY / N;

            let sse = 0;
            let r2 = 0;
            let r = 0;

            if (modelType === 'linear') {
                let sumX = 0;
                mathPoints.forEach(p => { sumX += p.x; });
                const meanX = sumX / N;

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

                // Pearson correlation r
                const denomCorr = Math.sqrt(sumSqX * sumSqY);
                r = denomCorr === 0 ? 0 : sumProd / denomCorr;
                r2 = r * r;

                // SSE
                mathPoints.forEach(p => {
                    const yPred = slope * p.x + intercept;
                    const error = p.y - yPred;
                    sse += error * error;
                });

                // Display
                const sign = intercept >= 0 ? '+' : '-';
                const absIntercept = Math.abs(intercept).toFixed(2);
                elFormula.innerHTML = `y = <span class="text-gradient">${slope.toFixed(2)}x</span> ${sign} <span class="text-gradient-green">${absIntercept}</span>`;
                elCorr.textContent = r.toFixed(4);
                elR2.textContent = r2.toFixed(4);
                elSlope.textContent = slope.toFixed(4);
                elIntercept.textContent = intercept.toFixed(2);
                if (elSSE) elSSE.textContent = sse.toFixed(2);

                if (elLabelSlope && elLabelIntercept) {
                    elLabelSlope.textContent = currentLang === 'tr' ? "Eğim (Slope / m)" : "Slope (m)";
                    elLabelSlope.setAttribute('data-translate', 'playground-stat-slope');
                    elLabelIntercept.textContent = currentLang === 'tr' ? "Kesişim (y-Intercept / c)" : "Intercept (c)";
                    elLabelIntercept.setAttribute('data-translate', 'playground-stat-intercept');
                }

                regCanvas.calculatedModel = { type: 'linear', slope, intercept };

            } else if (modelType === 'polynomial') {
                let Sx = 0, Sx2 = 0, Sx3 = 0, Sx4 = 0;
                let Sy = 0, Sxy = 0, Sx2y = 0;

                mathPoints.forEach(p => {
                    const x = p.x;
                    const y = p.y;
                    const x2 = x * x;
                    Sx += x;
                    Sx2 += x2;
                    Sx3 += x2 * x;
                    Sx4 += x2 * x2;
                    Sy += y;
                    Sxy += x * y;
                    Sx2y += x2 * y;
                });

                // Solve the 3x3 system using Cramer's Rule:
                // [ Sx4  Sx3  Sx2 ] [ a ]   [ Sx2y ]
                // [ Sx3  Sx2  Sx  ] [ b ] = [ Sxy  ]
                // [ Sx2  Sx   N   ] [ c ]   [ Sy   ]
                const detA = Sx4 * (Sx2 * N - Sx * Sx) - Sx3 * (Sx3 * N - Sx2 * Sx) + Sx2 * (Sx3 * Sx - Sx2 * Sx2);
                
                let polyA = 0, polyB = 0, polyC = 0;

                if (Math.abs(detA) > 1e-5) {
                    const detA0 = Sx2y * (Sx2 * N - Sx * Sx) - Sx3 * (Sxy * N - Sy * Sx) + Sx2 * (Sxy * Sx - Sy * Sx2);
                    const detA1 = Sx4 * (Sxy * N - Sy * Sx) - Sx2y * (Sx3 * N - Sx2 * Sx) + Sx2 * (Sx3 * Sy - Sxy * Sx2);
                    const detA2 = Sx4 * (Sx2 * Sy - Sxy * Sx) - Sx3 * (Sx3 * Sy - Sx2 * Sxy) + Sx2y * (Sx3 * Sx - Sx2 * Sx2);

                    polyA = detA0 / detA;
                    polyB = detA1 / detA;
                    polyC = detA2 / detA;
                }

                // SSE & SST
                let sst = 0;
                mathPoints.forEach(p => {
                    const pred = polyA * p.x * p.x + polyB * p.x + polyC;
                    const error = p.y - pred;
                    sse += error * error;
                    const dev = p.y - meanY;
                    sst += dev * dev;
                });

                r2 = sst === 0 ? 0 : Math.max(0, 1 - (sse / sst));
                r = Math.sqrt(r2);

                // Display
                const signB = polyB >= 0 ? '+' : '-';
                const signC = polyC >= 0 ? '+' : '-';
                const absB = Math.abs(polyB).toFixed(2);
                const absC = Math.abs(polyC).toFixed(2);
                elFormula.innerHTML = `y = <span class="text-gradient">${polyA.toFixed(4)}x²</span> ${signB} <span class="text-gradient">${absB}x</span> ${signC} <span class="text-gradient-green">${absC}</span>`;
                
                elCorr.textContent = r.toFixed(4);
                elR2.textContent = r2.toFixed(4);
                elSlope.textContent = polyA.toFixed(6);
                elIntercept.textContent = polyC.toFixed(2);
                if (elSSE) elSSE.textContent = sse.toFixed(2);

                if (elLabelSlope && elLabelIntercept) {
                    elLabelSlope.textContent = currentLang === 'tr' ? "Katsayı (a)" : "Coefficient (a)";
                    elLabelSlope.removeAttribute('data-translate');
                    elLabelIntercept.textContent = currentLang === 'tr' ? "Sabit Terim (c)" : "Constant (c)";
                    elLabelIntercept.removeAttribute('data-translate');
                }

                regCanvas.calculatedModel = { type: 'polynomial', polyA, polyB, polyC };

            } else if (modelType === 'exponential') {
                let sumX = 0, sumZ = 0;
                const mathPointsZ = mathPoints.map(p => {
                    const z = Math.log(Math.max(1, p.y));
                    sumX += p.x;
                    sumZ += z;
                    return { x: p.x, y: p.y, z };
                });
                const meanX = sumX / N;
                const meanZ = sumZ / N;

                let num = 0;
                let den = 0;
                let sumSqX = 0;
                let sumSqZ = 0;
                let sumProd = 0;

                mathPointsZ.forEach(p => {
                    const diffX = p.x - meanX;
                    const diffZ = p.z - meanZ;
                    num += diffX * diffZ;
                    den += diffX * diffX;
                    sumSqX += diffX * diffX;
                    sumSqZ += diffZ * diffZ;
                    sumProd += diffX * diffZ;
                });

                const expB = den === 0 ? 0 : num / den;
                const expA_log = meanZ - expB * meanX;
                const expA = Math.exp(expA_log);

                // SSE & SST
                let sst = 0;
                mathPoints.forEach(p => {
                    const pred = expA * Math.exp(expB * p.x);
                    const error = p.y - pred;
                    sse += error * error;
                    const dev = p.y - meanY;
                    sst += dev * dev;
                });

                r2 = sst === 0 ? 0 : Math.max(0, 1 - (sse / sst));
                r = Math.sqrt(r2);

                // Display
                elFormula.innerHTML = `y = <span class="text-gradient">${expA.toFixed(2)}</span> · e^(<span class="text-gradient-green">${expB.toFixed(4)}x</span>)`;
                elCorr.textContent = r.toFixed(4);
                elR2.textContent = r2.toFixed(4);
                elSlope.textContent = expB.toFixed(4);
                elIntercept.textContent = expA.toFixed(2);
                if (elSSE) elSSE.textContent = sse.toFixed(2);

                if (elLabelSlope && elLabelIntercept) {
                    elLabelSlope.textContent = currentLang === 'tr' ? "Büyüme Oranı (b)" : "Growth Rate (b)";
                    elLabelSlope.removeAttribute('data-translate');
                    elLabelIntercept.textContent = currentLang === 'tr' ? "Başlangıç Değeri (a)" : "Initial Value (a)";
                    elLabelIntercept.removeAttribute('data-translate');
                }

                regCanvas.calculatedModel = { type: 'exponential', expA, expB };
            }
        }

        function drawRegression() {
            const W = regCanvas.width;
            const H = regCanvas.height;

            regCtx.clearRect(0, 0, W, H);

            const isLight = body.classList.contains('light-theme');
            const gridColor = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.03)';
            const axisColor = isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.2)';
            
            // 1. Grafik Izgara Çizimi
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

            // 2. Matematiksel Eksenlerin Çizimi
            regCtx.strokeStyle = axisColor;
            regCtx.lineWidth = 2;
            
            const xAxisY = H - 30;
            regCtx.beginPath();
            regCtx.moveTo(30, xAxisY);
            regCtx.lineTo(W - 10, xAxisY);
            regCtx.stroke();

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

            // Eksen Sayı Etiketleri ve Çentikler (Ticks & Labels)
            regCtx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.35)';
            regCtx.font = '500 10px var(--font-body)';
            
            // Orijin (0,0) Etiketi
            regCtx.textAlign = 'right';
            regCtx.textBaseline = 'top';
            regCtx.fillText('0', yAxisX - 6, xAxisY + 6);
            
            // X Ekseni Sayı Etiketleri ve Çentikleri
            regCtx.textAlign = 'center';
            regCtx.textBaseline = 'top';
            for (let xCanvas = 30 + 60; xCanvas <= W - 30; xCanvas += 60) {
                const xMath = xCanvas - 30;
                // Çentik çizgisi
                regCtx.beginPath();
                regCtx.strokeStyle = axisColor;
                regCtx.lineWidth = 1;
                regCtx.moveTo(xCanvas, xAxisY);
                regCtx.lineTo(xCanvas, xAxisY + 4);
                regCtx.stroke();
                // Sayı etiketi
                regCtx.fillText(xMath.toString(), xCanvas, xAxisY + 6);
            }

            // Y Ekseni Sayı Etiketleri ve Çentikleri
            regCtx.textAlign = 'right';
            regCtx.textBaseline = 'middle';
            for (let yCanvas = H - 30 - 60; yCanvas >= 30; yCanvas -= 60) {
                const yMath = H - 30 - yCanvas;
                // Çentik çizgisi
                regCtx.beginPath();
                regCtx.strokeStyle = axisColor;
                regCtx.lineWidth = 1;
                regCtx.moveTo(yAxisX, yCanvas);
                regCtx.lineTo(yAxisX - 4, yCanvas);
                regCtx.stroke();
                // Sayı etiketi
                regCtx.fillText(yMath.toString(), yAxisX - 6, yCanvas);
            }

            const minPoints = (modelType === 'polynomial') ? 3 : 2;

            // 3. Regresyon Eğrisinin Çizilmesi
            if (points.length >= minPoints && regCanvas.calculatedModel) {
                const model = regCanvas.calculatedModel;

                // 3.0 Hata (Artık / Residual) Çizgilerinin Çizilmesi
                if (toggleResiduals && toggleResiduals.checked) {
                    regCtx.strokeStyle = isLight ? 'rgba(220, 38, 38, 0.45)' : 'rgba(239, 68, 68, 0.5)';
                    regCtx.lineWidth = 1.5;
                    regCtx.setLineDash([4, 4]);

                    points.forEach(p => {
                        const xMath = p.x - 30;
                        let yLineMath;
                        if (model.type === 'linear') {
                            yLineMath = model.slope * xMath + model.intercept;
                        } else if (model.type === 'polynomial') {
                            yLineMath = model.polyA * xMath * xMath + model.polyB * xMath + model.polyC;
                        } else if (model.type === 'exponential') {
                            yLineMath = model.expA * Math.exp(model.expB * xMath);
                        }
                        const yLineCanvas = (H - 30) - yLineMath;

                        regCtx.beginPath();
                        regCtx.moveTo(p.x, p.y);
                        regCtx.lineTo(p.x, yLineCanvas);
                        regCtx.stroke();
                    });

                    regCtx.setLineDash([]);
                }

                // Çizgi gradyanı oluştur
                const pColor = isLight ? '#6d28d9' : '#8b5cf6';
                const sColor = isLight ? '#0891b2' : '#06b6d4';
                const lineGradient = regCtx.createLinearGradient(30, 0, W - 10, 0);
                lineGradient.addColorStop(0, pColor);
                lineGradient.addColorStop(1, sColor);

                // Parlama (Glow) Efekti
                regCtx.shadowColor = pColor;
                regCtx.shadowBlur = 12;
                regCtx.strokeStyle = lineGradient;
                regCtx.lineWidth = 4;
                regCtx.lineCap = 'round';

                // Eğriyi çiz (adımlarla)
                regCtx.beginPath();
                let first = true;
                for (let xCanvas = 30; xCanvas <= W - 10; xCanvas += 2) {
                    const xMath = xCanvas - 30;
                    let yMath;
                    
                    if (model.type === 'linear') {
                        yMath = model.slope * xMath + model.intercept;
                    } else if (model.type === 'polynomial') {
                        yMath = model.polyA * xMath * xMath + model.polyB * xMath + model.polyC;
                    } else if (model.type === 'exponential') {
                        yMath = model.expA * Math.exp(model.expB * xMath);
                    }
                    
                    const yCanvas = (H - 30) - yMath;
                    const finalYCanvas = Math.max(-1000, Math.min(H + 1000, yCanvas));
                    
                    if (first) {
                        regCtx.moveTo(xCanvas, finalYCanvas);
                        first = false;
                    } else {
                        regCtx.lineTo(xCanvas, finalYCanvas);
                    }
                }
                regCtx.stroke();
                regCtx.shadowBlur = 0; // Parlamayı sıfırla
            }

            // 4. Veri Noktalarının Çizilmesi
            points.forEach((p, idx) => {
                const isHovered = (idx === hoveredPointIndex);
                const pColor = isHovered ? '#ef4444' : (isLight ? '#6d28d9' : '#8b5cf6');
                const sColor = isHovered ? '#f87171' : (isLight ? '#0891b2' : '#06b6d4');
                
                // Hover durumunda kırmızı silme uyarısı halkası
                if (isHovered) {
                    regCtx.beginPath();
                    regCtx.arc(p.x, p.y, 11, 0, Math.PI * 2);
                    regCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                    regCtx.lineWidth = 2;
                    regCtx.stroke();
                }

                // Dış gölge
                regCtx.beginPath();
                regCtx.arc(p.x, p.y, isHovered ? 9 : 8, 0, Math.PI * 2);
                regCtx.fillStyle = isHovered ? 'rgba(239, 68, 68, 0.3)' : (isLight ? 'rgba(109, 40, 217, 0.2)' : 'rgba(139, 92, 246, 0.25)');
                regCtx.fill();

                // İç katı renk
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

            // refreshPlayground hook'unu bağla (sayfa ilk kez yüklenirken veya dil değişirken kullanılabilmesi için)
            refreshPlayground = () => {
                calculateRegression();
                drawRegression();
            };
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
        window.addEventListener('themeChanged', () => {
            setTimeout(() => {
                calculateRegression();
                drawRegression();
            }, 100);
        });
    }

    // ==========================================================================
    // DATA SCIENCE & STATISTICS LAB: TAB SWITCHER & CLT ENGINE
    // ==========================================================================
    function initLabTabs() {
        const tabBtns = document.querySelectorAll('.lab-tab-btn');
        const panelOLS = document.getElementById('lab-panel-ols');
        const panelCLT = document.getElementById('lab-panel-clt');

        if (!tabBtns.length || !panelOLS || !panelCLT) return;

        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const target = this.getAttribute('data-tab');
                if (!target) return;

                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');

                if (target === 'ols') {
                    panelCLT.style.display = 'none';
                    panelCLT.classList.remove('active');
                    panelOLS.style.display = 'grid';
                    panelOLS.classList.add('active');
                    if (typeof refreshPlayground === 'function') {
                        refreshPlayground();
                    }
                } else if (target === 'clt') {
                    panelOLS.style.display = 'none';
                    panelOLS.classList.remove('active');
                    panelCLT.style.display = 'grid';
                    panelCLT.classList.add('active');
                    if (window.cltEngine && typeof window.cltEngine.resizeAndRender === 'function') {
                        window.cltEngine.resizeAndRender();
                    }
                }
            });
        });
    }

    function initCLTEngine() {
        const panelCLT = document.getElementById('lab-panel-clt');
        const parentCanvas = document.getElementById('clt-parent-canvas');
        const samplingCanvas = document.getElementById('clt-sampling-canvas');
        if (!parentCanvas || !samplingCanvas) return;

        const parentCtx = parentCanvas.getContext('2d');
        const samplingCtx = samplingCanvas.getContext('2d');

        const selectDist = document.getElementById('select-clt-dist');
        const nButtons = document.querySelectorAll('#clt-n-pills .clt-n-btn');
        const btnStep = document.getElementById('btn-clt-step');
        const btn100 = document.getElementById('btn-clt-100');
        const btn1000 = document.getElementById('btn-clt-1000');
        const btnReset = document.getElementById('btn-clt-reset');

        const warningOverlay = document.getElementById('clt-canvas-warning');
        const distLabel = document.getElementById('clt-active-dist-label');
        const theoryParamsEl = document.getElementById('clt-theory-params');
        const samplesDrawnEl = document.getElementById('clt-samples-drawn');
        const formulaDisplayEl = document.getElementById('clt-formula-display');
        const theoryDescEl = document.getElementById('clt-theory-desc');

        const statK = document.getElementById('clt-stat-k');
        const statMu = document.getElementById('clt-stat-mu');
        const statXbar = document.getElementById('clt-stat-xbar');
        const statSE = document.getElementById('clt-stat-se');
        const statObsSE = document.getElementById('clt-stat-obs-se');
        const statFit = document.getElementById('clt-stat-fit');

        let currentDist = 'dice';
        let currentN = 5;
        let sampleMeans = [];

        // Dağılım Modelleri Tanımları
        const distributions = {
            dice: {
                nameTR: "Zar Dağılımı (Ayrık Düzgün)",
                nameEN: "Dice Distribution (Discrete Uniform)",
                mu: 3.5,
                sigma: Math.sqrt(35 / 12), // ~1.7078
                min: 1,
                max: 6,
                isDiscrete: true,
                draw: () => Math.floor(Math.random() * 6) + 1,
                getPMF: (x) => (x >= 1 && x <= 6 ? 1 / 6 : 0)
            },
            exponential: {
                nameTR: "Üstel Dağılım (Sağa Çarpık λ=0.5)",
                nameEN: "Exponential Distribution (Skewed λ=0.5)",
                lambda: 0.5,
                mu: 2.0, // 1 / lambda
                sigma: 2.0, // 1 / lambda
                min: 0,
                max: 8.0,
                isDiscrete: false,
                draw: () => -Math.log(1 - Math.random()) / 0.5,
                getPDF: (x) => (x >= 0 ? 0.5 * Math.exp(-0.5 * x) : 0)
            },
            binomial: {
                nameTR: "Binom Dağılımı (n=10, p=0.25)",
                nameEN: "Binomial Distribution (n=10, p=0.25)",
                nTrials: 10,
                p: 0.25,
                mu: 2.5, // 10 * 0.25
                sigma: Math.sqrt(10 * 0.25 * 0.75), // sqrt(1.875) ~ 1.3693
                min: 0,
                max: 10,
                isDiscrete: true,
                draw: () => {
                    let successes = 0;
                    for (let i = 0; i < 10; i++) {
                        if (Math.random() < 0.25) successes++;
                    }
                    return successes;
                },
                getPMF: (k) => {
                    if (k < 0 || k > 10) return 0;
                    const comb = (n, r) => {
                        if (r < 0 || r > n) return 0;
                        if (r === 0 || r === n) return 1;
                        let c = 1;
                        for (let i = 1; i <= r; i++) {
                            c = c * (n - (i - 1)) / i;
                        }
                        return c;
                    };
                    return comb(10, k) * Math.pow(0.25, k) * Math.pow(0.75, 10 - k);
                }
            },
            poisson: {
                nameTR: "Poisson Dağılımı (Nadir Olaylar λ=3)",
                nameEN: "Poisson Distribution (Rare Events λ=3)",
                lambda: 3.0,
                mu: 3.0,
                sigma: Math.sqrt(3.0), // ~1.732
                min: 0,
                max: 10,
                isDiscrete: true,
                draw: () => {
                    const L = Math.exp(-3.0);
                    let k = 0;
                    let p = 1.0;
                    do {
                        k++;
                        p *= Math.random();
                    } while (p > L);
                    return k - 1;
                },
                getPMF: (k) => {
                    if (k < 0) return 0;
                    const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
                    return (Math.pow(3.0, k) * Math.exp(-3.0)) / factorial(k);
                }
            }
        };

        function getActiveDist() {
            return distributions[currentDist] || distributions.dice;
        }

        function resizeCanvases() {
            const isCltVisible = panelCLT && panelCLT.classList.contains('active');
            const dpr = window.devicePixelRatio || 1;

            [parentCanvas, samplingCanvas].forEach(c => {
                if (!c) return;
                const rect = c.getBoundingClientRect();
                const w = Math.floor(rect.width || 450);
                const h = Math.floor(rect.height || 225);

                if (w > 0 && h > 0) {
                    c.width = w * dpr;
                    c.height = h * dpr;
                    const ctx = c.getContext('2d');
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.scale(dpr, dpr);
                }
            });

            if (isCltVisible) {
                renderAll();
            }
        }

        function drawOneSample() {
            const dist = getActiveDist();
            let sum = 0;
            for (let i = 0; i < currentN; i++) {
                sum += dist.draw();
            }
            const mean = sum / currentN;
            sampleMeans.push(mean);
        }

        function drawBatch(count) {
            const dist = getActiveDist();
            for (let b = 0; b < count; b++) {
                let sum = 0;
                for (let i = 0; i < currentN; i++) {
                    sum += dist.draw();
                }
                sampleMeans.push(sum / currentN);
            }
            updateStatsAndRender();
        }

        function resetSimulation() {
            sampleMeans = [];
            updateStatsAndRender();
        }

        function updateStatsAndRender() {
            const dist = getActiveDist();
            const K = sampleMeans.length;
            const theorySE = dist.sigma / Math.sqrt(currentN);

            if (distLabel) {
                distLabel.textContent = currentLang === 'tr' ? dist.nameTR : dist.nameEN;
            }
            if (theoryParamsEl) {
                theoryParamsEl.innerHTML = `<span>μ = ${dist.mu.toFixed(2)}</span> · <span>σ = ${dist.sigma.toFixed(2)}</span>`;
            }
            if (samplesDrawnEl) {
                samplesDrawnEl.textContent = K.toLocaleString();
            }

            if (statK) statK.textContent = K.toLocaleString();
            if (statMu) statMu.textContent = dist.mu.toFixed(2);
            if (statSE) statSE.textContent = theorySE.toFixed(3);

            if (K === 0) {
                if (warningOverlay) warningOverlay.classList.add('active');
                if (statXbar) statXbar.textContent = '-';
                if (statObsSE) statObsSE.textContent = '-';
                if (statFit) statFit.textContent = '-';
                if (formulaDisplayEl) formulaDisplayEl.textContent = `X̄ ~ N(${dist.mu.toFixed(1)}, ${(theorySE * theorySE).toFixed(3)})`;
                if (theoryDescEl) {
                    theoryDescEl.textContent = currentLang === 'tr'
                        ? `Örneklem büyüklüğü (n=${currentN}) arttıkça ortalamalar dağılımı Gauss çan eğrisine yakınsar.`
                        : `As sample size (n=${currentN}) increases, the sampling distribution of the mean converges to a Gaussian Bell Curve.`;
                }
            } else {
                if (warningOverlay) warningOverlay.classList.remove('active');

                // Örneklemlerin ortalaması (mu_xbar) ve standart sapması (obs_SE)
                let sumXbar = 0;
                for (let i = 0; i < K; i++) sumXbar += sampleMeans[i];
                const meanXbar = sumXbar / K;

                let sumSqDiff = 0;
                for (let i = 0; i < K; i++) {
                    sumSqDiff += Math.pow(sampleMeans[i] - meanXbar, 2);
                }
                const obsSE = K > 1 ? Math.sqrt(sumSqDiff / (K - 1)) : 0;

                if (statXbar) statXbar.textContent = meanXbar.toFixed(3);
                if (statObsSE) statObsSE.textContent = obsSE.toFixed(3);

                // Normallik Uyum Skoru (Fit Score)
                let fitScore = 80;
                if (K >= 10) {
                    const seRatio = Math.min(obsSE, theorySE) / Math.max(obsSE, theorySE);
                    const meanDiff = Math.abs(meanXbar - dist.mu) / (theorySE || 1);
                    const nFactor = Math.min(1, Math.log10(currentN) / Math.log10(50));
                    const kFactor = Math.min(1, Math.log10(K) / 3);
                    const rawScore = (seRatio * 0.55 + Math.max(0, 1 - meanDiff * 0.3) * 0.45) * 100;
                    fitScore = Math.min(99.8, Math.max(75, (rawScore * 0.7) + (nFactor * 15) + (kFactor * 15)));
                }

                if (statFit) {
                    statFit.textContent = `%${fitScore.toFixed(1)}`;
                }

                if (formulaDisplayEl) {
                    formulaDisplayEl.innerHTML = `X̄ ~ N(μ=${dist.mu.toFixed(2)}, SE=${theorySE.toFixed(3)})`;
                }
                if (theoryDescEl) {
                    theoryDescEl.textContent = currentLang === 'tr'
                        ? `K=${K.toLocaleString()} örneklem çekildi. Ortalama ${meanXbar.toFixed(2)} değeri, popülasyon ortalaması μ=${dist.mu.toFixed(2)} değerine kilitlendi.`
                        : `Drawn K=${K.toLocaleString()} samples. Mean ${meanXbar.toFixed(2)} converges closely to population mean μ=${dist.mu.toFixed(2)}.`;
                }
            }

            renderAll();
        }

        function renderAll() {
            renderParentCanvas();
            renderSamplingCanvas();
        }

        // 1. Üst Grafik (Ana Popülasyon Dağılımı) Çizimi
        function renderParentCanvas() {
            const rect = parentCanvas.getBoundingClientRect();
            const W = rect.width;
            const H = rect.height;
            if (W <= 0 || H <= 0) return;

            parentCtx.clearRect(0, 0, W, H);
            const isLight = document.body.classList.contains('light-theme');
            const dist = getActiveDist();

            const padL = 36;
            const padR = 16;
            const padT = 12;
            const padB = 22;
            const plotW = W - padL - padR;
            const plotH = H - padT - padB;

            // Arka plan ızgarası
            parentCtx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)';
            parentCtx.lineWidth = 1;
            for (let y = padT; y <= H - padB; y += plotH / 2) {
                parentCtx.beginPath();
                parentCtx.moveTo(padL, y);
                parentCtx.lineTo(W - padR, y);
                parentCtx.stroke();
            }

            // Eksenler
            parentCtx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.2)';
            parentCtx.lineWidth = 1.5;
            parentCtx.beginPath();
            parentCtx.moveTo(padL, H - padB);
            parentCtx.lineTo(W - padR, H - padB);
            parentCtx.moveTo(padL, padT);
            parentCtx.lineTo(padL, H - padB);
            parentCtx.stroke();

            // Dağılımın Çizilmesi
            if (dist.isDiscrete) {
                // Ayrık Çubuklar
                const count = (dist.max - dist.min) + 1;
                const barWidth = Math.max(6, Math.min(28, (plotW / count) * 0.55));
                let maxProb = 0;
                for (let k = dist.min; k <= dist.max; k++) {
                    const p = dist.getPMF(k);
                    if (p > maxProb) maxProb = p;
                }
                maxProb = Math.max(maxProb, 0.01) * 1.15;

                for (let k = dist.min; k <= dist.max; k++) {
                    const p = dist.getPMF(k);
                    const cx = padL + ((k - dist.min + 0.5) / count) * plotW;
                    const barH = (p / maxProb) * plotH;
                    const topY = (H - padB) - barH;

                    // Bar gradient
                    const grad = parentCtx.createLinearGradient(0, topY, 0, H - padB);
                    grad.addColorStop(0, '#8b5cf6');
                    grad.addColorStop(1, 'rgba(139, 92, 246, 0.2)');
                    parentCtx.fillStyle = grad;
                    parentCtx.fillRect(cx - barWidth / 2, topY, barWidth, barH);

                    // Bar border
                    parentCtx.strokeStyle = '#a78bfa';
                    parentCtx.lineWidth = 1;
                    parentCtx.strokeRect(cx - barWidth / 2, topY, barWidth, barH);

                    // X Ekseni Etiketi
                    parentCtx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.5)';
                    parentCtx.font = '500 10px var(--font-body)';
                    parentCtx.textAlign = 'center';
                    parentCtx.fillText(k.toString(), cx, H - padB + 14);
                }
            } else {
                // Sürekli Eğri (Üstel)
                const maxPDF = dist.getPDF(0) * 1.05;
                parentCtx.beginPath();
                const steps = 60;
                for (let i = 0; i <= steps; i++) {
                    const xVal = dist.min + (i / steps) * (dist.max - dist.min);
                    const pdfVal = dist.getPDF(xVal);
                    const px = padL + (i / steps) * plotW;
                    const py = (H - padB) - (pdfVal / maxPDF) * plotH;
                    if (i === 0) parentCtx.moveTo(px, py);
                    else parentCtx.lineTo(px, py);
                }
                parentCtx.lineTo(padL + plotW, H - padB);
                parentCtx.lineTo(padL, H - padB);
                parentCtx.closePath();

                const grad = parentCtx.createLinearGradient(0, padT, 0, H - padB);
                grad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
                grad.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
                parentCtx.fillStyle = grad;
                parentCtx.fill();

                // Çizgi
                parentCtx.beginPath();
                for (let i = 0; i <= steps; i++) {
                    const xVal = dist.min + (i / steps) * (dist.max - dist.min);
                    const pdfVal = dist.getPDF(xVal);
                    const px = padL + (i / steps) * plotW;
                    const py = (H - padB) - (pdfVal / maxPDF) * plotH;
                    if (i === 0) parentCtx.moveTo(px, py);
                    else parentCtx.lineTo(px, py);
                }
                parentCtx.strokeStyle = '#8b5cf6';
                parentCtx.lineWidth = 2;
                parentCtx.stroke();

                // X Ekseni Etiketleri
                parentCtx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.5)';
                parentCtx.font = '500 10px var(--font-body)';
                parentCtx.textAlign = 'center';
                parentCtx.fillText('0', padL, H - padB + 14);
                parentCtx.fillText('4', padL + plotW * 0.5, H - padB + 14);
                parentCtx.fillText('8+', padL + plotW, H - padB + 14);
            }

            // Ortalama Çizgisi (mu)
            const muX = padL + ((dist.mu - dist.min) / (dist.max - dist.min)) * plotW;
            parentCtx.strokeStyle = '#06b6d4';
            parentCtx.setLineDash([3, 3]);
            parentCtx.lineWidth = 1.5;
            parentCtx.beginPath();
            parentCtx.moveTo(muX, padT);
            parentCtx.lineTo(muX, H - padB);
            parentCtx.stroke();
            parentCtx.setLineDash([]);

            parentCtx.fillStyle = '#06b6d4';
            parentCtx.font = '600 10px var(--font-mono, monospace)';
            parentCtx.textAlign = 'center';
            parentCtx.fillText(`μ=${dist.mu.toFixed(1)}`, muX, padT + 8);
        }

        // 2. Alt Grafik (Örneklem Ortalamaları Histogramı + Gauss Çan Eğrisi) Çizimi
        function renderSamplingCanvas() {
            const rect = samplingCanvas.getBoundingClientRect();
            const W = rect.width;
            const H = rect.height;
            if (W <= 0 || H <= 0) return;

            samplingCtx.clearRect(0, 0, W, H);
            const isLight = document.body.classList.contains('light-theme');
            const dist = getActiveDist();
            const K = sampleMeans.length;

            const padL = 36;
            const padR = 16;
            const padT = 16;
            const padB = 24;
            const plotW = W - padL - padR;
            const plotH = H - padT - padB;

            // Arka plan ızgarası
            samplingCtx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)';
            samplingCtx.lineWidth = 1;
            for (let y = padT; y <= H - padB; y += plotH / 3) {
                samplingCtx.beginPath();
                samplingCtx.moveTo(padL, y);
                samplingCtx.lineTo(W - padR, y);
                samplingCtx.stroke();
            }

            // Eksenler
            samplingCtx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.2)';
            samplingCtx.lineWidth = 1.5;
            samplingCtx.beginPath();
            samplingCtx.moveTo(padL, H - padB);
            samplingCtx.lineTo(W - padR, H - padB);
            samplingCtx.moveTo(padL, padT);
            samplingCtx.lineTo(padL, H - padB);
            samplingCtx.stroke();

            // X Ekseni Aralıkları (Popülasyon sınırları)
            const minX = dist.min;
            const maxX = dist.max;

            // X Ekseni Sayı Etiketleri
            samplingCtx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.45)';
            samplingCtx.font = '500 10px var(--font-body)';
            samplingCtx.textAlign = 'center';
            const tickCount = 5;
            for (let t = 0; t <= tickCount; t++) {
                const val = minX + (t / tickCount) * (maxX - minX);
                const tx = padL + (t / tickCount) * plotW;
                samplingCtx.fillText(val.toFixed(1), tx, H - padB + 14);
            }

            if (K === 0) return;

            // Histogram Bins Oluşturma (28-36 bins)
            const numBins = 32;
            const binWidthVal = (maxX - minX) / numBins;
            const bins = new Array(numBins).fill(0);

            for (let i = 0; i < K; i++) {
                const val = sampleMeans[i];
                let bIdx = Math.floor((val - minX) / binWidthVal);
                if (bIdx < 0) bIdx = 0;
                if (bIdx >= numBins) bIdx = numBins - 1;
                bins[bIdx]++;
            }

            const maxBinCount = Math.max(...bins, 1);

            // Histogram Çubuklarının Çizimi
            const barW = (plotW / numBins);
            for (let b = 0; b < numBins; b++) {
                const count = bins[b];
                if (count === 0) continue;

                const barH = (count / maxBinCount) * plotH * 0.85;
                const bx = padL + b * barW;
                const by = (H - padB) - barH;

                const grad = samplingCtx.createLinearGradient(0, by, 0, H - padB);
                grad.addColorStop(0, '#06b6d4');
                grad.addColorStop(1, 'rgba(6, 182, 212, 0.25)');
                samplingCtx.fillStyle = grad;
                samplingCtx.fillRect(bx + 0.5, by, barW - 1, barH);

                samplingCtx.strokeStyle = 'rgba(103, 232, 249, 0.5)';
                samplingCtx.lineWidth = 0.8;
                samplingCtx.strokeRect(bx + 0.5, by, barW - 1, barH);
            }

            // Gauss Çan Eğrisi (Normal Dağılım Teorik Eğrisi) Çizimi
            const theorySE = dist.sigma / Math.sqrt(currentN);
            const gaussianPDF = (x) => {
                const z = (x - dist.mu) / theorySE;
                return (1 / (theorySE * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
            };

            const peakPDF = gaussianPDF(dist.mu);
            const scaleFactor = plotH * 0.85;

            samplingCtx.beginPath();
            const curveSteps = 100;
            for (let i = 0; i <= curveSteps; i++) {
                const xVal = minX + (i / curveSteps) * (maxX - minX);
                const gVal = gaussianPDF(xVal);
                const cx = padL + (i / curveSteps) * plotW;
                const cy = (H - padB) - (gVal / peakPDF) * scaleFactor;
                if (i === 0) samplingCtx.moveTo(cx, cy);
                else samplingCtx.lineTo(cx, cy);
            }

            samplingCtx.strokeStyle = '#ec4899';
            samplingCtx.lineWidth = 2.5;
            samplingCtx.shadowColor = 'rgba(236, 72, 153, 0.6)';
            samplingCtx.shadowBlur = 8;
            samplingCtx.stroke();
            samplingCtx.shadowBlur = 0; // Parlamayı sıfırla

            // Canlı Örneklem Ortalaması Dikey Çizgisi
            let sumXbar = 0;
            for (let i = 0; i < K; i++) sumXbar += sampleMeans[i];
            const liveMean = sumXbar / K;
            const liveMeanX = padL + ((liveMean - minX) / (maxX - minX)) * plotW;

            samplingCtx.strokeStyle = '#10b981';
            samplingCtx.lineWidth = 2;
            samplingCtx.beginPath();
            samplingCtx.moveTo(liveMeanX, padT);
            samplingCtx.lineTo(liveMeanX, H - padB);
            samplingCtx.stroke();

            samplingCtx.fillStyle = '#10b981';
            samplingCtx.font = '600 10px var(--font-mono, monospace)';
            samplingCtx.textAlign = 'center';
            samplingCtx.fillText(`X̄=${liveMean.toFixed(2)}`, liveMeanX, padT + 10);
        }

        // Olay Dinleyicileri
        if (selectDist) {
            selectDist.addEventListener('change', (e) => {
                currentDist = e.target.value;
                resetSimulation();
            });
        }

        nButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                nButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentN = parseInt(this.getAttribute('data-n'), 10) || 5;
                resetSimulation();
            });
        });

        if (btnStep) {
            btnStep.addEventListener('click', () => {
                drawOneSample();
                updateStatsAndRender();
            });
        }

        if (btn100) {
            btn100.addEventListener('click', () => {
                drawBatch(100);
            });
        }

        if (btn1000) {
            btn1000.addEventListener('click', () => {
                drawBatch(1000);
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                resetSimulation();
            });
        }

        window.addEventListener('resize', () => {
            resizeCanvases();
        });

        window.addEventListener('themeChanged', () => {
            setTimeout(renderAll, 120);
        });

        // Global referans
        window.cltEngine = {
            resizeAndRender: () => {
                setTimeout(() => {
                    resizeCanvases();
                    updateStatsAndRender();
                }, 40);
            },
            reset: resetSimulation
        };

        // İlk başlatma
        setTimeout(resizeCanvases, 250);
        updateStatsAndRender();
    }

    initLabTabs();
    initCLTEngine();


    // --- ULTRA-SNAPPY NATIVE PAGE TRANSITIONS ---
    function initPageTransitions() {
        const contentWrapper = document.getElementById('page-content-wrapper') || document.body;

        // Nano toploader element
        let nanoBar = document.getElementById('nano-progress-bar');
        if (!nanoBar) {
            nanoBar = document.createElement('div');
            nanoBar.id = 'nano-progress-bar';
            nanoBar.className = 'nano-progress-bar';
            document.body.prepend(nanoBar);
        }

        // Sayfa ilk yüklendiğinde nano toploader'ı hızlıca tamamla ve kapat
        nanoBar.classList.add('finish');
        setTimeout(() => {
            nanoBar.classList.remove('loading', 'finish');
            nanoBar.style.width = '0%';
        }, 220);

        // Sayfa adını alma yardımcısı
        function getPageName(urlStr) {
            try {
                const url = new URL(urlStr, window.location.origin);
                let path = url.pathname;
                let page = path.substring(path.lastIndexOf('/') + 1);
                if (page === '' || page === '/') {
                    page = 'index.html';
                }
                return page;
            } catch (e) {
                return '';
            }
        }

        // HOVER & FOCUS PREFETCH SİSTEMİ (Anında tarayıcı önbelleğine alır)
        const prefetchedLinks = new Set();
        function prefetchUrl(urlStr) {
            if (!urlStr || prefetchedLinks.has(urlStr)) return;
            try {
                const url = new URL(urlStr, window.location.origin);
                if (url.origin !== window.location.origin) return;
                prefetchedLinks.add(urlStr);

                const linkElem = document.createElement('link');
                linkElem.rel = 'prefetch';
                linkElem.href = urlStr;
                document.head.appendChild(linkElem);
            } catch (err) {}
        }

        document.addEventListener('mouseover', (e) => {
            const a = e.target.closest('a');
            if (a && a.href && !a.href.startsWith('javascript:') && !a.hash) {
                prefetchUrl(a.href);
            }
        }, { passive: true });

        document.addEventListener('focusin', (e) => {
            const a = e.target.closest('a');
            if (a && a.href && !a.href.startsWith('javascript:') && !a.hash) {
                prefetchUrl(a.href);
            }
        }, { passive: true });

        // Tıklama yakalayıcı (Delegated Click Listener)
        document.addEventListener('click', (e) => {
            if (e.defaultPrevented) return;
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // İndirme veya blob
            if (link.hasAttribute('download') || href.startsWith('blob:')) return;

            // Dış bağlantı veya yeni sekme
            if (link.target === '_blank') return;
            if (href.startsWith('http://') || href.startsWith('https://')) {
                try {
                    const url = new URL(href);
                    if (url.origin !== window.location.origin) return;
                } catch (err) {
                    return;
                }
            }

            // Özel şemalar
            if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            // Aynı sayfa içi çapa kontrolü
            const currentPg = getPageName(window.location.href);
            const targetPg = getPageName(link.href);
            const hasHash = link.hash || href.includes('#');

            if (currentPg === targetPg && hasHash) {
                return;
            }

            // Farklı bir sayfaya tıklandı (Ana Sayfa ↔ Blog)
            e.preventDefault();

            // 1. Navbar Active Indicator'ı hedef sekmeye anında kaydır
            if (typeof updateSlidingPill === 'function') {
                const targetNavLink = document.querySelector(`.nav-links a[href*="${targetPg}"]`) || link;
                if (targetNavLink) {
                    document.querySelectorAll('.nav-links .nav-link').forEach(l => l.classList.remove('active'));
                    targetNavLink.classList.add('active');
                    updateSlidingPill(targetNavLink);
                }
            }

            // 2. Nano Toploader Laser Bar'ı başlat
            nanoBar.classList.remove('finish');
            nanoBar.classList.add('loading');

            // 3. İçeriği çok hızlı (80ms) yumuşakça soldur
            contentWrapper.classList.add('page-nav-exit');

            // 4. Anında yeni sayfaya geç (80ms)
            setTimeout(() => {
                window.location.href = link.href;
            }, 80);
        });

        // Tarayıcı geri/ileri buton önbelleği (bfcache) kurtarıcı
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                contentWrapper.classList.remove('page-nav-exit');
                if (nanoBar) {
                    nanoBar.classList.remove('loading');
                    nanoBar.classList.add('finish');
                    setTimeout(() => {
                        nanoBar.classList.remove('finish');
                        nanoBar.style.width = '0%';
                    }, 200);
                }
            }
        });
    }

    initPageTransitions();
});
