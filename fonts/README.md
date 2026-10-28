# Site fonts

Inter v20 and Outfit v15, unmodified WOFF2 files distributed by Google Fonts.
SIL Open Font License texts are included as `INTER-OFL.txt` and `OUTFIT-OFL.txt`.

CSS source: https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=Outfit:wght@300..800&display=swap

The local CSS preserves Google's unicode ranges and supported weight ranges.
Each variable font subset is declared once instead of once per weight.
The desktop home page preloads the Inter Latin/Latin Extended and Outfit Latin subsets.
On mobile, fonts do not compete with critical styles and scripts through preloads.
`font-display: optional` keeps the metric-adjusted system fallback for a slow first
visit instead of repeatedly swapping fonts and laying out the entire page. Cached
fonts can be used immediately on later visits.
