import React, { useState, useEffect } from 'react';
import {
  AdminApiClient,
  GtfsFeed,
  ApiDiagnosticsResponse,
  LiveMonitorResponse,
} from '../../api/adminClient';
import {
  Database,
  Activity,
  Radio,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  Shield,
  Layers,
  Train,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { getLineColors } from '../../utils/formatters';

interface AdminDashboardProps {
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<'gtfs' | 'diagnostics' | 'live' | 'config'>('gtfs');
  const [feeds, setFeeds] = useState<GtfsFeed[]>([]);
  const [diagnostics, setDiagnostics] = useState<ApiDiagnosticsResponse | null>(null);
  const [wlDepartures, setWlDepartures] = useState<LiveMonitorResponse | null>(null);
  const [oebbDepartures, setOebbDepartures] = useState<LiveMonitorResponse | null>(null);
  const [selectedRbl, setSelectedRbl] = useState<number>(4114); // Stephansplatz U1
  const [selectedEva, setSelectedEva] = useState<string>('1190100'); // Wien Hbf
  const [selectedEvaName, setSelectedEvaName] = useState<string>('Wien Hauptbahnhof');
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [isSyncingFeed, setIsSyncingFeed] = useState<string | null>(null);
  const [isCheckingApis, setIsCheckingApis] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Load GTFS feeds
  const loadFeeds = async () => {
    setIsLoadingFeeds(true);
    try {
      const data = await AdminApiClient.getFeeds();
      setFeeds(data);
    } finally {
      setIsLoadingFeeds(false);
    }
  };

  // Run API diagnostics
  const runChecks = async () => {
    setIsCheckingApis(true);
    try {
      const data = await AdminApiClient.runApiChecks();
      setDiagnostics(data);
    } finally {
      setIsCheckingApis(false);
    }
  };

  // Load live departures
  const loadLiveMonitors = async (rbl = selectedRbl, eva = selectedEva, evaName = selectedEvaName) => {
    setIsLoadingLive(true);
    try {
      const [wlData, oebbData] = await Promise.all([
        AdminApiClient.getWienerLinienLive(rbl),
        AdminApiClient.getOebbLive(eva, evaName),
      ]);
      setWlDepartures(wlData);
      setOebbDepartures(oebbData);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    loadFeeds();
    runChecks();
    loadLiveMonitors();
  }, []);

  const handleSyncFeed = async (feedId: string) => {
    setIsSyncingFeed(feedId);
    setSyncFeedback(null);
    try {
      const res = await AdminApiClient.syncFeed(feedId);
      setSyncFeedback(res.message);
      await loadFeeds();
    } finally {
      setIsSyncingFeed(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased flex flex-col">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToApp}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Zurück zur Fahrgast-Suche"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück zur Routensuche</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  ÖPNV Datenpflege &amp; API-Konsole
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-white tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                GTFS-Fahrplandaten, Echtzeit-Schnittstellen (Wiener Linien &amp; ÖBB) und API-Checks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadFeeds();
                runChecks();
                loadLiveMonitors();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeeds || isCheckingApis ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Alles aktualisieren</span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('gtfs')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'gtfs'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Fahrplandaten &amp; GTFS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>API-Status &amp; Diagnostik</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'live'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live-Echtzeit-Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Konfiguration &amp; Schnittstellen</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        {syncFeedback && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              Schließen
            </button>
          </div>
        )}

        {/* TAB 1: GTFS FAHRPLANDATEN */}
        {activeTab === 'gtfs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  GTFS-Fahrplanverwaltung (Wiener Linien &amp; ÖBB)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statische Fahrpläne für U-Bahnen, Straßenbahnen, Busse, S-Bahnen und Regionalzüge in Wien &amp; Umgebung.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  {feeds.length} Feeds registriert
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-800 tracking-wider">
                        {feed.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktiv</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {feed.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{feed.operator}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Haltestellen</span>
                        <span className="font-bold text-slate-800">{feed.stopsCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Linien / Routen</span>
                        <span className="font-bold text-slate-800">{feed.routesCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Fahrten (Trips)</span>
                        <span className="font-bold text-slate-800">{feed.tripsCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Dateigröße</span>
                        <span className="font-bold text-slate-800">{formatBytes(feed.fileSizeBytes)}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                      <div className="flex justify-between">
                        <span>Gültig von:</span>
                        <span className="font-semibold text-slate-700">{feed.validFrom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gültig bis:</span>
                        <span className="font-semibold text-slate-700">{feed.validTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Letztes Update:</span>
                        <span className="font-semibold text-slate-700">
                          {new Date(feed.lastUpdated).toLocaleDateString('de-AT')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Echtzeit-Schnittstelle:</span>
                        <span className="font-semibold text-blue-600">{feed.realtimeProvider}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={feed.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Quelle</span>
                    </a>

                    <button
                      type="button"
                      disabled={isSyncingFeed === feed.id}
                      onClick={() => handleSyncFeed(feed.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingFeed === feed.id ? 'animate-spin' : ''}`} />
                      <span>{isSyncingFeed === feed.id ? 'Aktualisiere …' : 'Synchronisieren'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Hinweis zu den Datenquellen:</h4>
              <p>
                <strong>Wiener Linien:</strong> Die statischen Fahrplandaten werden als Open Data unter CC-BY-4.0 zur Verfügung gestellt. Der Feed enthält alle Haltestellengeometrien, U-Bahn-, Straßenbahn- und Bus-Fahrten in Wien.
              </p>
              <p>
                <strong>ÖBB Personenverkehr:</strong> Der ÖBB GTFS-Datensatz deckt das gesamte österreichische Schienennetz ab, einschließlich S-Bahn Wien (Stammstrecke, S7 Flughafen, S45, S80) und Regionalexpress-Verbindungen.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: API DIAGNOSTIK & HEALTH */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Live API-Checks &amp; Netzwerkdiagnose
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Überprüft Antwortzeiten, Latenzen und Erreichbarkeit der Wiener Linien, ÖBB und Routing-Engines.
                </p>
              </div>

              <button
                type="button"
                disabled={isCheckingApis}
                onClick={runChecks}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Activity className={`w-4 h-4 ${isCheckingApis ? 'animate-spin' : ''}`} />
                <span>{isCheckingApis ? 'Prüfung läuft …' : 'Diagnose jetzt ausführen'}</span>
              </button>
            </div>

            {diagnostics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {diagnostics.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-xs text-slate-800">{check.provider}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            check.status === 'ONLINE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : check.status === 'STANDBY'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {check.status}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-black text-slate-900">{check.latencyMs} ms</span>
                        <span className="text-xs text-slate-400">Latenz</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {check.details}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                      <span>HTTP Status: {check.statusCode || 'Lokal'}</span>
                      <span>geprüft: {new Date(diagnostics.timestamp).toLocaleTimeString('de-AT')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE ECHTZEIT-MONITOR */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">
                Echtzeit-Testkonsole: Live-Abfahrten Wien
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Teste direkte Abfragen gegen die offizielle Wiener Linien Monitor-API und das ÖBB Scotty Gateway.
              </p>

              {/* Station Selector Pills */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Wiener Linien Haltestelle wählen:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Stephansplatz (U1)', rbl: 4114 },
                    { label: 'Stephansplatz (U3)', rbl: 4914 },
                    { label: 'Praterstern (U1)', rbl: 4117 },
                    { label: 'Karlsplatz (U1)', rbl: 4113 },
                    { label: 'Schwedenplatz (U4)', rbl: 4415 },
                    { label: 'Wien Mitte (U3)', rbl: 4916 },
                    { label: 'Westbahnhof (U3)', rbl: 4910 },
                  ].map((s) => (
                    <button
                      key={s.rbl}
                      type="button"
                      onClick={() => {
                        setSelectedRbl(s.rbl);
                        loadLiveMonitors(s.rbl, selectedEva, selectedEvaName);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedRbl === s.rbl
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">ÖBB Bahnhof wählen (Scotty / HAFAS):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Wien Hauptbahnhof', eva: '1190100' },
                    { name: 'Wien Praterstern', eva: '1192101' },
                    { name: 'Wien Mitte Landstraße', eva: '1191100' },
                    { name: 'Flughafen Wien (VIE)', eva: '1191201' },
                    { name: 'Wien Meidling', eva: '1190200' },
                  ].map((b) => (
                    <button
                      key={b.eva}
                      type="button"
                      onClick={() => {
                        setSelectedEva(b.eva);
                        setSelectedEvaName(b.name);
                        loadLiveMonitors(selectedRbl, b.eva, b.name);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedEva === b.eva
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Grid: Left Wiener Linien, Right ÖBB */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wiener Linien Live Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Wiener Linien Monitor: {wlDepartures?.station || 'Stephansplatz'}
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">RBL: {selectedRbl}</span>
                </div>

                {isLoadingLive ? (
                  <div className="py-8 text-center text-xs text-slate-400">Lade Echtzeit-Abfahrten …</div>
                ) : wlDepartures && wlDepartures.departures.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {wlDepartures.departures.map((dep, idx) => {
                      const colors = getLineColors(dep.line, dep.type);
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {dep.line}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800">{dep.towards}</div>
                              {dep.platform && (
                                <div className="text-[11px] text-slate-400">{dep.platform}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-sm text-slate-900">
                              {dep.countdown !== undefined ? `${dep.countdown} min` : dep.timePlanned}
                            </span>
                            {dep.barrierFree && (
                              <div className="text-[10px] text-emerald-600">barrierefrei</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">Keine Live-Abfahrten gemeldet.</div>
                )}
              </div>

              {/* ÖBB Scotty Live Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      ÖBB Scotty HAFAS: {selectedEvaName}
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">EVA: {selectedEva}</span>
                </div>

                {isLoadingLive ? (
                  <div className="py-8 text-center text-xs text-slate-400">Lade ÖBB Live-Abfahrten …</div>
                ) : oebbDepartures && oebbDepartures.departures.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {oebbDepartures.departures.map((dep, idx) => {
                      const colors = getLineColors(dep.train, 'TRAIN');
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {dep.train}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-800">{dep.direction}</div>
                              {dep.platform && (
                                <div className="text-[11px] text-slate-400">{dep.platform}</div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-sm text-slate-900">{dep.time}</span>
                            <div
                              className={`text-[10px] font-semibold ${
                                dep.isDelayed ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {dep.statusText}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">Keine Züge gemeldet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KONFIGURATION */}
        {activeTab === 'config' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Schnittstellen- und System-Einstellungen
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfiguriere Polling-Intervalle, API-URLs und Authentifizierungsschlüssel.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Wiener Linien API Sender-Key (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Standard: Freier Open Data Zugriff"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-red-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Die öffentliche Wiener Linien OGD Realtime API funktioniert standardmäßig ohne Key.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ÖBB HAFAS / Scotty Endpoint
                </label>
                <input
                  type="text"
                  defaultValue="https://fahrplan.oebb.at/bin/stboard.exe/dn"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-red-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Basiert auf den Spezifikationen von public-transport/oebb für Live-Bahnhofsabfragen.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  OpenTripPlanner (OTP) Basis-URL
                </label>
                <input
                  type="text"
                  defaultValue="http://localhost:8080/otp"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Echtzeit-Polling Intervall
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                    <option value="15">Alle 15 Sekunden</option>
                    <option value="30">Alle 30 Sekunden (Empfohlen)</option>
                    <option value="60">Alle 60 Sekunden</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cache TTL (Redis / RAM)
                  </label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                    <option value="30">30 Sekunden</option>
                    <option value="60">60 Sekunden</option>
                    <option value="120">2 Minuten</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('Einstellungen wurden gespeichert.')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Einstellungen speichern
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
