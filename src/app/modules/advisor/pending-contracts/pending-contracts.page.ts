import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { ContratacionDetalle } from '../../../models';
import { Observable } from 'rxjs';
import { ToastController, AlertController, IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-pending-contracts',
  templateUrl: './pending-contracts.page.html',
  styleUrls: ['./pending-contracts.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PendingContractsPage implements OnInit {
  contratacionesPendientes$: Observable<ContratacionDetalle[]>;
  isLoading = true;

  constructor(
    private contratacionesService: ContratacionesService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.contratacionesPendientes$ = this.contratacionesService.getContratacionesPendientes();
  }

  ngOnInit() {
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/advisor/dashboard']);
  }

  async aprobarContratacion(contratacionId: string) {
    const alert = await this.alertController.create({
      header: 'Aprobar Contratación',
      message: '¿Deseas aprobar esta contratación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aprobar',
          handler: () => {
            this.contratacionesService.actualizarEstadoContratacion(contratacionId, 'activa').subscribe(
              async success => {
                if (success) {
                  await this.presentToast('¡Contratación aprobada!', 'success');
                } else {
                  await this.presentToast('Error al aprobar', 'danger');
                }
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }

  async rechazarContratacion(contratacionId: string) {
    const alert = await this.alertController.create({
      header: 'Rechazar Contratación',
      message: '¿Deseas rechazar esta contratación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Rechazar',
          handler: () => {
            this.contratacionesService.actualizarEstadoContratacion(contratacionId, 'cancelada').subscribe(
              async success => {
                if (success) {
                  await this.presentToast('¡Contratación rechazada!', 'success');
                } else {
                  await this.presentToast('Error al rechazar', 'danger');
                }
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
