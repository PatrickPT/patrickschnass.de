# Hugo & Blowfish Technical Settings

## 1. Primary Params (hugo.toml)
This configuration forces the light theme and enables the interactive background.

```toml
baseURL = "[https://www.patrickschnass.de/](https://www.patrickschnass.de/)"
languageCode = "de-DE"
title = "Patrick Schnaß | AI Strategy"
theme = "blowfish"

[params]
  colorScheme = "blowfish"
  defaultAppearance = "light" # Force Light Mode
  autoSwitchAppearance = false # Disable toggle to keep the "Clean White" look
  enableSearch = false # Keep it simple for a consulting profile

  [params.header]
    layout = "fixed"
    logo = "logo.png" # Placeholder

  [params.homepage]
    layout = "profile" # The "Executive Card" layout
    showDescription = true
    showRecent = true 

  [params.main]
    background = "graph" # The interactive particle background
    enableVisualTests = false

  [params.footer]
    showScrollToTop = true