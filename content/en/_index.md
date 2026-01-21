---
title: "Patrick Schnaß"
description: "Strategic AI Advisory. Built on Scale, Driven by Impact."
layout: "profile"
showAuthor: false
---

<section id="contact" class="snap-section">

```python
"""
Stop Experimenting and Start Transforming
"""

if current_status == "experimenting":
    stop()  # Break the loop

import scale
from advisory import Impact

def execute_strategy():
    # Build on Scale. Drive by Impact.
    engine = scale.build_robust()
    return Impact.drive(engine)
```
## Let's start working on your AI strategy.

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
      label: 'Book appointment',
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
    <button class="carousel-tab" data-index="1">Data Org </button>
    <button class="carousel-tab" data-index="2">AI Sparring</button>
</div>

<div class="carousel-panels">

<div class="carousel-panel is-active" data-index="0">

```python
"""
Independent validation of your AI roadmap 
and vendor selection
"""

def reality_check(roadmap):
    # Cut through the hype
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
Build a high-performance Data Team that sticks
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
Filter signal from noise and identify high-impact
use cases for your specific business model.
"""

def sparring_session(executive):
    # Confidential 1:1 advisory
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


