import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DaySummary, WaterLogItem } from '../types';
import { StorageService } from './storage';

export interface ExportData {
  version: string;
  exportDate: string;
  summaries: DaySummary[];
  waterLogs: WaterLogItem[];
}

export class ExportService {
  static async exportData(): Promise<string> {
    try {
      // Get all data
      const summaries = await StorageService.getAllDaySummaries();
      const allWaterLogs = await StorageService.getWaterLogs();

      const exportData: ExportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        summaries,
        waterLogs: allWaterLogs,
      };

      // Create JSON string
      const jsonString = JSON.stringify(exportData, null, 2);

      // Save to file
      const fileName = `step-water-export-${new Date()
        .toISOString()
        .split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async shareExport(): Promise<void> {
    try {
      const fileUri = await this.exportData();
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Step & Water Data',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing export:', error);
      throw error;
    }
  }

  static async importData(jsonString: string): Promise<void> {
    try {
      const data: ExportData = JSON.parse(jsonString);

      // Validate data structure
      if (!data.summaries || !Array.isArray(data.summaries)) {
        throw new Error('Invalid export data: missing summaries');
      }

      if (!data.waterLogs || !Array.isArray(data.waterLogs)) {
        throw new Error('Invalid export data: missing water logs');
      }

      // Import summaries
      for (const summary of data.summaries) {
        await StorageService.saveDaySummary(summary);
      }

      // Note: Water logs are managed through summaries, but we could import them too
      // For now, summaries should contain the water data

      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  private static buildStepsCsv(rows: DaySummary[]): string {
    const header = 'date,steps,stepDistanceMeters,calories,waterMl';
    const data = rows.map((row) => {
      const values = [
        row.date,
        row.steps ?? 0,
        row.stepDistanceMeters ?? '',
        row.calories ?? '',
        row.waterMl ?? 0,
      ];
      return values.join(',');
    });
    return [header, ...data].join('\n');
  }

  private static buildWaterCsv(rows: WaterLogItem[]): string {
    const header = 'id,date,time,amountMl';
    const data = rows.map((row) => {
      const values = [row.id, row.date, row.time, row.amountMl];
      return values.join(',');
    });
    return [header, ...data].join('\n');
  }

  static async exportStepsCsv(): Promise<string> {
    try {
      const summaries = await StorageService.getAllDaySummaries();
      const csv = this.buildStepsCsv(summaries);
      const fileName = `step-water-steps-${new Date()
        .toISOString()
        .split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('Error exporting steps CSV:', error);
      throw error;
    }
  }

  static async exportWaterCsv(): Promise<string> {
    try {
      const logs = await StorageService.getWaterLogs();
      const csv = this.buildWaterCsv(logs);
      const fileName = `step-water-water-${new Date()
        .toISOString()
        .split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('Error exporting water CSV:', error);
      throw error;
    }
  }

  static async shareStepsCsv(): Promise<void> {
    try {
      const fileUri = await this.exportStepsCsv();
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Steps Log (CSV)',
      });
    } catch (error) {
      console.error('Error sharing steps CSV:', error);
      throw error;
    }
  }

  static async shareWaterCsv(): Promise<void> {
    try {
      const fileUri = await this.exportWaterCsv();
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Water Log (CSV)',
      });
    } catch (error) {
      console.error('Error sharing water CSV:', error);
      throw error;
    }
  }
}

