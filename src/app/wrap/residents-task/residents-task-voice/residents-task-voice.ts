import { Component, computed, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonCard,
  IonSpinner,
  IonAlert,
  NavController,
  ToastController
} from '@ionic/angular/standalone';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { ResidenceStateService } from '../../../services/residence-state.service';
import { VoiceParseResponse } from '../../../../openapi/generated/models/voice-parse-response';

@Component({
  selector: 'app-residents-task-voice',
  templateUrl: './residents-task-voice.html',
  styleUrls: ['./residents-task-voice.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonCard,
    IonSpinner,
    IonAlert
  ]
})
export class ResidentsTaskVoice {
  private navCtrl = inject(NavController);
  private tasksService = inject(TasksService);
  private residenceStateService = inject(ResidenceStateService);
  private toastCtrl = inject(ToastController);

  // Signals
  isRecording = signal(false);
  isProcessing = signal(false);
  transcript = signal<string>('');
  parsedData = signal<VoiceParseResponse | null>(null);
  showConfirmAlert = signal(false);
  errorMessage = signal<string | null>(null);

  // Computed
  residenceId = computed(() => this.residenceStateService.residenceId());

  // Alert buttons
  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => this.cancelConfirmation()
    },
    {
      text: 'Asignar',
      role: 'confirm',
      handler: () => this.confirmTask()
    }
  ];

  async ngOnInit() {
    await this.checkPermissions();
  }

  async checkPermissions() {
    try {
      const { available } = await SpeechRecognition.available();
      if (!available) {
        this.errorMessage.set('Reconocimiento de voz no disponible en este dispositivo');
        return;
      }

      const { speechRecognition } = await SpeechRecognition.checkPermissions();
      if (speechRecognition === 'prompt' || speechRecognition === 'prompt-with-rationale') {
        await SpeechRecognition.requestPermissions();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      this.errorMessage.set('Error al verificar permisos de micrófono');
    }
  }

  async startRecording() {
    try {
      this.isRecording.set(true);
      this.transcript.set('');
      this.errorMessage.set(null);

      let finalTranscript = '';

      SpeechRecognition.addListener('partialResults', data => {
        if (data.matches && data.matches.length > 0) {
          this.transcript.set(data.matches[0]);
          finalTranscript = data.matches[0];
        }
      });

      await SpeechRecognition.start({
        language: 'es-ES',
        maxResults: 1,
        prompt: 'Di el nombre del residente y la tarea a asignar',
        partialResults: true,
        popup: true
      });

      if (finalTranscript) {
        this.transcript.set(finalTranscript);
        await this.parseTranscript(finalTranscript);
      } else {
        this.errorMessage.set('No se pudo capturar el audio');
      }
    } catch (error: any) {
      console.error('Error recording:', error);
      this.errorMessage.set('Error al grabar: ' + (error.message || 'Desconocido'));
    } finally {
      this.isRecording.set(false);
      await SpeechRecognition.stop();
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

    this.tasksService
      .parseVoiceTranscriptTasksApplicationsParseVoicePost({
        body: {
          transcript: transcript,
          residence_id: residenceId.toString()
        }
      })
      .subscribe({
        next: (response: VoiceParseResponse) => {
          this.isProcessing.set(false);

          if (response.success) {
            this.parsedData.set(response);
            this.showConfirmAlert.set(true);
          } else {
            this.errorMessage.set(response.error || 'Error al procesar el audio');
          }
        },
        error: (error: Error) => {
          console.error('Error parsing transcript:', error);
          this.errorMessage.set('Error al procesar el audio');
          this.isProcessing.set(false);
        }
      });
  }

  async confirmTask() {
    const data = this.parsedData();
    const residenceId = this.residenceId();

    if (!data || !residenceId) return;

    this.showConfirmAlert.set(false);
    this.isProcessing.set(true);

    this.tasksService
      .createVoiceApplicationTasksApplicationsVoicePost({
        body: {
          resident_id: data.resident_id!,
          task_id: data.task_id!.toString(),
          status: data.status || null,
          residence_id: residenceId.toString()
        }
      })
      .subscribe({
        next: async () => {
          this.isProcessing.set(false);
          const toast = await this.toastCtrl.create({
            message: 'Tarea asignada exitosamente',
            duration: 2000,
            color: 'success',
            position: 'top'
          });
          await toast.present();

          // Reset
          this.transcript.set('');
          this.parsedData.set(null);
        },
        error: async (error: Error) => {
          console.error('Error creating task:', error);
          this.isProcessing.set(false);
          const toast = await this.toastCtrl.create({
            message: 'Error al asignar tarea',
            duration: 2000,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
        }
      });
  }

  cancelConfirmation() {
    this.showConfirmAlert.set(false);
    this.parsedData.set(null);
    this.transcript.set('');
  }

  goBack() {
    this.navCtrl.back();
  }
}
