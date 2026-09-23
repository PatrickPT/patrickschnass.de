---
title: "Architektur & Engineering"
weight: 3
icon: "cube"
art: "eng-wave"
lead: "Von der Zielarchitektur bis in den Produktivbetrieb. Daten- und KI-Plattformen, Agenten, ML-Modelle und Automatisierung – sauber spezifiziert, wiederverwendbar und langlebig."
formats: ["build"]
packages:
  - id: "data-ai-architecture"
    title: "Daten- & KI-Architektur"
    summary: "Eine Cloud-native Zielarchitektur für Daten und KI – von Ingestion und Streaming über Data Warehouse und Lakehouse bis zum Model Serving –, abgeleitet aus Ihren Anforderungen statt aus der Folie eines Anbieters."
    why: |
      Jede KI-Initiative stößt irgendwann an dieselbe Grenze: Die Daten sind nicht dort, wo sie gebraucht werden, nicht in der richtigen Form und nicht zur richtigen Zeit. Nächtliche Batch-Jobs können keine Echtzeit-Entscheidungen versorgen, On-Premise-Systeme halten mit dem Bedarf nicht Schritt, und ein Flickenteppich aus Tools macht Governance nahezu unmöglich.

      Architekturarbeit beginnt deshalb mit den Anforderungen, nicht mit der Technologie: Latenz, Datenvolumen, Schutzbedarf, bestehende Systeme, Kompetenzen im Team und Budget. Daraus entsteht das Zielbild – wie Daten aufgenommen, gestreamt, gespeichert, gesteuert und für Analytics, ML-Modelle und Agenten bereitgestellt werden – und der Weg dorthin, einschließlich der Migration aus Alt- und On-Premise-Systemen.

      Kritische Annahmen prüfen wir früh mit einem gezielten Proof of Concept, statt sie erst im Produktivbetrieb zu entdecken. Das Ergebnis ist eine Plattform, auf der die nächsten zehn Use Cases aufbauen können, mit Betriebskosten, die von Anfang an transparent sind – und die neue Services und Modelle aufnehmen kann, ohne jedes Mal neu entworfen zu werden.
    value:
      - "Ein Fundament für Analytics, ML und Agenten statt eines Silos pro Use Case"
      - "Echtzeit, wo sie Wert schafft, Batch, wo er ausreicht"
      - "Governance und Sicherheit von Anfang an mitgedacht statt nachgerüstet"
      - "Ein realistischer Migrationspfad statt eines Big-Bang-Neubaus"
    deliverables:
      - "Zielarchitektur mit dokumentierten Architekturentscheidungen"
      - "Roadmap für Migration und Modernisierung"
      - "Proof of Concept für den kritischen Pfad"
      - "Kostenmodell und Betriebskonzept"

  - id: "ai-agents"
    title: "KI-Agenten"
    summary: "Agenten, die mit Ihren Tools, Daten und Prozessen arbeiten – zuverlässig, nachvollziehbar und wartbar gebaut."
    why: |
      Agenten bringen KI vom Antworten zum Handeln: Sie recherchieren Informationen, rufen Systeme auf, erstellen und prüfen Ergebnisse und übergeben an Menschen, wenn nötig. In den richtigen Workflows übernehmen sie Arbeit, die früher viele manuelle Schritte über mehrere Tools hinweg erforderte.

      Agenten lassen sich aber auch leicht schlecht bauen. Ein Prototyp, der in der Demo funktioniert, kann sich mit echten Daten unvorhersehbar verhalten, Kosten in die Höhe treiben oder Aktionen ausführen, die niemand nachvollziehen kann. Ohne Evaluation, Monitoring und klare Berechtigungen schwindet das Vertrauen schnell – und das Projekt landet in der Schublade.

      Ich baue Agenten auf Basis klarer Spezifikationen: definierte Ziele und Grenzen, Evaluation anhand realistischer Testfälle, Beobachtbarkeit für jeden Schritt und minimale Zugriffsrechte auf Ihre Systeme. Agenten entstehen aus wiederverwendbaren Komponenten – Tools, Prompts, Retrieval, Leitplanken -, damit der nächste Agent schneller und günstiger umgesetzt ist und der spätere Wechsel auf ein besseres Modell keinen Neustart bedeutet.
    value:
      - "Ganze Arbeitsabläufe automatisiert – nicht nur Chat-Antworten"
      - "Vorhersehbares Verhalten durch Evaluation und Leitplanken"
      - "Volle Nachvollziehbarkeit, was der Agent getan hat und warum"
      - "Modellunabhängiges Design, das von jeder neuen Generation profitiert"
    deliverables:
      - "Produktionsreife Agenten, integriert in Ihre Systeme"
      - "Evaluations-Suite und Monitoring-Dashboards"
      - "Wiederverwendbare Komponenten für Tools, Retrieval und Leitplanken"
      - "Dokumentation und Übergabe an Ihr Team"

  - id: "machine-learning"
    title: "Machine Learning"
    summary: "Prognosemodelle, die konkrete Entscheidungen verbessern – von Absatzprognosen über Churn bis Pricing – zuverlässig im Produktivbetrieb."
    why: |
      Nicht jedes Problem braucht ein großes Sprachmodell. Viele der wertvollsten Entscheidungen in einem Unternehmen – wie viel auf Lager liegen soll, welche Kunden kurz vor der Kündigung stehen, wie Preise gesetzt werden und wo man eingreifen sollte – lassen sich am besten mit klassischem Machine Learning auf Ihren eigenen Daten treffen. Diese Modelle sind oft günstiger im Betrieb, leichter zu erklären und direkt an ein messbares Geschäftsergebnis gekoppelt.

      Die eigentliche Herausforderung ist selten der Algorithmus. Es sind zuverlässige Datenpipelines, Features, die in Training und Produktion konsistent sind, die Integration in die Systeme, in denen Entscheidungen tatsächlich getroffen werden, und ein Monitoring, das erkennt, wenn sich die Welt verändert und ein Modell zu driften beginnt.

      Dieser letzte Punkt ist wichtiger denn je. Kundenverhalten, Märkte und Lieferketten verändern sich schnell; ein Modell, das auf der Realität des letzten Jahres trainiert wurde, liegt nach und nach daneben. Modelle mit MLOps-Praktiken zu bauen – automatisiertes Retraining, Performance-Monitoring und Versionierung – hält sie wertvoll, statt sie still verfallen zu lassen.
    value:
      - "Bessere Entscheidungen bei Prognose, Churn, Pricing und Risiko"
      - "Modelle, die direkt an messbare Geschäftsergebnisse gekoppelt sind"
      - "Drift-Erkennung und Retraining, wenn sich Bedingungen ändern"
      - "Kosteneffiziente Alternativen, wo generative KI überdimensioniert wäre"
    deliverables:
      - "Validierte Modelle mit dokumentierter Performance"
      - "Produktionsreife Daten- und Feature-Pipelines"
      - "MLOps-Setup: Deployment, Monitoring, Retraining"
      - "Integration in die Geschäftssysteme, die die Prognosen nutzen"

  - id: "automation"
    title: "Automatisierung"
    summary: "Wiederkehrende Prozesse und Datenflüsse automatisieren – klassische Automatisierung dort, wo sie reicht, KI dort, wo sie Mehrwert bringt."
    why: |
      Ein großer Teil der täglichen Arbeit ist noch immer manuell: Daten zwischen Systemen kopieren, Dokumente prüfen, Berichte zusammenstellen, Anfragen weiterleiten. Jeder dieser Schritte kostet Zeit, erzeugt Fehler und bremst die Organisation – und es ist genau die Arbeit, die Menschen am wenigsten gern machen.

      Automatisierung macht diese Kapazität frei. Entscheidend ist, für jeden Schritt das richtige Werkzeug zu wählen: deterministische Workflows und Integrationen, wo Regeln klar sind, KI, wo Eingaben unstrukturiert sind – E-Mails, Dokumente, Freitext -, und menschliche Prüfung, wo Urteilsvermögen gefragt ist. Diese Kombination bewusst zu gestalten, ergibt robuste Prozesse statt fragiler Skripte.

      In einem sich schnell verändernden Umfeld geht es bei Automatisierung auch um Agilität. Prozesse auf Basis sauberer Integrationen und dokumentierter Workflows lassen sich in Tagen anpassen, wenn sich Regulierung, Produkte oder Systeme ändern. Automatisierung in undokumentierten Makros und persönlichen Skripten bewirkt das Gegenteil – sie hält die Organisation in der Arbeitsweise von gestern fest.
    value:
      - "Freie Kapazitäten statt repetitiver Handarbeit"
      - "Weniger Fehler und kürzere Durchlaufzeiten"
      - "KI dort, wo Eingaben unstrukturiert sind, Regeln dort, wo sie klar sind"
      - "Prozesse, die sich bei neuen Anforderungen schnell anpassen lassen"
    deliverables:
      - "Automatisierte Workflows und Integrationen im Produktivbetrieb"
      - "Dokumenten- und Datenverarbeitung mit KI, wo es sich rechnet"
      - "Monitoring, Fehlerbehandlung und Runbooks"
      - "Dokumentation, damit Ihre Teams die Automatisierung selbst erweitern können"
---

Eine Strategie schafft erst dann Wert, wenn etwas produktiv läuft. Genau diese letzte Strecke – vom vielversprechenden Prototyp zum zuverlässigen System, das integriert, überwacht und gewartet wird – ist die, auf der die meisten KI-Initiativen stecken bleiben. Demos sind schnell gebaut, Produktivsysteme nicht.

Diese Leistung schließt die Lücke. Ich entwerfe die Daten- und KI-Architektur, auf der diese Systeme laufen, und baue KI-Agenten, Machine-Learning-Modelle und Automatisierungen mit derselben Disziplin wie jede andere geschäftskritische Software: klare Spezifikationen, wiederverwendbare Komponenten, Tests, Monitoring und eine Übergabe, die Ihre Teams übernehmen können. Das Ziel ist kein Vorzeigeprojekt, sondern eine Lösung, die auch nach der ersten Version Nutzen bringt – und sich weiterentwickeln lässt, wenn sich Modelle und Anforderungen ändern.
