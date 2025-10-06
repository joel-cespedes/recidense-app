import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonSelect,
  IonSelectOption,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexNonAxisChartSeries,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule
} from 'ng-apexcharts';
import { MeasurementOut } from '../../../../../openapi/generated/models/measurement-out';
import { PaginatedResponseMeasurementOut } from '../../../../../openapi/generated/models/paginated-response-measurement-out';
import { MeasurementsService } from '../../../../../openapi/generated/services/measurements.service';

@Component({
  selector: 'app-chart-measure',
  templateUrl: './chart-measure.html',
  styleUrls: ['./chart-measure.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonButton,
    IonSelect,
    IonSelectOption,
    NgApexchartsModule
  ]
})
export class ChartMeasure {
  id = input.required<string>();
  private navCtrl = inject(NavController);
  private measurementsService = inject(MeasurementsService);

  measurement = signal<MeasurementOut | null>(null);
  measurements = signal<MeasurementOut[]>([]);
  residentId = signal<string>('');
  selectedDate = signal<string>('');
  measurementLimit = signal<number>(4); // 4, 10, 30
  isFullscreen = signal<boolean>(false);

  chartConfig = signal<{
    series: ApexAxisChartSeries | ApexNonAxisChartSeries;
    chart: ApexChart;
    colors: string[];
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    fill: ApexFill;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    grid: ApexGrid;
    tooltip: ApexTooltip;
  }>({
    series: [],
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      }
    } as ApexChart,
    colors: [],
    dataLabels: {
      enabled: false
    } as ApexDataLabels,
    stroke: {
      curve: 'smooth',
      width: 2
    } as ApexStroke,
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    } as ApexFill,
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: '#000000'
        }
      }
    } as ApexXAxis,
    yaxis: {
      labels: {
        style: {
          colors: '#000000'
        }
      }
    } as ApexYAxis,
    grid: {
      borderColor: '#e0e0e0'
    } as ApexGrid,
    tooltip: {
      theme: 'light'
    } as ApexTooltip
  });

  constructor() {
    // Obtener resident_id y date del state de navegación
    const state = window.history.state as any;
    if (state) {
      this.residentId.set(state.resident_id || '');
      this.selectedDate.set(state.date || '');
    }

    effect(() => {
      const measurementId = this.id();
      if (measurementId) {
        this.loadMeasurement(measurementId);
      }
    });
  }

  loadMeasurement(measurementId: string) {
    // Cargar la medición específica
    this.measurementsService
      .getMeasurementMeasurementsMeasurementIdGet({
        measurement_id: measurementId
      })
      .subscribe({
        next: (measurement: MeasurementOut) => {
          this.measurement.set(measurement);
          // Cargar el historial de mediciones del mismo residente
          this.loadMeasurementHistory(measurement);
        },
        error: (error: Error) => {
          console.error('Error loading measurement:', error);
        }
      });
  }

  loadMeasurementHistory(measurement: MeasurementOut) {
    const residentId = this.residentId();
    const limit = this.measurementLimit();

    const params = {
      resident_id: residentId,
      residence_id: measurement.residence_id,
      type: measurement.type,
      size: limit,
      sort_order: 'desc' as const
    };

    console.log('Loading last N measurements with params:', params);

    // Usar el endpoint específico de mediciones por residente
    this.measurementsService
      .getMeasurementsByResidentMeasurementsResidentsResidentIdMeasurementsGet(params)
      .subscribe({
        next: (response: PaginatedResponseMeasurementOut) => {
          console.log('Response received:', response);
          console.log('Loaded last N measurements:', response.items);
          this.measurements.set(response.items);
          this.configureChart(measurement, response.items);
        },
        error: () => {
          console.error('Error loading measurements');
          this.measurements.set([measurement]);
          this.configureChart(measurement, [measurement]);
        }
      });
  }

  onLimitChange(newLimit: number) {
    this.measurementLimit.set(newLimit);
    const currentMeasurement = this.measurement();
    if (currentMeasurement) {
      this.loadMeasurementHistory(currentMeasurement);
    }
  }

  configureChart(currentMeasurement: MeasurementOut, measurements: MeasurementOut[]) {
    console.log('Configuring chart with measurements:', measurements.length);
    console.log('Current measurement type:', currentMeasurement.type);

    const series: any[] = [];
    const colors: string[] = [];

    // Ordenar mediciones por fecha
    const sortedMeasurements = [...measurements].sort(
      (a, b) => new Date(a.taken_at).getTime() - new Date(b.taken_at).getTime()
    );

    console.log('Sorted measurements:', sortedMeasurements);

    // Crear categorías del eje X (fecha + hora)
    const categories = sortedMeasurements.map(m => {
      const date = new Date(m.taken_at);
      return (
        date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit'
        }) +
        ' ' +
        date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    });

    console.log('Categories (date + time):', categories);

    // Configurar series según el tipo de medición
    switch (currentMeasurement.type) {
      case 'bp':
        const systolicData = sortedMeasurements.map(m => m.systolic ?? 0);
        const diastolicData = sortedMeasurements.map(m => m.diastolic ?? 0);

        console.log('Systolic data:', systolicData);
        console.log('Diastolic data:', diastolicData);

        series.push({
          name: 'Sistólica',
          data: systolicData
        });
        series.push({
          name: 'Diastólica',
          data: diastolicData
        });
        colors.push('#6765ee', '#4344ab');
        break;

      case 'spo2':
        const spo2Data = sortedMeasurements.map(m => m.spo2 ?? 0);
        series.push({
          name: 'SpO2',
          data: spo2Data
        });
        colors.push('#6765ee');
        break;

      case 'weight':
        const weightData = sortedMeasurements.map(m => m.weight_kg ?? 0);
        series.push({
          name: 'Peso',
          data: weightData
        });
        colors.push('#8b5fff');
        break;

      case 'temperature':
        const tempData = sortedMeasurements.map(m => m.temperature_c ?? 0);
        series.push({
          name: 'Temperatura',
          data: tempData
        });
        colors.push('#ffca22');
        break;
    }

    // No agregar pulso automáticamente, solo mostrar el tipo seleccionado

    console.log('Series configured:', series);
    console.log('Colors:', colors);

    const chartOptions = {
      series: series,
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        }
      } as ApexChart,
      colors: colors,
      dataLabels: {
        enabled: false
      } as ApexDataLabels,
      stroke: {
        curve: 'smooth',
        width: 2
      } as ApexStroke,
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      } as ApexFill,
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#000000'
          },
          rotate: -45,
          rotateAlways: false
        }
      } as ApexXAxis,
      yaxis: {
        labels: {
          style: {
            colors: '#000000'
          }
        }
      } as ApexYAxis,
      grid: {
        borderColor: '#e0e0e0'
      } as ApexGrid,
      tooltip: {
        theme: 'light',
        x: {
          format: 'dd/MM/yy HH:mm'
        }
      } as ApexTooltip
    };

    console.log('Final chart config:', JSON.stringify(chartOptions, null, 2));

    // Pequeño delay para que ApexCharts renderice correctamente
    setTimeout(() => {
      this.chartConfig.set(chartOptions);
    }, 100);
  }

  async toggleFullscreen() {
    const newFullscreenState = !this.isFullscreen();
    this.isFullscreen.set(newFullscreenState);

    try {
      if (newFullscreenState) {
        // Entrar en modo fullscreen - forzar landscape
        await ScreenOrientation.lock({ orientation: 'landscape' });

        // Actualizar tamaño de gráfica para landscape
        const currentConfig = this.chartConfig();
        this.chartConfig.set({
          ...currentConfig,
          chart: {
            ...currentConfig.chart,
            height: window.innerHeight - 100
          }
        });
      } else {
        // Salir de fullscreen - permitir cualquier orientación
        await ScreenOrientation.unlock();

        // Restaurar tamaño original de gráfica
        const currentConfig = this.chartConfig();
        this.chartConfig.set({
          ...currentConfig,
          chart: {
            ...currentConfig.chart,
            height: 350
          }
        });
      }
    } catch (error) {
      console.error('Error toggling orientation:', error);
    }
  }

  goBack() {
    // Si está en fullscreen, primero salir
    if (this.isFullscreen()) {
      this.toggleFullscreen();
    } else {
      this.navCtrl.back();
    }
  }
}
