import Papa from 'papaparse';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SurveySession, LogSession } from '@app-types/measurement';
import { BackupData, PDFReportData } from '@app-types/export';
import { volumeFormulas, SpeciesKey } from '@data/volumeFormulas';
import { speciesNames } from '@data/speciesSpeechPatterns';

/**
 * Export szolgáltatás
 * CSV, PDF és JSON backup export funkciók
 */
export class ExportService {
  /**
   * Fafaj kulcs -> név átalakítás
   */
  private getSpeciesName(key: string): string {
    const params = volumeFormulas[key as SpeciesKey];
    return params ? params.species : key;
  }
  /**
   * CSV export
   */
  exportCSV(session: SurveySession, filename?: string): void {
    const data = session.trees.map((tree) => ({
      Fafaj: this.getSpeciesName(tree.species),
      'Átmérő (cm)': tree.diameterCm,
      'Magasság (m)': tree.heightM,
      'Fatömeg (m³)': tree.volumeM3.toFixed(2),
      Időpont: new Date(tree.timestamp).toLocaleString('hu-HU'),
    }));

    const csv = Papa.unparse(data, {
      delimiter: ';', // Excel kompatibilitás
      header: true,
    });

    // BOM hozzáadása (UTF-8 támogatás Excel-ben)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `fatomeg_${session.id}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * PDF export (egyszerű jegyzőkönyv)
   */
  exportPDF(
    session: SurveySession,
    metadata?: PDFReportData,
    filename?: string
  ): void {
    const doc = new jsPDF();

    // Fejléc
    doc.setFontSize(18);
    doc.text('Fatömegbecslési Jegyzőkönyv', 105, 20, { align: 'center' });

    // Meta információk
    doc.setFontSize(12);
    let y = 40;

    doc.text(
      `Dátum: ${new Date(session.startedAt).toLocaleDateString('hu-HU')}`,
      20,
      y
    );
    y += 10;

    if (metadata?.surveyorName) {
      doc.text(`Felmérő: ${metadata.surveyorName}`, 20, y);
      y += 10;
    }

    if (session.location) {
      doc.text(`Helyszín: ${session.location}`, 20, y);
      y += 10;
    }

    y += 10;

    // Táblázat fejléc
    doc.setFontSize(10);
    doc.text('Sorszám', 20, y);
    doc.text('Fafaj', 45, y);
    doc.text('Átmérő (cm)', 85, y);
    doc.text('Magasság (m)', 125, y);
    doc.text('Fatömeg (m³)', 165, y);

    y += 7;
    doc.line(20, y, 190, y); // Vonal
    y += 5;

    // Mérések
    session.trees.forEach((tree, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text((index + 1).toString(), 20, y);
      doc.text(this.getSpeciesName(tree.species), 45, y);
      doc.text(tree.diameterCm.toString(), 90, y);
      doc.text(tree.heightM.toString(), 130, y);
      doc.text(tree.volumeM3.toFixed(2), 170, y);

      y += 7;
    });

    // Összegzés
    y += 10;
    doc.line(20, y, 190, y);
    y += 7;

    const totalVolume = session.trees.reduce((sum, t) => sum + t.volumeM3, 0);
    const totalTrees = session.trees.length;

    doc.setFontSize(12);
    doc.text(`Összesen: ${totalTrees} fa`, 20, y);
    doc.text(`Összes fatömeg: ${totalVolume.toFixed(2)} m³`, 100, y);

    // Letöltés
    doc.save(filename || `fatomeg_jegyzokonyv_${session.id}.pdf`);
  }

  /**
   * Excel export
   */
  exportExcel(session: SurveySession, filename?: string): void {
    const data = session.trees.map((tree, index) => ({
      'Sorszám': index + 1,
      'Fafaj': this.getSpeciesName(tree.species),
      'Átmérő (cm)': tree.diameterCm,
      'Magasság (m)': tree.heightM,
      'Fatömeg (m³)': Number(tree.volumeM3.toFixed(2)),
      'Időpont': new Date(tree.timestamp).toLocaleString('hu-HU'),
    }));

    // Összesítő sor hozzáadása
    const totalVolume = session.trees.reduce((sum, t) => sum + t.volumeM3, 0);
    data.push({
      'Sorszám': '',
      'Fafaj': 'ÖSSZESEN',
      'Átmérő (cm)': '',
      'Magasság (m)': '',
      'Fatömeg (m³)': Number(totalVolume.toFixed(2)),
      'Időpont': '',
    } as any);

    // Worksheet létrehozása
    const ws = XLSX.utils.json_to_sheet(data);

    // Oszlopszélességek beállítása
    ws['!cols'] = [
      { wch: 10 }, // Sorszám
      { wch: 20 }, // Fafaj
      { wch: 15 }, // Átmérő
      { wch: 15 }, // Magasság
      { wch: 15 }, // Fatömeg
      { wch: 20 }, // Időpont
    ];

    // Workbook létrehozása
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Felmérés');

    // Letöltés
    XLSX.writeFile(wb, filename || `fatomeg_${session.id}.xlsx`);
  }

  /**
   * JSON backup export (összes session)
   */
  exportBackup(sessions: SurveySession[], settings?: any): void {
    const backupData: BackupData = {
      version: '1.0',
      exportedAt: Date.now(),
      sessions,
      settings,
    };

    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `fatomeg_backup_${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * JSON backup import
   */
  async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const data = JSON.parse(json) as BackupData;
          resolve(data);
        } catch (error) {
          reject('Érvénytelen backup fájl');
        }
      };

      reader.onerror = () => {
        reject('Hiba történt a fájl olvasása során');
      };

      reader.readAsText(file);
    });
  }

  // ============================================================
  // RÖNKKÖBÖZÉS (LOG SESSION) EXPORT FUNKCIÓK
  // ============================================================

  /**
   * LogSession CSV export
   */
  exportLogCSV(session: LogSession, filename?: string): void {
    const data = session.logs.map((log, index) => ({
      'Sorszám': index + 1,
      'Fafaj': speciesNames[log.species] || log.species,
      'Csúcsátmérő (cm)': log.tipDiameterCm,
      'Hossz (m)': log.lengthM,
      'Térfogat (m³)': log.volumeM3.toFixed(4),
      'Béta': log.betaValue.toFixed(6),
      'Időpont': new Date(log.timestamp).toLocaleString('hu-HU'),
    }));

    const csv = Papa.unparse(data, {
      delimiter: ';', // Excel kompatibilitás
      header: true,
    });

    // BOM hozzáadása (UTF-8 támogatás Excel-ben)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `ronkkobozes_${session.id}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * LogSession Excel export
   */
  exportLogExcel(session: LogSession, filename?: string): void {
    const data = session.logs.map((log, index) => ({
      'Sorszám': index + 1,
      'Fafaj': speciesNames[log.species] || log.species,
      'Csúcsátmérő (cm)': log.tipDiameterCm,
      'Hossz (m)': log.lengthM,
      'Térfogat (m³)': Number(log.volumeM3.toFixed(4)),
      'Béta': Number(log.betaValue.toFixed(6)),
      'Időpont': new Date(log.timestamp).toLocaleString('hu-HU'),
    }));

    // Összesítő sor hozzáadása
    const totalVolume = session.logs.reduce((sum, l) => sum + l.volumeM3, 0);
    data.push({
      'Sorszám': '',
      'Fafaj': 'ÖSSZESEN',
      'Csúcsátmérő (cm)': '',
      'Hossz (m)': '',
      'Térfogat (m³)': Number(totalVolume.toFixed(4)),
      'Béta': '',
      'Időpont': '',
    } as any);

    // Worksheet létrehozása
    const ws = XLSX.utils.json_to_sheet(data);

    // Oszlopszélességek beállítása
    ws['!cols'] = [
      { wch: 10 }, // Sorszám
      { wch: 25 }, // Fafaj
      { wch: 18 }, // Csúcsátmérő
      { wch: 12 }, // Hossz
      { wch: 16 }, // Térfogat
      { wch: 12 }, // Béta
      { wch: 20 }, // Időpont
    ];

    // Workbook létrehozása
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rönkköbözés');

    // Letöltés
    XLSX.writeFile(wb, filename || `ronkkobozes_${session.id}.xlsx`);
  }

  /**
   * LogSession PDF export (jegyzőkönyv)
   */
  exportLogPDF(
    session: LogSession,
    metadata?: PDFReportData,
    filename?: string
  ): void {
    const doc = new jsPDF();

    // Fejléc
    doc.setFontSize(18);
    doc.text('Rönkköbözési Jegyzőkönyv', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text('(Huber-Smalian formula)', 105, 28, { align: 'center' });

    // Meta információk
    doc.setFontSize(12);
    let y = 45;

    doc.text(
      `Dátum: ${new Date(session.startedAt).toLocaleDateString('hu-HU')}`,
      20,
      y
    );
    y += 10;

    if (metadata?.surveyorName) {
      doc.text(`Felmérő: ${metadata.surveyorName}`, 20, y);
      y += 10;
    }

    if (session.location) {
      doc.text(`Helyszín: ${session.location}`, 20, y);
      y += 10;
    }

    y += 10;

    // Táblázat fejléc
    doc.setFontSize(9);
    doc.text('Sorszám', 20, y);
    doc.text('Fafaj', 40, y);
    doc.text('Csúcsátmérő (cm)', 80, y);
    doc.text('Hossz (m)', 120, y);
    doc.text('Béta', 145, y);
    doc.text('Térfogat (m³)', 165, y);

    y += 5;
    doc.line(20, y, 190, y); // Vonal
    y += 5;

    // Mérések
    session.logs.forEach((log, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text((index + 1).toString(), 22, y);
      doc.text(speciesNames[log.species] || log.species, 40, y);
      doc.text(log.tipDiameterCm.toString(), 90, y);
      doc.text(log.lengthM.toString(), 125, y);
      doc.text(log.betaValue.toFixed(2), 147, y);
      doc.text(log.volumeM3.toFixed(4), 172, y);

      y += 7;
    });

    // Összegzés
    y += 10;
    doc.line(20, y, 190, y);
    y += 7;

    const totalVolume = session.logs.reduce((sum, l) => sum + l.volumeM3, 0);
    const totalLogs = session.logs.length;

    doc.setFontSize(12);
    doc.text(`Összesen: ${totalLogs} rönk`, 20, y);
    doc.text(`Összes térfogat: ${totalVolume.toFixed(4)} m³`, 100, y);

    // Letöltés
    doc.save(filename || `ronkkobozes_jegyzokonyv_${session.id}.pdf`);
  }
}

// Singleton instance export
export const exportService = new ExportService();
