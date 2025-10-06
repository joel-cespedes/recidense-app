import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import {
  IonAlert,
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

import { VoiceParseResponse } from '../../../../openapi/generated/models/voice-parse-response';
import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { ResidenceStateService } from '../../../services/residence-state.service';

@Component({
  selector: 'app-residents-task-voice',
  templateUrl: './residents-task-voice.html',
  styleUrls: ['./residents-task-voice.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButtons,
    IonButton,
    IonCard,
    IonSpinner,
    IonAlert,
    IonModal,
    IonRadioGroup,
    IonRadio,
    IonList,
    IonItem
  ]
})
export class ResidentsTaskVoice implements OnInit {
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
  showOptionsModal = signal(false);
  errorMessage = signal<string | null>(null);
  selectedResidentId = signal<string | null>(null);
  selectedTaskId = signal<string | null>(null);
  selectedStatus = signal<string | null>(null);

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
      // Detener cualquier reconocimiento previo que pueda estar corriendo
      try {
        SpeechRecognition.stop();
      } catch (e) {
        // Ignorar si no hay nada corriendo
      }

      // Limpiar cualquier listener previo
      await SpeechRecognition.removeAllListeners();

      this.isRecording.set(true);
      this.transcript.set('');
      this.errorMessage.set(null);

      // Listener para capturar resultados parciales
      await SpeechRecognition.addListener('partialResults', data => {
        console.log('partialResults:', data);
        if (data.matches && data.matches.length > 0) {
          this.transcript.set(data.matches[0]);
        }
      });

      console.log('Starting SpeechRecognition...');
      await SpeechRecognition.start({
        language: 'es-ES',
        maxResults: 5,
        prompt: 'Di el nombre del residente y la tarea a asignar',
        partialResults: true,
        popup: false
      });
      console.log('SpeechRecognition started');
    } catch (error: any) {
      console.error('Error recording:', error);
      this.errorMessage.set('Error al grabar: ' + (error.message || 'Desconocido'));
      this.isRecording.set(false);
      SpeechRecognition.removeAllListeners();
    }
  }

  async stopRecording() {
    // Cambiar el estado visual
    this.isRecording.set(false);

    try {
      SpeechRecognition.stop(); // Sin await - no bloquear

      // Esperar 800ms para que lleguen los últimos partialResults
      await new Promise(resolve => setTimeout(resolve, 800));

      // Ahora obtener el transcript final
      const currentTranscript = this.transcript();

      // Limpiar listeners
      await SpeechRecognition.removeAllListeners();
      if (currentTranscript) {
        await this.parseTranscript(currentTranscript);
      } else {
        this.errorMessage.set('No se capturó ningún audio');
      }
    } catch (error: any) {
      this.errorMessage.set('Error al detener grabación: ' + (error.message || 'Desconocido'));
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
          this.parsedData.set(response);

          if (response.success) {
            // Match único - mostrar confirmación
            this.showConfirmAlert.set(true);
          } else if (
            response.resident_options ||
            response.task_options ||
            response.status_options
          ) {
            // Hay opciones para seleccionar
            this.showOptionsModal.set(true);
          } else {
            // Error general
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

  confirmSelection() {
    const data = this.parsedData();
    const residenceId = this.residenceId();

    if (!data || !residenceId) return;

    // Construir el body con las selecciones del usuario
    const residentId = this.selectedResidentId() || data.resident_id;
    const taskId = this.selectedTaskId() || data.task_id;
    const status = this.selectedStatus() || data.status;

    if (!residentId || !taskId) {
      this.errorMessage.set('Debes seleccionar todas las opciones');
      return;
    }

    this.showOptionsModal.set(false);
    this.isProcessing.set(true);

    this.tasksService
      .createVoiceApplicationTasksApplicationsVoicePost({
        body: {
          resident_id: residentId,
          task_id: taskId.toString(),
          status: status || null,
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
          this.resetState();
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

  cancelSelection() {
    this.showOptionsModal.set(false);
    this.resetState();
  }

  resetState() {
    this.transcript.set('');
    this.parsedData.set(null);
    this.selectedResidentId.set(null);
    this.selectedTaskId.set(null);
    this.selectedStatus.set(null);
  }

  goBack() {
    this.navCtrl.back();
  }
}
