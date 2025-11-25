import Papa from 'papaparse';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SurveySession } from '@app-types/measurement';
import { BackupData, PDFReportData } from '@app-types/export';
import { volumeFormulas, SpeciesKey } from '@data/volumeFormulas';

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
}

// Singleton instance export
export const exportService = new ExportService();
