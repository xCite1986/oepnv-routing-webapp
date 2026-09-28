import React, { useState, useEffect, useCallback } from 'react';
import { Journey, JourneySearchRequest, JourneySearchResponse, Leg, LocationPoint, TimeMode, TransferSpeed } from './types/routing';
import { TransitApiClient } from './api/client';
import { AppShell } from './components/common/AppShell';
import { SearchForm } from './components/search/SearchForm';
import { JourneyResults } from './components/journeys/JourneyResults';
import { TimeDistanceChart } from './components/chart/TimeDistanceChart';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DisruptionsSidebar } from './components/disruptions/DisruptionsSidebar';
import { ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'app' | 'admin'>('app');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [timeMode, setTimeMode] = useState<TimeMode>('NOW');
  const [dateTime, setDateTime] = useState<string>(new Date().toISOString());
  const [maxWalking, setMaxWalking] = useState<number>(1500);
  const [transferSpeed, setTransferSpeed] = useState<TransferSpeed>('NORMAL');
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [selectedLeg, setSelectedLeg] = useState<Leg | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState<boolean>(true);
  const [disruptionSummary, setDisruptionSummary] = useState<string | undefined>();
  const [showDisruptionsSidebar, setShowDisruptionsSidebar] = useState<boolean>(false);
  const [showMapOnMobile, setShowMapOnMobile] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [lastRequest, setLastRequest] = useState<JourneySearchRequest | null>(null);

  // Sync hash routing #admin
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('app');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check backend availability on mount
  useEffect(() => {
    TransitApiClient.checkBackendHealth().then((isAvailable) => {
      setIsBackendConnected(isAvailable);
    });
  }, []);

  // Execute Search
  const handleSearch = useCallback(async (request: JourneySearchRequest) => {
    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setLastRequest(request);
    setOrigin(request.from);
    setDestination(request.to);
    if (request.timeMode) setTimeMode(request.timeMode);
    if (request.dateTime) setDateTime(request.dateTime);
    if (request.preferences?.maxWalkingDistance) setMaxWalking(request.preferences.maxWalkingDistance);
    if (request.preferences?.transferSpeed) setTransferSpeed(request.preferences.transferSpeed);

    try {
      const response: JourneySearchResponse = await TransitApiClient.searchJourneys(request);
      setJourneys(response.journeys);
      setRealtimeActive(response.realtimeActive);
      setDisruptionSummary(response.disruptionSummary);

      // Select recommended journey by default
      const rec = response.journeys.find((j) => j.recommended) || response.journeys[0] || null;
      setSelectedJourney(rec);
      setSelectedLeg(null);
    } catch (err: any) {
      setError(err?.message || 'Verbindungssuche fehlgeschlagen. Bitte versuche es erneut.');
      setJourneys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetSearch = () => {
    setHasSearched(false);
    setJourneys([]);
    setSelectedJourney(null);
    setSelectedLeg(null);
    setError(null);
  };

  const handleSelectJourney = (journey: Journey) => {
    setSelectedJourney(journey);
    setSelectedLeg(null);
  };

  const handleSelectLeg = (leg: Leg) => {
    setSelectedLeg(leg);
  };

  const handleShowOnMap = (journey: Journey) => {
    setSelectedJourney(journey);
    setShowMapOnMobile(true);
  };

  if (currentView === 'admin') {
    return (
      <AdminDashboard
        onBackToApp={() => {
          window.location.hash = '';
          setCurrentView('app');
        }}
      />
    );
  }

  return (
    <>
      <AppShell
        showMapOnMobile={showMapOnMobile}
        onToggleMapMobile={() => setShowMapOnMobile(!showMapOnMobile)}
        isBackendConnected={isBackendConnected}
        onOpenDisruptions={() => setShowDisruptionsSidebar(true)}
        isCenteredMode={!hasSearched}
        onResetSearch={hasSearched ? handleResetSearch : undefined}
        onOpenAdmin={() => {
          window.location.hash = '#admin';
          setCurrentView('admin');
        }}
        chartNode={
          hasSearched ? (
            <TimeDistanceChart
              journeys={journeys}
              selectedJourney={selectedJourney}
              onSelectJourney={handleSelectJourney}
              onCloseMobile={() => setShowMapOnMobile(false)}
            />
          ) : undefined
        }
      >
        {/* Reset button when search has been performed */}
        {hasSearched && (
          <div className="flex justify-between items-center -mb-2">
            <button
              type="button"
              onClick={handleResetSearch}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-200/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Neue Suche (Startansicht)</span>
            </button>
          </div>
        )}

        {/* Search Input Form */}
        <SearchForm
          origin={origin}
          destination={destination}
          timeMode={timeMode}
          dateTime={dateTime}
          maxWalking={maxWalking}
          transferSpeed={transferSpeed}
          onChangeOrigin={setOrigin}
          onChangeDestination={setDestination}
          onChangeTimeMode={setTimeMode}
          onChangeDateTime={setDateTime}
          onChangeMaxWalking={setMaxWalking}
          onChangeTransferSpeed={setTransferSpeed}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* Results List - only rendered after search */}
        {hasSearched && (
          <JourneyResults
            journeys={journeys}
            selectedJourneyId={selectedJourney?.id}
            isLoading={isLoading}
            error={error}
            realtimeActive={realtimeActive}
            disruptionSummary={disruptionSummary}
            onOpenDisruptions={() => setShowDisruptionsSidebar(true)}
            onSelectJourney={handleSelectJourney}
            onSelectLeg={handleSelectLeg}
            onShowOnMap={handleShowOnMap}
            onRetry={() => lastRequest && handleSearch(lastRequest)}
          />
        )}
      </AppShell>

      {/* Ausklappbare Sidebar rechts für aktuelle Störungen */}
      <DisruptionsSidebar
        isOpen={showDisruptionsSidebar}
        onClose={() => setShowDisruptionsSidebar(false)}
        selectedJourney={selectedJourney}
        disruptionSummary={disruptionSummary}
      />
    </>
  );
};

export default App;
