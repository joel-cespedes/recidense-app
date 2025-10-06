import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonModal,
  IonRadio,
  IonRadioGroup,
  IonSpinner,
  IonToolbar,
  NavController,
  ToastController
} from '@ionic/angular/standalone';

import { MeasurementsService } from '../../../../openapi/generated/services/measurements.service';
import { ResidenceStateService } from '../../../services/residence-state.service';
import { processVoiceMeasurementMeasurementsVoicePost } from '../../../../openapi/generated/fn/measurements/process-voice-measurement-measurements-voice-post';
import { confirmVoiceMeasurementMeasurementsVoiceConfirmPost } from '../../../../openapi/generated/fn/measurements/confirm-voice-measurement-measurements-voice-confirm-post';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../../../openapi/generated/api-configuration';

interface VoiceMeasurementResponse {
  status: 'success' | 'ambiguous' | 'error';
  message: string;
  measurement?: {
    id: string;
    resident_id: string;
    resident_name: string;
    measurement_type: 'bp' | 'spo2' | 'weight' | 'temperature';
    values: any;
    source: string;
    recorded_at: string;
    recorded_by: string;
  };
  confirmation_message?: string;
  resident_options?: {
    id: string;
    full_name: string;
    room_name?: string;
    bed_number?: string;
    floor_name?: string;
  }[];
  parsed_measurement?: {
    measurement_type: 'bp' | 'spo2' | 'weight' | 'temperature';
    values: any;
  };
  error_code?: string;
  details?: any;
}

@Component({
  selector: 'app-devices-voice',
  templateUrl: './devices-voice.html',
  styleUrls: ['./devices-voice.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonButton,
    IonCard,
    IonSpinner,
    IonModal,
    IonRadioGroup,
    IonRadio,
    IonList,
    IonItem
  ]
})
export class DevicesVoice implements OnInit {
  private navCtrl = inject(NavController);
  private residenceStateService = inject(ResidenceStateService);
  private toastCtrl = inject(ToastController);
  private http = inject(HttpClient);
  private apiConfig = inject(ApiConfiguration);

  // Signals
  isRecording = signal(false);
  isProcessing = signal(false);
  transcript = signal<string>('');
  parsedData = signal<VoiceMeasurementResponse | null>(null);
  showConfirmAlert = signal(false);
  showOptionsModal = signal(false);
  errorMessage = signal<string | null>(null);
  selectedResidentId: string | null = null;

  // Computed
  residenceId = computed(() => this.residenceStateService.residenceId());

  // Alert buttons
  alertButtons = [
    {
      text: 'Cerrar',
      role: 'confirm',
      handler: () => {
        this.showConfirmAlert.set(false);
        this.goBack();
      }
    }
  ];

  async ngOnInit() {
    const permission = await SpeechRecognition.requestPermissions();
    if (permission.speechRecognition !== 'granted') {
      this.errorMessage.set('Permiso de micrófono denegado');
    }
  }

  async startRecording() {
    try {
      // Detener cualquier reconocimiento previo
      try {
        SpeechRecognition.stop();
      } catch (e) {
        // Ignorar si no hay nada corriendo
      }

      // Limpiar listeners previos
      await SpeechRecognition.removeAllListeners();

      this.isRecording.set(true);
      this.transcript.set('');
      this.errorMessage.set(null);

      // Listener para capturar resultados parciales
      await SpeechRecognition.addListener('partialResults', data => {
        if (data.matches && data.matches.length > 0) {
          this.transcript.set(data.matches[0]);
        }
      });

      await SpeechRecognition.start({
        language: 'es-ES',
        maxResults: 5,
        partialResults: true,
        popup: false
      });
    } catch (error: any) {
      console.error('Error recording:', error);
      this.errorMessage.set('Error al grabar: ' + (error.message || 'Desconocido'));
      this.isRecording.set(false);
      SpeechRecognition.removeAllListeners();
    }
  }

  async stopRecording() {
    this.isRecording.set(false);

    try {
      SpeechRecognition.stop();

      // Esperar para capturar últimos resultados
      await new Promise(resolve => setTimeout(resolve, 800));

      const currentTranscript = this.transcript();
      if (currentTranscript) {
        await this.parseTranscript(currentTranscript);
      } else {
        this.errorMessage.set('No se capturó ningún audio');
      }

      SpeechRecognition.removeAllListeners();
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      this.errorMessage.set('Error al detener grabación: ' + (error.message || 'Desconocido'));
      this.isRecording.set(false);
      SpeechRecognition.removeAllListeners();
    }
  }

  async parseTranscript(transcript: string) {
    const residenceId = this.residenceId();
    if (!residenceId) {
      this.errorMessage.set('No hay residencia seleccionada');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    processVoiceMeasurementMeasurementsVoicePost(this.http, this.apiConfig.rootUrl, {
      body: {
        residence_id: residenceId.toString(),
        transcript
      }
    })
      .pipe((res: any) => res)
      .subscribe({
        next: (response: any) => {
          this.isProcessing.set(false);
          this.parsedData.set(response);

          if (response.status === 'success') {
            // Mostrar mensaje de confirmación
            this.showSuccessToast(
              response.confirmation_message || 'Medición registrada correctamente'
            );
            setTimeout(() => {
              this.goBack();
            }, 2000);
          } else if (response.status === 'ambiguous') {
            // Mostrar modal de selección
            this.showOptionsModal.set(true);
          } else if (response.status === 'error') {
            this.errorMessage.set(response.message);
          }
        },
        error: (error: any) => {
          console.error('Error parsing transcript:', error);
          this.isProcessing.set(false);
          this.errorMessage.set(
            error.error?.message || 'Error al procesar la medición. Intenta de nuevo.'
          );
        }
      });
  }

  confirmSelection() {
    const data = this.parsedData();
    const residenceId = this.residenceId();

    if (!data || !residenceId || !this.selectedResidentId || !data.parsed_measurement) {
      this.errorMessage.set('Debes seleccionar un residente');
      return;
    }

    this.isProcessing.set(true);
    this.showOptionsModal.set(false);

    confirmVoiceMeasurementMeasurementsVoiceConfirmPost(this.http, this.apiConfig.rootUrl, {
      body: {
        residence_id: residenceId.toString(),
        resident_id: this.selectedResidentId,
        measurement_type: data.parsed_measurement.measurement_type,
        values: data.parsed_measurement.values,
        transcript: this.transcript()
      }
    })
      .pipe((res: any) => res)
      .subscribe({
        next: (response: any) => {
          this.isProcessing.set(false);
          this.showSuccessToast(
            response.confirmation_message || 'Medición registrada correctamente'
          );
          setTimeout(() => {
            this.goBack();
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error confirming measurement:', error);
          this.isProcessing.set(false);
          this.errorMessage.set(
            error.error?.message || 'Error al confirmar la medición. Intenta de nuevo.'
          );
        }
      });
  }

  cancelSelection() {
    this.showOptionsModal.set(false);
    this.selectedResidentId = null;
    this.parsedData.set(null);
  }

  async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }

  goBack() {
    this.navCtrl.back();
  }
}
