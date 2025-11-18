import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanesService } from '../../../services/planes.service';
import { AuthService } from '../../../services/auth.service';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { Plan } from '../../../models';
import { Observable } from 'rxjs';
import { ToastController, AlertController, IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-plan-detail',
  templateUrl: './plan-detail.page.html',
  styleUrls: ['./plan-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PlanDetailPage implements OnInit {
  plan: Plan | null = null;
  isAuthenticated$: Observable<boolean>;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planesService: PlanesService,
    private authService: AuthService,
    private contratacionesService: ContratacionesService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id');
    if (planId) {
      this.planesService.getPlanById(planId).subscribe(
        plan => {
          this.plan = plan;
          this.isLoading = false;
        },
        error => {
          console.error('Error cargando plan:', error);
          this.isLoading = false;
        }
      );
    }
  }

  async contratarPlan() {
    const user = await this.authService.getCurrentUser().toPromise();
    if (!user || !this.plan) {
      await this.router.navigate(['/login']);
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Contratación',
      message: `¿Deseas contratar el plan <strong>${this.plan.nombre}</strong> por $${this.plan.precio}/mes?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.contratacionesService.createContratacion(user.id, this.plan!.id, this.plan!.precio).subscribe(
              contratacion => {
                if (contratacion) {
                  this.presentToast('¡Contratación completada!', 'success');
                  this.router.navigate(['/mis-contrataciones']);
                } else {
                  this.presentToast('Error al crear contratación', 'danger');
                }
              },
              error => {
                console.error('Error:', error);
                this.presentToast('Error en la contratación', 'danger');
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }

  goBack() {
    this.router.navigate(['/catalog']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
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
