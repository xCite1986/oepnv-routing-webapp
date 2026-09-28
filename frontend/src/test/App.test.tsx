import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe('OMATA – Optimal Multimodal Arrival & Transfer Assistant Frontend', () => {
  const triggerSearch = (origin = 'Stephansplatz, Wien', destination = 'Flughafen Wien (Schwechat)') => {
    const originInput = screen.getByLabelText('Von');
    const destInput = screen.getByLabelText('Nach');
    fireEvent.change(originInput, { target: { value: origin } });
    fireEvent.change(destInput, { target: { value: destination } });
    const searchBtn = screen.getByRole('button', { name: /Verbindungen suchen/i });
    fireEvent.click(searchBtn);
  };

  it('renders application header and title', () => {
    render(<App />);
    expect(screen.getAllByText('OMATA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Optimal Multimodal Arrival & Transfer Assistant/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Von" and "Nach" input fields empty initially without prefilling', () => {
    render(<App />);
    expect(screen.getByLabelText('Von')).toBeInTheDocument();
    expect(screen.getByLabelText('Nach')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Stephansplatz, Wien')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Flughafen Wien (Schwechat)')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Start (Haltestelle oder Adresse)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ziel (Haltestelle oder Adresse)')).toBeInTheDocument();
  });

  it('does not search on initial load and renders the search form centered', () => {
    render(<App />);
    expect(screen.getByText('Wohin möchtest du fahren?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verbindungen suchen/i })).toBeInTheDocument();
    expect(screen.queryByText('EMPFOHLEN')).not.toBeInTheDocument();
    expect(screen.queryByText('Zeit-Weg-Liniengrafik')).not.toBeInTheDocument();
  });

  it('displays the recommended journey with the required explanation from prompt after search', async () => {
    render(<App />);

    triggerSearch();

    // Wait for the mock results to load
    await waitFor(() => {
      expect(screen.getAllByText('EMPFOHLEN').length).toBeGreaterThanOrEqual(1);
    });

    // Verify explanation section
    expect(screen.getByText('Warum diese Verbindung?')).toBeInTheDocument();
    expect(screen.getByText('Aktuell schnellste Verbindung')).toBeInTheDocument();
    expect(
      screen.getByText(/Trotz eines zusätzlichen Umstiegs bist du aktuell 8 Minuten schneller am Ziel/i)
    ).toBeInTheDocument();
  });

  it('preserves user input across search and when returning to standard view', async () => {
    render(<App />);
    const originInput = screen.getByLabelText('Von');
    const destInput = screen.getByLabelText('Nach');
    fireEvent.change(originInput, { target: { value: 'Wien Geiselbergstraße' } });
    fireEvent.change(destInput, { target: { value: 'Bruck an der Leitha' } });

    const searchBtn = screen.getByRole('button', { name: /Verbindungen suchen/i });
    fireEvent.click(searchBtn);

    // Wait for results
    await waitFor(() => {
      expect(screen.getAllByText('EMPFOHLEN').length).toBeGreaterThanOrEqual(1);
    });

    // Inputs in the search results view still have the user's entries
    expect(screen.getByDisplayValue('Wien Geiselbergstraße')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bruck an der Leitha')).toBeInTheDocument();

    // Click "Neue Suche (Startansicht)"
    const resetBtn = screen.getByRole('button', { name: /Neue Suche/i });
    fireEvent.click(resetBtn);

    // Back in standard view, entries are still preserved!
    expect(screen.getByText('Wohin möchtest du fahren?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Wien Geiselbergstraße')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bruck an der Leitha')).toBeInTheDocument();
  });

  it('displays alternatives and trade-off comparison after search', async () => {
    render(<App />);

    triggerSearch();

    await waitFor(() => {
      expect(screen.getAllByText('DIREKTER').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('WENIGER ZU FUSS').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('finds Wien Traisengasse when searching stations in frontend autocomplete', async () => {
    const { searchViennaLocations } = await import('../api/viennaLocations');
    const results = searchViennaLocations('Wien Traisengasse');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.label.includes('Wien Traisengasse'))).toBe(true);

    const resultsShort = searchViennaLocations('Traisengasse');
    expect(resultsShort.length).toBeGreaterThan(0);
    expect(resultsShort.some(r => r.label.includes('Wien Traisengasse'))).toBe(true);
  });

  it('opens and closes the live disruptions sidebar from the trigger button', async () => {
    render(<App />);

    triggerSearch();

    await waitFor(() => {
      expect(screen.getAllByText('EMPFOHLEN').length).toBeGreaterThanOrEqual(1);
    });

    const openBtn = screen.getAllByRole('button', { name: /Störungen/i })[0];
    expect(openBtn).toBeInTheDocument();
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByText('Störungen & Verkehrslage')).toBeInTheDocument();
      expect(screen.getByText(/Auswirkung auf gewählte Route/i)).toBeInTheDocument();
      expect(screen.getByText(/Alle Meldungen \(Wien & Umgebung\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Störungsbeginn:/i)).toBeInTheDocument();
    });

    // Close button
    const closeBtn = screen.getByTitle(/Sidebar schließen/i);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Störungen & Verkehrslage')).not.toBeInTheDocument();
    });
  });

  it('renders permanently visible options with transfer speed selection (Langsam, Normal, Schnell)', () => {
    render(<App />);

    // Header should be "Optionen" without "(max. Fußweg)"
    expect(screen.getByText('Optionen')).toBeInTheDocument();
    expect(screen.queryByText(/Optionen \(max\. Fußweg\)/i)).not.toBeInTheDocument();

    // Speed options should be present as buttons
    expect(screen.getByRole('button', { name: /Langsam/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Normal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schnell/i })).toBeInTheDocument();
    expect(screen.getByText('Maximaler Fußweg:')).toBeInTheDocument();

    // Select "Langsam"
    const slowBtn = screen.getByRole('button', { name: /Langsam/i });
    fireEvent.click(slowBtn);
    expect(screen.getByText(/Gepäck oder Rollstuhl/i)).toBeInTheDocument();

    // Select "Schnell"
    const fastBtn = screen.getByRole('button', { name: /Schnell/i });
    fireEvent.click(fastBtn);
    expect(screen.getByText(/Sportliches Tempo/i)).toBeInTheDocument();
  });

  it('renders Zeit-Weg-Liniengrafik replacing the map with vertical bars and export button', async () => {
    render(<App />);

    triggerSearch();

    await waitFor(() => {
      expect(screen.getByText('Zeit-Weg-Liniengrafik')).toBeInTheDocument();
      expect(screen.getByText(/Fahrzeiten, Linien & Umstiege im Direkten vergleich/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Grafik exportieren/i })).toBeInTheDocument();
    });

    // Vertical columns should display travel times
    expect(screen.getAllByText('39 min').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('47 min').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('49 min').length).toBeGreaterThanOrEqual(1);

    // Export button triggers graphic export
    const exportBtn = screen.getByRole('button', { name: /Grafik exportieren/i });
    expect(exportBtn).toBeInTheDocument();
    fireEvent.click(exportBtn);
  });

  it('renders Kosten- & Risiko-Score penalties in minutes with one decimal place', async () => {
    render(<App />);

    triggerSearch();

    await waitFor(() => {
      expect(screen.getAllByText('Kosten- & Risiko-Score').length).toBeGreaterThanOrEqual(1);
    });

    // Check penalty titles and formatted values in min (e.g., +0,0 min, +15,0 min, +20,4 min)
    expect(screen.getAllByText('Umstiegs-Penalty').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Anschluss-Risiko').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Störungs-Risiko').length).toBeGreaterThanOrEqual(1);

    // There should be values formatted with German comma and "min", e.g. "+0,0 min"
    expect(screen.getAllByText(/\+[0-9]+,[0-9] min/).length).toBeGreaterThanOrEqual(3);
  });

  it('renders connection badge as Live (ÖBB/WL Proxy) when proxies are active', () => {
    render(<App />);
    expect(screen.getByText('Live (ÖBB/WL Proxy)')).toBeInTheDocument();
  });
});

