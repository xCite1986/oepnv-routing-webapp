import React, { useState } from 'react';
import { Compass, Info, Map, Sparkles, Database, AlertTriangle } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  mapNode?: React.ReactNode;
  showMapOnMobile?: boolean;
  onToggleMapMobile?: () => void;
  isBackendConnected?: boolean;
  onOpenAdmin?: () => void;
  onOpenDisruptions?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

            {/* Mobile Map Toggle */}
            {onToggleMapMobile && (
              <button
                type="button"
                onClick={onToggleMapMobile}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <Map className="w-4 h-4 text-red-600" />
                <span>{showMapOnMobile ? 'Liste' : 'Karte'}</span>
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
                <span className="hidden md:inline">Störungen</span>
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
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Über dieses Projekt"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Journey Results (Desktop: 7 cols) */}
          <div className={`space-y-6 ${showMapOnMobile ? 'hidden lg:block' : 'block'} lg:col-span-7 xl:col-span-6`}>
            {children}
          </div>

          {/* Right Column: Sticky Map (Desktop: 5-6 cols, Mobile: full view when toggled) */}
          {mapNode && (
            <div
              className={`lg:col-span-5 xl:col-span-6 ${
                showMapOnMobile ? 'block h-[calc(100vh-6rem)]' : 'hidden lg:block'
              } lg:sticky lg:top-24 h-[600px] lg:h-[calc(100vh-8rem)]`}
            >
              {mapNode}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ÖPNV-Routing Wien &middot; Basierend auf OpenStreetMap &amp; Wiener Linien Realtime</span>
          <span>Regelbasierte Erklärung &amp; minimale realistische Ankunftszeit</span>
        </div>
      </footer>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Über WienMobil Routing
              </h3>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                Diese Anwendung optimiert ÖPNV-Verbindungen in Wien nach der <strong>frühestmöglichen realistischen Ankunftszeit</strong> unter Einbeziehung aktueller Verspätungen und Störungsmeldungen.
              </p>
              <p>
                <strong>Besonderheit:</strong> Mehr Umstiege sind ausdrücklich erlaubt, wenn dadurch die Gesamtreisezeit verkürzt wird (z.B. Umfahrung von Weichenstörungen). Die regelbasierte Explanation-Engine erklärt transparent, warum die Verbindung gewählt wurde.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">Architektur-Highlights:</div>
                <div>&bull; Frontend: React + TypeScript + Vite + Tailwind CSS + MapLibre GL</div>
                <div>&bull; Backend: FastAPI + Pydantic + Ranking &amp; Explanation Engine</div>
                <div>&bull; OpenStreetMap &amp; Wiener Linien Realtime Normalisierung</div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
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
