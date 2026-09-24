import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe('WienMobil Routing Frontend', () => {
  it('renders application header and title', () => {
    render(<App />);
    expect(screen.getByText('WienMobil Routing')).toBeInTheDocument();
  });

  it('renders "Von" and "Nach" input fields with Vienna defaults', () => {
    render(<App />);
    expect(screen.getByLabelText('Von')).toBeInTheDocument();
    expect(screen.getByLabelText('Nach')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Stephansplatz, Wien')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Flughafen Wien (Schwechat)')).toBeInTheDocument();
  });

  it('displays the recommended journey with the required explanation from prompt', async () => {
    render(<App />);

    // Wait for the mock results to load
    await waitFor(() => {
      expect(screen.getByText('EMPFOHLEN')).toBeInTheDocument();
    });

    // Verify explanation section
    expect(screen.getByText('Warum diese Verbindung?')).toBeInTheDocument();
    expect(screen.getByText('Aktuell schnellste Verbindung')).toBeInTheDocument();
    expect(
      screen.getByText(/Trotz eines zusätzlichen Umstiegs bist du aktuell 8 Minuten schneller am Ziel/i)
    ).toBeInTheDocument();
  });

  it('displays alternatives and trade-off comparison', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('DIREKTER')).toBeInTheDocument();
      expect(screen.getByText('WENIGER ZU FUSS')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByText('EMPFOHLEN')).toBeInTheDocument();
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
});

