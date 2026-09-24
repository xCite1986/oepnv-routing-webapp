from typing import List, Dict

VIENNA_STOPS: List[Dict] = [
    # --- Große Fern- & Regionalknotenpunkte ---
    {
        "lat": 48.18530,
        "lon": 16.37640,
        "label": "Wien Hauptbahnhof",
        "type": "STATION",
        "municipality": "Wien 10. Bezirk",
        "stopId": "1190100"
    },
    {
        "lat": 48.17470,
        "lon": 16.33310,
        "label": "Wien Meidling",
        "type": "STATION",
        "municipality": "Wien 12. Bezirk",
        "stopId": "1191200"
    },
    {
        "lat": 48.19690,
        "lon": 16.33780,
        "label": "Wien Westbahnhof",
        "type": "STATION",
        "municipality": "Wien 15. Bezirk",
        "stopId": "1191500"
    },
    {
        "lat": 48.20630,
        "lon": 16.38550,
        "label": "Wien Mitte / Landstraße",
        "type": "STATION",
        "municipality": "Wien 3. Bezirk",
        "stopId": "1190300"
    },
    {
        "lat": 48.21780,
        "lon": 16.39170,
        "label": "Wien Praterstern",
        "type": "STATION",
        "municipality": "Wien 2. Bezirk",
        "stopId": "1192101"
    },
    {
        "lat": 48.25640,
        "lon": 16.40020,
        "label": "Wien Floridsdorf",
        "type": "STATION",
        "municipality": "Wien 21. Bezirk",
        "stopId": "1292100"
    },
    {
        "lat": 48.24180,
        "lon": 16.38530,
        "label": "Wien Handelskai",
        "type": "STATION",
        "municipality": "Wien 20. Bezirk",
        "stopId": "1292001"
    },
    {
        "lat": 48.23550,
        "lon": 16.35850,
        "label": "Wien Spittelau",
        "type": "STATION",
        "municipality": "Wien 9. Bezirk",
        "stopId": "1190900"
    },
    {
        "lat": 48.24920,
        "lon": 16.36530,
        "label": "Wien Heiligenstadt",
        "type": "STATION",
        "municipality": "Wien 19. Bezirk",
        "stopId": "1191900"
    },
    {
        "lat": 48.19720,
        "lon": 16.26110,
        "label": "Wien Hütteldorf",
        "type": "STATION",
        "municipality": "Wien 14. Bezirk",
        "stopId": "1191400"
    },
    {
        "lat": 48.22580,
        "lon": 16.36080,
        "label": "Wien Franz-Josefs-Bahnhof",
        "type": "STATION",
        "municipality": "Wien 9. Bezirk",
        "stopId": "1190901"
    },

    # --- S-Bahn Stammstrecke (Meidling <-> Floridsdorf) ---
    {
        "lat": 48.18020,
        "lon": 16.35780,
        "label": "Wien Matzleinsdorfer Platz",
        "type": "STATION",
        "municipality": "Wien 5. / 10. Bezirk",
        "stopId": "1190501"
    },
    {
        "lat": 48.18780,
        "lon": 16.38310,
        "label": "Wien Quartier Belvedere",
        "type": "STATION",
        "municipality": "Wien 3. / 4. Bezirk",
        "stopId": "1190401"
    },
    {
        "lat": 48.19420,
        "lon": 16.38690,
        "label": "Wien Rennweg",
        "type": "STATION",
        "municipality": "Wien 3. Bezirk",
        "stopId": "1190301"
    },
    {
        "lat": 48.234786,
        "lon": 16.38338,
        "label": "Wien Traisengasse",
        "type": "STATION",
        "municipality": "Wien 20. Bezirk (Brigittenau)",
        "stopId": "1292002"
    },

    # --- S-Bahn Flughafenlinie (S7) & östliche Bahnhöfe ---
    {
        "lat": 48.11030,
        "lon": 16.56970,
        "label": "Flughafen Wien (Schwechat)",
        "type": "STATION",
        "municipality": "Schwechat",
        "stopId": "1191201"
    },
    {
        "lat": 48.19150,
        "lon": 16.40240,
        "label": "Wien St. Marx",
        "type": "STATION",
        "municipality": "Wien 3. Bezirk",
        "stopId": "1190302"
    },
    {
        "lat": 48.17890,
        "lon": 16.41030,
        "label": "Wien Geiselbergstraße",
        "type": "STATION",
        "municipality": "Wien 11. Bezirk"
    },
    {
        "lat": 48.15610,
        "lon": 16.44280,
        "label": "Wien Zentralfriedhof S-Bahn",
        "type": "STATION",
        "municipality": "Wien 11. Bezirk"
    },
    {
        "lat": 48.15610,
        "lon": 16.46780,
        "label": "Kaiserebersdorf Bahnhof",
        "type": "STATION",
        "municipality": "Wien 11. Bezirk"
    },
    {
        "lat": 48.14170,
        "lon": 16.47890,
        "label": "Schwechat Bahnhof",
        "type": "STATION",
        "municipality": "Schwechat"
    },
    {
        "lat": 48.13890,
        "lon": 16.51670,
        "label": "Mannswörth Bahnhof",
        "type": "STATION",
        "municipality": "Schwechat"
    },

    # --- S-Bahn Vorortelinie (S45) & West ---
    {
        "lat": 48.21140,
        "lon": 16.31140,
        "label": "Wien Ottakring",
        "type": "STATION",
        "municipality": "Wien 16. Bezirk"
    },
    {
        "lat": 48.22350,
        "lon": 16.31560,
        "label": "Wien Hernals",
        "type": "STATION",
        "municipality": "Wien 17. Bezirk"
    },
    {
        "lat": 48.23250,
        "lon": 16.32920,
        "label": "Wien Gersthof",
        "type": "STATION",
        "municipality": "Wien 18. Bezirk"
    },
    {
        "lat": 48.23940,
        "lon": 16.34220,
        "label": "Wien Krottenbachstraße",
        "type": "STATION",
        "municipality": "Wien 19. Bezirk"
    },
    {
        "lat": 48.24170,
        "lon": 16.35330,
        "label": "Wien Oberdöbling",
        "type": "STATION",
        "municipality": "Wien 19. Bezirk"
    },
    {
        "lat": 48.19290,
        "lon": 16.30610,
        "label": "Wien Penzing",
        "type": "STATION",
        "municipality": "Wien 14. Bezirk"
    },
    {
        "lat": 48.17220,
        "lon": 16.28330,
        "label": "Wien Speising",
        "type": "STATION",
        "municipality": "Wien 13. Bezirk"
    },

    # --- S-Bahn Südbahn & Donaustadt ---
    {
        "lat": 48.16640,
        "lon": 16.31140,
        "label": "Wien Hetzendorf",
        "type": "STATION",
        "municipality": "Wien 12. Bezirk"
    },
    {
        "lat": 48.14890,
        "lon": 16.29940,
        "label": "Wien Atzgersdorf",
        "type": "STATION",
        "municipality": "Wien 23. Bezirk"
    },
    {
        "lat": 48.13500,
        "lon": 16.28420,
        "label": "Wien Liesing",
        "type": "STATION",
        "municipality": "Wien 23. Bezirk"
    },
    {
        "lat": 48.27060,
        "lon": 16.41720,
        "label": "Wien Siemensstraße",
        "type": "STATION",
        "municipality": "Wien 21. Bezirk"
    },
    {
        "lat": 48.27780,
        "lon": 16.45280,
        "label": "Wien Leopoldau",
        "type": "STATION",
        "municipality": "Wien 21. Bezirk"
    },
    {
        "lat": 48.22890,
        "lon": 16.45670,
        "label": "Wien Stadlau",
        "type": "STATION",
        "municipality": "Wien 22. Bezirk"
    },
    {
        "lat": 48.23330,
        "lon": 16.46390,
        "label": "Wien Erzherzog-Karl-Straße",
        "type": "STATION",
        "municipality": "Wien 22. Bezirk"
    },
    {
        "lat": 48.23440,
        "lon": 16.50560,
        "label": "Wien Aspern Nord",
        "type": "STATION",
        "municipality": "Wien 22. Bezirk"
    },
    {
        "lat": 48.17060,
        "lon": 16.42060,
        "label": "Wien Simmering",
        "type": "STATION",
        "municipality": "Wien 11. Bezirk"
    },

    # --- Zentrale U-Bahn-Stationen (Wiener Linien) ---
    {
        "lat": 48.20849,
        "lon": 16.37208,
        "label": "Stephansplatz, Wien",
        "type": "STATION",
        "municipality": "Wien 1. Bezirk"
    },
    {
        "lat": 48.20030,
        "lon": 16.36980,
        "label": "Karlsplatz, Wien",
        "type": "STATION",
        "municipality": "Wien 1./4. Bezirk"
    },
    {
        "lat": 48.21140,
        "lon": 16.37750,
        "label": "Schwedenplatz, Wien",
        "type": "STATION",
        "municipality": "Wien 1. Bezirk"
    },
    {
        "lat": 48.21950,
        "lon": 16.36180,
        "label": "Schottentor (Universität)",
        "type": "STATION",
        "municipality": "Wien 1. / 9. Bezirk"
    },
    {
        "lat": 48.20790,
        "lon": 16.35910,
        "label": "Volkstheater, Wien",
        "type": "STATION",
        "municipality": "Wien 7. Bezirk"
    },
    {
        "lat": 48.21280,
        "lon": 16.35770,
        "label": "Rathaus, Wien",
        "type": "STATION",
        "municipality": "Wien 1. / 8. Bezirk"
    },
    {
        "lat": 48.24350,
        "lon": 16.43320,
        "label": "Kagran, Wien",
        "type": "STATION",
        "municipality": "Wien 22. Bezirk"
    },
    {
        "lat": 48.21670,
        "lon": 16.36220,
        "label": "Schottenring, Wien",
        "type": "STATION",
        "municipality": "Wien 1. / 2. Bezirk"
    },
    {
        "lat": 48.18830,
        "lon": 16.33530,
        "label": "Längenfeldgasse, Wien",
        "type": "STATION",
        "municipality": "Wien 12. Bezirk"
    },
    {
        "lat": 48.17440,
        "lon": 16.37890,
        "label": "Reumannplatz, Wien",
        "type": "STATION",
        "municipality": "Wien 10. Bezirk"
    },
    {
        "lat": 48.18560,
        "lon": 16.31280,
        "label": "Schloss Schönbrunn",
        "type": "POI",
        "municipality": "Wien 13. Bezirk"
    },
    {
        "lat": 48.19230,
        "lon": 16.38070,
        "label": "Schloss Belvedere",
        "type": "POI",
        "municipality": "Wien 3. Bezirk"
    },
    {
        "lat": 48.20720,
        "lon": 16.42110,
        "label": "Ernst-Happel-Stadion",
        "type": "POI",
        "municipality": "Wien 2. Bezirk"
    },
    {
        "lat": 48.22890,
        "lon": 16.41580,
        "label": "Donauturm Wien",
        "type": "POI",
        "municipality": "Wien 22. Bezirk"
    }
]
