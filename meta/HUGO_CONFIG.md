# Hugo & Blowfish Technical Settings

## Primary Params (hugo.toml)
```toml
[params]
  colorScheme = "blowfish"
  defaultAppearance = "light"
  autoSwitchAppearance = false # Keep it clean and white

  [params.header]
    layout = "fixed"
    logo = "logo.png" # Optional

  [params.homepage]
    layout = "profile" # High-authority expert look
    showDescription = true
    showRecent = true

  [params.main]
    background = "graph" # Interactive technical background
    enableVisualTests = false