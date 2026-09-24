import React, { useState } from 'react';
import {
  Compass,
  Info,
  BarChart2,
  Database,
  AlertTriangle,
  Scale,
  X,
  ShieldCheck,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  chartNode?: React.ReactNode;
  mapNode?: React.ReactNode;
  showMapOnMobile?: boolean;
  onToggleMapMobile?: () => void;
  isBackendConnected?: boolean;
  onOpenAdmin?: () => void;
  onOpenDisruptions?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  chartNode,
  mapNode,
  showMapOnMobile = false,
  onToggleMapMobile,
  isBackendConnected = false,
  onOpenAdmin,
  onOpenDisruptions,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  WienMobil Routing
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Schnellste ÖPNV-Verbindungen unter realen Bedingungen
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Backend connection pill */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isBackendConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
              title={isBackendConnected ? 'Mit lokalem FastAPI Backend verbunden' : 'Demo & Offline Modus (Wien Mock Engine)'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
              />
              <span>{isBackendConnected ? 'API Live' : 'Demo Modus'}</span>
            </div>

            {/* Mobile Diagram Toggle */}
            {onToggleMapMobile && (
              <button
                type="button"
                onClick={onToggleMapMobile}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <BarChart2 className="w-4 h-4 text-red-600" />
                <span>{showMapOnMobile ? 'Liste' : 'Grafik'}</span>
              </button>
            )}

            {/* Live Disruptions Sidebar Button */}
            {onOpenDisruptions && (
              <button
                type="button"
                onClick={onOpenDisruptions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/90 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                title="Aktuelle Störungsmeldungen &amp; Verkehrslage anzeigen"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Störungen</span>
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                  1
                </span>
              </button>
            )}

            {/* Admin Dashboard Button */}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                title="Admin-Bereich, GTFS-Fahrplandaten & API-Checks"
              >
                <Database className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden md:inline">Datenpflege &amp; Admin</span>
              </button>
            )}

            {/* Info Dialog Button */}
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Open Data, Lizenzen &amp; Rechtliches"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Journey Results (Desktop: 5 cols) */}
          <div className={`space-y-6 ${showMapOnMobile ? 'hidden lg:block' : 'block'} lg:col-span-5 xl:col-span-5`}>
            {children}
          </div>

          {/* Right Column: Chart / Comparison Diagram (Desktop: 7 cols, Mobile: full view when toggled) */}
          {(chartNode || mapNode) && (
            <div
              className={`lg:col-span-7 xl:col-span-7 ${
                showMapOnMobile ? 'block h-[calc(100vh-6rem)]' : 'hidden lg:block'
              } lg:sticky lg:top-24 h-[650px] lg:h-[calc(100vh-8rem)]`}
            >
              {chartNode || mapNode}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-center sm:text-left">
            <span>ÖPNV-Routing Wien &middot; Basierend auf Open Data der Stadt Wien, Wiener Linien, ÖBB &amp; OpenStreetMap</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
            >
              Open Data, Lizenzen &amp; Rechtliches
            </button>
            <span>&middot;</span>
            <span className="text-slate-400">MIT-Lizenz</span>
          </div>
        </div>
      </footer>

      {/* Open Data, Licenses & Legal Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                    Open Data, Lizenzen &amp; Rechtliches
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Datenquellen, Nutzungsrechte, Haftungsausschluss &amp; Datenschutz
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              {/* 1. Verwendete Datenquellen & Attribution */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
                  <Database className="w-4 h-4 text-red-600 shrink-0" />
                  <h4>1. Verwendete Datenquellen &amp; Attribution (Open Data)</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Wiener Linien / Stadt Wien */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Stadt Wien &amp; Wiener Linien</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">CC BY 4.0</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      GTFS-Fahrplandaten, Echtzeit-Abfahrten, Betriebsmeldungen &amp; Störungs-Feed.
                    </p>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Quelle: <em>data.wien.gv.at / Wiener Linien GmbH &amp; Co KG</em>
                    </div>
                  </div>

                  {/* ÖBB */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>ÖBB Scotty &amp; Personenverkehr AG</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">ÖBB HAFAS</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Fahrplandaten und Bahnverbindungen des Schienen-Regional- und Fernverkehrs in Österreich.
                    </p>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      Quelle: <em>ÖBB-Personenverkehr AG (Fahrplan-Schnittstelle)</em>
                    </div>
                  </div>

                  {/* OpenStreetMap */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>OpenStreetMap</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">ODbL</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Geodaten, Straßen- und Fußwegnetze sowie Haltestellenkoordinaten.
                    </p>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">OpenStreetMap-Mitwirkende</a>
                    </div>
                  </div>

                  {/* VOR */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Verkehrsverbund Ost-Region (VOR)</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Verbundtarif</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Linienverläufe und Verbundintegration im Großraum Wien, Niederösterreich &amp; Burgenland.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Software-Lizenzen (Open Source) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <FileText className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <h4>2. Software-Lizenz (Open Source)</h4>
                </div>
                <p className="text-[11px] text-slate-600">
                  Der Quellcode dieser Anwendung ist als freie Open-Source-Software unter der <strong>MIT-Lizenz</strong> lizenziert. Die Webapp verwendet etablierte Open-Source-Komponenten wie React, TypeScript, FastAPI, Tailwind CSS, Vite und Lucide Icons.
                </p>
                <div className="pt-0.5">
                  <a
                    href="https://github.com/xCite1986/oepnv-routing-webapp"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                  >
                    <span>Repository auf GitHub aufrufen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 3. Haftungsausschluss (Disclaimer) */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-amber-950">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <h4>3. Haftungsausschluss &amp; Unabhängigkeitshinweis</h4>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  <strong>Keine Gewähr:</strong> Sämtliche Angaben zu Fahrzeiten, Abfahrten, Verspätungen, Gleisen und Umstiegen erfolgen ohne Gewähr auf Richtigkeit und Vollständigkeit. Es wird keine Haftung für verpasste Anschlüsse, Verspätungen, Ausfälle oder Folgeschäden übernommen.
                </p>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  <strong>Unabhängiges Projekt:</strong> Diese Anwendung ist ein unabhängiges Open-Source-Projekt zur multimodalen Reisezeitoptimierung und steht in keinem offiziellen Vertretungsverhältnis zur Wiener Linien GmbH &amp; Co KG oder der ÖBB-Personenverkehr AG.
                </p>
              </div>

              {/* 4. Datenschutz & Privatsphäre */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <h4>4. Datenschutz &amp; Privatsphäre (DSGVO-konform)</h4>
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  <strong>Kein Tracking:</strong> Es werden keine personenbezogenen Profile erstellt, keine Werbe-Tracker eingesetzt und keine Suchanfragen an Dritte verkauft oder weitergegeben.
                </p>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  <strong>Keine Cookies:</strong> Die Anwendung verwendet keine Tracking-Cookies. Benutzereinstellungen (z.B. Umstiegsgeschwindigkeit) verbleiben ausschließlich lokal in Ihrem Browser (Local Storage).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400">
                Stand: September 2026 &middot; Open Data Österreich
              </span>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
