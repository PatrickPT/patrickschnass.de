---
title: "Patrick Schnaß"
description: "Strategische KI-Beratung. Aufgebaut auf Skalierbarkeit, angetrieben durch Wirkung."
layout: "profile"
showAuthor: false
---

<section id="contact" class="snap-section">

```python
"""
Stop Experimenting
Start Transforming
"""

if current_status == experiment:
    stop()  # Break the loop

import scale
from advisory import Impact

def execute_strategy():
    # Build on Scale. Drive by Impact.
    engine = scale.build_robust()
    return Impact.drive(engine)
```
## Lassen Sie uns an Ihrer KI-Strategie arbeiten.

<!-- Google Calendar Appointment Scheduling -->
<link href="https://calendar.google.com/calendar/scheduling-button-script.css" rel="stylesheet">
<script src="https://calendar.google.com/calendar/scheduling-button-script.js" async></script>
<script>
(function() {
  var target = document.currentScript;
  window.addEventListener('load', function() {
    calendar.schedulingButton.load({
      url: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1LuEwDn8POT8P603ixQSg5XmHAFvXPy4lvjPSZ1mwUSfg-E7cnqU8Mv5m7IaAQT6YS42O7Fq9U?gv=true',
      color: '#039BE5',
      label: 'Termin buchen',
      target,
    });
  });
})();
</script>

</section>

<section id="services" class="snap-section">
<div class="services-carousel">

<div class="carousel-tabs">
    <button class="carousel-tab is-active" data-index="0">Reality Check</button>
    <button class="carousel-tab" data-index="1">Data Org</button>
    <button class="carousel-tab" data-index="2">AI Sparring</button>
</div>

<div class="carousel-panels">

<div class="carousel-panel is-active" data-index="0">

```python
"""
Validierung Ihrer KI-Roadmap 
"""

def reality_check(roadmap):
    # Schluss mit dem Hype
    feasibility = assess(roadmap)
    roi = calculate_viability()
    
    if feasibility.is_real:
        return optimize(roadmap)
    else:
        return pivot_strategy()
```

</div>

<div class="carousel-panel" data-index="1">

```python
"""
Hochleistungs-Data-Team aufbauen
"""

class DataTeam:
    def __init__(self):
        self.roles = define_roles()
        self.structure = set_reporting()
    
    def build(self):
        # High-performance team
        hire(self.framework)
        return Team.that_sticks()
```

</div>

<div class="carousel-panel" data-index="2">

```python
"""
AI Use Cases identifizieren.
"""

def sparring_session(executive):
    # Vertrauliches 1:1
    signal = filter_noise(market)
    cases = find_high_impact(
        business=executive.model
    )
    return strategic_clarity()
```

</div>

</div>

<div class="carousel-progress">
    <span class="progress-dot is-active" data-index="0"></span>
    <span class="progress-dot" data-index="1"></span>
    <span class="progress-dot" data-index="2"></span>
</div>

</div>

<script>
(function() {
    const carousel = document.querySelector('.services-carousel');
    if (!carousel) return;
    
    const tabs = carousel.querySelectorAll('.carousel-tab');
    const panels = carousel.querySelectorAll('.carousel-panel');
    const dots = carousel.querySelectorAll('.progress-dot');
    let currentIndex = 0;
    let autoRotate;
    
    function showPanel(index) {
        tabs.forEach(t => t.classList.remove('is-active'));
        panels.forEach(p => p.classList.remove('is-active'));
        dots.forEach(d => d.classList.remove('is-active'));
        
        tabs[index].classList.add('is-active');
        panels[index].classList.add('is-active');
        dots[index].classList.add('is-active');
        currentIndex = index;
    }
    
    function nextPanel() {
        showPanel((currentIndex + 1) % panels.length);
    }
    
    function startAutoRotate() {
        autoRotate = setInterval(nextPanel, 10000);
    }
    
    function resetAutoRotate() {
        clearInterval(autoRotate);
        startAutoRotate();
    }
    
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
            showPanel(i);
            resetAutoRotate();
        });
    });
    
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showPanel(i);
            resetAutoRotate();
        });
    });
    
    startAutoRotate();
})();
</script>

</section>

<section id="about" class="snap-section">
<div class="about-section">

<img src="/patrick.png" alt="Patrick Schnaß" class="about-photo">

## Hallo, ich bin Patrick

Techie aus Leidenschaft mit Begeisterung für Künstliche Intelligenz und Data Science.

Derzeit leite ich die **Data Science Abteilung bei Vodafone**, wo mein Team und ich maschinelles Lernen und KI implementieren, um Lösungen zu entwickeln, die Impact schaffen und Kundenerlebnisse verbessern.

<div class="about-links">

[LinkedIn](https://www.linkedin.com/in/patrickschnass/) | [GitHub](https://github.com/PatrickPT) | [Datenschutz & Impressum](/gdpr)

</div>

</div>
</section>
