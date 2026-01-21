---
title: "Patrick Schnaß"
description: "Strategische KI-Beratung. Aufgebaut auf Skalierbarkeit, angetrieben durch Wirkung."
layout: "profile"
showAuthor: false
---

<section id="contact" class="snap-section">

```python
# Stop Experimenting
if current_status == "experimenting":
    stop()  # Break the loop

# Start Transforming
import scale
from advisory import Impact

def execute_strategy():
    # Build on Scale. Drive by Impact.
    engine = scale.build_robust()
    return Impact.drive(engine)
```

## Ich kann Ihnen helfen KI in profitable Geschäftsprozesse zu verwandeln. 

Lassen Sie uns besprechen, wie ich Sie unterstützen kann.

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
    <button class="carousel-tab is-active" data-index="0">KI Reality Check</button>
    <button class="carousel-tab" data-index="1">Data Org Aufbau</button>
    <button class="carousel-tab" data-index="2">Executive Sparring</button>
</div>

<div class="carousel-panels">

<div class="carousel-panel is-active" data-index="0">

```python
def reality_check(roadmap):
    # Schluss mit dem Hype
    machbarkeit = bewerten(roadmap)
    roi = wirtschaftlichkeit()
    
    if machbarkeit.ist_real:
        return optimieren(roadmap)
    else:
        return strategie_pivot()
```

</div>

<div class="carousel-panel" data-index="1">

```python
class DataTeam:
    def __init__(self):
        self.rollen = definiere_rollen()
        self.struktur = reporting_setup()
    
    def aufbauen(self):
        # Hochleistungsteam
        einstellen(self.rahmen)
        return Team.das_bleibt()
```

</div>

<div class="carousel-panel" data-index="2">

```python
def sparring_session(executive):
    # Vertrauliches 1:1
    signal = rauschen_filtern(markt)
    cases = high_impact_finden(
        geschaeft=executive.modell
    )
    return strategische_klarheit()
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


