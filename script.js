/* ==========================================================================
   Kişisel Portfolyo Web Sitesi - Modern ve İnteraktif JavaScript Arayüzü
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. Koyu / Aydınlık Tema Kontrolü (Theme Toggle)
    // ==========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Sistem veya LocalStorage Tercihini Yükle
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light') {
        body.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
        body.classList.remove('light-theme');
    } else if (!prefersDark) {
        // Eğer kayıtlı veri yoksa ve kullanıcının işletim sistemi aydınlık tema istiyorsa
        body.classList.add('light-theme');
    }

    // Tema Değiştirme Tetikleyicisi
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        // Canvas renk sistemini güncelle
        updateCanvasColors();
    });


    // ==========================================================================
    // 2. İnteraktif Yapay Sinir Ağı Animasyonu (HTML5 Canvas Neural Network)
    // ==========================================================================
    const canvas = document.getElementById('neural-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animationFrameId;
    let mouse = { x: null, y: null, radius: 150 };

    // Temaya göre değişen renk paletleri
    let particleColor = 'rgba(139, 92, 246, 0.4)';  /* Mor */
    let connectorColor = 'rgba(6, 182, 212, 0.08)'; /* Siber Mavi */
    let mouseLineColor = 'rgba(139, 92, 246, 0.15)';

    function updateCanvasColors() {
        const isLight = body.classList.contains('light-theme');
        if (isLight) {
            particleColor = 'rgba(109, 40, 217, 0.35)';   /* Koyu Mor */
            connectorColor = 'rgba(8, 145, 178, 0.06)';   /* Koyu Siber Mavi */
            mouseLineColor = 'rgba(109, 40, 217, 0.12)';
        } else {
            particleColor = 'rgba(139, 92, 246, 0.4)';    /* Elektrik Moru */
            connectorColor = 'rgba(6, 182, 212, 0.08)';   /* Siber Mavi */
            mouseLineColor = 'rgba(139, 92, 246, 0.15)';
        }
    }
    updateCanvasColors(); // İlk yüklemede renkleri tanımla

    // Canvas Boyutlandırma
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    // Parçacık Sınıfı
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 0.8; // Yavaş, akıcı hareket
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
            // Sınır Kontrolleri
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

            // Hareket Ettir
            this.x += this.vx;
            this.y += this.vy;

            // Fareye göre hafif tepki (İtme/Çekme etkileşimi)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    // Fare yönüne doğru hafif itme
                    this.x += (dx / distance) * force * 1.2;
                    this.y += (dy / distance) * force * 1.2;
                }
            }

            this.draw();
        }
    }

    // Parçacıkları Oluşturma
    function initParticles() {
        particles = [];
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 11000); // Ekran boyutuna göre orantılı sayı
        const limitedParticles = Math.min(numberOfParticles, 120); // Performans için max limit
        
        for (let i = 0; i < limitedParticles; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            particles.push(new Particle(x, y));
        }
    }

    // Parçacıklar Arası Yapay Sinir Ağı Bağlantıları
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Eğer parçacıklar yakınsa çizgi çek
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

            // Fare ve Parçacık Bağlantısı
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

    // Animasyon Döngüsü
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => particle.update());
        connectParticles();
        
        animationFrameId = requestAnimationFrame(animate);
    }

    // Fare Etkinlikleri
    window.addEventListener('mousemove', (e) => {
        // Hero bölümünün dışına çıkıldığında fare etkileşimini kesmek için koordinatları al
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

    // Başlatıcılar
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();


    // ==========================================================================
    // 3. Dinamik Yazı Efekti (Typewriter Effect)
    // ==========================================================================
    const typedTextSpan = document.getElementById('typed-text');
    const textArray = [
        "Veri Bilimi Meraklısı",
        "Makine Öğrenmesi Geliştiricisi",
        "Derin Öğrenme Araştırmacısı",
        "Yazılım Mühendisi"
    ];
    const typingSpeed = 70;
    const erasingSpeed = 40;
    const newTextDelay = 2000; // Kelimeler arası bekleme süresi
    let textArrayIndex = 0;
    let charIndex = 0;

    function type() {
        if (charIndex < textArray[textArrayIndex].length) {
            typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingSpeed);
        } else {
            setTimeout(erase, newTextDelay);
        }
    }

    function erase() {
        if (charIndex > 0) {
            typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, erasingSpeed);
        } else {
            textArrayIndex++;
            if (textArrayIndex >= textArray.length) textArrayIndex = 0;
            setTimeout(type, typingSpeed + 300);
        }
    }

    // Yazı animasyonunu başlat
    if (textArray.length) setTimeout(type, newTextDelay - 1000);


    // ==========================================================================
    // 4. Sayıcı İstatistik Animasyonları (Scroll-Spy)
    // ==========================================================================
    
    // İstatistik Sayı Değerleri
    const projectCountEl = document.getElementById('stat-projects');
    const hoursCountEl = document.getElementById('stat-hours');
    
    const targetProjects = 18;  // Tamamlanan Projeler
    const targetHours = 1200;   // Model eğitim & geliştirme saatleri
    let statsAnimated = false;

    // Sayı Sayma Efekti Fonksiyonu
    function animateCount(element, target, duration, suffix = "") {
        let start = 0;
        const stepTime = Math.abs(Math.floor(duration / target));
        
        // Eğer sayı çok büyükse adım aralığını optimize et
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

    // IntersectionObserver yardımıyla ekrana girildiğinde tetikleme
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Yetenek tetikleyici kaldırılmıştır (progress bar yerine badges kullanılmaktadır)
                
                // İstatistikleri Tetikle
                if (entry.target.id === 'about' && !statsAnimated) {
                    statsAnimated = true;
                    if (projectCountEl) animateCount(projectCountEl, targetProjects, 1500, "+");
                    if (hoursCountEl) animateCount(hoursCountEl, targetHours, 1800, " Saat+");
                }

                // Elementin CSS sınıfı olan reveal'ı tetikle
                if (entry.target.classList.contains('reveal')) {
                    entry.target.classList.add('active');
                }
            }
        });
    }, observerOptions);

    // Gözlemcileri Kaydet
    document.querySelectorAll('.reveal').forEach(el => scrollObserver.observe(el));
    const skillsSection = document.getElementById('skills');
    const aboutSection = document.getElementById('about');
    
    if (skillsSection) scrollObserver.observe(skillsSection);
    if (aboutSection) scrollObserver.observe(aboutSection);


    // ==========================================================================
    // 5. Proje Filtreleme Sistemi (Project Portfolio Grid Filter)
    // ==========================================================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Buton aktifliğini değiştir
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    card.classList.remove('hide');
                    // Yeniden açılırken tatlı bir scale-up efekti için timeout
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    // Animasyon bitiminde alanı gizle
                    setTimeout(() => {
                        card.classList.add('hide');
                    }, 300);
                }
            });
        });
    });


    // ==========================================================================
    // 6. Mobil Menü Hamburger Etkileşimi
    // ==========================================================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbarLinks = document.getElementById('navbar-links');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navbarLinks.classList.toggle('active');
    });

    // Menü linklerine tıklandığında menüyü kapat
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navbarLinks.classList.remove('active');
        });
    });


    // ==========================================================================
    // 7. İletişim Formu Kontrolü (Web3Forms Canlı Entegrasyonu)
    // ==========================================================================
    const contactForm = document.getElementById('portfolio-contact-form');
    const formFeedback = document.getElementById('form-message');

    // 💡 İletişim formunun gerçek e-postanıza düşmesi için:
    // 1. https://web3forms.com adresine gidin ve e-postanızı yazarak ücretsiz bir Access Key (Anahtar) alın.
    // 2. Aldığınız anahtarı aşağıdaki tırnak işaretlerinin arasına yapıştırın:
    const WEB3FORMS_ACCESS_KEY = "27a2282e-8e92-4ee8-9c4c-adf8345398cc";

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Gönderiliyor Durumu
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Gönderiliyor...';
            
            formFeedback.style.display = 'block';
            formFeedback.className = "form-feedback";
            formFeedback.textContent = "Mesajınız iletiliyor...";

            // Eğer anahtar henüz girilmemişse simülasyon modunda çalıştır
            if (WEB3FORMS_ACCESS_KEY === "BURAYA_ANAHTARINIZI_YAZIN" || WEB3FORMS_ACCESS_KEY.trim() === "") {
                setTimeout(() => {
                    contactForm.reset();
                    formFeedback.textContent = "Mesajınız başarıyla gönderildi (Simülasyon Modu)! Gerçek e-posta almak için script.js dosyasındaki WEB3FORMS_ACCESS_KEY değerini güncelleyin.";
                    formFeedback.className = "form-feedback success";
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;

                    setTimeout(() => {
                        formFeedback.style.display = 'none';
                    }, 6000);
                }, 1200);
                return;
            }

            // Gerçek API Gönderimi
            const formData = new FormData(contactForm);
            formData.append("access_key", WEB3FORMS_ACCESS_KEY);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            })
            .then(async (response) => {
                const result = await response.json();
                if (response.status === 200) {
                    // Formu sıfırla ve başarı mesajı göster
                    contactForm.reset();
                    formFeedback.textContent = "Mesajınız başarıyla gönderildi! Orçun en kısa sürede sizinle iletişime geçecektir.";
                    formFeedback.className = "form-feedback success";
                } else {
                    // API hatası
                    formFeedback.textContent = "Bir hata oluştu: " + (result.message || "Mesaj iletilemedi.");
                    formFeedback.className = "form-feedback error";
                }
            })
            .catch(error => {
                // Bağlantı hatası
                formFeedback.textContent = "Bağlantı hatası! Lütfen internetinizi kontrol edip tekrar deneyin.";
                formFeedback.className = "form-feedback error";
                console.error("Form error:", error);
            })
            .finally(() => {
                // Butonu eski haline getir
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;

                // 6 saniye sonra bildirimi gizle
                setTimeout(() => {
                    formFeedback.style.display = 'none';
                }, 6000);
            });
        });
    }


    // ==========================================================================
    // 8. Sayfa Sonu ve Yukarı Çık Butonu Kontrolleri (Scroll Events)
    // ==========================================================================
    const scrollTopBtn = document.getElementById('scroll-to-top');
    const navbar = document.getElementById('main-navbar');
    const currentYearSpan = document.getElementById('current-year');
    const scrollBar = document.getElementById('scroll-bar');

    // Alt Bilgi Yıl Bilgisi
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    window.addEventListener('scroll', () => {
        // İlerleme Çubuğunu Doldur (%0 - %100)
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (scrollBar) {
            scrollBar.style.width = scrollPercent + '%';
        }

        // Yukarı Çık Butonunu Göster/Gizle
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }

        // Navbar Küçülme / Arka Plan Sabitleme
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

    // ==========================================================================
    // 9. Bento Grid Kartları Fare İzleme Efekti (Bento Card Mouse Tracker)
    // ==========================================================================
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
