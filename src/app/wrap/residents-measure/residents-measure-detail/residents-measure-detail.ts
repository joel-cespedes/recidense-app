import { Component, inject, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSpinner,
  NavController
} from '@ionic/angular/standalone';
import { MeasurementsService } from '../../../../openapi/generated/services/measurements.service';
import { MeasurementOut } from '../../../../openapi/generated/models/measurement-out';

@Component({
  selector: 'app-residents-details',
  templateUrl: './residents-measure-detail.html',
  styleUrls: ['./residents-measure-detail.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonSpinner
  ]
})
export class ResidentsDetail {
  resident_id = input.required<string>();
  date = input.required<string>();
  private navCtrl = inject(NavController);
  private measurementsService = inject(MeasurementsService);

  measurements = signal<MeasurementOut[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  measurementStats = signal<
    {
      type: string;
      label: string;
      field: string;
      unit: string;
      count: number;
      max: number;
      min: number;
      avg: number;
      devices: {
        device_id: string;
        device_name: string;
        periods: {
          period: string;
          periodLabel: string;
          measurements: MeasurementOut[];
        }[];
      }[];
    }[]
  >([]);

  constructor() {
    effect(() => {
      const residentId = this.resident_id();
      const date = this.date();
      if (residentId && date) {
        this.loadMeasurements(residentId, date);
      }
    });
  }

  loadMeasurements(residentId: string, date: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.measurementsService
      .getMeasurementsByDayMeasurementsByDayGet({
        resident_id: residentId,
        date: date
      })
      .subscribe({
        next: (measurements: MeasurementOut[]) => {
          this.measurements.set(measurements);
          this.calculateStats(measurements);
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          console.error('Error loading measurements:', error);
          this.errorMessage.set('Error al cargar las mediciones');
          this.isLoading.set(false);
        }
      });
  }

  calculateStats(measurements: MeasurementOut[]) {
    const stats: {
      type: string;
      label: string;
      field: string;
      unit: string;
      count: number;
      max: number;
      min: number;
      avg: number;
      devices: {
        device_id: string;
        device_name: string;
        periods: {
          period: string;
          periodLabel: string;
          measurements: MeasurementOut[];
        }[];
      }[];
    }[] = [];

    const getPeriodOfDay = (dateStr: string): { period: string; label: string } => {
      const hour = new Date(dateStr).getHours();
      if (hour >= 6 && hour < 12) return { period: 'morning', label: 'Mañana (06:00 - 11:59)' };
      if (hour >= 12 && hour < 18) return { period: 'afternoon', label: 'Tarde (12:00 - 17:59)' };
      if (hour >= 18 && hour < 24) return { period: 'evening', label: 'Noche (18:00 - 23:59)' };
      return { period: 'night', label: 'Madrugada (00:00 - 05:59)' };
    };

    const groupByDevice = (measurementsList: MeasurementOut[]) => {
      const deviceMap = new Map<string, MeasurementOut[]>();

      measurementsList.forEach(m => {
        const deviceKey = m.device_id || 'manual';
        if (!deviceMap.has(deviceKey)) {
          deviceMap.set(deviceKey, []);
        }
        deviceMap.get(deviceKey)!.push(m);
      });

      return Array.from(deviceMap.entries()).map(([deviceId, deviceMeasurements]) => {
        // Agrupar por período del día
        const periodMap = new Map<string, MeasurementOut[]>();

        deviceMeasurements.forEach(m => {
          const { period } = getPeriodOfDay(m.taken_at);
          if (!periodMap.has(period)) {
            periodMap.set(period, []);
          }
          periodMap.get(period)!.push(m);
        });

        // Ordenar períodos: mañana, tarde, noche, madrugada
        const periodOrder = ['morning', 'afternoon', 'evening', 'night'];
        const periods = Array.from(periodMap.entries())
          .sort((a, b) => periodOrder.indexOf(a[0]) - periodOrder.indexOf(b[0]))
          .map(([periodKey, periodMeasurements]) => {
            const { label } = getPeriodOfDay(periodMeasurements[0].taken_at);
            return {
              period: periodKey,
              periodLabel: label,
              measurements: periodMeasurements.sort(
                (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
              )
            };
          });

        return {
          device_id: deviceId,
          device_name:
            deviceMeasurements[0].device_name || deviceMeasurements[0].device_id || 'Manual',
          periods
        };
      });
    };

    // Presión Arterial (sistólica/diastólica)
    const bpMeasurements = measurements.filter(m => m.systolic && m.diastolic);
    if (bpMeasurements.length > 0) {
      const systolicValues = bpMeasurements.map(m => m.systolic!);

      stats.push({
        type: 'bp',
        label: 'Presión Arterial',
        field: 'systolic',
        unit: 'mmHg',
        count: bpMeasurements.length,
        max: Math.max(...systolicValues),
        min: Math.min(...systolicValues),
        avg: Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length),
        devices: groupByDevice(bpMeasurements)
      });
    }

    // SpO2
    const spo2Measurements = measurements.filter(m => m.spo2);
    if (spo2Measurements.length > 0) {
      const values = spo2Measurements.map(m => m.spo2!);
      stats.push({
        type: 'spo2',
        label: 'Oxigenación',
        field: 'spo2',
        unit: '%',
        count: spo2Measurements.length,
        max: Math.max(...values),
        min: Math.min(...values),
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        devices: groupByDevice(spo2Measurements)
      });
    }

    // Pulso
    const pulseMeasurements = measurements.filter(m => m.pulse_bpm);
    if (pulseMeasurements.length > 0) {
      const values = pulseMeasurements.map(m => m.pulse_bpm!);
      stats.push({
        type: 'pulse',
        label: 'Pulso',
        field: 'pulse_bpm',
        unit: 'bpm',
        count: pulseMeasurements.length,
        max: Math.max(...values),
        min: Math.min(...values),
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        devices: groupByDevice(pulseMeasurements)
      });
    }

    // Peso
    const weightMeasurements = measurements.filter(m => m.weight_kg);
    if (weightMeasurements.length > 0) {
      const values = weightMeasurements.map(m => m.weight_kg!);
      stats.push({
        type: 'weight',
        label: 'Peso',
        field: 'weight_kg',
        unit: 'kg',
        count: weightMeasurements.length,
        max: Math.max(...values),
        min: Math.min(...values),
        avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
        devices: groupByDevice(weightMeasurements)
      });
    }

    // Temperatura
    const tempMeasurements = measurements.filter(m => m.temperature_c);
    if (tempMeasurements.length > 0) {
      const values = tempMeasurements.map(m => m.temperature_c!);
      stats.push({
        type: 'temperature',
        label: 'Temperatura',
        field: 'temperature_c',
        unit: '°C',
        count: tempMeasurements.length,
        max: Math.max(...values),
        min: Math.min(...values),
        avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
        devices: groupByDevice(tempMeasurements)
      });
    }

    this.measurementStats.set(stats);
  }

  navigateToChart(measurementId: string) {
    const residentId = this.resident_id();
    const date = this.date();
    this.navCtrl.navigateForward(`/wrap/residents-measurements/chart/${measurementId}`, {
      animated: true,
      state: {
        resident_id: residentId,
        date: date
      }
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}
